import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Contraction {
  id: number;               // Date.now() at end — used as unique key and end timestamp
  duration: number;         // seconds — how long the contraction lasted
  interval: number | null;  // seconds from previous contraction's START to this one's START
}

export interface ContractionSession {
  id: number;               // Date.now() when session was saved (reset pressed)
  savedAt: number;          // same — for display
  contractions: Contraction[];
}

interface ContractionState {
  contractions: Contraction[];
  sessions: ContractionSession[];
  active: boolean;
  startMs: number | null;     // Date.now() when the current contraction started
  lastStartMs: number | null; // Date.now() when the previous contraction started
  startContraction: () => void;
  endContraction: () => void;
  deleteContraction: (id: number) => void;
  deleteSession: (id: number) => void;
  reset: () => void;
}

export const useContractionStore = create<ContractionState>()(
  persist(
    (set, get) => ({
      contractions: [],
      sessions: [],
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
          contractions: [{ id: now, duration, interval }, ...contractions],
        });
      },

      deleteContraction: (id: number) =>
        set(state => ({ contractions: state.contractions.filter(c => c.id !== id) })),

      deleteSession: (id: number) =>
        set(state => ({ sessions: state.sessions.filter(s => s.id !== id) })),

      reset: () => {
        const { contractions, sessions } = get();
        const now = Date.now();
        const newSessions = contractions.length > 0
          ? [{ id: now, savedAt: now, contractions }, ...sessions]
          : sessions;
        set({
          contractions: [],
          sessions: newSessions,
          active: false,
          startMs: null,
          lastStartMs: null,
        });
      },
    }),
    { name: 'contraction-store' },
  ),
);
