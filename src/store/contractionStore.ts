import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Contraction {
  id: number;               // Date.now() at end — used as unique key and end timestamp
  startMs?: number;         // Date.now() at start (older records: derive via contractionStart())
  duration: number;         // seconds — how long the contraction lasted
  interval: number | null;  // seconds from previous contraction's START to this one's START
}

export interface ContractionSession {
  id: number;               // Date.now() when session was saved (reset pressed)
  savedAt: number;          // same — for display
  label?: string;           // optional name / nickname of the mother
  contractions: Contraction[];
}

/** Start timestamp of a contraction — records saved before startMs existed are derived from end − duration */
export function contractionStart(c: Contraction): number {
  return c.startMs ?? c.id - c.duration * 1000;
}

interface ContractionState {
  contractions: Contraction[];
  sessions: ContractionSession[];
  currentLabel: string;
  active: boolean;
  startMs: number | null;     // Date.now() when the current contraction started
  lastStartMs: number | null; // Date.now() when the previous contraction started
  startContraction: () => void;
  endContraction: () => void;
  deleteContraction: (id: number) => void;
  deleteSession: (id: number) => void;
  setCurrentLabel: (label: string) => void;
  renameSession: (id: number, label: string) => void;
  restoreSession: (id: number) => void;
  reset: () => void;
}

export const useContractionStore = create<ContractionState>()(
  persist(
    (set, get) => ({
      contractions: [],
      sessions: [],
      currentLabel: '',
      active: false,
      startMs: null,
      lastStartMs: null,

      startContraction: () => {
        set({ active: true, startMs: Date.now() });
      },

      endContraction: () => {
        const { startMs, lastStartMs, contractions } = get();
        const now = Date.now();
        const start = startMs ?? now;
        const duration = Math.round((now - start) / 1000);
        const interval = lastStartMs
          ? Math.round((start - lastStartMs) / 1000)
          : null;
        set({
          active: false,
          lastStartMs: start,
          startMs: null,
          contractions: [{ id: now, startMs: start, duration, interval }, ...contractions],
        });
      },

      deleteContraction: (id: number) =>
        set(state => ({ contractions: state.contractions.filter(c => c.id !== id) })),

      deleteSession: (id: number) =>
        set(state => ({ sessions: state.sessions.filter(s => s.id !== id) })),

      setCurrentLabel: (label) => set({ currentLabel: label }),

      renameSession: (id, label) =>
        set(state => ({ sessions: state.sessions.map(s => (s.id === id ? { ...s, label } : s)) })),

      // Bring a saved mother back to the main screen; the current one (if any) is saved to history first
      restoreSession: (id) => {
        const { sessions, contractions, currentLabel } = get();
        const target = sessions.find(s => s.id === id);
        if (!target) return;
        const now = Date.now();
        const rest = sessions.filter(s => s.id !== id);
        const withCurrent = contractions.length > 0
          ? [{ id: now, savedAt: now, label: currentLabel.trim() || undefined, contractions }, ...rest]
          : rest;
        const latest = target.contractions[0];
        set({
          contractions: target.contractions,
          currentLabel: target.label ?? '',
          sessions: withCurrent,
          active: false,
          startMs: null,
          lastStartMs: latest ? contractionStart(latest) : null,
        });
      },

      reset: () => {
        const { contractions, sessions, currentLabel } = get();
        const now = Date.now();
        const newSessions = contractions.length > 0
          ? [{ id: now, savedAt: now, label: currentLabel.trim() || undefined, contractions }, ...sessions]
          : sessions;
        set({
          contractions: [],
          sessions: newSessions,
          currentLabel: '',
          active: false,
          startMs: null,
          lastStartMs: null,
        });
      },
    }),
    { name: 'contraction-store' },
  ),
);
