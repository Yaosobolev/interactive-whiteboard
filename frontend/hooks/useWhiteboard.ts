"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ToolType,
  Point,
  WhiteboardObject,
  PreviewShape,
} from "@/types/whiteboard";
import {
  generateId,
  isPointInRect,
  isPointInEllipse,
  isPointNearLine,
  isPointNearPath,
} from "@/lib/geometry";

const BOARDS_LIST_KEY = "whiteboard-boards-list";

interface BoardInfo {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  objectsCount: number;
}

interface Settings {
  color: string;
  strokeWidth: number;
}

interface UseWhiteboardReturn {
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  color: string;
  setColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  objects: WhiteboardObject[];
  selectedId: string | null;
  currentPath: Point[];
  previewShape: PreviewShape | null;
  handleMouseDown: (pos: Point) => void;
  handleMouseMove: (pos: Point) => void;
  handleMouseUp: (pos: Point) => void;
  clearCanvas: () => void;
}

// Storage keys с boardId
const getObjectsKey = (boardId: string) => `whiteboard-objects-${boardId}`;
const getSettingsKey = (boardId: string) => `whiteboard-settings-${boardId}`;

// Загрузка объектов из localStorage
const loadObjectsFromStorage = (boardId: string): WhiteboardObject[] => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(getObjectsKey(boardId));
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Failed to load objects from localStorage:", error);
  }
  return [];
};

// Загрузка настроек из localStorage
const loadSettingsFromStorage = (boardId: string): Settings | null => {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(getSettingsKey(boardId));
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Failed to load settings from localStorage:", error);
  }
  return null;
};

// Сохранение объектов в localStorage
const saveObjectsToStorage = (boardId: string, objects: WhiteboardObject[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getObjectsKey(boardId), JSON.stringify(objects));

    // Обновляем информацию о доске в списке
    updateBoardInfo(boardId, objects.length);
  } catch (error) {
    console.error("Failed to save objects to localStorage:", error);
  }
};

// Сохранение настроек в localStorage
const saveSettingsToStorage = (boardId: string, settings: Settings) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getSettingsKey(boardId), JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings to localStorage:", error);
  }
};

// Обновление информации о доске в списке досок
const updateBoardInfo = (boardId: string, objectsCount: number) => {
  try {
    const saved = localStorage.getItem(BOARDS_LIST_KEY);
    if (saved) {
      const boards: BoardInfo[] = JSON.parse(saved);
      const updatedBoards = boards.map((board) => {
        if (board.id === boardId) {
          return {
            ...board,
            updatedAt: Date.now(),
            objectsCount,
          };
        }
        return board;
      });
      localStorage.setItem(BOARDS_LIST_KEY, JSON.stringify(updatedBoards));
    }
  } catch (error) {
    console.error("Failed to update board info:", error);
  }
};

