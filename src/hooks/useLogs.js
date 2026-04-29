import { create } from "zustand";

// simple hash (demo only)
const hash = (s) =>
  btoa(unescape(encodeURIComponent(s))).slice(0, 16);

export const useLogs = create((set, get) => ({
  chain: [],
  alerts: [],

  addBlock: (event) => {
    const prev = get().chain.at(-1);
    const payload = JSON.stringify(event) + (prev?.hash || "");
    const block = {
      ...event,
      timestamp: Date.now(),
      prevHash: prev?.hash || "GENESIS",
      hash: hash(payload),
    };

    set((state) => ({
      chain: [...state.chain, block],
      alerts: [event.message, ...state.alerts].slice(0, 5),
    }));
  },

  clearAlerts: () => set({ alerts: [] }),
}));
