import { create } from "zustand";
import type { SystemStats } from "@otomus/arqitect-sdk";

interface SystemStore {
  stats: SystemStats | null;
  update: (stats: SystemStats) => void;
}

/** Zustand store for system-level stats (CPU, memory, uptime, etc.) from the agent process. */
export const useSystemStore = create<SystemStore>((set) => ({
  stats: null,
  update: (stats) => set({ stats }),
}));
