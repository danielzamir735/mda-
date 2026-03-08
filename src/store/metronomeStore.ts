import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useVitalsLogStore } from './vitalsLogStore';

export const BPM_VALUES = [100, 110, 120] as const;
export type BpmValue = typeof BPM_VALUES[number];

interface MetronomeStore {
  bpm: BpmValue;
  isPlaying: boolean;
  isAudioMuted: boolean;
  cprStartTime: number | null;
  lastCPRTime: string;
  lastCPRShocks: number;
  shockCount: number;
  setBpm: (bpm: BpmValue) => void;
  start: () => void;
  toggleAudio: () => void;
  incrementShock: () => void;
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
      lastCPRShocks: 0,
      shockCount: 0,
      setBpm: (bpm) => set({ bpm }),
      start: () =>
        set({ isPlaying: true, isAudioMuted: false, cprStartTime: Date.now(), shockCount: 0 }),
      toggleAudio: () =>
        set((state) => ({ isAudioMuted: !state.isAudioMuted })),
      incrementShock: () =>
        set((state) => ({ shockCount: state.shockCount + 1 })),
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
            cprShocks: state.shockCount,
          });
        }
        set({
          isPlaying: false,
          isAudioMuted: false,
          cprStartTime: null,
          lastCPRTime: duration,
          lastCPRShocks: state.shockCount,
          shockCount: 0,
        });
      },
      toggle: () => {
        const state = get();
        if (state.isPlaying) {
          get().endCPR();
        } else {
          set({ isPlaying: true, isAudioMuted: false, cprStartTime: Date.now(), shockCount: 0 });
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
