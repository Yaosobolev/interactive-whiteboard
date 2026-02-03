import {
  Point,
  Bounds,
  WhiteboardObject,
  LineObject,
  ArrowObject,
} from "@/types/whiteboard";

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const isPointInRect = (
  px: number,
  py: number,
  rect: Bounds,
): boolean => {
  const { x, y, width, height } = rect;
  const minX = Math.min(x, x + width);
  const maxX = Math.max(x, x + width);
  const minY = Math.min(y, y + height);
  const maxY = Math.max(y, y + height);
  return px >= minX && px <= maxX && py >= minY && py <= maxY;
};

export const isPointInEllipse = (
  px: number,
  py: number,
  ellipse: { x: number; y: number; width: number; height: number },
): boolean => {
  const { x, y, width, height } = ellipse;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const rx = Math.abs(width / 2);
  const ry = Math.abs(height / 2);
  if (rx === 0 || ry === 0) return false;
  return Math.pow((px - cx) / rx, 2) + Math.pow((py - cy) / ry, 2) <= 1;
};

export const isPointNearLine = (
  px: number,
  py: number,
  line: { x: number; y: number; x2: number; y2: number },
  threshold: number = 8,
): boolean => {
  const { x, y, x2, y2 } = line;
  const A = px - x;
  const B = py - y;
  const C = x2 - x;
  const D = y2 - y;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  const param = lenSq !== 0 ? dot / lenSq : -1;

  let xx: number, yy: number;
  if (param < 0) {
    xx = x;
    yy = y;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x + param * C;
    yy = y + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy) < threshold;
};

export const isPointNearPath = (
  px: number,
  py: number,
  points: Point[],
  threshold: number = 10,
): boolean => {
  for (let i = 0; i < points.length - 1; i++) {
    if (
      isPointNearLine(
        px,
        py,
        {
          x: points[i].x,
          y: points[i].y,
          x2: points[i + 1].x,
          y2: points[i + 1].y,
        },
        threshold,
      )
    ) {
      return true;
    }
  }
  return false;
};

export const getObjectBounds = (obj: WhiteboardObject): Bounds => {
  if (obj.type === "path") {
    const xs = obj.points.map((p) => p.x);
    const ys = obj.points.map((p) => p.y);
    return {
      x: Math.min(...xs) - 5,
      y: Math.min(...ys) - 5,
      width: Math.max(...xs) - Math.min(...xs) + 10,
      height: Math.max(...ys) - Math.min(...ys) + 10,
    };
  }

  if (obj.type === "line" || obj.type === "arrow") {
    const lineObj = obj as LineObject | ArrowObject;
    return {
      x: Math.min(lineObj.x, lineObj.x2) - 5,
      y: Math.min(lineObj.y, lineObj.y2) - 5,
      width: Math.abs(lineObj.x2 - lineObj.x) + 10,
      height: Math.abs(lineObj.y2 - lineObj.y) + 10,
    };
  }

  return { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
};

export const drawArrowHead = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  size: number = 12,
): void => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - size * Math.cos(angle - Math.PI / 6),
    y2 - size * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    x2 - size * Math.cos(angle + Math.PI / 6),
    y2 - size * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
};
