import { create } from "zustand";

type Status = "connecting" | "online" | "offline" | "killed";

interface ConnectionStore {
  status: Status;
  reconnectAttempt: number;
  setOnline: () => void;
  setOffline: () => void;
  setReconnecting: (attempt: number) => void;
  setKilled: () => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  status: "connecting",
  reconnectAttempt: 0,
  setOnline: () => set({ status: "online", reconnectAttempt: 0 }),
  setOffline: () => set({ status: "offline" }),
  setReconnecting: (attempt) => set({ status: "offline", reconnectAttempt: attempt }),
  setKilled: () => set({ status: "killed" }),
}));
