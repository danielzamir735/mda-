import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const HEART_DURATIONS = [10, 15, 20, 30, 60] as const;
export const BREATH_DURATIONS = [15, 20, 30, 60] as const;
export type HeartDuration = typeof HEART_DURATIONS[number];
export type BreathDuration = typeof BREATH_DURATIONS[number];

interface SettingsState {
  heartDuration: HeartDuration;
  breathDuration: BreathDuration;
  setHeartDuration: (d: HeartDuration) => void;
  setBreathDuration: (d: BreathDuration) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      heartDuration: 15,
      breathDuration: 30,
      setHeartDuration: (d) => set({ heartDuration: d }),
      setBreathDuration: (d) => set({ breathDuration: d }),
    }),
    { name: 'emt-settings' },
  ),
);
