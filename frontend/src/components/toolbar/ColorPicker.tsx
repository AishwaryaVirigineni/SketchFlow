"use client";

import { useWhiteboardStore } from "@/store/useWhiteboardStore";

export default function ColorPicker() {
  const { color, setColor, tool } = useWhiteboardStore();

  return (
    <div className="flex items-center gap-2">
      {/* Visible color preview */}
      <div
        className="w-6 h-6 rounded-full border shadow-sm group relative"
        style={{
          backgroundColor: tool === "eraser" ? "#ffffff" : color,
        }}
        data-tooltip="Current Color"
      />

      {/* Real color selector */}
      <div className="group relative w-8 h-8 flex items-center justify-center" data-tooltip="Pick Color">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-full h-full p-0 border-none bg-transparent cursor-pointer opacity-0 absolute inset-0 z-10"
        />
        {/* Visual for the picker since input is hidden/ugly */}
        <div className="w-6 h-6 rounded border bg-gradient-to-br from-red-500 via-green-500 to-blue-500 shadow-sm" />
      </div>
    </div>
  );
}
