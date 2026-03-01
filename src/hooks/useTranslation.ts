import { useSettingsStore } from '../store/settingsStore';

const dict = {
  he: {
    heartRate: 'דופק',
    breathing: 'נשימות',
    bpmUnit: 'פעימות בדקה',
    breathUnit: 'נשימות בדקה',
    seconds: 'שניות',
    lastMeasurement: 'מדידה אחרונה',
    cancel: 'בטל',
    metronome: 'מטרונום',
    utilities: 'כלי עזר',
    camera: 'מצלמה',
    addVitals: 'הוספת מדדים',
    notes: 'פתקים',
    photos: 'תמונות',
    vitalsHistory: 'היסטוריית מדדים',
    hub: 'עזרים',
    close: 'סגור',
  },
  en: {
    heartRate: 'Heart Rate',
    breathing: 'Breathing',
    bpmUnit: 'BPM',
    breathUnit: 'Breaths/min',
    seconds: 'sec',
    lastMeasurement: 'Last result',
    cancel: 'Cancel',
    metronome: 'Metronome',
    utilities: 'Tools',
    camera: 'Camera',
    addVitals: 'Add Vitals',
    notes: 'Notes',
    photos: 'Photos',
    vitalsHistory: 'Vitals History',
    hub: 'Hub',
    close: 'Close',
  },
} as const;

type TranslationKey = keyof typeof dict['he'];

export function useTranslation() {
  const language = useSettingsStore((s) => s.language);
  const lang: keyof typeof dict = language === 'en' ? 'en' : 'he';
  return (key: TranslationKey): string => dict[lang][key];
}
