import { create } from "zustand";
import type { SystemStats } from "@otomus/sentient-sdk";

interface SystemStore {
  stats: SystemStats | null;
  update: (stats: SystemStats) => void;
}

export const useSystemStore = create<SystemStore>((set) => ({
  stats: null,
  update: (stats) => set({ stats }),
}));
