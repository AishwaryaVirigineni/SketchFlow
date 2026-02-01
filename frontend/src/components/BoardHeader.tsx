import { useCursorStore } from "@/store/useCursorStore";
import { ArrowLeft, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { getClientId } from "@/lib/clientId";

export default function BoardHeader({ roomId }: { roomId: string }) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const users = useCursorStore((s) => s.activeUsers);

    // Add local state for board name and editing
    const [boardName, setBoardName] = useState("Untitled Board");
    const [isEditing, setIsEditing] = useState(false);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        // Fetch current name and ownership
        apiFetch(`/boards/${roomId}`)
            .then((b: any) => {
                setBoardName(b.name);
                setIsOwner(b.ownerId === getClientId());
            });
    }, [roomId]);

    const handleRename = async () => {
        setIsEditing(false);
        try {
            await apiFetch(`/boards/${roomId}/name`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: boardName }),
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleShare = () => {
        const url = `${window.location.origin}/board/${roomId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-50">
            {/* Left Side: Back + Name */}
            <div className="pointer-events-auto flex items-center gap-3 bg-white p-2 rounded-xl shadow-md border">
                <button
                    onClick={() => router.push("/boards")}
                    className="hover:bg-gray-100 p-1 rounded-lg"
                    title="Back to Dashboard"
                >
                    <ArrowLeft size={20} />
                </button>

                {isEditing ? (
                    <input
                        className="text-sm font-bold outline-none border-b-2 border-blue-500 w-48"
                        value={boardName}
                        onChange={(e) => setBoardName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => e.key === "Enter" && handleRename()}
                        autoFocus
                    />
                ) : (
                    <span
                        onClick={() => isOwner && setIsEditing(true)}
                        className={`text-sm font-bold group relative ${isOwner ? "cursor-pointer hover:bg-gray-50 px-2 py-1 rounded" : ""}`}
                        data-tooltip={isOwner ? "Click to Rename" : "Board Name"}
                    >
                        {boardName}
                    </span>
                )}
            </div>


            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
                {/* Active Users List */}
                <div
                    className="pointer-events-auto flex items-center -space-x-2 bg-white/90 backdrop-blur p-1.5 rounded-full shadow border pr-4 group relative"
                    data-tooltip="Active Users"
                >
                    {users.slice(0, 5).map((u) => (
                        <div
                            key={u.id}
                            className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center bg-gray-100 overflow-hidden shadow-sm"
                            style={u.avatar?.startsWith("http") || u.avatar?.startsWith("/") ? undefined : { backgroundColor: u.color }}
                            title={u.name}
                        >
                            {u.avatar?.startsWith("http") || u.avatar?.startsWith("/") ? (
                                <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-white">{u.avatar || u.name[0]}</span>
                            )}
                        </div>
                    ))}
                    {users.length > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 z-10">
                            +{users.length - 5}
                        </div>
                    )}
                    {users.length === 0 && (
                        <span className="ml-3 text-xs text-gray-400">Waiting...</span>
                    )}
                </div>

                {/* Share Button */}
                <button
                    onClick={handleShare}
                    className="pointer-events-auto bg-black text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2 hover:bg-gray-800 transition h-[44px]"
                >
                    <Share2 size={16} />
                    {copied ? "Copied!" : "Share"}
                </button>


            </div>
        </div>
    );
}
