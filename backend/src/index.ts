// MUST be first line - Trigger Restart 7
import "dotenv/config";

import express from "express";
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
// import { PrismaClient } from "./generated/prisma";
import { PrismaClient } from "@prisma/client";

import cookieParser from "cookie-parser";
import cors from "cors";
import { authRouter } from "./routes/auth";

import boardsRouter from "./routes/boards";


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const prisma = new PrismaClient();

const app = express();
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());
app.use("/boards", boardsRouter);

app.use(cookieParser());
app.use("/auth", authRouter);


app.get("/", (_req, res) => {
  res.json({ message: "Backend running" });
});

let server;
const certPath = path.join(__dirname, "../server.cert");
const keyPath = path.join(__dirname, "../server.key");

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  console.log("🔒 Found certificates, starting HTTPS server...");
  server = https.createServer({
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  }, app);
} else {
  console.log("🔓 No certificates found, starting HTTP server...");
  server = http.createServer(app);
}

const wss = new WebSocketServer({ server, path: "/ws" });

// roomId -> sockets
const rooms = new Map<string, Set<WebSocket>>();
// socket -> roomId
const socketRoom = new Map<WebSocket, string>();
// socket -> UserData
type UserData = {
  id: string;
  name: string;
  color: string;
  avatar?: string;
};
const socketUser = new Map<WebSocket, UserData>();

wss.on("connection", (socket: WebSocket) => {
  console.log("Client connected");

  socket.on("message", async (msg) => {
    let data: any;
    try {
      data = JSON.parse(msg.toString());
    } catch {
      return;
    }

    try {
      switch (data.type) {
        case "join": {
          const roomId: string = data.roomId || "room1";
          const user: UserData = data.user || { id: "unknown", name: "Anonymous", color: "#000" };

          // Leave previous room if any
          if (socketRoom.has(socket)) {
            const oldRoomId = socketRoom.get(socket)!;
            const oldUser = socketUser.get(socket);
            const oldRoom = rooms.get(oldRoomId);

            if (oldRoom) {
              oldRoom.delete(socket);
              if (oldRoom.size === 0) rooms.delete(oldRoomId);

              // Notify old room of departure
              if (oldUser) {
                broadcast(oldRoomId, { type: "user-left", userId: oldUser.id }, socket);
              }
            }
          }

          // Register new state
          socketRoom.set(socket, roomId);
          socketUser.set(socket, user);

          if (!rooms.has(roomId)) rooms.set(roomId, new Set());
          rooms.get(roomId)!.add(socket);

          console.log("Client joined room:", roomId, user.name);

          // Broadcast join to others
          broadcast(roomId, { type: "user-joined", user }, socket);

          // Send current active users to the new joiner
          const activeUsers = Array.from(rooms.get(roomId) || [])
            .map(s => socketUser.get(s))
            .filter(Boolean);

          socket.send(JSON.stringify({ type: "room-users", users: activeUsers }));

          // Ensure board exists
          await prisma.board.upsert({
            where: { id: roomId },
            update: {},
            create: {
              id: roomId,
            },
          });

          // Send snapshot to this socket only
          const strokes = await prisma.stroke.findMany({
            where: { boardId: roomId, isDeleted: false },
            orderBy: { createdAt: "asc" },
          });

          socket.send(
            JSON.stringify({
              type: "snapshot",
              roomId,
              strokes: strokes.map((s) => ({
                id: s.id,
                userId: s.userId,
                color: s.color,
                width: s.width,
                points: s.points,
                shape: s.shape ?? undefined,
                kind: s.kind,
                text: s.text,
              })),
            })
          );

          socket.send(JSON.stringify({ type: "join-ack", roomId }));
          break;
        }

        // Final commit events
        case "stroke":
        case "shape-final": {
          const roomId = socketRoom.get(socket);
          if (!roomId) return;

          const stroke = data.stroke;
          if (!stroke?.id) return;

          const shape = stroke.shape ? String(stroke.shape) : null;
          const kind = stroke.kind ? String(stroke.kind) : (stroke.shape ? String(stroke.shape) : "pencil");

          await prisma.stroke.upsert({
            where: { id: String(stroke.id) },
            update: {
              boardId: roomId,
              userId: String(stroke.userId),
              kind,
              shape,
              color: String(stroke.color),
              width: Number(stroke.width),
              points: stroke.points,
              isDeleted: false,
              text: stroke.text || null,
            },
            create: {
              id: String(stroke.id),
              boardId: roomId,
              userId: String(stroke.userId),
              kind,
              shape,
              color: String(stroke.color),
              width: Number(stroke.width),
              points: stroke.points,
              isDeleted: false,
              text: stroke.text || null,
            },
          });

          broadcast(roomId, { type: data.type, stroke }, socket);
          break;
        }

        // Optional live streaming support, safe to keep
        case "stroke-point": {
          const roomId = socketRoom.get(socket);
          if (!roomId) return;

          // just broadcast, do not persist each point
          broadcast(roomId, data, socket);
          break;
        }

        case "cursor": {
          const roomId = socketRoom.get(socket);
          if (!roomId) return;
          broadcast(roomId, data, socket);
          break;
        }

        case "undo": {
          const roomId = socketRoom.get(socket);
          if (!roomId) return;

          const strokeId = String(data.strokeId || "");
          if (!strokeId) return;

          await prisma.stroke.updateMany({
            where: { id: strokeId, boardId: roomId },
            data: { isDeleted: true },
          });

          broadcast(roomId, { type: "undo", strokeId }, socket);
          break;
        }

        case "redo": {
          const roomId = socketRoom.get(socket);
          if (!roomId) return;

          const stroke = data.stroke;
          if (!stroke?.id) return;

          await prisma.stroke.updateMany({
            where: { id: String(stroke.id), boardId: roomId },
            data: { isDeleted: false },
          });

          broadcast(roomId, { type: "redo", stroke }, socket);
          break;
        }

        case "clear": {
          const roomId = socketRoom.get(socket);
          if (!roomId) return;

          await prisma.stroke.updateMany({
            where: { boardId: roomId },
            data: { isDeleted: true },
          });

          broadcast(roomId, { type: "clear" }, socket);
          break;
        }

        case "restore": {
          const roomId = socketRoom.get(socket);
          if (!roomId) return;

          const strokes = data.strokes;
          if (!Array.isArray(strokes)) return;

          const ids = strokes.map((s: any) => String(s.id));
          if (ids.length === 0) return;

          await prisma.stroke.updateMany({
            where: {
              boardId: roomId,
              id: { in: ids }
            },
            data: { isDeleted: false }
          });

          broadcast(roomId, { type: "restore", strokes }, socket);
          break;
        }

        case "log":
          console.log("CLIENT LOG:", data.message);
          break;
      }
    } catch (err) {
      console.error("WS handler error:", err);
    }
  });

  socket.on("close", () => {
    console.log("Client disconnected");

    const roomId = socketRoom.get(socket);
    const user = socketUser.get(socket);

    socketRoom.delete(socket);
    socketUser.delete(socket);

    if (!roomId) return;

    const set = rooms.get(roomId);
    if (!set) return;

    set.delete(socket);
    if (set.size === 0) rooms.delete(roomId);

    // Broadcast departure
    if (user) {
      broadcast(roomId, { type: "user-left", userId: user.id }, socket);
    }
  });
});

function broadcast(roomId: string, data: any, sender: WebSocket) {
  const clients = rooms.get(roomId);
  if (!clients) return;

  for (const client of clients) {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }
}

const PORT = Number(process.env.PORT || 4000);
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
