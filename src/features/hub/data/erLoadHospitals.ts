import { LEVEL_A, LEVEL_B } from './hospitals';
import type { Hospital } from '../components/HospitalAccordionItem';

// Hospitals people can report ER load on: every hospital in the hospital info
// screen that has an ER. The large trauma centers (LEVEL_A) are marked `major`
// and listed first, since that is where most reports will come from.
// The Hebrew name is the key stored in er_load_reports.hospital_name.

export interface ErLoadHospital {
  name: string;
  city: string;
  /** English display name and city */
  en?: [name: string, city: string];
  major: boolean;
}

// a hospital with no ER number (a mental-health center) has no ER to report on
const hasEr = (h: Hospital) => Boolean(h.er) && h.er !== '-';

export const ER_LOAD_HOSPITALS: ErLoadHospital[] = [
  ...LEVEL_A.filter(hasEr).map(({ name, city, en }) => ({ name, city, en, major: true })),
  ...LEVEL_B.filter(hasEr).map(({ name, city, en }) => ({ name, city, en, major: false })),
];

export type ErDepartment = 'general' | 'pediatric';

export const ER_DEPARTMENTS: { key: ErDepartment; label: string }[] = [
  { key: 'general', label: 'מיון כללי' },
  { key: 'pediatric', label: 'מיון ילדים' },
];

export type ErLoadLevel = 1 | 2 | 3;

export const ER_LOAD_LEVELS: {
  level: ErLoadLevel;
  label: string;
  emoji: string;
  color: string;
  dot: string;
  bg: string;
  border: string;
}[] = [
  { level: 1, label: 'קל',     emoji: '🙂', color: 'text-emt-green',  dot: 'bg-emt-green',  bg: 'bg-emt-green/10',  border: 'border-emt-green/40' },
  { level: 2, label: 'בינוני', emoji: '😐', color: 'text-amber-800 dark:text-amber-400',  dot: 'bg-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/40' },
  { level: 3, label: 'כבד',    emoji: '😫', color: 'text-emt-red',    dot: 'bg-emt-red',    bg: 'bg-emt-red/10',    border: 'border-emt-red/40' },
];
