import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const BPM_VALUES = [100, 110, 120] as const;
export type BpmValue = typeof BPM_VALUES[number];

interface MetronomeStore {
  bpm: BpmValue;
  isPlaying: boolean;
  cprStartTime: number | null;
  lastCPRTime: string;
  setBpm: (bpm: BpmValue) => void;
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

export const useMetronomeStore = create<MetronomeStore>()(
  persist(
    (set) => ({
      bpm: 110,
      isPlaying: false,
      cprStartTime: null,
      lastCPRTime: '',
      setBpm: (bpm) => set({ bpm }),
      toggle: () =>
        set((state) => {
          if (state.isPlaying) {
            return {
              isPlaying: false,
              cprStartTime: null,
              lastCPRTime: elapsedToMMSS(state.cprStartTime),
            };
          }
          return { isPlaying: true, cprStartTime: Date.now() };
        }),
      stop: () =>
        set((state) => ({
          isPlaying: false,
          cprStartTime: null,
          lastCPRTime: elapsedToMMSS(state.cprStartTime),
        })),
    }),
    {
      name: 'metronome-store',
      partialize: (state) => ({ lastCPRTime: state.lastCPRTime }),
    },
  ),
);
