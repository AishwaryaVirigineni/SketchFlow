"use client";

import { useEffect, useRef, useState } from "react";
import { useWhiteboardStore, Stroke } from "@/store/useWhiteboardStore";
import { sendWS, onWSMessage } from "@/lib/ws";
import { getClientId, getUserColor, getUserName, getUserAvatar } from "@/lib/clientId";
import { useCursorStore } from "@/store/useCursorStore";

export default function CanvasBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    strokes,
    currentStroke,
    remoteStrokes,
    startStroke,
    updateShapeEnd,
    addPoint,
    commitStroke,
    addRemoteStroke,
    updateRemoteStroke,
    removeStrokeById,
    replaceAllStrokes,
    addStroke,
    tool,
  } = useWhiteboardStore();

  const { updateCursor, removeCursor, addUser, removeUser, setUsers } = useCursorStore();
  const userId = getClientId();

  const [editingText, setEditingText] = useState<{ x: number; y: number; clientX: number; clientY: number } | null>(null);

  const hydratedRef = useRef(false);

  useEffect(() => {
    replaceAllStrokes([]); // Clear store on mount to avoid carrying over state

    // Reset users on mount
    setUsers([]);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redraw();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    redraw();
  }, [strokes, currentStroke, remoteStrokes]);

  // Clean up text input when switching tools
  useEffect(() => {
    if (tool !== "text") {
      setEditingText(null);
    }
  }, [tool]);

  useEffect(() => {
    const off = onWSMessage((data) => {
      switch (data.type) {

        case "snapshot":
          if (hydratedRef.current) break;
          hydratedRef.current = true;

          data.strokes.forEach((stroke: Stroke) => {
            addRemoteStroke(stroke);
          });
          break;

        // case "snapshot":
        //   replaceAllStrokes(data.strokes || []);
        //   break;

        case "shape-final":
        case "stroke":
          addRemoteStroke(data.stroke);
          break;

        case "stroke-point":
          updateRemoteStroke(data.userId, data.stroke);
          break;

        case "cursor":
          updateCursor(data.userId, {
            x: data.x,
            y: data.y,
            color: data.color,
            name: data.name,
            avatar: data.avatar,
            lastUpdate: Date.now(),
          });
          break;

        case "user-joined":
          addUser(data.user);
          break;

        case "user-left":
          removeUser(data.userId);
          removeCursor(data.userId); // Clear their cursor immediately because they left
          break;

        case "room-users":
          setUsers(data.users);
          break;

        case "undo":
          removeStrokeById(data.strokeId);
          break;

        case "redo":
          addRemoteStroke(data.stroke);
          break;

        case "clear":
          replaceAllStrokes([]);
          break;

        case "restore":
          replaceAllStrokes(data.strokes);
          break;
      }
    });

    return () => {
      off();
    };
  }, [addRemoteStroke, removeStrokeById, replaceAllStrokes, updateCursor, updateRemoteStroke, addUser, removeUser, removeCursor, setUsers]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const { tool, deleteStroke } = useWhiteboardStore.getState();
    const rect = canvasRef.current!.getBoundingClientRect();
    const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (tool === "pointer") return;

    if (tool === "text") {
      setEditingText({
        x: p.x,
        y: p.y,
        clientX: e.clientX,
        clientY: e.clientY
      });
      return;
    }

    if (tool === "select") {
      // ... (keep select logic)
      // Simple hit testing
      // Find top-most stroke that is close to point
      const { strokes } = useWhiteboardStore.getState();
      const hit = [...strokes].reverse().find(s => {
        if (s.kind === "text") {
          // Text hit test approx
          const pt = s.points[0];
          const w = s.width * (s.text?.length || 5);
          const h = 20;
          return p.x >= pt.x && p.x <= pt.x + w && p.y >= pt.y - h && p.y <= pt.y;
        }

        if (s.points.length < 2) return false;
        // Bounding box check first
        const minX = Math.min(...s.points.map(pt => pt.x)) - s.width;
        const maxX = Math.max(...s.points.map(pt => pt.x)) + s.width;
        const minY = Math.min(...s.points.map(pt => pt.y)) - s.width;
        const maxY = Math.max(...s.points.map(pt => pt.y)) + s.width;

        if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) return false;

        // Refined distance check for lines? For now box is okay for prototype
        return true;
      });

      if (hit) {
        const deleted = deleteStroke(hit.id);
        if (deleted) {
          sendWS({ type: "undo", strokeId: deleted.id });
        }
      }
      return;
    }

    startStroke(userId, p);

    // Broadcast start
    // We construct a partial stroke to start syncing
    const { currentStroke } = useWhiteboardStore.getState();
    if (currentStroke) {
      sendWS({ type: "stroke-point", userId, stroke: currentStroke });
    }
  };

  // ... (handlePointerMove, handlePointerUp)

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    sendWS({
      type: "cursor",
      userId,
      x: e.clientX,
      y: e.clientY,
      color: getUserColor(),
      name: getUserName(),
      avatar: getUserAvatar(),

    });

    if (!currentStroke) return;

    if (currentStroke.shape) updateShapeEnd(p);
    else addPoint(p);

    // Broadcast update
    sendWS({ type: "stroke-point", userId, stroke: currentStroke });

    redraw();
  };

  const handlePointerUp = () => {
    const stroke = commitStroke();
    if (!stroke) return;

    sendWS({
      type: stroke.shape ? "shape-final" : "stroke",
      stroke,
    });
  };

  const finalizeText = (text: string) => {
    if (!editingText || !text.trim()) {
      // prevent auto-close on empty to avoid disappearing box issues
      // setEditingText(null);
      return;
    }

    const { color, width } = useWhiteboardStore.getState();
    const stroke: Stroke = {
      id: crypto.randomUUID(),
      userId,
      color,
      width, // serves as font size roughly?
      points: [{ x: editingText.x, y: editingText.y }],
      kind: "text",
      text: text.trim(),
    };

    addStroke(stroke); // Add locally with history
    sendWS({ type: "stroke", stroke }); // Broadcast

    setEditingText(null);
  };

  // ... (redraw, drawStroke functions)

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved strokes
    strokes.forEach((s) => drawStroke(ctx, s));

    // Draw remote live strokes
    Object.values(remoteStrokes).forEach(s => drawStroke(ctx, s));

    // Draw my current stroke
    if (currentStroke) drawStroke(ctx, currentStroke);
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.kind === "text" && stroke.text) {
      ctx.save();
      ctx.font = `bold 24px sans-serif`;
      ctx.fillStyle = stroke.color;
      ctx.textBaseline = "middle";
      ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y);
      ctx.restore();
      return;
    }

    if (stroke.shape === "line") return drawLine(ctx, stroke);
    if (stroke.shape === "arrow") return drawArrow(ctx, stroke);
    if (stroke.shape === "rect") return drawRect(ctx, stroke);
    if (stroke.shape === "ellipse") return drawEllipse(ctx, stroke);

    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";

    ctx.beginPath();
    stroke.points.forEach((p, i) =>
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
    );
    ctx.stroke();
    ctx.restore();
  };

  const drawLine = (ctx: CanvasRenderingContext2D, s: Stroke) => {
    const [a, b] = s.points;
    if (!a || !b) return;

    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, s: Stroke) => {
    const [a, b] = s.points;
    if (!a || !b) return;

    drawLine(ctx, s);

    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const size = 12;

    ctx.save();
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(
      b.x - size * Math.cos(angle - Math.PI / 6),
      b.y - size * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      b.x - size * Math.cos(angle + Math.PI / 6),
      b.y - size * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawRect = (ctx: CanvasRenderingContext2D, s: Stroke) => {
    const [a, b] = s.points;
    if (!a || !b) return;

    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    ctx.restore();
  };

  const drawEllipse = (ctx: CanvasRenderingContext2D, s: Stroke) => {
    const [a, b] = s.points;
    if (!a || !b) return;

    const rx = (b.x - a.x) / 2;
    const ry = (b.y - a.y) / 2;
    const cx = a.x + rx;
    const cy = a.y + ry;

    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white touch-none">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {editingText && (
        <form
          className="fixed z-[999999] origin-top-left"
          style={{
            left: editingText.clientX,
            top: editingText.clientY - 14,
          }}
          onSubmit={(e) => {
            e.preventDefault();
            finalizeText((e.currentTarget.elements.namedItem("txt") as HTMLInputElement).value);
          }}
        >
          <input
            name="txt"
            autoFocus
            autoComplete="off"
            className="bg-white border-2 border-black rounded px-2 py-1 text-2xl font-bold font-sans text-black shadow-lg min-w-[200px] outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            style={{ color: "black", opacity: 1 }}
            placeholder="Type here..."
            onBlur={(e) => finalizeText(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </form>
      )}
    </div>
  );
}
