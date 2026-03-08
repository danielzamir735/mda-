import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const BPM_VALUES = [100, 110, 120] as const;
export type BpmValue = typeof BPM_VALUES[number];

interface MetronomeStore {
  bpm: BpmValue;
  isPlaying: boolean;
  isAudioMuted: boolean;
  cprStartTime: number | null;
  lastCPRTime: string;
  setBpm: (bpm: BpmValue) => void;
  start: () => void;
  toggleAudio: () => void;
  endCPR: () => void;
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

export const useMetronomeStore = create<MetronomeStore>()(
  persist(
    (set, get) => ({
      bpm: 110,
      isPlaying: false,
      isAudioMuted: false,
      cprStartTime: null,
      lastCPRTime: '',
      setBpm: (bpm) => set({ bpm }),
      start: () =>
        set({ isPlaying: true, isAudioMuted: false, cprStartTime: Date.now() }),
      toggleAudio: () =>
        set((state) => ({ isAudioMuted: !state.isAudioMuted })),
      endCPR: () =>
        set((state) => ({
          isPlaying: false,
          isAudioMuted: false,
          cprStartTime: null,
          lastCPRTime: elapsedToMMSS(state.cprStartTime),
        })),
      toggle: () => {
        const state = get();
        if (state.isPlaying) {
          set({
            isPlaying: false,
            isAudioMuted: false,
            cprStartTime: null,
            lastCPRTime: elapsedToMMSS(state.cprStartTime),
          });
        } else {
          set({ isPlaying: true, isAudioMuted: false, cprStartTime: Date.now() });
        }
      },
      stop: () =>
        set((state) => ({
          isPlaying: false,
          isAudioMuted: false,
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
