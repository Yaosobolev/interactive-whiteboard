"use client";

interface StrokeWidthProps {
  value: number;
  onChange: (value: number) => void;
}

export const StrokeWidth = ({ value, onChange }: StrokeWidthProps) => {
  return (
    <div>
      <div className="text-[11px] text-gray-500 text-center mb-2 font-semibold tracking-wide">
        ТОЛЩИНА
      </div>
      <input
        type="range"
        min="1"
        max="20"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-500"
      />
      <div className="text-center text-xs text-gray-500 mt-1">{value}px</div>
    </div>
  );
};
