import { create } from "zustand";

interface RemoteCursor {
  x: number;
  y: number;
  color: string;
  name: string;
  avatar?: string;
  lastUpdate: number;
}

interface CursorState {
  remoteCursors: Record<string, RemoteCursor>;
  activeUsers: { id: string; name: string; avatar?: string; color: string }[];

  updateCursor: (userId: string, data: Partial<RemoteCursor>) => void;
  removeCursor: (userId: string) => void;

  setUsers: (users: any[]) => void;
  addUser: (user: any) => void;
  removeUser: (userId: string) => void;
}

export const useCursorStore = create<CursorState>((set) => ({
  remoteCursors: {},
  activeUsers: [],

  updateCursor: (userId, data) =>
    set((state) => ({
      remoteCursors: {
        ...state.remoteCursors,
        [userId]: {
          ...(state.remoteCursors[userId] || {}),
          ...data,
        },
      },
    })),

  removeCursor: (userId) =>
    set((state) => {
      const newMap = { ...state.remoteCursors };
      delete newMap[userId];
      return { remoteCursors: newMap };
    }),

  setUsers: (users) => set({ activeUsers: users }),

  addUser: (user) =>
    set((state) => {
      if (state.activeUsers.some(u => u.id === user.id)) return state;
      return { activeUsers: [...state.activeUsers, user] };
    }),

  removeUser: (userId) =>
    set((state) => ({
      activeUsers: state.activeUsers.filter(u => u.id !== userId)
    })),
}));
