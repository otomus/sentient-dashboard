import { create } from "zustand";
import type { MemoryState } from "@otomus/sentient-sdk";

interface MemoryStore {
  session: Record<string, string>;
  conversation: Array<{ role: string; content: string }>;
  episodes: Array<{ task: string; nerve: string; success: boolean; timestamp?: string }>;
  facts: Array<{ key: string; value: string; source?: string }>;

  update: (data: MemoryState) => void;
}

export const useMemoryStore = create<MemoryStore>((set) => ({
  session: {},
  conversation: [],
  episodes: [],
  facts: [],

  update: (data) =>
    set({
      session: data.session ?? {},
      conversation: data.conversation ?? [],
      episodes: data.episodes ?? [],
      facts: data.facts ?? [],
    }),
}));
