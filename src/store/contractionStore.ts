import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Contraction {
  id: number;
  duration: number;       // seconds — how long the contraction lasted
  interval: number | null; // seconds from previous contraction's START to this one's START
}

interface ContractionState {
  contractions: Contraction[];
  active: boolean;
  startMs: number | null;     // Date.now() when the current contraction started
  lastStartMs: number | null; // Date.now() when the previous contraction started
  startContraction: () => void;
  endContraction: () => void;
  reset: () => void;
}

export const useContractionStore = create<ContractionState>()(
  persist(
    (set, get) => ({
      contractions: [],
      active: false,
      startMs: null,
      lastStartMs: null,

      startContraction: () => {
        set({ active: true, startMs: Date.now() });
      },

      endContraction: () => {
        const { startMs, lastStartMs, contractions } = get();
        const now = Date.now();
        const duration = Math.round((now - (startMs ?? now)) / 1000);
        const interval = lastStartMs
          ? Math.round((now - lastStartMs) / 1000)
          : null;
        set({
          active: false,
          lastStartMs: startMs,
          startMs: null,
          contractions: [{ id: now, duration, interval }, ...contractions].slice(0, 10),
        });
      },

      reset: () => set({
        contractions: [],
        active: false,
        startMs: null,
        lastStartMs: null,
      }),
    }),
    { name: 'contraction-store' },
  ),
);
