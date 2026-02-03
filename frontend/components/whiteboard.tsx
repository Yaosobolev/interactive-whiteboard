"use client";

import { useWhiteboard } from "@/hooks/useWhiteboard";
import { Canvas } from "./canvas";
import { Toolbar } from "./toolbar";
import { Trash2, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface WhiteboardProps {
  boardId: string;
}

export const Whiteboard = ({ boardId }: WhiteboardProps) => {
  const {
    tool,
    setTool,
    color,
    setColor,
    strokeWidth,
    setStrokeWidth,
    objects,
    selectedId,
    currentPath,
    previewShape,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearCanvas,
  } = useWhiteboard(boardId);

  return (
    <div className="h-[100dvh] w-screen bg-[#fafafa] flex flex-col overflow-hidden">
      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        <Canvas
          objects={objects}
          selectedId={selectedId}
          currentPath={currentPath}
          previewShape={previewShape}
          color={color}
          strokeWidth={strokeWidth}
          tool={tool}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />

        {/* Top Left - Back button */}
        <Link
          href="/"
          className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 sm:gap-2 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-gray-600 hover:text-gray-900 hover:bg-white transition-all shadow-sm border border-gray-100"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium hidden sm:inline">
            Все доски
          </span>
        </Link>

        {/* Top Right Controls */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-sm text-gray-600 shadow-sm border border-gray-100 flex items-center gap-1.5 sm:gap-2">
            <span className="text-gray-400">{objects.length}</span>
            <span className="hidden xs:inline">объектов</span>
          </div>
          <button
            onClick={clearCanvas}
            className="bg-white/90 backdrop-blur-sm rounded-xl p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm border border-gray-100"
            title="Очистить доску"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Selection Hint */}
        {selectedId && (
          <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-sm text-white text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-2">
            <RotateCcw size={14} />
            <span>Delete</span>
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      <Toolbar
        tool={tool}
        onToolChange={setTool}
        color={color}
        onColorChange={setColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
      />
    </div>
  );
};
