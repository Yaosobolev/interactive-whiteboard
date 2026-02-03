"use client";

import { useState, useRef, useEffect, useLayoutEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { ToolType } from "@/types/whiteboard";
import { COLORS } from "@/lib/constants";
import {
  MousePointer2,
  Pencil,
  Minus,
  Square,
  Circle,
  Eraser,
  SlidersHorizontal,
} from "lucide-react";

interface ToolItem {
  id: ToolType;
  icon: ReactNode;
  label: string;
  shortcut?: string;
}

const tools: ToolItem[] = [
  { id: "select", icon: <MousePointer2 size={20} />, label: "Выбор" },
  { id: "pen", icon: <Pencil size={20} />, label: "Карандаш" },
  { id: "line", icon: <Minus size={20} />, label: "Линия" },
  { id: "rect", icon: <Square size={20} />, label: "Прямоугольник" },
  { id: "ellipse", icon: <Circle size={20} />, label: "Эллипс" },
  { id: "eraser", icon: <Eraser size={20} />, label: "Ластик" },
];

const Popup = ({
  isOpen,
  onClose,
  triggerRef,
  children,
  className = "",
  width = 200,
}: {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  width?: number;
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0, arrowLeft: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      const viewportWidth = window.innerWidth;

      const gap = 12;

      let leftPos = rect.left + rect.width / 2 + scrollX;

      const halfWidth = width / 2;

      if (leftPos - halfWidth < 10) {
        leftPos = halfWidth + 10;
      } else if (leftPos + halfWidth > viewportWidth - 10) {
        leftPos = viewportWidth - 10 - halfWidth;
      }

      const arrowAbsolutePos = rect.left + rect.width / 2 + scrollX;
      const arrowOffset = arrowAbsolutePos - (leftPos - halfWidth);

      const finalLeft = leftPos - halfWidth;

      setPosition({
        top: rect.top + scrollY - gap,
        left: finalLeft,
        arrowLeft: arrowOffset,
      });
    }
  }, [isOpen, triggerRef, width]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={popupRef}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width: width,
        transform: "translateY(-100%)",
        zIndex: 9999,
      }}
      className={`bg-white rounded-xl shadow-xl border border-gray-200 p-3 ${className}`}
    >
      <div
        className="absolute bottom-0 w-3 h-3 bg-white border-r border-b border-gray-200"
        style={{
          left: position.arrowLeft,
          transform: "translate(-50%, 50%) rotate(45deg)",
        }}
      />
      {children}
    </div>,
    document.body,
  );
};

interface ToolbarProps {
  tool: ToolType;
  onToolChange: (tool: ToolType) => void;
  color: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
}

