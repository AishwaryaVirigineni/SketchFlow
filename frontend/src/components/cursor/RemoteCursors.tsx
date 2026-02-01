"use client";

import { useCursorStore } from "@/store/useCursorStore";

export default function RemoteCursors() {
  const remoteCursors = useCursorStore((s) => s.remoteCursors);
  const now = Date.now();

  return (
    <>
      {Object.entries(remoteCursors).map(([id, c]) => {
        if (now - c.lastUpdate > 1500) return null;

        return (
          <div
            key={id}
            className="pointer-events-none absolute"
            style={{
              transform: `translate(${c.x}px, ${c.y}px)`,
            }}
          >
            {/* Avatar or dot */}
            {c.avatar ? (
              <img
                src={c.avatar}
                alt={c.name}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: `2px solid ${c.color}`,
                  background: "white",
                }}
              />
            ) : (
              <div
                style={{
                  width: 12,
                  height: 12,
                  background: c.color,
                  borderRadius: "50%",
                  border: "2px solid white",
                }}
              />
            )}

            {/* Name label */}
            <div
              style={{
                background: c.color,
                color: "white",
                padding: "2px 6px",
                borderRadius: 6,
                marginTop: 4,
                fontSize: 10,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {c.name}
            </div>
          </div>
        );
      })}
    </>
  );
}
  