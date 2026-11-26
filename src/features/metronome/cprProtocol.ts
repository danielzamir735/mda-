// הגדרות פרוטוקול ההחייאה — כל המינונים, הזמנים והנוסחים במקום אחד.
// לעדכון לפי פרוטוקול מד"א יש לשנות רק את הקובץ הזה (והנוסחים ב־src/i18n/cpr.ts), בלי לגעת בלוגיקה.
import { translate, type TranslationKey } from '../../i18n';

/** אורך מחזור — החלפת מעסה ובדיקת קצב (שניות) */
export const CYCLE_SEC = 120;

/** כמה שניות לפני סוף המחזור תינתן התראה מקדימה */
export const PREWARN_SEC = 10;

/** מרווח בין מנות אדרנלין (שניות) */
export const EPI_INTERVAL_SEC = { min: 180, max: 300, default: 240 } as const;
export const EPI_INTERVAL_OPTIONS = [180, 240, 300] as const;

/** Epinephrine dose label in the current language */
export const epiDose = () => translate('cprEpiDose');

/** תזכורות אמיודרון בקצב שוקיבי — מפתח: מספר השוק שאחריו מגיעה התזכורת */
export const AMIO_BY_SHOCK: Record<number, { doseKey: TranslationKey; withEpi: boolean }> = {
  3: { doseKey: 'cprAmio300', withEpi: true },
  5: { doseKey: 'cprAmio150', withEpi: false },
};

/** סיבות הפיכות — H's & T's */
export const H_AND_T: { id: string; labelKey: TranslationKey; group: 'H' | 'T' }[] = [
  { id: 'hypoxia',      labelKey: 'cprHtHypoxia',      group: 'H' },
  { id: 'hypovolemia',  labelKey: 'cprHtHypovolemia',  group: 'H' },
  { id: 'kalemia',      labelKey: 'cprHtKalemia',      group: 'H' },
  { id: 'hypothermia',  labelKey: 'cprHtHypothermia',  group: 'H' },
  { id: 'acidosis',     labelKey: 'cprHtAcidosis',     group: 'H' },
  { id: 'tension',      labelKey: 'cprHtTension',      group: 'T' },
  { id: 'tamponade',    labelKey: 'cprHtTamponade',    group: 'T' },
  { id: 'toxins',       labelKey: 'cprHtToxins',       group: 'T' },
  { id: 'thrombosis',   labelKey: 'cprHtThrombosis',   group: 'T' },
];

export const RHYTHM_LABEL_KEYS = {
  shockable: 'cprRhythmShockable',
  nonShockable: 'cprRhythmNonShockable',
} as const satisfies Record<string, TranslationKey>;

/** נוסחי ההתראות הקוליות (בשפת הממשק) */
export const VOICE = {
  prewarn: () => translate('cprVoicePrewarn'),
  cycle: () => translate('cprVoiceCycle'),
  epiDue: () => translate('cprVoiceEpiDue'),
  epiNow: () => translate('cprVoiceEpiNow'),
  amio: (dose: string, withEpi: boolean) => (withEpi ? translate('cprVoiceEpiAnd', { dose }) : dose),
} as const;

export const disclaimer = () => translate('cprDisclaimer');
