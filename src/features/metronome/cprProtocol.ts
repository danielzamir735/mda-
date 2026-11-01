// הגדרות פרוטוקול ההחייאה — כל המינונים, הזמנים והנוסחים במקום אחד.
// לעדכון לפי פרוטוקול מד"א יש לשנות רק את הקובץ הזה, בלי לגעת בלוגיקה.

/** אורך מחזור — החלפת מעסה ובדיקת קצב (שניות) */
export const CYCLE_SEC = 120;

/** כמה שניות לפני סוף המחזור תינתן התראה מקדימה */
export const PREWARN_SEC = 10;

/** מרווח בין מנות אדרנלין (שניות) */
export const EPI_INTERVAL_SEC = { min: 180, max: 300, default: 240 } as const;
export const EPI_INTERVAL_OPTIONS = [180, 240, 300] as const;

export const EPI_DOSE = 'אדרנלין 1 מ"ג';

/** תזכורות אמיודרון בקצב שוקיבי — מפתח: מספר השוק שאחריו מגיעה התזכורת */
export const AMIO_BY_SHOCK: Record<number, { dose: string; withEpi: boolean }> = {
  3: { dose: 'אמיודרון 300 מ"ג', withEpi: true },
  5: { dose: 'אמיודרון 150 מ"ג', withEpi: false },
};

/** סיבות הפיכות — H's & T's */
export const H_AND_T: { id: string; label: string; group: 'H' | 'T' }[] = [
  { id: 'hypoxia',      label: 'היפוקסיה',                group: 'H' },
  { id: 'hypovolemia',  label: 'היפוולמיה',               group: 'H' },
  { id: 'kalemia',      label: 'היפו/היפרקלמיה',          group: 'H' },
  { id: 'hypothermia',  label: 'היפותרמיה',               group: 'H' },
  { id: 'acidosis',     label: 'חמצת (H⁺)',               group: 'H' },
  { id: 'tension',      label: 'טנסיון פנאומותורקס',      group: 'T' },
  { id: 'tamponade',    label: 'טמפונדה',                 group: 'T' },
  { id: 'toxins',       label: 'טוקסינים',                group: 'T' },
  { id: 'thrombosis',   label: 'תרומבוזיס ריאתי/לבבי',    group: 'T' },
];

export const RHYTHM_LABELS = {
  shockable: 'שוקיבי (VF/VT)',
  nonShockable: 'לא שוקיבי (אסיסטולה/PEA)',
} as const;

/** נוסחי ההתראות הקוליות */
export const VOICE = {
  prewarn: 'מתכוננים להחלפה',
  cycle: 'החלפת מעסה ובדיקת קצב',
  epiDue: 'זמן לאדרנלין',
  epiNow: 'אדרנלין מיד',
  amio: (dose: string, withEpi: boolean) => (withEpi ? `אדרנלין ו${dose}` : dose),
} as const;

export const DISCLAIMER = 'כלי עזר, לפי פרוטוקול מד"א והנחיית ראש הצוות';
