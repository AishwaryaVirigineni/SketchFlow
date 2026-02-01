"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

type Board = {
  id: string;
  name: string;
};

import AuthGuard from "@/components/AuthGuard";

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const router = useRouter();

  const [joinId, setJoinId] = useState("");

  useEffect(() => {
    // Basic check before fetch, though guard will handle it
    if (typeof window !== "undefined") {
      apiFetch("/boards").then(setBoards).catch(() => { });
    }
  }, []);

  async function createBoard() {
    const board = await apiFetch("/boards", { method: "POST" });
    router.push(`/board/${board.id}`);
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinId.trim()) return;

    let id = joinId.trim();

    // Extract ID if user pasted a full URL
    try {
      const url = new URL(id);
      const segments = url.pathname.split("/").filter(Boolean);
      const last = segments[segments.length - 1];
      if (last) id = last;
    } catch {
      // Not a URL, use as is
    }

    router.push(`/board/${id}`);
  }

  return (
    <AuthGuard>
      <div className="p-8 max-w-5xl mx-auto space-y-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
            {/* We could show user name here if we had it in context/store easily */}
            <button
              onClick={() => {
                apiFetch("/auth/logout", { method: "POST" })
                  .then(() => {
                    // Clear client-side token immediately
                    localStorage.removeItem("whiteboard_token");
                    localStorage.removeItem("whiteboard_user");
                    router.push("/login");
                  });
              }}
              className="text-sm font-medium text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex flex-col h-full justify-between space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-1 group-hover:text-blue-600 transition-colors">Create New Board</h2>
                <p className="text-gray-500 text-sm">Start a fresh collaboration session instantly.</p>
              </div>
              <button
                onClick={createBoard}
                className="w-full bg-black text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-800 transition-all active:scale-[0.98]"
              >
                Create Board
              </button>
            </div>
          </div>

          {/* Join Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col h-full justify-between space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">Join Session</h2>
                <p className="text-gray-500 text-sm">Enter a Board ID to jump into an existing room.</p>
              </div>
              <form onSubmit={handleJoin} className="flex gap-2">
                <input
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  placeholder="e.g. 123e4567..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black/5"
                />
                <button
                  type="submit"
                  disabled={!joinId.trim()}
                  className="bg-gray-100 border border-gray-200 text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Recent Boards List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2">Recent Boards</h2>
          {boards.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-gray-500">No boards found. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {boards.map((b) => (
                <div
                  key={b.id}
                  className="group relative bg-white border p-5 rounded-xl cursor-pointer hover:border-black/30 transition-all hover:-translate-y-1 shadow-sm"
                  onClick={() => router.push(`/board/${b.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-mono text-gray-500">
                      {b.id.slice(0, 2)}
                    </div>
                    <div className="text-xs text-gray-400">Owner</div>
                  </div>
                  <div className="font-medium text-gray-900 truncate">{b.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono mt-1 truncate">{b.id}</div>

                  <div className="absolute inset-0 border-2 border-black rounded-xl opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </AuthGuard >
  );
}
