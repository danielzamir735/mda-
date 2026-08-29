// Curated list of major medical centers for the ER-load reporting feature.
// Deliberately limited to large hospitals (same set as LEVEL_A in
// HospitalsModal.tsx) — a crowd-sourced report feature only works once enough
// people are actually reporting, and that critical mass is far more likely at
// a handful of major centers than spread across all ~30 hospitals in Israel.

export interface ErLoadHospital {
  name: string;
  city: string;
}

export const ER_LOAD_HOSPITALS: ErLoadHospital[] = [
  { name: 'רמב"ם', city: 'חיפה' },
  { name: 'בלינסון', city: 'פתח תקווה' },
  { name: 'איכילוב', city: 'תל אביב' },
  { name: 'תל השומר שיבא', city: 'רמת גן' },
  { name: 'הדסה עין כרם', city: 'ירושלים' },
  { name: 'שערי צדק', city: 'ירושלים' },
  { name: 'סורוקה', city: 'באר שבע' },
];

export type ErDepartment = 'general' | 'pediatric';

export const ER_DEPARTMENTS: { key: ErDepartment; label: string }[] = [
  { key: 'general', label: 'מיון כללי' },
  { key: 'pediatric', label: 'מיון ילדים' },
];

export type ErLoadLevel = 1 | 2 | 3;

export const ER_LOAD_LEVELS: { level: ErLoadLevel; label: string; color: string; dot: string }[] = [
  { level: 1, label: 'קל', color: 'text-emt-green', dot: 'bg-emt-green' },
  { level: 2, label: 'בינוני', color: 'text-amber-400', dot: 'bg-amber-400' },
  { level: 3, label: 'כבד', color: 'text-emt-red', dot: 'bg-emt-red' },
];
