import { useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';

export function useHaptics() {
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  const vibrate = useCallback((pattern: VibratePattern = 30) => {
    if (hapticsEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, [hapticsEnabled]);

  return vibrate;
}
