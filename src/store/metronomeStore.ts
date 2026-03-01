import { create } from 'zustand';

export const BPM_VALUES = [100, 110, 120] as const;
export type BpmValue = typeof BPM_VALUES[number];

interface MetronomeStore {
  bpm: BpmValue;
  isPlaying: boolean;
  setBpm: (bpm: BpmValue) => void;
  toggle: () => void;
  stop: () => void;
}

export const useMetronomeStore = create<MetronomeStore>(set => ({
  bpm: 110,
  isPlaying: false,
  setBpm: (bpm) => set({ bpm }),
  toggle: () => set(state => ({ isPlaying: !state.isPlaying })),
  stop: () => set({ isPlaying: false }),
}));
