import { create } from "zustand";

export interface LogEntry {
  id: string;
  type: "thought" | "action" | "result" | "tool" | "system" | "error";
  text: string;
  timestamp: number;
}

interface ReflexStore {
  logs: LogEntry[];
  log: (type: LogEntry["type"], text: string) => void;
  clear: () => void;
}

let logCounter = 0;

export const useReflexStore = create<ReflexStore>((set) => ({
  logs: [],

  log: (type, text) =>
    set((state) => ({
      logs: [
        ...state.logs.slice(-500),
        { id: `log-${++logCounter}`, type, text, timestamp: Date.now() },
      ],
    })),

  clear: () => set({ logs: [] }),
}));
