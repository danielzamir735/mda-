import { create } from 'zustand';

const MIN_BPM = 100;
const MAX_BPM = 120;

interface MetronomeStore {
  bpm: number;
  isPlaying: boolean;
  setBpm: (bpm: number) => void;
  toggle: () => void;
  stop: () => void;
}

export const useMetronomeStore = create<MetronomeStore>(set => ({
  bpm: 100,
  isPlaying: false,
  setBpm: (bpm) => set({ bpm: Math.min(MAX_BPM, Math.max(MIN_BPM, bpm)) }),
  toggle: () => set(state => ({ isPlaying: !state.isPlaying })),
  stop: () => set({ isPlaying: false }),
}));
