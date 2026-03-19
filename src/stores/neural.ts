import { create } from "zustand";
import type { NerveStatus, NerveDetails } from "@otomus/arqitect-sdk";

/**
 * A discrete event in the neural processing pipeline.
 * @property id - Auto-incrementing identifier (e.g. "evt-7").
 * @property type - The kind of neural event.
 * @property nerve - Name of the nerve involved, if any.
 * @property stage - Processing stage label (e.g. "qualifying", "responding").
 * @property timestamp - Unix epoch milliseconds.
 */
export interface NeuralEvent {
  id: string;
  type: "thought" | "action" | "result" | "response";
  nerve?: string;
  stage?: string;
  timestamp: number;
}

/** Current stage of the dream (background consolidation) lifecycle, or null when not dreaming. */
export type DreamStage =
  | "qualifying"
  | "qualified"
  | "qualification_failed"
  | "reconciling"
  | "pruning"
  | "finetuning"
  | "personality_reflection"
  | null;

interface NeuralStore {
  nerves: NerveStatus[];
  events: NeuralEvent[];
  activeNerve: string | null;
  selectedNerve: string | null;
  selectedNerveDetails: NerveDetails | null;
  detailsLoading: boolean;
  brainState: "idle" | "thinking" | "acting" | "responding";
  dreamStage: DreamStage;
  dreamNerve: string | null;
  dreamMessage: string | null;

  updateNerves: (nerves: NerveStatus[]) => void;
  addEvent: (event: Omit<NeuralEvent, "id" | "timestamp">) => void;
  setActiveNerve: (name: string | null) => void;
  setSelectedNerve: (name: string | null) => void;
  setSelectedNerveDetails: (details: NerveDetails | null) => void;
  setDetailsLoading: (loading: boolean) => void;
  setBrainState: (state: NeuralStore["brainState"]) => void;
  setDream: (stage: DreamStage, nerve?: string | null, message?: string | null) => void;
}

let eventCounter = 0;

/**
 * Zustand store for neural state: nerves, events, brain activity, and dream stage.
 * Keeps the most recent 100 events, automatically discarding older ones on each append.
 */
export const useNeuralStore = create<NeuralStore>((set) => ({
  nerves: [],
  events: [],
  activeNerve: null,
  selectedNerve: null,
  selectedNerveDetails: null,
  detailsLoading: false,
  brainState: "idle",
  dreamStage: null,
  dreamNerve: null,
  dreamMessage: null,

  updateNerves: (nerves) => set({ nerves }),

  addEvent: (event) =>
    set((state) => ({
      events: [
        ...state.events.slice(-100),
        { ...event, id: `evt-${++eventCounter}`, timestamp: Date.now() },
      ],
    })),

  setActiveNerve: (name) => set({ activeNerve: name }),
  setSelectedNerve: (name) => set({ selectedNerve: name }),
  setSelectedNerveDetails: (details) => set({ selectedNerveDetails: details }),
  setDetailsLoading: (loading) => set({ detailsLoading: loading }),
  setBrainState: (brainState) => set({ brainState }),
  setDream: (stage, nerve = null, message = null) =>
    set({ dreamStage: stage, dreamNerve: nerve, dreamMessage: message }),
}));
