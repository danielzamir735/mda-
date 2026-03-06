import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const HEART_DURATIONS = [10, 15, 20, 30, 60] as const;
export const BREATH_DURATIONS = [15, 20, 30, 60] as const;
export type HeartDuration = typeof HEART_DURATIONS[number];
export type BreathDuration = typeof BREATH_DURATIONS[number];
export type Theme = 'dark' | 'light';
export type Language = 'he' | 'en';

interface SettingsState {
  heartDuration: HeartDuration;
  breathDuration: BreathDuration;
  theme: Theme;
  language: Language;
  hapticsEnabled: boolean;
  wakeLockEnabled: boolean;
  hasSeenLatestUpdate: boolean;
  setHeartDuration: (d: HeartDuration) => void;
  setBreathDuration: (d: BreathDuration) => void;
  setTheme: (t: Theme) => void;
  setLanguage: (l: Language) => void;
  setHapticsEnabled: (v: boolean) => void;
  setWakeLockEnabled: (v: boolean) => void;
  setHasSeenLatestUpdate: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      heartDuration: 15,
      breathDuration: 30,
      theme: 'dark',
      language: 'he',
      hapticsEnabled: true,
      wakeLockEnabled: false,
      hasSeenLatestUpdate: false,
      setHeartDuration: (d) => set({ heartDuration: d }),
      setBreathDuration: (d) => set({ breathDuration: d }),
      setTheme: (t) => set({ theme: t }),
      setLanguage: (l) => set({ language: l }),
      setHapticsEnabled: (v) => set({ hapticsEnabled: v }),
      setWakeLockEnabled: (v) => set({ wakeLockEnabled: v }),
      setHasSeenLatestUpdate: (v) => set({ hasSeenLatestUpdate: v }),
    }),
    { name: 'emt-settings' },
  ),
);
