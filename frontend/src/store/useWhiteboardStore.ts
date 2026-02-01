import { create } from "zustand";

export type Point = { x: number; y: number };

export type ShapeType = "line" | "arrow" | "rect" | "ellipse";
export type ToolType =
  | "pointer"
  | "select"
  | "text"
  | "pencil"
  | "eraser"
  | "highlighter"
  | ShapeType;

export type Stroke = {
  id: string;
  userId: string;
  color: string;
  width: number;
  points: Point[];
  shape?: ShapeType;
  kind?: string;
  text?: string;
};

function hexToRgba(hex: string, alpha: number) {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Action History Types
type HistoryAction =
  | { type: "add"; stroke: Stroke }
  | { type: "delete"; stroke: Stroke }
  | { type: "clear"; previousStrokes: Stroke[] };

// Broadcast Types (what we tell the server)
export type BroadcastEvent =
  | { type: "undo"; strokeId: string }
  | { type: "stroke"; stroke: Stroke } // Also used for redo-add and undo-delete
  | { type: "clear" }
  | { type: "restore"; strokes: Stroke[] }
  | { type: "snapshot"; strokes: Stroke[] };

type WhiteboardState = {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  remoteStrokes: Record<string, Stroke>;

  // History for Undo/Redo
  history: HistoryAction[];
  future: HistoryAction[];

  color: string;
  width: number;
  tool: ToolType;

  setColor: (c: string) => void;
  setWidth: (w: number) => void;
  setTool: (t: ToolType) => void;

  replaceAllStrokes: (strokes: Stroke[]) => void;

  startStroke: (userId: string, p: Point) => void;
  updateShapeEnd: (p: Point) => void;
  addPoint: (p: Point) => void;
  commitStroke: () => Stroke | null;

  addStroke: (stroke: Stroke) => void;

  deleteStroke: (id: string, broadcast?: boolean) => Stroke | null; // modified to be an action
  clearBoard: () => void;

  undo: () => BroadcastEvent | null;
  redo: () => BroadcastEvent | null;

  addRemoteStroke: (stroke: Stroke) => void;
  updateRemoteStroke: (userId: string, stroke: Stroke) => void;
  removeStrokeById: (id: string) => void; // Remote removal
};

export const useWhiteboardStore = create<WhiteboardState>((set, get) => ({
  strokes: [],
  currentStroke: null,
  remoteStrokes: {},
  history: [],
  future: [],

  color: "#000000",
  width: 4,
  tool: "pencil",

  setColor: (color) => set({ color }),
  setWidth: (width) => set({ width }),
  setTool: (tool) => set({ tool }),

  replaceAllStrokes: (strokes) =>
    set({
      strokes: Array.isArray(strokes) ? strokes : [],
      currentStroke: null,
      remoteStrokes: {},
      history: [],
      future: [],
    }),

  startStroke: (userId, point) => {
    const { color, width, tool } = get();

    // Mapping tool to logic
    const isShape =
      tool === "line" || tool === "arrow" || tool === "rect" || tool === "ellipse";

    let strokeColor = color;
    if (tool === "eraser") strokeColor = "#ffffff";
    if (tool === "highlighter") strokeColor = hexToRgba(color, 0.25);

    // For text, we handle it elsewhere, but good to have safety
    const kind = tool === "text" ? "text" : (isShape ? tool : tool);

    const stroke: Stroke = {
      id: crypto.randomUUID(),
      userId,
      color: strokeColor,
      width,
      points: isShape ? [point, point] : [point],
      shape: isShape ? tool : undefined,
      kind: isShape ? tool : (tool === "text" ? "text" : tool),
    };

    set({ currentStroke: stroke });
  },

  updateShapeEnd: (point) => {
    const { currentStroke } = get();
    if (!currentStroke) return;
    if (!currentStroke.shape) return;

    const [start] = currentStroke.points;
    currentStroke.points = [start, point];
    set({ currentStroke });
  },

  addPoint: (point) => {
    const { currentStroke } = get();
    if (!currentStroke) return;

    currentStroke.points.push(point);
    set({ currentStroke });
  },

  commitStroke: () => {
    // Finalize drawing -> Add to history
    let done: Stroke | null = null;

    set((state) => {
      if (!state.currentStroke) return state;
      done = state.currentStroke;

      return {
        strokes: [...state.strokes, done],
        currentStroke: null,
        history: [...state.history, { type: "add", stroke: done }],
        future: [] // Clear redo stack on new action
      };
    });

    return done;
  },

  addStroke: (stroke) => {
    set((state) => {
      if (state.strokes.some(s => s.id === stroke.id)) return state;

      return {
        strokes: [...state.strokes, stroke],
        history: [...state.history, { type: "add", stroke }],
        future: []
      };
    });
  },

  deleteStroke: (id, broadcast = true) => {
    // Action: Delete
    let deleted: Stroke | null = null;
    set((state) => {
      const target = state.strokes.find(s => s.id === id);
      if (!target) return state;
      deleted = target;

      return {
        strokes: state.strokes.filter(s => s.id !== id),
        history: broadcast ? [...state.history, { type: "delete", stroke: target }] : state.history,
        future: broadcast ? [] : state.future
      };
    });
    return deleted;
  },

  clearBoard: () => {
    set((state) => {
      if (state.strokes.length === 0) return state;

      return {
        strokes: [],
        history: [...state.history, { type: "clear", previousStrokes: state.strokes }],
        future: []
      };
    });
  },

  undo: () => {
    let broadcast: BroadcastEvent | null = null;

    set((state) => {
      if (state.history.length === 0) return state;

      const lastAction = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);

      // REVERSE the action locally
      let newStrokes = [...state.strokes];

      if (lastAction.type === "add") {
        // Inverse of ADD is DELETE
        newStrokes = newStrokes.filter(s => s.id !== lastAction.stroke.id);
        broadcast = { type: "undo", strokeId: lastAction.stroke.id };
      } else if (lastAction.type === "delete") {
        // Inverse of DELETE is ADD
        newStrokes = [...newStrokes, lastAction.stroke];
        broadcast = { type: "stroke", stroke: lastAction.stroke };
      } else if (lastAction.type === "clear") {
        // Inverse of CLEAR is RESTORE
        newStrokes = lastAction.previousStrokes;
        broadcast = { type: "restore", strokes: lastAction.previousStrokes } as any;
      }

      return {
        strokes: newStrokes,
        history: newHistory,
        future: [...state.future, lastAction]
      };
    });

    return broadcast;
  },

  redo: () => {
    let broadcast: BroadcastEvent | null = null;

    set((state) => {
      if (state.future.length === 0) return state;

      const nextAction = state.future[state.future.length - 1];
      const newFuture = state.future.slice(0, -1);

      // RE-APPLY the action locally
      let newStrokes = [...state.strokes];

      if (nextAction.type === "add") {
        newStrokes = [...newStrokes, nextAction.stroke];
        broadcast = { type: "stroke", stroke: nextAction.stroke };
      } else if (nextAction.type === "delete") {
        newStrokes = newStrokes.filter(s => s.id !== nextAction.stroke.id);
        broadcast = { type: "undo", strokeId: nextAction.stroke.id };
      } else if (nextAction.type === "clear") {
        newStrokes = [];
        broadcast = { type: "clear" };
      }

      return {
        strokes: newStrokes,
        history: [...state.history, nextAction],
        future: newFuture
      };
    });

    return broadcast;
  },

  addRemoteStroke: (stroke) =>
    set((state) => {
      if (state.strokes.some((s) => s.id === stroke.id)) return state;

      const { [stroke.userId]: _, ...rest } = state.remoteStrokes;

      return {
        strokes: [...state.strokes, stroke],
        remoteStrokes: rest
      };
    }),

  updateRemoteStroke: (userId, stroke) =>
    set((state) => ({
      remoteStrokes: {
        ...state.remoteStrokes,
        [userId]: stroke
      }
    })),

  removeStrokeById: (id) =>
    set((state) => ({
      strokes: state.strokes.filter((s) => s.id !== id),
    })),
}));

