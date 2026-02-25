import { create } from 'zustand';

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
  setBpm: (bpm) => set({ bpm }),
  toggle: () => set(state => ({ isPlaying: !state.isPlaying })),
  stop: () => set({ isPlaying: false }),
}));
