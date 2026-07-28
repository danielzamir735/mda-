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
      { id: 'iv',  abbr: 'IV',  he: 'מתן תוך ורידי',                 phonetic: 'אָי וִי',           speech: 'I. V.' },
      { id: 'po',  abbr: 'PO',  he: 'מתן פומי (דרך הפה)',            phonetic: 'פִּי אוֹ',          speech: 'P. O.' },
      { id: 'im',  abbr: 'IM',  he: 'מתן תוך שרירי',                 phonetic: 'אָי אֶם',           speech: 'I. M.' },
      { id: 'sl',  abbr: 'SL',  he: 'מתן תחת הלשון',                 phonetic: 'אֶס אֶל',           speech: 'S. L.' },
      { id: 'sc',  abbr: 'SC',  he: 'מתן תת עורי',                   phonetic: 'אֶס סִי',           speech: 'S. C.' },
      { id: 'io',  abbr: 'IO',  he: 'מתן תוך-עצמי (לתוך מח העצם)',   phonetic: 'אָי אוֹ',           speech: 'I. O.' },
      { id: 'in',  abbr: 'IN',  he: 'מתן תוך-אפי',                   phonetic: 'אָי אֶן',           speech: 'I. N.' },
      { id: 'inh', abbr: 'INH', he: 'מתן בשאיפה (אינהלציה)',         phonetic: "אָי אֶן אֵייצ'",    speech: 'I. N. H.' },
    ],
  },
  {
    id: 'cardiac',
    title: 'לב וקרדיולוגיה',
    color: 'text-rose-400',
    border: 'border-rose-400/30',
    bg: 'bg-rose-400/5',
    items: [
      { id: 'pp',  abbr: 'PP',  he: 'לחץ הדופק (הפרש בין סיסטולי לדיאסטולי)', phonetic: 'פִּי פִּי',       speech: 'P. P.' },
      { id: 'san', abbr: 'SAN', he: 'קוצב הלב הראשי (צומת סינוסי)',          phonetic: 'אֶס אֵי אֶן',     speech: 'S. A. N.' },
      { id: 'avn', abbr: 'AVN', he: 'קוצב הלב המשני (צומת פרוזדורי-חדרי)',   phonetic: 'אֵי וִי אֶן',     speech: 'A. V. N.' },
      { id: 'svc', abbr: 'SVC', he: 'וריד נבוב עליון',                       phonetic: 'אֶס וִי סִי',     speech: 'S. V. C.' },
      { id: 'ivc', abbr: 'IVC', he: 'וריד נבוב תחתון',                       phonetic: 'אָי וִי סִי',     speech: 'I. V. C.' },
      { id: 'crt', abbr: 'CRT', he: 'זמן מילוי קפילארי',                     phonetic: 'סִי אָר טִי',     speech: 'C. R. T.' },
      { id: 'mi',  abbr: 'MI',  he: 'אוטם בשריר הלב',                        phonetic: 'אֶם אָי',         speech: 'M. I.' },
      { id: 'vf',  abbr: 'VF',  he: 'פרפור חדרים',                           phonetic: 'וִי אֶף',         speech: 'V. F.' },
      { id: 'vt',  abbr: 'VT',  he: 'טכיקרדיה חדרית',                        phonetic: 'וִי טִי',         speech: 'V. T.' },
      { id: 'svt', abbr: 'SVT', he: 'טכיקרדיה על-חדרית',                     phonetic: 'אֶס וִי טִי',     speech: 'S. V. T.' },
      { id: 'af',  abbr: 'AF',  he: 'פרפור עליות',                           phonetic: 'אֵי אֶף',         speech: 'A. F.' },
      { id: 'ap',  abbr: 'AP',  he: 'תעוקת חזה (אנגינה)',                    phonetic: 'אֵי פִּי',        speech: 'A. P.' },
      { id: 'acs', abbr: 'ACS', he: 'תסמונת כלילית חריפה',                   phonetic: 'אֵי סִי אֶס',     speech: 'A. C. S.' },
    ],
  },
  {
    id: 'respiratory',
    title: 'נשימה',
    color: 'text-blue-400',
    border: 'border-blue-400/30',
    bg: 'bg-blue-400/5',
    items: [
      { id: 'copd', abbr: 'COPD', he: 'מחלת ריאות חסימתית כרונית', phonetic: 'סִי אוֹ פִּי דִי', speech: 'C. O. P. D.' },
      { id: 'hv',   abbr: 'HV',   he: 'נשימת יתר / אוורור יתר',    phonetic: "אֵייצ' וִי",      speech: 'H. V.' },
    ],
  },
  {
    id: 'neuro',
    title: 'עצבים ומוח',
    color: 'text-purple-400',
    border: 'border-purple-400/30',
    bg: 'bg-purple-400/5',
    items: [
      { id: 'bbb',  abbr: 'BBB',  he: 'מחסום דם-מוח',                                   phonetic: 'בִּי בִּי בִּי',      speech: 'B. B. B.' },
      { id: 'cva',  abbr: 'CVA',  he: 'שבץ מוחי',                                       phonetic: 'סִי וִי אֵי',         speech: 'C. V. A.' },
      { id: 'tia',  abbr: 'TIA',  he: 'שבץ איסכמי חולף',                                phonetic: 'טִי אָי אֵי',         speech: 'T. I. A.' },
      { id: 'cpss', abbr: 'CPSS', he: 'סרגל לאבחון מהיר של שבץ מוחי בשטח',              phonetic: 'סִי פִּי אֶס אֶס',    speech: 'C. P. S. S.' },
      { id: 'pnes', abbr: 'PNES', he: 'פרכוסים לא-אפילפטיים ממקור פסיכוגני',            phonetic: 'פִּי אֶן אִי אֶס',    speech: 'P. N. E. S.' },
      { id: 'icp',  abbr: 'ICP',  he: 'לחץ תוך-גולגולתי',                               phonetic: 'אָי סִי פִּי',        speech: 'I. C. P.' },
    ],
  },
  {
    id: 'lab',
    title: 'מעבדה והמטולוגיה',
    color: 'text-green-400',
    border: 'border-green-400/30',
    bg: 'bg-green-400/5',
    items: [
      { id: 'uti', abbr: 'UTI', he: 'דלקת בדרכי השתן',                                phonetic: 'יוּ טִי אָי',   speech: 'U. T. I.' },
      { id: 'rbc', abbr: 'RBC', he: 'כדוריות דם אדומות',                              phonetic: 'אָר בִּי סִי',  speech: 'R. B. C.' },
      { id: 'wbc', abbr: 'WBC', he: 'כדוריות דם לבנות',                               phonetic: 'דָּבֶּליו בִּי סִי', speech: 'W. B. C.' },
      { id: 'hct', abbr: 'Hct', he: 'המטוקריט — אחוז נפח הדם שהן כדוריות אדומות',     phonetic: 'הֶמָטוֹקְריט',   speech: 'Hematocrit.' },
    ],
  },
  {
    id: 'assessment',
    title: 'הערכה ופרוטוקולים',
    color: 'text-indigo-400',
    border: 'border-indigo-400/30',
    bg: 'bg-indigo-400/5',
    items: [
      { id: 'gcs',   abbr: 'GCS',   he: 'מדד גלזגו להערכת רמת הכרה',                                     phonetic: "גִ'י סִי אֶס",         speech: 'G. C. S.' },
      { id: 'avpu',  abbr: 'AVPU',  he: 'סולם מהיר להערכת הכרה: ער / מגיב לקול / מגיב לכאב / לא מגיב',   phonetic: 'אֵי וִי פִּי יוּ',      speech: 'A. V. P. U.' },
      { id: 'aed',   abbr: 'AED',   he: 'דפיברילטור חיצוני אוטומטי',                                     phonetic: 'אֵי אִי דִי',           speech: 'A. E. D.' },
      { id: 'cpr',   abbr: 'CPR',   he: 'החייאת לב-ריאה',                                                phonetic: 'סִי פִּי אָר',          speech: 'C. P. R.' },
      { id: 'opa',   abbr: 'OPA',   he: 'נתיב אוויר אורופרינגיאלי',                                      phonetic: 'אוֹ פִּי אֵי',          speech: 'O. P. A.' },
      { id: 'phtls', abbr: 'PHTLS', he: 'טיפול טרום-בית-חולימי בנפגע טראומה',                            phonetic: "פִּי אֵייצ' טִי אֶל אֶס", speech: 'P. H. T. L. S.' },
    ],
  },
  {
    id: 'cranial-nerves',
    title: '12 העצבים הקרניאליים',
    color: 'text-fuchsia-400',
    border: 'border-fuchsia-400/30',
    bg: 'bg-fuchsia-400/5',
    items: [
      { id: 'cn1',  abbr: 'CN I',    he: 'עצב אולפקטורי — חוש הריח',                        phonetic: 'סִי אֶן וואן',     speech: 'C. N. One.' },
      { id: 'cn2',  abbr: 'CN II',   he: 'עצב אופטי — ראייה',                                phonetic: 'סִי אֶן טו',       speech: 'C. N. Two.' },
      { id: 'cn3',  abbr: 'CN III',  he: 'עצב אוקולומוטורי — תנועת גלגל העין',              phonetic: "סִי אֶן ת'רי",     speech: 'C. N. Three.' },
      { id: 'cn4',  abbr: 'CN IV',   he: 'עצב טרוכליארי — תנועת העין למטה ופנימה',          phonetic: 'סִי אֶן פור',      speech: 'C. N. Four.' },
      { id: 'cn5',  abbr: 'CN V',    he: 'עצב טריגמינלי — תחושת פנים ולעיסה',               phonetic: 'סִי אֶן פייב',     speech: 'C. N. Five.' },
      { id: 'cn6',  abbr: 'CN VI',   he: 'עצב אבדוסנס — הסטת העין החוצה',                   phonetic: 'סִי אֶן סיקס',     speech: 'C. N. Six.' },
      { id: 'cn7',  abbr: 'CN VII',  he: 'עצב פציאלי — הבעות פנים וטעם',                    phonetic: 'סִי אֶן סבן',      speech: 'C. N. Seven.' },
      { id: 'cn8',  abbr: 'CN VIII', he: 'עצב וסטיבולוקוכליארי — שמיעה ושיווי משקל',        phonetic: 'סִי אֶן אייט',     speech: 'C. N. Eight.' },
      { id: 'cn9',  abbr: 'CN IX',   he: 'עצב גלוסופרינגיאלי — טעם ובליעה',                 phonetic: 'סִי אֶן ניין',     speech: 'C. N. Nine.' },
      { id: 'cn10', abbr: 'CN X',    he: 'עצב ואגוס — פאראסימפתטי ללב, ריאות ומעיים',       phonetic: 'סִי אֶן טן',       speech: 'C. N. Ten.' },
      { id: 'cn11', abbr: 'CN XI',   he: 'עצב אקססורי — שרירי הצוואר (SCM וטרפזיוס)',       phonetic: 'סִי אֶן אילבן',    speech: 'C. N. Eleven.' },
      { id: 'cn12', abbr: 'CN XII',  he: 'עצב היפוגלוסאל — תנועת הלשון',                    phonetic: 'סִי אֶן טוולב',    speech: 'C. N. Twelve.' },
    ],
  },
];

export const ALL_ABBREVIATIONS: MedicalAbbreviation[] = ABBREVIATION_CATEGORIES.flatMap(
  (cat) => cat.items,
);
