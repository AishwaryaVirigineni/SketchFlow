"use client";

import { useEffect } from "react";
import { getSocket, sendWS, onWSOpen } from "@/lib/ws";
import { useParams } from "next/navigation";
import CanvasBoard from "@/components/canvas/CanvasBoard";
import Toolbar from "@/components/toolbar/Toolbar";
import RemoteCursors from "@/components/cursor/RemoteCursors";

import AuthGuard from "@/components/AuthGuard";
import BoardHeader from "@/components/BoardHeader";

import { apiFetch } from "@/lib/api";
import { getClientId, getUserName, getUserColor, getUserAvatar } from "@/lib/clientId";

export default function BoardPage() {
  const { boardId } = useParams();

  useEffect(() => {
    // Fetch board details to record visit (API side effect)
    apiFetch(`/boards/${boardId}`).catch(err => console.error("Failed to load board meta:", err));

    const join = () => {
      sendWS({
        type: "join",
        roomId: boardId,
        user: {
          id: getClientId(),
          name: getUserName(),
          color: getUserColor(),
          avatar: getUserAvatar(),
        },
      });
    };

    if (getSocket().readyState === WebSocket.OPEN) join();

    // Also listen for open event in case it's connecting
    const off = onWSOpen(join);
    return () => {
      off();
    };
  }, [boardId]);

  return (
    <AuthGuard>
      <div className="relative w-screen h-screen">
        <BoardHeader roomId={boardId as string} />
        <Toolbar />
        <CanvasBoard />
        <div className="absolute inset-0 pointer-events-none">
          <RemoteCursors />
        </div>
      </div>
    </AuthGuard>
  );
}
