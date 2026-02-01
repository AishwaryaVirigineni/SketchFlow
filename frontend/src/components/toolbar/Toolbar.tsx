"use client";

import { useWhiteboardStore } from "@/store/useWhiteboardStore";
import {
  Eraser,
  Pencil,
  Undo,
  Redo,
  Highlighter,
  Slash,
  ArrowUpRight,
  Square,
  Circle,
  Trash2,
  MousePointer2,
  Type,
  Download,
  FileX,
} from "lucide-react";
import { getClientId } from "@/lib/clientId";
import { sendWS } from "@/lib/ws";
import ColorPicker from "./ColorPicker";

export default function Toolbar() {
  const { tool, setTool, width, setWidth, undo, redo, replaceAllStrokes, clearBoard } =
    useWhiteboardStore();


  const handleUndo = () => {
    const event = undo();
    if (event) {
      sendWS(event);
    }
  };

  const handleRedo = () => {
    const event = redo();
    if (event) {
      sendWS(event);
    }
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the entire board?")) {
      clearBoard();
      sendWS({ type: "clear" });
    }

  };

  const handleExport = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    // Create a temporary link
    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const btnClass = (active: boolean) =>
    `p-2 rounded-xl transition group relative ${active ? "bg-black text-white shadow" : "bg-gray-100 hover:bg-gray-200"
    }`;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 flex gap-4 bg-white p-3 rounded-2xl shadow-lg z-50 items-center border border-gray-200">
      {/* Pointer (Move) */}
      <button
        onClick={() => setTool("pointer")}
        className={btnClass(tool === "pointer")}
        data-tooltip="Move / Select"
      >
        <MousePointer2 size={18} />
      </button>

      {/* Pencil */}
      <button
        onClick={() => setTool("pencil")}
        className={btnClass(tool === "pencil")}
        data-tooltip="Pencil"
      >
        <Pencil size={18} />
      </button>

      {/* Text */}
      <button
        onClick={() => setTool("text")}
        className={btnClass(tool === "text")}
        data-tooltip="Add Text"
      >
        <Type size={18} />
      </button>

      {/* Line */}
      <button
        onClick={() => setTool("line")}
        className={btnClass(tool === "line")}
        data-tooltip="Line"
      >
        <Slash size={18} />
      </button>

      {/* Arrow */}
      <button
        onClick={() => setTool("arrow")}
        className={btnClass(tool === "arrow")}
        data-tooltip="Arrow"
      >
        <ArrowUpRight size={18} />
      </button>

      {/* Rectangle */}
      <button
        onClick={() => setTool("rect")}
        className={btnClass(tool === "rect")}
        data-tooltip="Rectangle"
      >
        <Square size={18} />
      </button>

      {/* Ellipse / Circle */}
      <button
        onClick={() => setTool("ellipse")}
        className={btnClass(tool === "ellipse")}
        data-tooltip="Ellipse"
      >
        <Circle size={18} />
      </button>

      {/* Highlighter */}
      <button
        onClick={() => setTool("highlighter")}
        className={btnClass(tool === "highlighter")}
        data-tooltip="Highlighter"
      >
        <Highlighter size={18} />
      </button>

      {/* Eraser */}
      <button
        onClick={() => setTool("eraser")}
        className={btnClass(tool === "eraser")}
        data-tooltip="Eraser"
      >
        <Eraser size={18} />
      </button>

      {/* Color Picker */}
      <ColorPicker />

      {/* Stroke Width */}
      <div className="flex items-center gap-2 group relative" data-tooltip="Adjust Stroke Width">
        <span className="text-xs text-gray-500">Width</span>
        <input
          type="range"
          min="2"
          max="25"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="w-28 cursor-pointer"
        />
      </div>

      {/* Separator */}
      <div className="w-px h-8 bg-gray-200 mx-1"></div>

      {/* Undo */}
      <button
        onClick={handleUndo}
        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl group relative"
        data-tooltip="Undo"
      >
        <Undo size={18} />
      </button>

      {/* Redo */}
      <button
        onClick={handleRedo}
        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl group relative"
        data-tooltip="Redo"
      >
        <Redo size={18} />
      </button>

      {/* Export */}
      <button
        onClick={handleExport}
        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl group relative"
        data-tooltip="Save as Image"
      >
        <Download size={18} />
      </button>

      {/* Delete Object (Trash) */}
      <button
        onClick={() => setTool("select")}
        className={`p-2 rounded-xl transition group relative ${tool === "select" ? "bg-red-500 text-white shadow" : "bg-gray-100 hover:bg-red-100 text-red-500"
          }`}
        data-tooltip="Eraser Tool (Select & Delete)"
      >
        <Trash2 size={18} />
      </button>

      {/* Separator */}
      <div className="w-px h-8 bg-gray-200 mx-1"></div>

      {/* Clear Board */}
      <button
        onClick={handleClear}
        className="p-2 bg-gray-100 hover:bg-red-100 text-red-500 rounded-xl group relative"
        data-tooltip="Reset Canvas"
      >
        <FileX size={18} />
      </button>
    </div>
  );
}
