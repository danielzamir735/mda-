import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const VALID_DURATIONS = [6, 10, 15, 20, 30] as const;
export type ValidDuration = typeof VALID_DURATIONS[number];

interface SettingsState {
  heartDuration: ValidDuration;
  breathDuration: ValidDuration;
  setHeartDuration: (d: ValidDuration) => void;
  setBreathDuration: (d: ValidDuration) => void;
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
