import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/requireAuth";
import { randomUUID } from "crypto";
import type { AuthedRequest } from "../middleware/requireAuth";




const router = Router();
const prisma = new PrismaClient();

/**
 * Create a board
 */
router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const { name } = req.body;

  const board = await prisma.board.create({
    data: {
      id: randomUUID(),
      ownerId: userId,
      name: name || "Untitled Board",
    },
  });

  res.json(board);
});

/**
 * Get all boards for user (owned + recent)
 */
router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;

  // Fetch owned boards
  const owned = await prisma.board.findMany({
    where: { ownerId: userId },
  });

  // Fetch recently visited boards
  const recents = await prisma.recentBoard.findMany({
    where: { userId },
    include: { board: true },
    orderBy: { visitedAt: "desc" },
  });

  // Combine and deduplicate
  const map = new Map<string, any>();

  owned.forEach(b => map.set(b.id, b));
  recents.forEach(r => {
    if (r.board) map.set(r.boardId, r.board);
  });

  const all = Array.from(map.values())
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  res.json(all);
});

/**
 * Get board by id (join by URL)
 */
router.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const boardId = req.params.id;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
  });

  if (!board) {
    return res.status(404).json({ error: "Board not found" });
  }

  // Record visit
  await prisma.recentBoard.upsert({
    where: {
      userId_boardId: {
        userId,
        boardId,
      },
    },
    create: {
      userId,
      boardId,
    },
    update: {
      visitedAt: new Date(),
    },
  });

  res.json(board);
});

/**
 * Update board name
 */
router.put("/:id/name", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const boardId = req.params.id;
  const { name } = req.body;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
  });

  if (!board) return res.status(404).json({ error: "Board not found" });

  if (board.ownerId !== userId) {
    return res.status(403).json({ error: "Not authorized to rename this board" });
  }

  const updated = await prisma.board.update({
    where: { id: boardId },
    data: { name },
  });

  res.json(updated);
});

export default router;
