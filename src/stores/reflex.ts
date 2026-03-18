import { create } from "zustand";

/**
 * A single reflex log entry shown in the log drawer.
 * @property id - Auto-incrementing identifier (e.g. "log-42").
 * @property type - Category used for filtering and color-coding.
 * @property text - Human-readable log message.
 * @property timestamp - Unix epoch milliseconds.
 */
export interface LogEntry {
  id: string;
  type: "thought" | "action" | "result" | "tool" | "system" | "error";
  text: string;
  timestamp: number;
  /** Full raw event payload for inspection. */
  raw?: unknown;
}

interface ReflexStore {
  logs: LogEntry[];
  log: (type: LogEntry["type"], text: string, raw?: unknown) => void;
  clear: () => void;
}

let logCounter = 0;

/**
 * Zustand store for the reflex log stream.
 * Keeps the most recent 500 entries, automatically discarding older ones on each append.
 */
export const useReflexStore = create<ReflexStore>((set) => ({
  logs: [],

  log: (type, text, raw?) =>
    set((state) => ({
      logs: [
        ...state.logs.slice(-500),
        { id: `log-${++logCounter}`, type, text, timestamp: Date.now(), raw },
      ],
    })),

  clear: () => set({ logs: [] }),
}));