export const useWhiteboard = (boardId: string): UseWhiteboardReturn => {
  const [tool, setTool] = useState<ToolType>("select");
  const [color, setColor] = useState("#1a1a2e");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [objects, setObjects] = useState<WhiteboardObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [dragOffset, setDragOffset] = useState<Point | null>(null);
  const [previewShape, setPreviewShape] = useState<PreviewShape | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Загрузка при монтировании или смене boardId
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoaded(false);

    const savedObjects = loadObjectsFromStorage(boardId);
    setObjects(savedObjects);

    const savedSettings = loadSettingsFromStorage(boardId);
    if (savedSettings) {
      setColor(savedSettings.color);
      setStrokeWidth(savedSettings.strokeWidth);
    } else {
      // Дефолтные значения для новой доски
      setColor("#1a1a2e");
      setStrokeWidth(3);
    }

    setSelectedId(null);
    setIsLoaded(true);
  }, [boardId]);

  // Сохранение объектов при изменении
  useEffect(() => {
    if (isLoaded) {
      saveObjectsToStorage(boardId, objects);
    }
  }, [objects, isLoaded, boardId]);

  // Сохранение настроек при изменении
  useEffect(() => {
    if (isLoaded) {
      saveSettingsToStorage(boardId, { color, strokeWidth });
    }
  }, [color, strokeWidth, isLoaded, boardId]);

  const findObjectAtPoint = useCallback(
    (x: number, y: number): WhiteboardObject | null => {
      for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        if (obj.type === "rect" && isPointInRect(x, y, obj)) return obj;
        if (obj.type === "ellipse" && isPointInEllipse(x, y, obj)) return obj;
        if (
          (obj.type === "line" || obj.type === "arrow") &&
          isPointNearLine(x, y, obj)
        )
          return obj;
        if (
          obj.type === "path" &&
          isPointNearPath(x, y, obj.points, obj.strokeWidth + 5)
        )
          return obj;
      }
      return null;
    },
    [objects],
  );

  const handleMouseDown = useCallback(
    (pos: Point) => {
      if (tool === "select") {
        const obj = findObjectAtPoint(pos.x, pos.y);
        if (obj) {
          setSelectedId(obj.id);
          setDragOffset({ x: pos.x - obj.x, y: pos.y - obj.y });
          setIsDrawing(true);
        } else {
          setSelectedId(null);
        }
      } else if (tool === "eraser") {
        const obj = findObjectAtPoint(pos.x, pos.y);
        if (obj) {
          setObjects((prev) => prev.filter((o) => o.id !== obj.id));
          if (selectedId === obj.id) setSelectedId(null);
        }
      } else if (tool === "pen") {
        setIsDrawing(true);
        setCurrentPath([pos]);
      } else if (["line", "arrow", "rect", "ellipse"].includes(tool)) {
        setIsDrawing(true);
        setStartPoint(pos);
      }
    },
    [tool, findObjectAtPoint, selectedId],
  );

  const handleMouseMove = useCallback(
    (pos: Point) => {
      if (!isDrawing) return;

      if (tool === "select" && selectedId && dragOffset) {
        setObjects((prev) =>
          prev.map((obj) => {
            if (obj.id !== selectedId) return obj;
            const dx = pos.x - dragOffset.x - obj.x;
            const dy = pos.y - dragOffset.y - obj.y;

            if (obj.type === "path") {
              return {
                ...obj,
                x: pos.x - dragOffset.x,
                y: pos.y - dragOffset.y,
                points: obj.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              };
            }

            if (obj.type === "line" || obj.type === "arrow") {
              return {
                ...obj,
                x: pos.x - dragOffset.x,
                y: pos.y - dragOffset.y,
                x2: obj.x2 + dx,
                y2: obj.y2 + dy,
              };
            }

            return { ...obj, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
          }),
        );
      } else if (tool === "pen") {
        setCurrentPath((prev) => [...prev, pos]);
      } else if (
        startPoint &&
        ["line", "arrow", "rect", "ellipse"].includes(tool)
      ) {
        setPreviewShape({
          type: tool,
          x: startPoint.x,
          y: startPoint.y,
          x2: pos.x,
          y2: pos.y,
          width: pos.x - startPoint.x,
          height: pos.y - startPoint.y,
          color,
          strokeWidth,
        });
      }
    },
    [isDrawing, tool, selectedId, dragOffset, startPoint, color, strokeWidth],
  );

  const handleMouseUp = useCallback(
    (pos: Point) => {
      if (!isDrawing) return;

      if (tool === "pen" && currentPath.length > 1) {
        const xs = currentPath.map((p) => p.x);
        const ys = currentPath.map((p) => p.y);
        setObjects((prev) => [
          ...prev,
          {
            id: generateId(),
            type: "path",
            points: currentPath,
            x: Math.min(...xs),
            y: Math.min(...ys),
            color,
            strokeWidth,
          },
        ]);
      } else if (startPoint && ["line", "arrow"].includes(tool)) {
        setObjects((prev) => [
          ...prev,
          {
            id: generateId(),
            type: tool as "line" | "arrow",
            x: startPoint.x,
            y: startPoint.y,
            x2: pos.x,
            y2: pos.y,
            color,
            strokeWidth,
          },
        ]);
      } else if (startPoint && ["rect", "ellipse"].includes(tool)) {
        const width = pos.x - startPoint.x;
        const height = pos.y - startPoint.y;
        if (Math.abs(width) > 5 && Math.abs(height) > 5) {
          setObjects((prev) => [
            ...prev,
            {
              id: generateId(),
              type: tool as "rect" | "ellipse",
              x: width > 0 ? startPoint.x : pos.x,
              y: height > 0 ? startPoint.y : pos.y,
              width: Math.abs(width),
              height: Math.abs(height),
              color,
              strokeWidth,
            },
          ]);
        }
      }

      setIsDrawing(false);
      setCurrentPath([]);
      setStartPoint(null);
      setDragOffset(null);
      setPreviewShape(null);
    },
    [isDrawing, tool, currentPath, startPoint, color, strokeWidth],
  );

  const clearCanvas = useCallback(() => {
    setObjects([]);
    setSelectedId(null);
    localStorage.removeItem(getObjectsKey(boardId));
  }, [boardId]);

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        // Предотвращаем удаление если фокус на input
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        ) {
          return;
        }
        setObjects((prev) => prev.filter((o) => o.id !== selectedId));
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  return {
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
  };
};