export const Toolbar = ({
  tool,
  onToolChange,
  color,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
}: ToolbarProps) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);

  const strokeBtnRef = useRef<HTMLButtonElement>(null);
  const colorBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-5 flex justify-center">
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-1.5 sm:p-2 flex items-center gap-1 sm:gap-2 max-w-full overflow-x-auto">
        {/* Tools */}
        <div className="flex items-center gap-0.5 sm:gap-1 px-0.5 sm:px-1 flex-shrink-0">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => onToolChange(t.id)}
              className={`
                w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-lg sm:rounded-xl flex items-center justify-center
                transition-all duration-200
                ${
                  tool === t.id
                    ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-105"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }
              `}
            >
              <span className="scale-90 sm:scale-100">{t.icon}</span>
            </button>
          ))}
        </div>

        <div className="w-px h-6 sm:h-8 bg-gray-200 flex-shrink-0" />

        {/* Stroke Width */}
        <div className="relative flex-shrink-0">
          <div className="lg:hidden">
            <button
              ref={strokeBtnRef}
              onClick={() => {
                setShowStrokePicker(!showStrokePicker);
                setShowColorPicker(false);
              }}
              className={`
                w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center
                transition-all duration-200 text-gray-500 hover:text-gray-700
                ${showStrokePicker ? "bg-gray-100" : "hover:bg-gray-100"}
              `}
            >
              <div className="relative">
                <SlidersHorizontal size={18} className="text-gray-500" />
                <div
                  className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gray-700 flex items-center justify-center"
                  style={{ transform: `scale(${0.5 + strokeWidth / 30})` }}
                />
              </div>
            </button>

            <Popup
              isOpen={showStrokePicker}
              onClose={() => setShowStrokePicker(false)}
              triggerRef={strokeBtnRef}
              width={220} // Указываем ширину явно для корректного расчета границ
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {[2, 4, 8, 12].map((width) => (
                    <button
                      key={width}
                      onClick={() => onStrokeWidthChange(width)}
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                        transition-all duration-200
                        ${strokeWidth === width ? "bg-gray-100 scale-105" : "hover:bg-gray-100"}
                      `}
                    >
                      <div
                        className="rounded-full bg-gray-700"
                        style={{
                          width: Math.min(width + 2, 14),
                          height: Math.min(width + 2, 14),
                        }}
                      />
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="24"
                    value={strokeWidth}
                    onChange={(e) =>
                      onStrokeWidthChange(Number(e.target.value))
                    }
                    className="flex-1 cursor-pointer w-full"
                  />
                  <span className="text-xs text-gray-400 w-8 text-right font-mono flex-shrink-0">
                    {strokeWidth}px
                  </span>
                </div>
              </div>
            </Popup>
          </div>

          {/* Desktop Stroke controls... (оставляем как было) */}
          <div className="hidden lg:flex items-center gap-3 px-3">
            {/* ... код десктопа без изменений ... */}
            <div className="flex items-center gap-1">
              {[2, 4, 8, 12].map((width) => (
                <button
                  key={width}
                  onClick={() => onStrokeWidthChange(width)}
                  title={`${width}px`}
                  className={`
                    w-9 h-9 rounded-lg flex items-center justify-center
                    transition-all duration-200
                    ${strokeWidth === width ? "bg-gray-100 scale-105" : "hover:bg-gray-100"}
                  `}
                >
                  <div
                    className="rounded-full bg-gray-700"
                    style={{
                      width: Math.min(width + 2, 14),
                      height: Math.min(width + 2, 14),
                    }}
                  />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="24"
                value={strokeWidth}
                onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
                className="w-20 cursor-pointer"
              />
              <span className="text-xs text-gray-400 w-7 text-right font-mono">
                {strokeWidth}px
              </span>
            </div>
          </div>
        </div>

        <div className="w-px h-6 sm:h-8 bg-gray-200 flex-shrink-0" />

        {/* Colors */}
        <div className="relative flex-shrink-0">
          <div className="xl:hidden">
            <button
              ref={colorBtnRef}
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowStrokePicker(false);
              }}
              className={`
                w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center
                transition-all duration-200 relative hover:bg-gray-100
                ${showColorPicker ? "bg-gray-100" : ""}
              `}
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: color }}
              />
            </button>

            <Popup
              isOpen={showColorPicker}
              onClose={() => setShowColorPicker(false)}
              triggerRef={colorBtnRef}
              width={184} // (4 колонки * 32px) + (3 gaps * 8px) + padding ~ 184px
            >
              {/* Добавил фиксированную ширину контейнера и центрирование */}
              <div className="grid grid-cols-4 gap-2 w-[160px] justify-items-center mx-auto">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onColorChange(c);
                      setShowColorPicker(false);
                    }}
                    className={`
                      w-8 h-8 rounded-full transition-all duration-200 flex-shrink-0
                      ${
                        color === c
                          ? "ring-2 ring-offset-2 ring-gray-300 scale-110"
                          : "hover:scale-110"
                      }
                    `}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </Popup>
          </div>

          {/* Desktop Colors... (оставляем как было) */}
          <div className="hidden xl:flex items-center gap-1.5 px-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                className={`
                  w-7 h-7 rounded-full transition-all duration-200
                  ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-gray-300 scale-110"
                      : "hover:scale-110"
                  }
                `}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
