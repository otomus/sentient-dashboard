import { create } from "zustand";
import type { SenseCalibration } from "@otomus/sentient-sdk";

interface SensesStore {
  calibration: Record<string, SenseCalibration>;
  configValues: Record<string, string>;
  sightFrame: string | null;
  sightSource: string | null;

  updateCalibration: (data: Record<string, SenseCalibration>) => void;
  restoreConfig: (data: Record<string, string>) => void;
  setConfigValue: (key: string, value: string) => void;
  setSightFrame: (image: string, source?: string) => void;
}

export const useSensesStore = create<SensesStore>((set) => ({
  calibration: {},
  configValues: {},
  sightFrame: null,
  sightSource: null,

  updateCalibration: (data) => set({ calibration: data }),
  restoreConfig: (data) =>
    set((state) => ({ configValues: { ...state.configValues, ...data } })),
  setConfigValue: (key, value) =>
    set((state) => ({ configValues: { ...state.configValues, [key]: value } })),
  setSightFrame: (image, source) => set({ sightFrame: image, sightSource: source ?? null }),
}));
