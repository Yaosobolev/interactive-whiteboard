"use client";

import {
  useRef,
  useEffect,
  useState,
  MouseEvent,
  WheelEvent,
  TouchEvent,
  useCallback,
} from "react";
import {
  Point,
  WhiteboardObject,
  PreviewShape,
  ToolType,
} from "@/types/whiteboard";
import { getObjectBounds, drawArrowHead } from "@/lib/geometry";
import { BOARD_WIDTH, BOARD_HEIGHT, GRID_SIZE } from "@/lib/constants";

interface CanvasProps {
  objects: WhiteboardObject[];
  selectedId: string | null;
  currentPath: Point[];
  previewShape: PreviewShape | null;
  color: string;
  strokeWidth: number;
  tool: ToolType;
  onMouseDown: (pos: Point) => void;
  onMouseMove: (pos: Point) => void;
  onMouseUp: (pos: Point) => void;
}
// touch
export const Canvas = ({
  objects,
  selectedId,
  currentPath,
  previewShape,
  color,
  strokeWidth,
  tool,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [containerSize, setContainerSize] = useState({
    width: 800,
    height: 600,
  });
  const [touchPanStart, setTouchPanStart] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);

  // Handle container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Fit canvas to screen on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fitToScreen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerSize]);

  // Handle space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const fitToScreen = useCallback(() => {
    const padding = 40;
    const scaleX = (containerSize.width - padding * 2) / BOARD_WIDTH;
    const scaleY = (containerSize.height - padding * 2) / BOARD_HEIGHT;
    const newScale = Math.min(scaleX, scaleY, 1);

    const newOffsetX = (containerSize.width - BOARD_WIDTH * newScale) / 2;
    const newOffsetY = (containerSize.height - BOARD_HEIGHT * newScale) / 2;

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  }, [containerSize]);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): Point => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };

      const x = (screenX - rect.left - offset.x) / scale;
      const y = (screenY - rect.top - offset.y) / scale;
      return { x, y };
    },
    [scale, offset],
  );

  // Mouse handlers
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (spacePressed || e.button === 1) {
      // Start panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      e.preventDefault();
      return;
    }

    if (e.button === 0) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      // Only trigger if within board bounds
      if (
        pos.x >= 0 &&
        pos.x <= BOARD_WIDTH &&
        pos.y >= 0 &&
        pos.y <= BOARD_HEIGHT
      ) {
        onMouseDown(pos);
      }
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const pos = screenToCanvas(e.clientX, e.clientY);
    onMouseMove(pos);
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    const pos = screenToCanvas(e.clientX, e.clientY);
    onMouseUp(pos);
  };

  // Touch handlers
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    e.preventDefault();

    // Two fingers - pan
    if (e.touches.length === 2) {
      setTouchPanStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
      setIsDrawing(false);
      return;
    }

    // One finger - drawing
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const pos = screenToCanvas(touch.clientX, touch.clientY);

      // Only trigger if within board bounds
      if (
        pos.x >= 0 &&
        pos.x <= BOARD_WIDTH &&
        pos.y >= 0 &&
        pos.y <= BOARD_HEIGHT
      ) {
        onMouseDown(pos);
        setIsDrawing(true);
      }
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    e.preventDefault();

    // Two fingers - pan
    if (e.touches.length === 2) {
      setOffset({
        x: e.touches[0].clientX - touchPanStart.x,
        y: e.touches[0].clientY - touchPanStart.y,
      });
      setIsDrawing(false);
      return;
    }

    // One finger - drawing
    if (e.touches.length === 1 && isDrawing) {
      const touch = e.touches[0];
      const pos = screenToCanvas(touch.clientX, touch.clientY);
      onMouseMove(pos);
    }
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Drawing end
    if (isDrawing && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const pos = screenToCanvas(touch.clientX, touch.clientY);
      onMouseUp(pos);
      setIsDrawing(false);
    }
  };

  // Zoom with mouse wheel
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scale * zoomFactor, 0.1), 3);

    // Zoom towards mouse position
    const newOffsetX = mouseX - (mouseX - offset.x) * (newScale / scale);
    const newOffsetY = mouseY - (mouseY - offset.y) * (newScale / scale);

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Draw dot grid
    ctx.fillStyle = "#e5e7eb";
    for (let x = GRID_SIZE; x < BOARD_WIDTH; x += GRID_SIZE) {
      for (let y = GRID_SIZE; y < BOARD_HEIGHT; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw objects
    objects.forEach((obj) => {
      ctx.strokeStyle = obj.color;
      ctx.fillStyle = obj.color;
      ctx.lineWidth = obj.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (obj.type === "path") {
        ctx.beginPath();
        obj.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      } else if (obj.type === "line") {
        ctx.beginPath();
        ctx.moveTo(obj.x, obj.y);
        ctx.lineTo(obj.x2, obj.y2);
        ctx.stroke();
      } else if (obj.type === "arrow") {
        ctx.beginPath();
        ctx.moveTo(obj.x, obj.y);
        ctx.lineTo(obj.x2, obj.y2);
        ctx.stroke();
        drawArrowHead(ctx, obj.x, obj.y, obj.x2, obj.y2);
      } else if (obj.type === "rect") {
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      } else if (obj.type === "ellipse") {
        ctx.beginPath();
        ctx.ellipse(
          obj.x + obj.width / 2,
          obj.y + obj.height / 2,
          obj.width / 2,
          obj.height / 2,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }

      // Selection
      if (obj.id === selectedId) {
        const bounds = getObjectBounds(obj);
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(
          bounds.x - 6,
          bounds.y - 6,
          bounds.width + 12,
          bounds.height + 12,
        );
        ctx.setLineDash([]);

        // Handles
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        const size = 8;
        const corners = [
          { x: bounds.x - 6, y: bounds.y - 6 },
          { x: bounds.x + bounds.width + 6, y: bounds.y - 6 },
          { x: bounds.x - 6, y: bounds.y + bounds.height + 6 },
          { x: bounds.x + bounds.width + 6, y: bounds.y + bounds.height + 6 },
        ];
        corners.forEach((c) => {
          ctx.fillRect(c.x - size / 2, c.y - size / 2, size, size);
          ctx.strokeRect(c.x - size / 2, c.y - size / 2, size, size);
        });
      }
    });

    // Current path
    if (currentPath.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.beginPath();
      currentPath.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }

    // Preview shape
    if (previewShape) {
      ctx.strokeStyle = previewShape.color;
      ctx.fillStyle = previewShape.color;
      ctx.lineWidth = previewShape.strokeWidth;
      ctx.globalAlpha = 0.5;

      if (previewShape.type === "line") {
        ctx.beginPath();
        ctx.moveTo(previewShape.x, previewShape.y);
        ctx.lineTo(previewShape.x2, previewShape.y2);
        ctx.stroke();
      } else if (previewShape.type === "arrow") {
        ctx.beginPath();
        ctx.moveTo(previewShape.x, previewShape.y);
        ctx.lineTo(previewShape.x2, previewShape.y2);
        ctx.stroke();
        drawArrowHead(
          ctx,
          previewShape.x,
          previewShape.y,
          previewShape.x2,
          previewShape.y2,
        );
      } else if (previewShape.type === "rect") {
        ctx.strokeRect(
          previewShape.x,
          previewShape.y,
          previewShape.width,
          previewShape.height,
        );
      } else if (previewShape.type === "ellipse") {
        ctx.beginPath();
        const rx = Math.abs(previewShape.width / 2);
        const ry = Math.abs(previewShape.height / 2);
        const cx = previewShape.x + previewShape.width / 2;
        const cy = previewShape.y + previewShape.height / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }, [objects, currentPath, previewShape, selectedId, color, strokeWidth]);

  const getCursor = (): string => {
    if (spacePressed || isPanning) return "grab";
    if (tool === "select") return "default";
    if (tool === "eraser") return "pointer";
    return "crosshair";
  };

  const zoomIn = () => {
    const newScale = Math.min(scale * 1.2, 3);
    setScale(newScale);
  };

  const zoomOut = () => {
    const newScale = Math.max(scale * 0.8, 0.1);
    setScale(newScale);
  };

  return (
    <div className="relative w-full h-full">
      {/* Canvas container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden bg-gray-100"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsPanning(false);
          onMouseUp({ x: 0, y: 0 });
        }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: getCursor(), touchAction: "none" }}
      >
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            width: BOARD_WIDTH,
            height: BOARD_HEIGHT,
          }}
        >
          <canvas
            ref={canvasRef}
            width={BOARD_WIDTH}
            height={BOARD_HEIGHT}
            className="shadow-2xl rounded-lg"
          />
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-1">
        <button
          onClick={zoomOut}
          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Уменьшить"
        >
          -
        </button>
        <button
          onClick={fitToScreen}
          className="px-2 h-8 flex items-center justify-center text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-mono min-w-[50px]"
          title="Вписать в экран"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={zoomIn}
          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Увеличить"
        >
          +
        </button>
      </div>

      {/* Board size indicator */}
      <div className="absolute bottom-4 right-4 text-xs text-gray-400 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-100">
        {BOARD_WIDTH} × {BOARD_HEIGHT}
      </div>

      {/* Pan hint */}
      <div className="hidden md:block absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-100">
        Пробел + мышь - перемещение • Колёсико - масштаб
      </div>
    </div>
  );
};
