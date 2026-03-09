import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useVitalsLogStore, type ShockLog } from './vitalsLogStore';

export const BPM_VALUES = [100, 110, 120] as const;
export type BpmValue = typeof BPM_VALUES[number];

interface MetronomeStore {
  bpm: BpmValue;
  isPlaying: boolean;
  isAudioMuted: boolean;
  cprStartTime: number | null;
  lastShockTimestamp: number | null;
  lastCPRTime: string;
  lastCPRShocks: number;
  shockLogs: ShockLog[];
  setBpm: (bpm: BpmValue) => void;
  start: () => void;
  toggleAudio: () => void;
  incrementShock: () => void;
  endCPR: () => void;
  discardCPR: () => void;
  /** @deprecated use start() / endCPR() */
  toggle: () => void;
  stop: () => void;
}

function elapsedToMMSS(startTime: number | null): string {
  if (!startTime) return '';
  const ms = Date.now() - startTime;
  const mm = Math.floor(ms / 60000).toString().padStart(2, '0');
  const ss = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function msToMMSS(ms: number): string {
  const mm = Math.floor(ms / 60000).toString().padStart(2, '0');
  const ss = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export const useMetronomeStore = create<MetronomeStore>()(
  persist(
    (set, get) => ({
      bpm: 110,
      isPlaying: false,
      isAudioMuted: false,
      cprStartTime: null,
      lastShockTimestamp: null,
      lastCPRTime: '',
      lastCPRShocks: 0,
      shockLogs: [],
      setBpm: (bpm) => set({ bpm }),
      start: () =>
        set({ isPlaying: true, isAudioMuted: false, cprStartTime: Date.now(), shockLogs: [], lastShockTimestamp: null }),
      toggleAudio: () =>
        set((state) => ({ isAudioMuted: !state.isAudioMuted })),
      incrementShock: () => {
        const state = get();
        const now = Date.now();
        const date = new Date(now);
        const time = [date.getHours(), date.getMinutes(), date.getSeconds()]
          .map((n) => String(n).padStart(2, '0'))
          .join(':');
        const elapsed = elapsedToMMSS(state.cprStartTime);
        const gap = state.lastShockTimestamp !== null
          ? msToMMSS(now - state.lastShockTimestamp)
          : '—';
        const shock: ShockLog = { time, elapsed, gap };
        set((prev) => ({ shockLogs: [...prev.shockLogs, shock], lastShockTimestamp: now }));
      },
      endCPR: () => {
        const state = get();
        const duration = elapsedToMMSS(state.cprStartTime);
        if (state.cprStartTime) {
          useVitalsLogStore.getState().addLog({
            type: 'cpr',
            bloodPressure: '',
            heartRate: '',
            breathing: '',
            bloodSugar: '',
            saturation: '',
            temperature: '',
            fastTest: '',
            notes: '',
            cprDuration: duration,
            cprShocks: state.shockLogs.length,
            cprShockLogs: state.shockLogs,
          });
        }
        set({
          isPlaying: false,
          isAudioMuted: false,
          cprStartTime: null,
          lastShockTimestamp: null,
          lastCPRTime: duration,
          lastCPRShocks: state.shockLogs.length,
          shockLogs: [],
        });
      },
      discardCPR: () => {
        set({
          isPlaying: false,
          isAudioMuted: false,
          cprStartTime: null,
          lastShockTimestamp: null,
          shockLogs: [],
        });
      },
      toggle: () => {
        const state = get();
        if (state.isPlaying) {
          get().endCPR();
        } else {
          set({ isPlaying: true, isAudioMuted: false, cprStartTime: Date.now(), shockLogs: [], lastShockTimestamp: null });
        }
      },
      stop: () => get().endCPR(),
    }),
    {
      name: 'metronome-store',
      partialize: (state) => ({ lastCPRTime: state.lastCPRTime, lastCPRShocks: state.lastCPRShocks }),
    },
  ),
);
