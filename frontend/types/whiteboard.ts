export type ToolType =
  | "select"
  | "hand"
  | "pen"
  | "line"
  | "arrow"
  | "rect"
  | "ellipse"
  | "eraser";

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BaseObject {
  id: string;
  color: string;
  strokeWidth: number;
}

export interface PathObject extends BaseObject {
  type: "path";
  points: Point[];
  x: number;
  y: number;
}

export interface LineObject extends BaseObject {
  type: "line";
  x: number;
  y: number;
  x2: number;
  y2: number;
}

export interface ArrowObject extends BaseObject {
  type: "arrow";
  x: number;
  y: number;
  x2: number;
  y2: number;
}

export interface RectObject extends BaseObject {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EllipseObject extends BaseObject {
  type: "ellipse";
  x: number;
  y: number;
  width: number;
  height: number;
}

export type WhiteboardObject =
  | PathObject
  | LineObject
  | ArrowObject
  | RectObject
  | EllipseObject;

export interface PreviewShape {
  type: ToolType;
  x: number;
  y: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
}

export interface Tool {
  id: ToolType;
  icon: string;
  label: string;
}
