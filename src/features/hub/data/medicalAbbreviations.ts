// מאגר קיצורים רפואיים — רובריקת "מושגים רפואיים"
// כל פריט כולל: קיצור באנגלית, משמעות בעברית, תעתיק פונטי, וטקסט הקראה ל-TTS.

export interface MedicalAbbreviation {
  id: string;
  /** הקיצור הרפואי באנגלית */
  abbr: string;
  /** המשמעות המלאה בעברית */
  he: string;
  /** תעתיק פונטי בעברית — כיצד הוגים את הקיצור */
  phonetic: string;
  /** טקסט להקראה ב-Text-to-Speech (אותיות מופרדות בנקודות להגייה ברורה) */
  speech: string;
}

export interface AbbreviationCategory {
  id: string;
  title: string;
  color: string;
  border: string;
  bg: string;
  items: MedicalAbbreviation[];
}

export const ABBREVIATION_CATEGORIES: AbbreviationCategory[] = [
  {
    id: 'conditions',
    title: 'מושגים ומצבים רפואיים',
    color: 'text-red-400',
    border: 'border-red-400/30',
    bg: 'bg-red-400/5',
    items: [
      { id: 'sp',   abbr: 'S/P',  he: 'מצב לאחר',          phonetic: 'אֶס פִּי',                       speech: 'S. P.' },
      { id: 'cabg', abbr: 'CABG', he: 'ניתוח מעקפים',      phonetic: "קַאבֶּג' / סִי אֵי בִּי גִ'י",   speech: 'cabbage. C. A. B. G.' },
      { id: 'ptca', abbr: 'PTCA', he: 'צנתור',             phonetic: 'פִּי טִי סִי אֵי',               speech: 'P. T. C. A.' },
      { id: 'ami',  abbr: 'AMI',  he: 'אוטם לבבי חריף',    phonetic: 'אֵי אֶם אָי',                    speech: 'A. M. I.' },
      { id: 'chf',  abbr: 'CHF',  he: 'אי ספיקת לב',       phonetic: "סִי אֵיצ' אֶף",                  speech: 'C. H. F.' },
      { id: 'crf',  abbr: 'CRF',  he: 'אי ספיקת כליות',    phonetic: 'סִי אָר אֶף',                    speech: 'C. R. F.' },
      { id: 'icu',  abbr: 'ICU',  he: 'טיפול נמרץ כללי',   phonetic: 'אָי סִי יוּ',                    speech: 'I. C. U.' },
      { id: 'ccu',  abbr: 'CCU',  he: 'טיפול נמרץ לב',     phonetic: 'סִי סִי יוּ',                    speech: 'C. C. U.' },
    ],
  },
  {
    id: 'routes',
    title: 'דרכי מתן תרופה למטופל',
    color: 'text-teal-400',
    border: 'border-teal-400/30',
    bg: 'bg-teal-400/5',
    items: [
      { id: 'iv', abbr: 'IV', he: 'מתן תוך ורידי',          phonetic: 'אָי וִי',   speech: 'I. V.' },
      { id: 'po', abbr: 'PO', he: 'מתן פומי (דרך הפה)',     phonetic: 'פִּי אוֹ',  speech: 'P. O.' },
      { id: 'im', abbr: 'IM', he: 'מתן תוך שרירי',          phonetic: 'אָי אֶם',   speech: 'I. M.' },
      { id: 'sl', abbr: 'SL', he: 'מתן תחת הלשון',          phonetic: 'אֶס אֶל',   speech: 'S. L.' },
      { id: 'sc', abbr: 'SC', he: 'מתן תת עורי',            phonetic: 'אֶס סִי',   speech: 'S. C.' },
    ],
  },
];

export const ALL_ABBREVIATIONS: MedicalAbbreviation[] = ABBREVIATION_CATEGORIES.flatMap(
  (cat) => cat.items,
);
