import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Trophy, Brain, CheckCircle, XCircle, RefreshCw, Users, Clock,
  Share2, Pill, AlertTriangle, OctagonAlert, Zap, Flame, Star, ChevronLeft, Volume2,
  Search, Stethoscope, Wrench, Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackEvent } from '../../../utils/analytics';
import HapticButton from '../../../components/HapticButton';
import { supabase } from '../../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type ClinicalCategory = 'bls' | 'als';
type QuizCategory = ClinicalCategory | 'med_v3' | 'improvised' | 'red_flag' | 'spot_error' | 'med_bag';
type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
type BlockId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

interface ClinicalQuestion {
  question: string;
  options: string[];
  correct_index: number;
  clinical_explanation: string;
}

interface MedOfDay {
  name: string;
  name_he?: string;
  name_en?: string;
  drug_class: string;
  description: string;
  question: string;
  options: string[];
  correct_index: number;
  clinical_pearl: string;
  emergency_note: string;
}

interface ImprovisedQ {
  scenario: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  topic_tag?: string;
}

interface RedFlagQ {
  scenario: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  topic_tag?: string;
}

interface SpotErrorQ {
  dispatch_opener: string;
  scenario: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  topic_tag: string;
}

interface MedBagQ {
  situation: string;
  medications: string[];
  med_descriptions: Record<string, string>;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  topic_tag: string;
}

interface DayCache<T> {
  date: string;
  data: T;
  answeredIdx?: number | null;
  timeTaken?: number;
}

interface GlobalStats {
  total: number;
  correct: number;
  answer_counts: number[];
}

interface CompetitionEntry {
  display_name: string;
  city: string;
  correct_answers: number;
  total_time_seconds: number;
  answers_count: number;
}

interface StreakData {
  lastCompletedDate: string;
  streak: number;
  bestStreak: number;
  completedDates?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

function getToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getSessionId(): string {
  const key = 'medic_session_id';
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

const CACHE_KEYS = {
  bls: 'daily_challenge_bls_v8',
  als: 'daily_challenge_als_v8',
  med: 'daily_challenge_med_v5',
  improvised: 'daily_challenge_improvised_v3',
  red_flag: 'daily_challenge_redflag_v3',
  spot_error: 'daily_challenge_spoterror_v2',
  med_bag: 'daily_challenge_medbag_v1',
} as const;

const STATS_CACHE_KEY: Record<QuizCategory, string> = {
  bls: 'daily_stats_bls_v1',
  als: 'daily_stats_als_v1',
  med_v3: 'daily_stats_med_v1',
  improvised: 'daily_stats_improvised_v1',
  red_flag: 'daily_stats_redflag_v1',
  spot_error: 'daily_stats_spoterror_v1',
  med_bag: 'daily_stats_medbag_v1',
};

const COMPETITION_OPT_OUT_KEY = 'daily_competition_opted_out';
const COMPETITION_PROFILE_KEY = 'daily_competition_profile';

function getParticipantBase(): number {
  return new Date().getDate() % 2 === 0 ? 230 : 430;
}

function isCompetitionOptedOut(): boolean {
  return localStorage.getItem(COMPETITION_OPT_OUT_KEY) === 'true';
}

function getTodayProfileKey(): string {
  return `daily_competition_today_${getToday()}`;
}

function getEffectiveProfile(): { name: string; city: string; isPermanent: boolean } | null {
  const perm = localStorage.getItem(COMPETITION_PROFILE_KEY);
  if (perm) { try { return { ...JSON.parse(perm), isPermanent: true }; } catch {} }
  const today = localStorage.getItem(getTodayProfileKey());
  if (today) { try { return { ...JSON.parse(today), isPermanent: false }; } catch {} }
  return null;
}

async function upsertCompetitionEntry(
  profile: { name: string; city: string },
  correctAnswers: number,
  totalTimeSeconds: number,
  answersCount: number,
) {
  try {
    await supabase.from('daily_competition').upsert({
      competition_date: getToday(),
      session_id: getSessionId(),
      display_name: profile.name,
      city: profile.city,
      correct_answers: correctAnswers,
      total_time_seconds: totalTimeSeconds,
      answers_count: answersCount,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'session_id,competition_date' });
  } catch { /* noop */ }
}

const CATEGORY_LABELS: Record<ClinicalCategory, string> = { bls: 'BLS', als: 'ALS' };
const CATEGORY_FULL: Record<ClinicalCategory, string> = { bls: 'החייאה בסיסית', als: 'החייאה מתקדמת' };

// ─── Prompts ──────────────────────────────────────────────────────────────────

function buildClinicalPrompt(type: 'BLS' | 'ALS'): string {
  const focus = type === 'BLS'
    ? 'תחום: BLS בלבד — סבב בין כל התחומים הבאים. כלל גיוון קפדני: לא יותר מ-20% מהשאלות יהיו CPR/דום לב טהור; חובה לסבב בין: (1) טראומה — עצירת דימום (טורניקט, חבישת פצע, דימום צמתים), קיבוע שברים, קבלת החלטות בהגבלת תנועת עמוד שדרה, פגיעת פיצוץ/מחיצה; (2) מצוקה נשימתית — אסתמה/ברונכוספאזם, אנפילקסיס (עיתוי מתן אפינפרין, תנוחת מטופל, מנה חוזרת), חסימת נתיב אוויר בגוף זר, זיהוי קרופ לעומת אפיגלוטיטיס בילדים; (3) חירום סביבתי — מכת חום לעומת התשת חום, ניהול היפותרמיה, טביעה/שקיעה, פגיעת ברק; (4) קורס רפואי — חירומי סוכרת (הבחנה היפוגליקמיה/היפרגליקמיה), ניהול פרכוסים, זיהוי שבץ מוחי (FAST + פרוטוקול שדה), אבחנות מבדלות סינקופה; (5) CPR/AED — מיקום רפידות, עיתוי מעצור היפותרמי, סיכון שוק בחזה רטוב, עומק לחיצה תינוק לעומת ילד, זיהוי ROSC. ללא תרופות ALS, ללא נתיב אוויר מתקדם, ללא פרשנות 12 ערוצים.'
    : 'תחום: ALS בלבד — סבב בין כל התחומים הבאים. כלל גיוון קפדני: לא יותר מ-20% מהשאלות יהיו CPR/דום לב; חובה לסבב בין: (1) הפרעות קצב — טכי-אריתמיות (SVT, Afib RVR, VT עם דופק, AF עם מוליכות עוקפת), ברדי-אריתמיות (חסם AV מלא, תסמונת סינוס חולה, חסם AV דרגה גבוהה, קיצוב טרנסעורי ואימות לכידה), הבחנה יציב לעומת לא יציב; (2) לב מעבר לדום — תסמונת כלילית חריפה (מחקות STEMI, MI אחורי, התוויות נגד ב-RV infarct), אי ספיקת לב חריפה (CPAP, עיתוי חנקנים, הימנעות מאינטובציה), חירום יתר לחץ דם עם פגיעת מטרה; (3) מלכודות פרמקולוגיות — אדנוזין ב-AF מוליך עוקף, בחירת אמיודרון לעומת לידוקאין, סידן לעומת ביקרבונאט בהיפרקלמיה, ניטרוגליצרין ב-MI תחתון עם מעורבות RV, כישלון אטרופין; (4) ניהול פוסט-ROSC — בקרת טמפרטורה, יעדים המודינמיים, החלטות נתיב אוויר, גורמים הפיכים (H&Ts) גישה שיטתית; (5) פרמקולוגיה מורכבת — מינון, מסלול מתן, עיתוי, אינטראקציות, התוויות נגד בתנאי שדה.';

  return (
    `אתה מדריך פרמדיק בכיר ישראלי. תפקידך לאתגר פרמדיקים וחובשים ישראלים עם שאלות קליניות ברמה גבוהה, בעברית רפואית מקצועית.\n\n` +
    `חשוב ביותר: כל שאלה, תשובה והסבר חייבים להתבסס אך ורק על הפרוטוקולים הישראליים ומשרד הבריאות. אין להתייחס לפרוטוקולי AHA, ERC, PHTLS או כל גוף בינלאומי אחר — במקרה של סתירה, ההנחיות הישראליות גוברות תמיד.\n\n` +
    `משימה: כתוב תרחיש קליני מאתגר עבור ${type} בעברית רפואית מקצועית גבוהה. התרחיש יכול להיות מקרה שגרתי עם סיבוך עדין, מקרה קצה, או מצב שבו ההחלטה הנכונה דורשת שיפוט שדה מנוסה.\n\n` +
    `כתיבת התרחיש — כללים מחייבים: (1) שפה ניטרלית מקצועית בלבד — ללא קידומות שיגור, ללא מספרי קריאה, ללא "קריאה דחופה", ללא "דיווח מקבלה", ללא כל סגנון רדיו/משגר. (2) התחל ישירות בהערכת המטופל: "בהגיעך למקום מצאת..." / "מטופל בן X שנים..." / "אישה כבת X מציגה עם..." — ישירות לעובדות הקליניות. (3) כלול: גיל/מין, תלונה עיקרית, סימנים חיוניים רלוונטיים, ממצאים פיזיקליים. 2-4 משפטים ספציפיים, קליניים.\n\n` +
    `${focus}\n\n` +
    'תשובות: בדיוק 4 אפשרויות בעברית רפואית מקצועית. כל אפשרות: משפט פעולה קליני אחד, שלם ומוחלט, 15-25 מילים. פורמט: "[פועל] [פעולה ספציפית / תרופה-מינון-מסלול / הגדרת אנרגיה או מכשיר] [הקשר קליני]". אין אפשרות עמומה או מהססת.\n' +
    'כלל הסחות הדעת: לפחות שתי תשובות שגויות חייבות להיות טעויות שכיחות בשדה או פרוטוקולים מיושנים. תשובה שגויה אחת תישמע כמו תשובת ספר לימוד שמתעלמת מהפרט הקליני העדין בתרחיש. בדיוק תשובה אחת עוקבת אחר הפרוטוקולים הישראליים העדכניים. כל הסחות הדעת סבירות לחובש מתחיל.\n\n' +
    'הסבר קליני: בדיוק 3-4 משפטים תמציתיים בעברית, סה"כ פחות מ-60 מילים. חייב להתחיל במשפט: "על פי הפרוטוקולים בישראל...". לאחר מכן: (1) הסבר המנגנון הפיזיולוגי שהופך את הפעולה הנכונה לעדיפה. (2) נתח את הסחת הדעת המפתה ביותר והנזק הספציפי שהיא גורמת. (3) סיים עם פנינת ידע קלינית אחת שמפרידה בין אנשי שדה מצטיינים לממוצעים.\n\n' +
    'דיוק: כל מינון תרופה, הגדרת ג\'ול, סף קצב ומסגרת זמן חייבים להתאים בדיוק לפרוטוקולים הישראליים העדכניים. אין קירובים. שפה: עברית רפואית מקצועית גבוהה — ללא תרגום מילולי מאנגלית. מינוח נכון: "נתיב אוויר", "קיבוע", "סביבת עבודה", "ניטור", "הנשמה", "פינוי", "הכרה", "דופק", "לחץ דם", "נשימה" וכדומה.\n\n' +
    'פלט JSON תקני בלבד, ללא פרוזה, ללא markdown: { "question": string, "options": string[], "correct_index": number, "clinical_explanation": string }'
  );
}

const CLINICAL_PROMPTS: Record<ClinicalCategory, string> = {
  bls: buildClinicalPrompt('BLS'),
  als: buildClinicalPrompt('ALS'),
};

// Shared drug pool — must stay identical to the server-side list in
// generate-daily-questions/index.ts so both select the same drug for any given date.
const MED_DRUG_POOL = [
  // נוגדי קרישה / נוגדי טסיות
  'Eliquis (Apixaban)', 'Xarelto (Rivaroxaban)', 'Pradaxa (Dabigatran)',
  'Warfarin (Coumadin)', 'Aspirin', 'Plavix (Clopidogrel)', 'Brilique (Ticagrelor)',
  // לב — קצב ולחץ דם
  'Bisoprolol (Concor)', 'Metoprolol (Betaloc)', 'Atenolol (Tenormin)',
  'Amlodipine (Norvasc)', 'Losartan (Cozaar)', 'Ramipril (Tritace)',
  'Perindopril (Prestarium)', 'Valsartan (Diovan)', 'Nebivolol (Nebilet)',
  'Digoxin', 'Amiodarone',
  // משתנים
  'Furosemide (Lasix)', 'Spironolactone (Aldactone)', 'Indapamide (Natrilix)',
  // ניטרטים
  'Isosorbide Mononitrate (Isoket)', 'Nitroglycerin (Nitrostat)',
  // כולסטרול
  'Atorvastatin (Lipitor)', 'Rosuvastatin (Crestor)', 'Ezetimibe (Ezetrol)',
  // סוכרת
  'Metformin (Glucophage)', 'Empagliflozin (Jardiance)', 'Sitagliptin (Januvia)',
  'Dapagliflozin (Forxiga)', 'Glibenclamide (Daonil)',
  'Insulin Glargine (Lantus)', 'Insulin Aspart (Novorapid)',
  // בלוטת תריס
  'Levothyroxine (Eltroxin)',
  // נשימה / ריאות
  'Salbutamol (Ventolin)', 'Budesonide/Formoterol (Symbicort)',
  'Fluticasone/Salmeterol (Seretide)', 'Tiotropium (Spiriva)',
  'Montelukast (Singulair)', 'Theophylline (Theolin)',
  // קיבה / עיכול
  'Omeprazole (Omepradex)', 'Esomeprazole (Nexium)',
  'Pantoprazole (Controloc)', 'Ondansetron (Zofran)',
  // אלרגיה
  'Cetirizine (Zyrtec)', 'Loratadine (Claritin)',
  // נוירולוגיה / אפילפסיה
  'Levetiracetam (Keppra)', 'Lamotrigine (Lamictal)',
  'Valproic Acid (Depakine)', 'Carbamazepine (Tegretol)', 'Phenytoin (Dilantin)',
  // פסיכיאטריה / נוגדי דיכאון
  'Escitalopram (Cipralex)', 'Sertraline (Zoloft)',
  'Venlafaxine (Efexor)', 'Duloxetine (Cymbalta)',
  // אנטי-פסיכוטים / מייצבי מצב רוח
  'Risperidone (Risperdal)', 'Olanzapine (Zyprexa)',
  'Quetiapine (Seroquel)', 'Lithium',
  // בנזודיאזפינים / שינה
  'Alprazolam (Xanax)', 'Clonazepam (Rivotril)', 'Zolpidem (Stilnox)',
  // כאב / אנטי-דלקתי
  'Ibuprofen (Advil)', 'Naproxen (Naprosyn)', 'Tramadol (Tramal)',
  // ראומטולוגיה
  'Methotrexate (Methotrex)', 'Hydroxychloroquine (Plaquenil)', 'Colchicine',
  // גאוט / אוסטיאופורוזיס
  'Allopurinol', 'Alendronate (Fosamax)',
  // סטרואידים
  'Prednisolone', 'Dexamethasone',
  // דמנציה
  'Donepezil (Aricept)', 'Memantine (Ebixa)',
  // אנטיביוטיקה (נפוצות בבית)
  'Amoxicillin-Clavulanate (Augmentin)', 'Azithromycin (Zithromax)',
  'Ciprofloxacin (Cipro)', 'Trimethoprim-Sulfamethoxazole (Bactrim)',
];

function buildMedPrompt(): string {
  const today = getToday();
  // Deterministic hash — identical algorithm to server-side so both pick the same drug
  let hash = 0;
  for (let i = 0; i < today.length; i++) hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
  const todayDrug = MED_DRUG_POOL[hash % MED_DRUG_POOL.length];

  return `אתה מדריך פרמדיק בכיר ישראלי. משימתך: צור שאלת MCQ אינטראקטיבית על "תרופת היום" לחובשים ולפרמדיקים ישראלים.
תאריך היום: ${today}. תרופת היום המוקצית: ${todayDrug}.
חובה להשתמש בתרופה ${todayDrug} כנושא השאלה. ערבב את מיקום התשובה הנכונה — correct_index לא תמיד 0.
השאלה חייבת להיות מעשית — על סכנה קלינית, אינדיקציה, או זהירות בשטח — לא שאלת טריוויה.
שפה: עברית רפואית מקצועית.
פלט JSON בלבד, ללא markdown:
{
  "name": "שם מסחרי ישראלי + גנרי — לדוגמה: אליקוויס (Apixaban)",
  "name_he": "שם מסחרי/מותג בעברית בלבד — לדוגמה: אליקוויס, קרטיה, נורמיטן",
  "name_en": "שם מסחרי/מותג באנגלית באותיות לטיניות (כפי שמופיע על האריזה) — לדוגמה: Eliquis, Cartia, Normiten. לא שם גנרי.",
  "drug_class": "קבוצה ומנגנון קצר — לדוגמה: NOAC — מעכב פקטור Xa",
  "description": "הסבר בשורה-שורה וחצי: מה התרופה הזאת עושה בגוף ולמה רושמים אותה — בשפה ברורה שכל חובש יבין. לדוגמה: תרופה מדללת דם — מונעת קרישי דם בחולים עם פרפור פרוזדורים, לאחר ניתוח אורתופדי, או לטיפול בתסחיף ריאתי.",
  "question": "שאלת MCQ על הסכנה/אינדיקציה/זהירות — לדוגמה: מטופל על אליקוויס חווה טראומה בטנית. מה החשש הקריטי ביותר?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "clinical_pearl": "דגש קליני חשוב למדיק (1-2 משפטים)",
  "emergency_note": "אזהרת חירום ספציפית (1-2 משפטים)"
}`;
}

const IMPROVISED_SETTINGS = [
  'פיקניק בפארק ציבורי',
  'קניון קומת מזון (פוד קורט)',
  'אוטובוס בין-עירוני בנסיעה',
  'חדר אוכל של בית ספר תיכון',
  'חתונה באולם שמחות',
  'חוף הים (קייטנה)',
  'מסעדה שוקקת',
  'שוק הכרמל / שוק מחנה יהודה',
  'חדר כושר / ספורטק',
  'גן ילדים / פעוטון',
  'מגרש כדורגל בשכונה',
  'בית כנסת',
  'סופרמרקט גדול',
  'מסיבת יום הולדת ביתית',
  'פאב / בר',
  'טיול שנתי בהר מירון',
  'קמפינג ביער הכרמל',
  'בריכת שחייה ציבורית',
  'תחנת רכבת / רציף',
  'מוזיאון',
  'ספרייה עירונית',
  'בית אבות',
  'גינת שכונה',
  'אצטדיון יציעים',
  'מספרה / סלון יופי',
  'רכבת ישראל (קרון נוסעים)',
  'שדה תעופה — טרמינל המתנה',
  'גן לאומי / שמורת טבע',
  'פארק מים',
  'אולם קולנוע',
  'קמפוס אוניברסיטה',
  'מסדרון בית חולים (כמבקר)',
  'מועדון לילה / דיסקוטק',
  'אירוע חברה / כנס עסקי',
  'שוק פשפשים בשטח פתוח',
  'גג בניין מגורים',
  'מרפאה קהילתית — חדר המתנה',
  'משרד פתוח / קומת hi-tech',
  'קניית מכוניות (מגרש מכוניות)',
  'ים המלח / ספא',
];

function getTodayImprovisedSetting(): string {
  const today = getToday();
  let hash = 0;
  for (let i = 0; i < today.length; i++) hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
  return IMPROVISED_SETTINGS[hash % IMPROVISED_SETTINGS.length];
}

const IMPROVISED_TOPICS = [
  'שברים ועצמות',
  'כוויות',
  'אובדן הכרה',
  'היפוגליקמיה',
  'היפרגליקמיה',
  'עילפון',
  'חנק ועיכבול נשימתי',
  'דימום חיצוני',
  'כאב לב / חשד לאוטם',
  'אנפילקסיס',
  'מכת חום',
  'היפותרמיה',
  'שבץ מוחי',
  'פגיעת ראש',
  'חבלת חזה',
  'פגיעת עמוד שדרה',
  'כמעט טביעה',
  'עקיצות ונשיכות',
  'הרעלה',
  'פגיעת עין',
  'לידה בשטח',
  'כאב בטן חריף',
  'פגיעות ספורט',
  'חירום ילדים',
  'תאונת דרכים',
  'פגיעת חשמל',
  'שאיפת עשן',
  'התקף חרדה / פאניקה',
  'פצע חודר',
  'חום גבוה / ספסיס',
];

function getDailyTopic(blockType: string): string {
  const today = getToday();
  const seed = today + '|' + blockType;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return IMPROVISED_TOPICS[hash % IMPROVISED_TOPICS.length];
}

function buildImprovisedPrompt(_recentTopics: string[]): string {
  const setting = getTodayImprovisedSetting();
  const topic = getDailyTopic('improvised');

  return `אתה מדריך חובשים ישראלי. משימתך: צור שאלת "חובש ללא ציוד" בנושא **${topic}** — הנפגע זקוק לעזרה ראשונה ל${topic}, ללא תיק רפואי. החובש חייב לאלתר פתרון מחפצים זמינים במקום.

נושא החירום של היום (חובה): ${topic}
מיקום היום (חובה): ${setting}

כללים מחייבים:
1. הנושא חייב להיות: ${topic}. המיקום חייב להיות: ${setting}. שניהם חייבים להופיע בתרחיש.
2. תרחיש (2-3 משפטים): גיל, מין, מנגנון/תסמינים של ${topic}, ומה זמין במקום (חפצים אופייניים ל${setting}).
3. שאלה: "מה הפעולה המאולתרת הטובה ביותר שניתן לבצע כאן?"
4. 4 תשובות: ספציפיות ל${setting} ול${topic} — אחת נכונה (פתרון יעיל ובטוח), שלוש מסיחות הגיוניות. ערבב מיקום התשובה הנכונה.
5. הסבר (2-3 משפטים): מדוע זהו הפתרון הטוב ביותר, כיצד הוא עוזר בפועל.
6. topic_tag: "${topic}"

פלט JSON תקני בלבד, ללא markdown:
{
  "scenario": "תיאור (2-3 משפטים — גיל, מין, ${topic} ב${setting}, מה זמין)",
  "question": "מה הפעולה המאולתרת הטובה ביותר שניתן לבצע כאן?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "explanation": "הסבר (2-3 משפטים) — מדוע זהו הפתרון הנכון ואיך הוא עוזר",
  "topic_tag": "${topic}"
}`;
}

function buildRedFlagPrompt(): string {
  const topic = getDailyTopic('red_flag');
  return `אתה מדריך פרמדיק בכיר ישראלי. צור מקרה חירום קצר שבו יש לזהות סימן אדום קריטי מסכן חיים.
נושא היום (חובה): ${topic}. כל המקרה חייב להתמקד ב${topic}.
המקרה: תיאור ספציפי — גיל, מנגנון/תלונה, סימנים חיוניים, תסמינים. 2-3 משפטים.
ערבב את מיקום התשובה הנכונה — correct_index לא תמיד 0.
פלט JSON בלבד, ללא markdown:
{
  "scenario": "תיאור המקרה (2-3 משפטים בעברית מקצועית, עם גיל, מנגנון/תלונה, סימנים חיוניים רלוונטיים)",
  "question": "מה הסימן האדום הקריטי המצריך התערבות מיידית?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "explanation": "הסבר קליני (2-3 משפטים) — מדוע זהו הסימן הקריטי ומה ההשלכות הפיזיולוגיות",
  "topic_tag": "${topic}"
}`;
}

function buildSpotErrorPrompt(): string {
  const topic = getDailyTopic('spot_error');
  return `אתה מדריך פרמדיק בכיר ישראלי. משימתך: כתוב תרחיש BLS מפורט ומבלבל בנושא ${topic}, המכיל טעות מקצועית אחת — מוסתרת בתוך נרטיב שנראה שלם ומקצועי לחלוטין.

נושא היום (חובה): ${topic}. כל התרחיש חייב להתמקד ב${topic}.
תחום: BLS בלבד — ללא תרופות ALS, ללא קצבים, ללא נתיב אוויר מתקדם.

כללים מחייבים:
1. פתח ישירות בתרחיש: "[גבר/אישה] בן/בת [גיל], [תלונה/מנגנון של ${topic}]" — ללא ניסוח שיגור.
2. תאר את ההתערבות בפירוט (5–8 שורות): כלול סימנים חיוניים ספציפיים, ממצאי בדיקה, פעולות שננקטו בסדר כרונולוגי — כדי שהנרטיב ייראה שלם ומקצועי. הטעות חייבת להיות מוסתרת היטב בתוך ים של פרטים נכונים. כלול לפחות שני פרטים שנראים חשודים אך נכונים לחלוטין (כדי להסיח דעת), ופרט אחד שנראה טבעי — שהוא הטעות האמיתית. דוגמאות לטעויות: ממצא שהוחמץ, סדר עדיפויות שגוי, פרוטוקול מיושן, התוויית נגד שנעלמה, תזמון שגוי, מינון לא נכון.
3. השאלה: "מה הטעות המקצועית שזוהתה בטיפול?"
4. 4 תשובות קצרות: אחת היא הטעות האמיתית, השאר — פעולות שלא קרו או שנראות חשודות אך נכונות לחלוטין. עשה את המסיחות משכנעות — לא תשובות ברורות שניתן לפסול בקלות.
5. הסבר (2 משפטים): הטעות, הנזק הפוטנציאלי, והנכון לפי הפרוטוקולים בישראל.
6. שפה: עברית רפואית תקנית בלבד — ללא תעתיקים מאנגלית. "ירידה בהכרה" ולא "סמי הכרה", "בלבול" ולא "קונפוזיה", "ספירת חמצן" ולא "סטורציה".
פלט JSON תקני בלבד, ללא markdown:
{
  "dispatch_opener": "",
  "scenario": "תיאור מפורט עם הטעות המוסתרת (5–8 שורות)",
  "question": "מה הטעות המקצועית שזוהתה בטיפול?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "explanation": "הסבר קצר (2 משפטים): הטעות, הנזק הפוטנציאלי, והנכון לפי הפרוטוקולים בישראל",
  "topic_tag": "${topic}"
}`;
}

function buildMedBagPrompt(recentTopics: string[]): string {
  const avoidSection = recentTopics.length > 0
    ? `\nנושאים שנשאלו לאחרונה — חובה לבחור נושא שונה לחלוטין: ${recentTopics.join(', ')}.\n`
    : '';
  return `אתה מדריך פרמדיק בכיר ישראלי. משימה: צור אתגר "תיק התרופות" — חובש מגיע לביתו של מטופל ומוצא את תרופותיו הכרוניות על השולחן. מהתרופות בלבד יש לנתח את הרקע הרפואי ולזהות את הסכנה הקריטית לטיפול.

כללים מחייבים:
1. סיטואציה (2 משפטים): תרחיש ביתי מציאותי — מטופל עם ערפול הכרה / קוצר נשימה / כאב / נפילה, גיל ומין ספציפיים. המשפחה/הסביבה אינם יודעים לדווח על רקע רפואי.
2. תרופות: רשימה של 3-4 תרופות כרוניות ביתיות בלבד (לא תרופות חירום ולא עירויים). בחר אך ורק מהרשימה הבאה — תרופות ישראליות נפוצות בבתי מטופלים:
   נוגדי קרישה: אליקוויס (Apixaban), קסרלטו (Rivaroxaban), פרדקסה (Dabigatran), סינטרום (Acenocoumarol), קומדין (Warfarin)
   לב/קצב: קרדילוק (Bisoprolol), ביטלוק (Metoprolol), קונקור (Bisoprolol), טנורמין (Atenolol), דיגוקסין (Digoxin)
   יתר לחץ דם: אמלודיפין/נורבסק (Amlodipine), לוסרטן/ואזר (Losartan), ליסינופריל/זסטריל (Lisinopril), רמיפריל/טריטייס (Ramipril), פרינדופריל (Perindopril)
   משתנים: פורוסמיד/לסיקס (Furosemide), אלדקטון (Spironolactone)
   סוכרת: גלוקופאג' (Metformin), ג'ארדיאנס (Empagliflozin), ג'אנוביה (Sitagliptin), נובורפיד/הומולוג (Insulin)
   בלוטת התריס: אויטירוקס/אלטרוקסין (Levothyroxine)
   כולסטרול: ליפיטור/טורבסטט (Atorvastatin), קרסטור (Rosuvastatin), זוקור (Simvastatin)
   ניטרטים: איזוקט (Isosorbide), ניטרודרם (Nitroglycerin patch)
   נוגדי טסיות: אספירין, פלביקס (Clopidogrel), בריליק (Ticagrelor)
   COPD/אסתמה: ונטולין (Salbutamol), סימביקורט (Budesonide/Formoterol), ספיריבה (Tiotropium)
   אפילפסיה: לאמיקטל (Lamotrigine), טגרטול (Carbamazepine), קפרה (Levetiracetam), דפאקין (Valproate)
   נפשי/נוירו: ריספרדל (Risperidone), זיפרקסה (Olanzapine), ציפרלקס (Escitalopram), ליתיום (Lithium)
   סטרואידים: פרדניזון (Prednisone), מדרול (Methylprednisolone)
3. שאלה: "לפי תיק התרופות, מאיזה רקע רפואי עליך לחשוש במיוחד בטיפול בו?"
4. 4 תשובות MCQ: אחת נכונה (הסכנה הקריטית המרכזית הנובעת מהשילוב), שלוש מסיחות סבירות לחובש מתחיל. ערבב מיקום התשובה — correct_index לא תמיד 0.
5. הסבר (2-3 משפטים): אילו תרופות מצביעות על מה, מהי הסכנה הקריטית הספציפית, ומה יש לדווח לצוות המקבל.
6. topic_tag: נושא קצר בעברית (1-3 מילים) לגיוון.
7. med_descriptions: עבור כל תרופה ברשימה — משפט אחד קצר בעברית שמסביר למה היא נועדה (מה היא מטפלת). פשוט ובסיסי, לא טכני.
${avoidSection}
פלט JSON תקני בלבד, ללא markdown:
{
  "situation": "תיאור הסיטואציה (2 משפטים בעברית מקצועית)",
  "medications": ["שם מסחרי א (גנרי)", "שם מסחרי ב (גנרי)", "שם מסחרי ג (גנרי)"],
  "med_descriptions": {"שם מסחרי א (גנרי)": "משפט קצר מה התרופה מטפלת", "שם מסחרי ב (גנרי)": "משפט קצר מה התרופה מטפלת"},
  "question": "לפי תיק התרופות, מאיזה רקע רפואי עליך לחשוש במיוחד בטיפול בו?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "explanation": "הסבר (2-3 משפטים): אילו תרופות מצביעות על מה, הסכנה הקריטית, ומה לדווח לצוות המקבל",
  "topic_tag": "נושא קצר בעברית (1-3 מילים)"
}`;
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

function loadCache<T>(key: string): DayCache<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: DayCache<T> = JSON.parse(raw);
    return parsed.date === getToday() ? parsed : null;
  } catch { return null; }
}

function saveCache<T>(key: string, data: T, answeredIdx?: number | null, timeTaken?: number) {
  localStorage.setItem(key, JSON.stringify({ date: getToday(), data, answeredIdx, timeTaken }));
}

const SUCCESS_SEEN_KEY = 'daily_challenge_success_seen_v1';

function hasSeenSuccessToday(): boolean {
  try {
    const raw = localStorage.getItem(SUCCESS_SEEN_KEY);
    if (!raw) return false;
    return (JSON.parse(raw) as { date: string }).date === getToday();
  } catch { return false; }
}

function markSuccessSeenToday() {
  localStorage.setItem(SUCCESS_SEEN_KEY, JSON.stringify({ date: getToday() }));
}

function loadCachedStats(cat: QuizCategory): GlobalStats | null {
  try {
    const raw = localStorage.getItem(STATS_CACHE_KEY[cat]);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { date: string; stats: GlobalStats };
    return parsed.date === getToday() ? parsed.stats : null;
  } catch { return null; }
}

function saveCachedStats(cat: QuizCategory, stats: GlobalStats) {
  try { localStorage.setItem(STATS_CACHE_KEY[cat], JSON.stringify({ date: getToday(), stats })); } catch { /* noop */ }
}

// ─── Streak helpers ───────────────────────────────────────────────────────────

function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem('daily_challenge_streak_v1');
    if (!raw) return { lastCompletedDate: '', streak: 0, bestStreak: 0 };
    return JSON.parse(raw) as StreakData;
  } catch { return { lastCompletedDate: '', streak: 0, bestStreak: 0 }; }
}

function markDayComplete(): StreakData {
  const today = getToday();
  const data = getStreak();
  if (data.lastCompletedDate === today) return data;

  const prev = new Date();
  prev.setDate(prev.getDate() - 1);
  const yesterday = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;

  const isConsecutive = data.lastCompletedDate === yesterday;
  const newStreak = isConsecutive ? data.streak + 1 : 1;
  const completedDates = [...(data.completedDates ?? []).filter(d => d !== today), today].slice(-30);
  const updated: StreakData = {
    lastCompletedDate: today,
    streak: newStreak,
    bestStreak: Math.max(newStreak, data.bestStreak),
    completedDates,
  };
  localStorage.setItem('daily_challenge_streak_v1', JSON.stringify(updated));
  return updated;
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1500): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (e) { lastErr = e; if (i < retries) await new Promise((r) => setTimeout(r, delayMs * (i + 1))); }
  }
  throw lastErr;
}

// ─── Gemini (server-side proxy) ───────────────────────────────────────────────

class RateLimitError extends Error {
  retryAfterMs: number;
  constructor(retryAfterMs = 15_000) { super('rate-limit'); this.retryAfterMs = retryAfterMs; }
}

async function callGemini<T>(prompt: string, model?: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45_000);
  let res: Response;
  try {
    res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, ...(model ? { model } : {}) }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
  if (res.status === 429) throw new RateLimitError();
  if (!res.ok) throw new Error(`Gemini proxy error: ${res.status}`);
  const { text } = await res.json() as { text: string };
  // Strip markdown fences then find the outermost { } — handles any preamble/postamble
  const stripped = text.trim().replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start === -1 || end <= start) {
    console.error('[callGemini] no JSON found in response:', stripped.slice(0, 300));
    throw new Error('No JSON in Gemini response');
  }
  return JSON.parse(stripped.slice(start, end + 1)) as T;
}

async function generateClinical(cat: ClinicalCategory): Promise<ClinicalQuestion> {
  // Use gemini-2.5-flash directly — weaker models reliably produce valid HTTP 200
  // responses but with wrong JSON keys (e.g. "explanation" instead of
  // "clinical_explanation"), which pass the proxy but fail client validation.
  // The Supabase cron job uses 2.5-flash and never has this problem.
  const raw = await withRetry(() =>
    callGemini<ClinicalQuestion & { explanation?: string; הסבר_קליני?: string }>(
      CLINICAL_PROMPTS[cat],
      'gemini-2.5-flash',
    ),
  );
  // Normalise alternate key names that weaker models sometimes emit
  if (!raw.clinical_explanation) {
    const alt = raw.explanation ?? (raw as Record<string, unknown>)['הסבר_קליני'] as string | undefined;
    if (alt) (raw as ClinicalQuestion).clinical_explanation = alt;
  }
  if (
    typeof raw.question !== 'string' || !Array.isArray(raw.options) ||
    raw.options.length !== 4 || typeof raw.correct_index !== 'number' ||
    typeof raw.clinical_explanation !== 'string'
  ) throw new Error('Invalid clinical question format');
  return raw as ClinicalQuestion;
}

async function generateMed(): Promise<MedOfDay> {
  const m = await withRetry(() => callGemini<MedOfDay>(buildMedPrompt()));
  if (!m.name || !m.drug_class || !m.question || !Array.isArray(m.options) || m.options.length !== 4 || typeof m.correct_index !== 'number') {
    throw new Error('Invalid med format');
  }
  return m;
}

async function generateImprovised(): Promise<ImprovisedQ> {
  const q = await withRetry(() => callGemini<ImprovisedQ>(buildImprovisedPrompt([])));
  if (!q.scenario || !q.question || !Array.isArray(q.options) || q.options.length !== 4) throw new Error('Invalid improvised format');
  return q;
}

async function generateRedFlag(): Promise<RedFlagQ> {
  const r = await withRetry(() => callGemini<RedFlagQ>(buildRedFlagPrompt()));
  if (!r.scenario || !r.question || !Array.isArray(r.options) || r.options.length !== 4) throw new Error('Invalid red flag format');
  return r;
}

async function getRecentTopicsForDiversity(): Promise<string[]> {
  const { data } = await supabase
    .from('daily_questions')
    .select('content')
    .in('question_type', ['bls', 'als', 'spot_error', 'med_bag', 'red_flag'])
    .order('question_date', { ascending: false })
    .limit(75);
  if (!data) return [];
  return data
    .map((r: { content?: { topic_tag?: string } }) => r.content?.topic_tag as string)
    .filter(Boolean);
}

async function generateSpotError(): Promise<SpotErrorQ> {
  const q = await withRetry(() => callGemini<SpotErrorQ>(buildSpotErrorPrompt()));
  if (!q.scenario || !q.question || !Array.isArray(q.options) || q.options.length !== 4) {
    throw new Error('Invalid spot error format');
  }
  return q;
}

async function generateMedBag(): Promise<MedBagQ> {
  const recentTopics = await getRecentTopicsForDiversity().catch(() => [] as string[]);
  const q = await withRetry(() => callGemini<MedBagQ>(buildMedBagPrompt(recentTopics)));
  if (!q.situation || !Array.isArray(q.medications) || q.medications.length < 2 || !q.question || !Array.isArray(q.options) || q.options.length !== 4) {
    throw new Error('Invalid med bag format');
  }
  return q;
}

// ─── Supabase ─────────────────────────────────────────────────────────────────

function parseClinicalContent(c: ClinicalQuestion): ClinicalQuestion {
  return {
    question: c.question,
    options: Array.isArray(c.options) ? c.options : JSON.parse(c.options as unknown as string),
    correct_index: c.correct_index,
    clinical_explanation: c.clinical_explanation,
  };
}

async function fetchOrCreateClinical(cat: ClinicalCategory): Promise<ClinicalQuestion> {
  const today = getToday();

  const existing = await queryDailyQuestion<ClinicalQuestion>(today, cat);
  if (existing) return parseClinicalContent(existing);

  let generated: ClinicalQuestion;
  try {
    generated = await withRetry(() => generateClinical(cat));
  } catch (err) {
    if (err instanceof RateLimitError) {
      await new Promise((r) => setTimeout(r, err.retryAfterMs));
      const fallback = await queryDailyQuestion<ClinicalQuestion>(today, cat);
      if (fallback) return parseClinicalContent(fallback);
    }
    throw err;
  }

  const { data: inserted, error: insertError } = await supabase.from('daily_questions')
    .insert({ question_date: today, question_type: cat, content: generated }).select().single();
  if (!insertError && inserted?.content) return parseClinicalContent(inserted.content as ClinicalQuestion);

  const canonical = await queryDailyQuestion<ClinicalQuestion>(today, cat);
  if (canonical) return parseClinicalContent(canonical);

  return generated;
}

async function queryDailyQuestion<T>(today: string, questionType: string): Promise<T | null> {
  const { data: rows } = await supabase.from('daily_questions').select('*')
    .eq('question_date', today).eq('question_type', questionType)
    .order('id', { ascending: true }).limit(1);
  return (rows?.[0]?.content as T) ?? null;
}

async function fetchOrCreateBlock<T>(questionType: string, generate: () => Promise<T>): Promise<T> {
  const today = getToday();

  const existing = await queryDailyQuestion<T>(today, questionType);
  if (existing) return existing;

  let generated: T;
  try {
    generated = await generate();
  } catch (err) {
    if (err instanceof RateLimitError) {
      // Quota hit — wait, then check if another user already stored today's question
      await new Promise((r) => setTimeout(r, err.retryAfterMs));
      const fallback = await queryDailyQuestion<T>(today, questionType);
      if (fallback) return fallback;
    }
    throw err;
  }

  const { data: inserted, error: insertError } = await supabase.from('daily_questions')
    .insert({ question_date: today, question_type: questionType, content: generated })
    .select().single();
  if (!insertError && inserted?.content) return inserted.content as T;

  // Race condition: another user inserted first — return their canonical version
  const canonical = await queryDailyQuestion<T>(today, questionType);
  if (canonical) return canonical;

  return generated;
}

async function saveClinicalResponse(category: QuizCategory, is_correct: boolean, time_taken: number, answer_index: number) {
  const full = { session_id: getSessionId(), question_type: category, question_date: getToday(), is_correct, time_taken, answer_index: Number(answer_index) };
  const { error } = await supabase.from('daily_responses').insert(full);
  if (!error) return;
  if (/column .* does not exist/i.test(error.message)) {
    const { error: fbErr } = await supabase.from('daily_responses').insert({ session_id: full.session_id, question_type: full.question_type, question_date: full.question_date, answer_index: full.answer_index });
    if (fbErr) console.error('[DailySync] fallback error:', fbErr.message);
    return;
  }
  console.error('[DailySync] INSERT error:', error.message);
}

async function fetchGlobalStats(category: QuizCategory, correctIndex: number | null): Promise<{ stats: GlobalStats; offline: boolean }> {
  const today = getToday();
  const emptyStats: GlobalStats = { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] };
  for (let attempt = 0; attempt <= 2; attempt++) {
    const { data, error } = await supabase.from('daily_responses').select('answer_index')
      .eq('question_type', category).eq('question_date', today);
    if (!error) {
      const rows = data ?? [];
      const answer_counts = [0, 0, 0, 0];
      let correct = 0;
      rows.forEach((r) => {
        const ai = Number(r.answer_index);
        if (Number.isInteger(ai) && ai >= 0 && ai <= 3) {
          answer_counts[ai]++;
          if (correctIndex !== null && ai === correctIndex) correct++;
        }
      });
      const stats: GlobalStats = { total: rows.length, correct, answer_counts };
      saveCachedStats(category, stats);
      return { stats, offline: false };
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 2000));
  }
  const cached = loadCachedStats(category);
  return { stats: cached ?? emptyStats, offline: true };
}

async function shareChallengeResult(score: number): Promise<void> {
  const text = `סיימתי את האתגר היומי של 'חובש +' עם ניקוד ${score}/6! 🏆`;
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  const shareData: ShareData = { title: 'חובש +', text, url };
  try {
    if (navigator.share && navigator.canShare?.(shareData)) { await navigator.share(shareData); return; }
  } catch { /* fall through */ }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); } catch { /* noop */ }
}

// ─── Animation variants ───────────────────────────────────────────────────────

const gridVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.02 } },
  exit: { opacity: 0, scale: 1.06, transition: { duration: 0.2 } },
};

const gridCardVariants = {
  hidden: { opacity: 0, scale: 0.93, y: 14 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

const expandedVariants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 340, damping: 28 } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.14 } },
};

// ─── HEBREW_LETTERS ───────────────────────────────────────────────────────────

const HEBREW_LETTERS = ['א', 'ב', 'ג', 'ד'];

// ─── MCQ Options ──────────────────────────────────────────────────────────────

function MCQOptions({
  options,
  correctIndex,
  answeredIdx,
  onAnswer,
  stats,
  accentCorrect = 'border-green-400/50 bg-green-500/10 text-green-200',
  accentWrong = 'border-red-400/50 bg-red-500/10 text-red-200',
}: {
  options: string[];
  correctIndex: number;
  answeredIdx: number | null;
  onAnswer: (i: number) => void;
  stats?: GlobalStats | null;
  accentCorrect?: string;
  accentWrong?: string;
}) {
  const isAnswered = answeredIdx !== null;

  return (
    <div className="flex flex-col gap-3">
      {options.map((option, idx) => {
        const isCorrect = idx === correctIndex;
        const isSelected = answeredIdx === idx;
        const rawPct = stats && isAnswered && stats.total > 0
          ? Math.round(((stats.answer_counts[idx] ?? 0) / stats.total) * 100)
          : null;
        const chosenPct = rawPct !== null && rawPct > 0 ? rawPct : null;

        let cls = 'border-white/8 bg-white/3 text-emt-light hover:bg-white/7 hover:border-white/14 active:scale-[0.98]';
        if (isAnswered) {
          if (isCorrect) cls = accentCorrect;
          else if (isSelected) cls = accentWrong;
          else cls = 'border-sky-400/30 bg-sky-500/10 text-sky-200/80';
        }
        const fillColor = isCorrect ? 'bg-green-500/20' : isSelected ? 'bg-red-500/20' : 'bg-sky-500/15';

        return (
          <HapticButton
            key={idx}
            onClick={() => onAnswer(idx)}
            disabled={isAnswered}
            hapticPattern={isAnswered ? 0 : 10}
            pressScale={isAnswered ? 1 : 0.97}
            className={`relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 h-auto min-h-[72px] text-right transition-all duration-200 ${cls}`}
          >
            {isAnswered && chosenPct !== null && (
              <motion.div
                className={`absolute inset-0 z-0 rounded-2xl ${fillColor}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: chosenPct / 100 }}
                transition={{ duration: 0.55, delay: 0.18 + idx * 0.06, ease: 'easeOut' }}
                style={{ transformOrigin: 'right' }}
              />
            )}
            <div className="relative z-10 flex items-center gap-3 w-full">
              <span className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm font-black border transition-colors ${
                isAnswered && isCorrect ? 'bg-green-500/35 border-green-400/60 text-green-200'
                : isAnswered && isSelected ? 'bg-red-500/35 border-red-400/60 text-red-200'
                : isAnswered ? 'bg-sky-500/20 border-sky-400/35 text-sky-200/80'
                : 'bg-white/8 border-white/18 text-white/55'
              }`}>
                {HEBREW_LETTERS[idx]}
              </span>
              <span className="flex-1 text-[15px] font-semibold leading-snug break-words min-w-0 text-right">
                {option}
              </span>
              <div className="shrink-0 flex items-center gap-1.5">
                {isAnswered && chosenPct !== null && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + idx * 0.06 }}
                    className={`text-xs font-black tabular-nums ${isCorrect ? 'text-green-300' : isSelected ? 'text-red-300' : 'text-sky-300'}`}
                  >
                    {chosenPct}%
                  </motion.span>
                )}
                {isAnswered && isCorrect && <CheckCircle size={16} className="text-green-400" />}
                {isAnswered && isSelected && !isCorrect && <XCircle size={16} className="text-red-400" />}
              </div>
            </div>
          </HapticButton>
        );
      })}
    </div>
  );
}

// ─── Clinical Explanation Modal ───────────────────────────────────────────────

function ExplanationModal({ explanation, category, isCorrect, onClose }: {
  explanation: string;
  category: ClinicalCategory;
  isCorrect: boolean;
  onClose: () => void;
}) {
  const accentBorder = category === 'bls' ? 'border-blue-500/30' : 'border-red-500/30';
  const accentBg = category === 'bls' ? 'from-blue-900/20' : 'from-red-900/20';

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      dir="rtl"
    >
      <motion.div
        className="w-full max-w-md rounded-3xl bg-emt-dark border border-emt-border overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <div className="shrink-0 flex items-center justify-between px-3.5 py-2.5 border-b border-emt-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
              <Brain size={15} className="text-amber-400" />
            </div>
            <h2 className="text-amber-300 font-black text-base leading-none">הסבר קליני</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-emt-gray border border-emt-border flex items-center justify-center text-emt-muted hover:text-emt-light active:scale-90 transition" aria-label="סגור">
            <X size={16} />
          </button>
        </div>
        <div className="p-3.5 flex flex-col gap-2.5">
          <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black self-center ${isCorrect ? 'bg-green-500/15 border-green-500/40 text-green-300' : 'bg-red-500/15 border-red-500/40 text-red-300'}`}>
            {isCorrect ? <CheckCircle size={13} /> : <XCircle size={13} />}
            <span>{isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה'}</span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className={`rounded-2xl bg-gradient-to-b ${accentBg} to-emt-dark border ${accentBorder} p-3.5`}
          >
            <p className="text-emt-light text-[14px] leading-[1.65] font-medium text-right">{explanation}</p>
          </motion.div>
          <HapticButton onClick={onClose} hapticPattern={10} pressScale={0.96} className="w-full py-3 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-sm">
            הבנתי ✓
          </HapticButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Simple Explanation Modal ─────────────────────────────────────────────────

function SimpleExplanationModal({ explanation, isCorrect, accentColor = 'purple', onClose }: {
  explanation: string;
  isCorrect: boolean;
  accentColor?: 'purple' | 'orange' | 'green';
  onClose: () => void;
}) {
  const borderColor =
    accentColor === 'purple' ? 'border-purple-500/30 from-purple-900/20' :
    accentColor === 'orange' ? 'border-orange-500/30 from-orange-900/20' :
    'border-green-500/30 from-green-900/20';

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      dir="rtl"
    >
      <motion.div
        className="w-full max-w-md rounded-3xl bg-emt-dark border border-emt-border overflow-hidden"
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <div className="p-4 flex flex-col gap-3">
          <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black self-center ${isCorrect ? 'bg-green-500/15 border-green-500/40 text-green-300' : 'bg-red-500/15 border-red-500/40 text-red-300'}`}>
            {isCorrect ? <CheckCircle size={13} /> : <XCircle size={13} />}
            <span>{isCorrect ? 'נכון!' : 'שגוי'}</span>
          </div>
          <div className={`rounded-2xl bg-gradient-to-b ${borderColor} to-emt-dark border p-3.5`}>
            <p className="text-emt-light text-[14px] leading-[1.65] font-medium text-right">{explanation}</p>
          </div>
          <HapticButton onClick={onClose} hapticPattern={10} pressScale={0.96} className="w-full py-3 rounded-2xl bg-white/8 border border-white/15 text-emt-light font-black text-sm">
            הבנתי ✓
          </HapticButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({ score, streak, onClose }: {
  score: number;
  streak: number;
  onClose: () => void;
}) {
  const [shared, setShared] = useState(false);

  return (
    <motion.div
      className="fixed inset-0 z-[85] flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      dir="rtl"
    >
      <motion.div
        className="w-full max-w-sm flex flex-col items-center gap-5"
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 0.05 }}
      >
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.2 + i * 0.07 }}
            >
              <Star
                size={28}
                className={i < score ? 'text-amber-400 fill-amber-400' : 'text-emt-border fill-transparent'}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="text-center"
        >
          <p className="text-emt-light font-black text-2xl leading-tight">
            {score === 6 ? '🏆 מושלם! כל הכבוד!' : score >= 5 ? '⭐ כמעט מושלם!' : score >= 4 ? '💪 מצוין!' : score >= 3 ? '👍 לא רע!' : '📚 המשך ללמוד!'}
          </p>
          <p className="text-emt-muted text-sm mt-1.5">ניקוד: {score}/6</p>
        </motion.div>

        {streak > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.65 }}
            className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-orange-500/15 border border-orange-500/30"
          >
            <Flame size={22} className="text-orange-400 shrink-0" />
            <div>
              <p className="text-orange-300 font-black text-lg leading-none">{streak} ימים ברצף</p>
              <p className="text-orange-400/60 text-xs mt-0.5">המשך את הרצף מחר!</p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="w-full flex flex-col gap-2.5"
        >
          <HapticButton
            onClick={async () => {
              await shareChallengeResult(score);
              setShared(true);
              setTimeout(() => setShared(false), 2200);
            }}
            hapticPattern={15}
            pressScale={0.96}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/35 py-3 text-emerald-200 font-bold text-base"
          >
            <Share2 size={16} />
            {shared ? 'הועתק! ✓' : 'שתף הישג'}
          </HapticButton>
          <HapticButton
            onClick={onClose}
            hapticPattern={10}
            pressScale={0.96}
            className="w-full py-3 rounded-2xl bg-white/8 border border-white/15 text-emt-light font-bold text-base"
          >
            סגור
          </HapticButton>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────────────────

interface GridCardConfig {
  neonBorder: string;
  glowColor: string;
  cardBg: string;
  topGlow: string;
  iconGlow: string;
  labelColor: string;
  icon: React.ReactNode;
  iconBg: string;
  iconBorder: string;
  blockTitle: string;
  emoji: string;
}

function GridCard({
  config,
  status,
  isAnswered,
  isCorrect,
  participantCount,
  onClick,
}: {
  config: GridCardConfig;
  status: LoadStatus;
  isAnswered: boolean;
  isCorrect?: boolean;
  participantCount?: number;
  onClick: () => void;
}) {
  const borderClass = isAnswered
    ? (isCorrect ? 'border-green-400/70' : 'border-red-500/45')
    : config.neonBorder;

  const cardBg = isAnswered
    ? (isCorrect ? 'bg-gradient-to-b from-green-950/55 to-slate-950' : 'bg-gradient-to-b from-red-950/40 to-slate-950')
    : config.cardBg;

  const glowStyle = isAnswered
    ? { boxShadow: isCorrect ? '0 0 52px rgba(34,197,94,0.38), 0 0 16px rgba(34,197,94,0.12) inset' : '0 0 30px rgba(239,68,68,0.22)' }
    : { boxShadow: config.glowColor };

  return (
    <motion.button
      variants={gridCardVariants}
      whileHover={{ scale: 1.04, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`relative w-full h-full flex flex-col items-center justify-center gap-5 rounded-3xl border backdrop-blur-xl overflow-hidden ${borderClass} ${cardBg}`}
      style={glowStyle}
    >
      {/* Colored radial top glow */}
      {!isAnswered && (
        <div
          className="absolute inset-x-0 top-0 h-2/3 pointer-events-none"
          style={{ background: config.topGlow, opacity: 0.35 }}
        />
      )}

      {/* Completion badge */}
      <div className="absolute top-3 right-3 z-10">
        {status === 'loading' && (
          <div className="w-5 h-5 rounded-full border-2 border-white/15 border-t-white/60 animate-spin" />
        )}
        {isAnswered && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 440, damping: 18 }}
            className={`w-7 h-7 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-500/40 border-2 border-green-400/80' : 'bg-red-500/30 border-2 border-red-400/65'}`}
          >
            {isCorrect
              ? <CheckCircle size={14} className="text-green-200" />
              : <XCircle size={14} className="text-red-300" />}
          </motion.div>
        )}
      </div>

      {/* Icon */}
      <motion.div
        className={`relative z-10 w-[70px] h-[70px] rounded-[20px] flex items-center justify-center ${config.iconBg} border ${config.iconBorder}`}
        style={{ boxShadow: isAnswered && isCorrect ? '0 0 32px rgba(34,197,94,0.45)' : config.iconGlow }}
        animate={isAnswered && isCorrect ? { scale: [1, 1.12, 1] } : {}}
        transition={{ duration: 0.48, delay: 0.1 }}
      >
        <span className="text-[34px] leading-none">{config.emoji}</span>
      </motion.div>

      {/* Title */}
      <p className="relative z-10 text-white font-black text-[16px] leading-snug px-4 text-center">
        {config.blockTitle}
      </p>

      {!isAnswered && status === 'ready' && participantCount !== undefined && participantCount > 0 && (
        <div className="absolute bottom-3 z-10 flex items-center gap-1">
          <Users size={9} className="text-white/25" />
          <span className="text-white/25 text-[9px] font-semibold tabular-nums">{participantCount.toLocaleString('he-IL')}</span>
        </div>
      )}
      {!isAnswered && status === 'ready' && (participantCount === undefined || participantCount === 0) && (
        <p className="absolute bottom-4 z-10 text-white/20 text-[10px] font-semibold tracking-wide">הקש לשחק</p>
      )}
      {!isAnswered && status === 'error' && (
        <p className="absolute bottom-4 z-10 text-red-400/60 text-[10px] font-semibold">שגיאה — נסה שוב</p>
      )}
    </motion.button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function DailyChallengeModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);

  // Navigation
  const [activeBlock, setActiveBlock] = useState<BlockId | null>(null);

  // Samsung/Android back gesture inside a block → go back to grid, not close modal
  useModalBackHandler(isOpen && activeBlock !== null, () => setActiveBlock(null));

  // Block A — Clinical
  const [clinicalCategory, setClinicalCategory] = useState<ClinicalCategory | null>(null);
  const [clinicalStatus, setClinicalStatus] = useState<LoadStatus>('idle');
  const [clinicalQuestion, setClinicalQuestion] = useState<ClinicalQuestion | null>(null);
  const [clinicalAnsweredIdx, setClinicalAnsweredIdx] = useState<number | null>(null);
  const [clinicalTimeTaken, setClinicalTimeTaken] = useState<number | null>(null);
  const [showClinicalExpl, setShowClinicalExpl] = useState(false);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [isStatsOffline, setIsStatsOffline] = useState(false);

  // Block B — Medication MCQ
  const [medStatus, setMedStatus] = useState<LoadStatus>('idle');
  const [medData, setMedData] = useState<MedOfDay | null>(null);
  const [medAnsweredIdx, setMedAnsweredIdx] = useState<number | null>(null);
  const [showMedExpl, setShowMedExpl] = useState(false);
  const [medStats, setMedStats] = useState<GlobalStats | null>(null);

  // Block C — Improvised Medicine
  const [improvStatus, setImprovStatus] = useState<LoadStatus>('idle');
  const [improvQuestion, setImprovQuestion] = useState<ImprovisedQ | null>(null);
  const [improvAnsweredIdx, setImprovAnsweredIdx] = useState<number | null>(null);
  const [showImprovExpl, setShowImprovExpl] = useState(false);
  const [improvStats, setImprovStats] = useState<GlobalStats | null>(null);

  // Block D — Red Flag
  const [redStatus, setRedStatus] = useState<LoadStatus>('idle');
  const [redQuestion, setRedQuestion] = useState<RedFlagQ | null>(null);
  const [redAnsweredIdx, setRedAnsweredIdx] = useState<number | null>(null);
  const [showRedExpl, setShowRedExpl] = useState(false);
  const [redStats, setRedStats] = useState<GlobalStats | null>(null);

  // Block E — Spot the Error
  const [spotStatus, setSpotStatus] = useState<LoadStatus>('idle');
  const [spotQuestion, setSpotQuestion] = useState<SpotErrorQ | null>(null);
  const [spotAnsweredIdx, setSpotAnsweredIdx] = useState<number | null>(null);
  const [showSpotExpl, setShowSpotExpl] = useState(false);
  const [spotStats, setSpotStats] = useState<GlobalStats | null>(null);

  // Block F — Med Bag (תיק התרופות)
  const [medBagStatus, setMedBagStatus] = useState<LoadStatus>('idle');
  const [medBagQuestion, setMedBagQuestion] = useState<MedBagQ | null>(null);
  const [medBagAnsweredIdx, setMedBagAnsweredIdx] = useState<number | null>(null);
  const [showMedBagExpl, setShowMedBagExpl] = useState(false);
  const [medBagStats, setMedBagStats] = useState<GlobalStats | null>(null);
  const [activeMedPopup, setActiveMedPopup] = useState<string | null>(null);

  // Overall
  const [streak, setStreak] = useState(0);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [blockParticipants, setBlockParticipants] = useState<Partial<Record<BlockId, number>>>({});

  const questionStartRef = useRef<number | null>(null);

  // Competition
  const [showCompetitionJoin, setShowCompetitionJoin] = useState(false);
  const [competitionJoinName, setCompetitionJoinName] = useState('');
  const [competitionJoinCity, setCompetitionJoinCity] = useState('');
  const [rememberProfile, setRememberProfile] = useState(true);
  const [competitionProfile, setCompetitionProfile] = useState<{ name: string; city: string } | null>(null);
  const [leaderboard, setLeaderboard] = useState<CompetitionEntry[]>([]);
  const perBlockTimeRef = useRef<Partial<Record<BlockId, number>>>({});
  const blockReadyTimeRef = useRef<Partial<Record<BlockId, number>>>({});

  // ── Derived ──
  const clinicalIsAnswered = clinicalAnsweredIdx !== null;
  const medIsAnswered = medAnsweredIdx !== null;
  const improvIsAnswered = improvAnsweredIdx !== null;
  const redIsAnswered = redAnsweredIdx !== null;
  const spotIsAnswered = spotAnsweredIdx !== null;
  const medBagIsAnswered = medBagAnsweredIdx !== null;
  const allAnswered = clinicalIsAnswered && medIsAnswered && improvIsAnswered && redIsAnswered && spotIsAnswered && medBagIsAnswered;
  const anyAnswered = clinicalIsAnswered || medIsAnswered || improvIsAnswered || redIsAnswered || spotIsAnswered || medBagIsAnswered;

  const score = [
    clinicalIsAnswered && clinicalAnsweredIdx === clinicalQuestion?.correct_index,
    medIsAnswered && medAnsweredIdx === medData?.correct_index,
    improvIsAnswered && improvAnsweredIdx === improvQuestion?.correct_index,
    redIsAnswered && redAnsweredIdx === redQuestion?.correct_index,
    spotIsAnswered && spotAnsweredIdx === spotQuestion?.correct_index,
    medBagIsAnswered && medBagAnsweredIdx === medBagQuestion?.correct_index,
  ].filter(Boolean).length;

  const blocksCompleted = [clinicalIsAnswered, medIsAnswered, improvIsAnswered, redIsAnswered, spotIsAnswered, medBagIsAnswered].filter(Boolean).length;

  const clinicalParticipantCount = (globalStats?.total ?? 0) + getParticipantBase();

  // ── Grid card configs ──
  const BLOCK_CONFIGS: Record<BlockId, GridCardConfig> = {
    A: {
      neonBorder: clinicalCategory === 'als' ? 'border-red-500/55' : 'border-amber-500/50',
      glowColor: clinicalCategory === 'als' ? '0 0 32px rgba(239,68,68,0.22)' : '0 0 28px rgba(245,158,11,0.20)',
      cardBg: clinicalCategory === 'als' ? 'bg-gradient-to-b from-red-950/50 to-slate-950' : 'bg-gradient-to-b from-amber-950/50 to-slate-950',
      topGlow: clinicalCategory === 'als'
        ? 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.7) 0%, transparent 70%)'
        : 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.7) 0%, transparent 70%)',
      iconGlow: clinicalCategory === 'als' ? '0 0 22px rgba(239,68,68,0.4)' : '0 0 22px rgba(245,158,11,0.4)',
      labelColor: clinicalCategory === 'als' ? 'text-red-400' : 'text-amber-400',
      icon: <Zap size={20} className={clinicalCategory === 'als' ? 'text-red-400' : 'text-amber-400'} />,
      iconBg: clinicalCategory === 'als' ? 'bg-red-400/20' : 'bg-amber-400/20',
      iconBorder: clinicalCategory === 'als' ? 'border-red-400/35' : 'border-amber-400/35',
      blockTitle: 'שאלה קלינית',
      emoji: clinicalCategory === 'als' ? '⚡' : '🫀',
    },
    B: {
      neonBorder: 'border-emerald-500/55',
      glowColor: '0 0 30px rgba(16,185,129,0.22)',
      cardBg: 'bg-gradient-to-b from-emerald-950/50 to-slate-950',
      topGlow: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.7) 0%, transparent 70%)',
      iconGlow: '0 0 22px rgba(16,185,129,0.4)',
      labelColor: 'text-emerald-400',
      icon: <Pill size={20} className="text-emerald-400" />,
      iconBg: 'bg-emerald-400/20',
      iconBorder: 'border-emerald-400/35',
      blockTitle: 'תרופת היום',
      emoji: '💊',
    },
    C: {
      neonBorder: 'border-teal-500/55',
      glowColor: '0 0 30px rgba(20,184,166,0.22)',
      cardBg: 'bg-gradient-to-b from-teal-950/50 to-slate-950',
      topGlow: 'radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.7) 0%, transparent 70%)',
      iconGlow: '0 0 22px rgba(20,184,166,0.4)',
      labelColor: 'text-teal-400',
      icon: <Wrench size={20} className="text-teal-400" />,
      iconBg: 'bg-teal-400/20',
      iconBorder: 'border-teal-400/35',
      blockTitle: 'אומנות האלתור',
      emoji: '🛠️',
    },
    D: {
      neonBorder: 'border-orange-500/55',
      glowColor: '0 0 30px rgba(249,115,22,0.22)',
      cardBg: 'bg-gradient-to-b from-orange-950/50 to-slate-950',
      topGlow: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.7) 0%, transparent 70%)',
      iconGlow: '0 0 22px rgba(249,115,22,0.4)',
      labelColor: 'text-orange-400',
      icon: <OctagonAlert size={20} className="text-orange-400" />,
      iconBg: 'bg-orange-400/20',
      iconBorder: 'border-orange-400/35',
      blockTitle: 'נורת אזהרה',
      emoji: '🚨',
    },
    E: {
      neonBorder: 'border-rose-500/55',
      glowColor: '0 0 30px rgba(244,63,94,0.22)',
      cardBg: 'bg-gradient-to-b from-rose-950/50 to-slate-950',
      topGlow: 'radial-gradient(ellipse at 50% 0%, rgba(244,63,94,0.7) 0%, transparent 70%)',
      iconGlow: '0 0 22px rgba(244,63,94,0.4)',
      labelColor: 'text-rose-400',
      icon: <Search size={20} className="text-rose-400" />,
      iconBg: 'bg-rose-400/20',
      iconBorder: 'border-rose-400/35',
      blockTitle: 'הפוסל במומו',
      emoji: '🔎',
    },
    F: {
      neonBorder: 'border-indigo-500/55',
      glowColor: '0 0 30px rgba(99,102,241,0.22)',
      cardBg: 'bg-gradient-to-b from-indigo-950/50 to-slate-950',
      topGlow: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.7) 0%, transparent 70%)',
      iconGlow: '0 0 22px rgba(99,102,241,0.4)',
      labelColor: 'text-indigo-400',
      icon: <Stethoscope size={20} className="text-indigo-400" />,
      iconBg: 'bg-indigo-400/20',
      iconBorder: 'border-indigo-400/35',
      blockTitle: 'תיק התרופות',
      emoji: '🩺',
    },
  };

  // ── Load B, C, D on open ──
  useEffect(() => {
    if (!isOpen) return;
    getSessionId();
    trackEvent('daily_challenge_modal_opened');
    const sd = getStreak();
    setStreak(sd.streak);
    setCompletedDates(sd.completedDates ?? []);

    const today = getToday();
    const cachedMed = loadCache<MedOfDay>(CACHE_KEYS.med);
    if (cachedMed && cachedMed.date === today) {
      setMedData(cachedMed.data);
      setMedAnsweredIdx(cachedMed.answeredIdx ?? null);
      setMedStatus('ready');
      if (cachedMed.answeredIdx !== null && cachedMed.answeredIdx !== undefined) {
        const seeded = loadCachedStats('med_v3');
        if (seeded) setMedStats(seeded);
        fetchGlobalStats('med_v3', cachedMed.data.correct_index).then(({ stats }) => {
          setMedStats((prev) => (prev && stats.total < prev.total ? prev : stats));
        });
      }
    } else {
      setMedStatus('loading');
      fetchOrCreateBlock<MedOfDay>('med_v4', generateMed).then((med) => {
        setMedData(med);
        saveCache(CACHE_KEYS.med, med);
        setMedStatus('ready');
      }).catch(() => setMedStatus('error'));
    }

    const cachedImprov = loadCache<ImprovisedQ>(CACHE_KEYS.improvised);
    if (cachedImprov) {
      setImprovQuestion(cachedImprov.data);
      setImprovAnsweredIdx(cachedImprov.answeredIdx ?? null);
      setImprovStatus('ready');
      if (cachedImprov.answeredIdx !== null && cachedImprov.answeredIdx !== undefined) {
        const seeded = loadCachedStats('improvised');
        if (seeded) {
          setImprovStats(seeded);
        } else {
          // Fallback: synthesize a local 1-vote entry so percentages always render
          const localCounts = [0, 0, 0, 0];
          localCounts[cachedImprov.answeredIdx] = 1;
          setImprovStats({ total: 1, correct: cachedImprov.answeredIdx === cachedImprov.data.correct_index ? 1 : 0, answer_counts: localCounts });
        }
        fetchGlobalStats('improvised', cachedImprov.data.correct_index).then(({ stats }) => {
          setImprovStats((prev) => (prev && stats.total < prev.total ? prev : stats));
        });
      }
    } else {
      setImprovStatus('loading');
      fetchOrCreateBlock<ImprovisedQ>('improvised', generateImprovised).then((q) => {
        setImprovQuestion(q);
        saveCache(CACHE_KEYS.improvised, q);
        setImprovStatus('ready');
      }).catch(() => setImprovStatus('error'));
    }

    const cachedRed = loadCache<RedFlagQ>(CACHE_KEYS.red_flag);
    if (cachedRed) {
      setRedQuestion(cachedRed.data);
      setRedAnsweredIdx(cachedRed.answeredIdx ?? null);
      setRedStatus('ready');
      if (cachedRed.answeredIdx !== null && cachedRed.answeredIdx !== undefined) {
        const seeded = loadCachedStats('red_flag');
        if (seeded) setRedStats(seeded);
        fetchGlobalStats('red_flag', cachedRed.data.correct_index).then(({ stats }) => {
          setRedStats((prev) => (prev && stats.total < prev.total ? prev : stats));
        });
      }
    } else {
      setRedStatus('loading');
      fetchOrCreateBlock<RedFlagQ>('red_flag', generateRedFlag).then((q) => {
        setRedQuestion(q);
        saveCache(CACHE_KEYS.red_flag, q);
        setRedStatus('ready');
      }).catch(() => setRedStatus('error'));
    }

    const cachedSpot = loadCache<SpotErrorQ>(CACHE_KEYS.spot_error);
    if (cachedSpot) {
      setSpotQuestion(cachedSpot.data);
      setSpotAnsweredIdx(cachedSpot.answeredIdx ?? null);
      setSpotStatus('ready');
      if (cachedSpot.answeredIdx !== null && cachedSpot.answeredIdx !== undefined) {
        const seeded = loadCachedStats('spot_error');
        if (seeded) setSpotStats(seeded);
        fetchGlobalStats('spot_error', cachedSpot.data.correct_index).then(({ stats }) => {
          setSpotStats((prev) => (prev && stats.total < prev.total ? prev : stats));
        });
      }
    } else {
      setSpotStatus('loading');
      fetchOrCreateBlock<SpotErrorQ>('spot_error', generateSpotError).then((q) => {
        setSpotQuestion(q);
        saveCache(CACHE_KEYS.spot_error, q);
        setSpotStatus('ready');
      }).catch(() => setSpotStatus('error'));
    }

    const cachedMedBag = loadCache<MedBagQ>(CACHE_KEYS.med_bag);
    if (cachedMedBag) {
      setMedBagQuestion(cachedMedBag.data);
      setMedBagAnsweredIdx(cachedMedBag.answeredIdx ?? null);
      setMedBagStatus('ready');
      if (cachedMedBag.answeredIdx !== null && cachedMedBag.answeredIdx !== undefined) {
        const seeded = loadCachedStats('med_bag');
        if (seeded) setMedBagStats(seeded);
        fetchGlobalStats('med_bag', cachedMedBag.data.correct_index).then(({ stats }) => {
          setMedBagStats((prev) => (prev && stats.total < prev.total ? prev : stats));
        });
      }
    } else {
      setMedBagStatus('loading');
      fetchOrCreateBlock<MedBagQ>('med_bag', generateMedBag).then((q) => {
        setMedBagQuestion(q);
        saveCache(CACHE_KEYS.med_bag, q);
        setMedBagStatus('ready');
      }).catch(() => setMedBagStatus('error'));
    }

    // Fetch all participant counts for grid tiles
    const fetchParticipants = async () => {
      const t = getToday();
      const base = getParticipantBase();
      try {
        const { data } = await supabase
          .from('daily_responses')
          .select('question_type')
          .eq('question_date', t)
          .in('question_type', ['bls', 'als', 'med_v3', 'improvised', 'red_flag', 'spot_error', 'med_bag']);
        if (!data) return;
        const counts: Record<string, number> = {};
        data.forEach((r: { question_type: string }) => {
          counts[r.question_type] = (counts[r.question_type] ?? 0) + 1;
        });
        setBlockParticipants({
          A: ((counts['bls'] ?? 0) + (counts['als'] ?? 0)) + base,
          B: (counts['med_v3'] ?? 0) + base,
          C: (counts['improvised'] ?? 0) + base,
          D: (counts['red_flag'] ?? 0) + base,
          E: (counts['spot_error'] ?? 0) + base,
          F: (counts['med_bag'] ?? 0) + base,
        });
      } catch { /* noop */ }
    };
    fetchParticipants();

    // Check competition participation
    if (!isCompetitionOptedOut()) {
      const effective = getEffectiveProfile();
      if (effective) {
        setCompetitionProfile(effective);
        setRememberProfile(effective.isPermanent);
      } else {
        const t = setTimeout(() => setShowCompetitionJoin(true), 700);
        return () => clearTimeout(t);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Real-time participant count updates
  useEffect(() => {
    if (!isOpen) return;
    const refreshParticipants = async () => {
      const t = getToday();
      const base = getParticipantBase();
      try {
        const { data } = await supabase
          .from('daily_responses')
          .select('question_type')
          .eq('question_date', t)
          .in('question_type', ['bls', 'als', 'med_v3', 'improvised', 'red_flag', 'spot_error', 'med_bag']);
        if (!data) return;
        const counts: Record<string, number> = {};
        data.forEach((r: { question_type: string }) => {
          counts[r.question_type] = (counts[r.question_type] ?? 0) + 1;
        });
        setBlockParticipants({
          A: ((counts['bls'] ?? 0) + (counts['als'] ?? 0)) + base,
          B: (counts['med_v3'] ?? 0) + base,
          C: (counts['improvised'] ?? 0) + base,
          D: (counts['red_flag'] ?? 0) + base,
          E: (counts['spot_error'] ?? 0) + base,
          F: (counts['med_bag'] ?? 0) + base,
        });
      } catch { /* noop */ }
    };
    const channel = supabase
      .channel('daily_responses_participants')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'daily_responses' }, refreshParticipants)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Track block open time for competition timing
  useEffect(() => {
    if (activeBlock !== null) {
      blockReadyTimeRef.current[activeBlock] = Date.now();
    }
  }, [activeBlock]);

  // Leaderboard — fetch + realtime subscription
  useEffect(() => {
    if (!isOpen) return;
    const fetchLeaderboard = async () => {
      try {
        const { data } = await supabase
          .from('daily_competition')
          .select('display_name, city, correct_answers, total_time_seconds, answers_count')
          .eq('competition_date', getToday())
          .order('correct_answers', { ascending: false })
          .order('total_time_seconds', { ascending: true })
          .limit(3);
        if (data) setLeaderboard(data as CompetitionEntry[]);
      } catch { /* noop */ }
    };
    fetchLeaderboard();
    const channel = supabase
      .channel('daily_competition_lb')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_competition' }, fetchLeaderboard)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setActiveBlock(null);
      setClinicalCategory(null); setClinicalStatus('idle'); setClinicalQuestion(null);
      setClinicalAnsweredIdx(null); setClinicalTimeTaken(null); setShowClinicalExpl(false);
      setGlobalStats(null); setIsStatsOffline(false);
      setMedStatus('idle'); setMedData(null); setMedAnsweredIdx(null); setShowMedExpl(false); setMedStats(null);
      setImprovStatus('idle'); setImprovQuestion(null); setImprovAnsweredIdx(null); setShowImprovExpl(false); setImprovStats(null);
      setRedStatus('idle'); setRedQuestion(null); setRedAnsweredIdx(null); setShowRedExpl(false); setRedStats(null);
      setSpotStatus('idle'); setSpotQuestion(null); setSpotAnsweredIdx(null); setShowSpotExpl(false); setSpotStats(null);
      setMedBagStatus('idle'); setMedBagQuestion(null); setMedBagAnsweredIdx(null); setShowMedBagExpl(false); setMedBagStats(null); setActiveMedPopup(null);
      setShowSuccess(false);
      setShowCompetitionJoin(false);
      setCompetitionJoinName('');
      setCompetitionJoinCity('');
      setRememberProfile(true);
      setCompetitionProfile(null);
      setLeaderboard([]);
      perBlockTimeRef.current = {};
      blockReadyTimeRef.current = {};
    }
  }, [isOpen]);

  // Mark streak as soon as any question is answered (regardless of score)
  useEffect(() => {
    if (anyAnswered) {
      const s = markDayComplete();
      setStreak(s.streak);
      setCompletedDates(s.completedDates ?? []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyAnswered]);

  // Trigger success screen — only once per day, never on re-open from cache
  useEffect(() => {
    if (allAnswered && !showSuccess && !hasSeenSuccessToday()) {
      const t = setTimeout(() => {
        setShowSuccess(true);
        markSuccessSeenToday();
        trackEvent('daily_challenge_all_blocks_complete', { score });
      }, 700);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAnswered, showSuccess]);

  // Re-validate B/C/D freshness when their block is opened (handles date rollover while modal stays mounted)
  useEffect(() => {
    if (!isOpen || activeBlock === null) return;

    if (activeBlock === 'B' && medStatus !== 'loading') {
      if (!loadCache<MedOfDay>(CACHE_KEYS.med)) {
        setMedStatus('loading'); setMedData(null); setMedAnsweredIdx(null);
        fetchOrCreateBlock<MedOfDay>('med_v4', generateMed)
          .then(med => { setMedData(med); saveCache(CACHE_KEYS.med, med); setMedStatus('ready'); })
          .catch(() => setMedStatus('error'));
      }
    } else if (activeBlock === 'C' && improvStatus !== 'loading') {
      if (!loadCache<ImprovisedQ>(CACHE_KEYS.improvised)) {
        setImprovStatus('loading'); setImprovQuestion(null); setImprovAnsweredIdx(null);
        fetchOrCreateBlock<ImprovisedQ>('improvised', generateImprovised)
          .then(q => { setImprovQuestion(q); saveCache(CACHE_KEYS.improvised, q); setImprovStatus('ready'); })
          .catch(() => setImprovStatus('error'));
      }
    } else if (activeBlock === 'D' && redStatus !== 'loading') {
      if (!loadCache<RedFlagQ>(CACHE_KEYS.red_flag)) {
        setRedStatus('loading'); setRedQuestion(null); setRedAnsweredIdx(null);
        fetchOrCreateBlock<RedFlagQ>('red_flag', generateRedFlag)
          .then(q => { setRedQuestion(q); saveCache(CACHE_KEYS.red_flag, q); setRedStatus('ready'); })
          .catch(() => setRedStatus('error'));
      }
    } else if (activeBlock === 'E' && spotStatus !== 'loading') {
      if (!loadCache<SpotErrorQ>(CACHE_KEYS.spot_error)) {
        setSpotStatus('loading'); setSpotQuestion(null); setSpotAnsweredIdx(null);
        fetchOrCreateBlock<SpotErrorQ>('spot_error', generateSpotError)
          .then(q => { setSpotQuestion(q); saveCache(CACHE_KEYS.spot_error, q); setSpotStatus('ready'); })
          .catch(() => setSpotStatus('error'));
      }
    } else if (activeBlock === 'F' && medBagStatus !== 'loading') {
      if (!loadCache<MedBagQ>(CACHE_KEYS.med_bag)) {
        setMedBagStatus('loading'); setMedBagQuestion(null); setMedBagAnsweredIdx(null);
        fetchOrCreateBlock<MedBagQ>('med_bag', generateMedBag)
          .then(q => { setMedBagQuestion(q); saveCache(CACHE_KEYS.med_bag, q); setMedBagStatus('ready'); })
          .catch(() => setMedBagStatus('error'));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeBlock]);

  // Live stats channel for Block A
  useEffect(() => {
    if (!isOpen || !clinicalCategory) return;
    const correctIdx = clinicalQuestion?.correct_index ?? null;
    const today = getToday();
    const channel = supabase
      .channel(`daily_responses:${clinicalCategory}:${today}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'daily_responses', filter: `question_date=eq.${today}` }, (payload) => {
        const row = payload.new as { question_type?: string; answer_index?: number };
        if (row.question_type !== clinicalCategory) return;
        const ai = Number(row.answer_index);
        setGlobalStats((prev) => {
          const base = prev ?? { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] };
          const counts = [...base.answer_counts];
          if (Number.isInteger(ai) && ai >= 0 && ai <= 3) counts[ai] = (counts[ai] ?? 0) + 1;
          return { total: base.total + 1, correct: base.correct + (correctIdx !== null && ai === correctIdx ? 1 : 0), answer_counts: counts };
        });
        setIsStatsOffline(false);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isOpen, clinicalCategory, clinicalQuestion?.correct_index]);

  // ── Competition join handler ──
  const handleJoinCompetition = useCallback(() => {
    const name = competitionJoinName.trim();
    if (!name) return;
    const city = competitionJoinCity.trim();
    const profile = { name, city };
    if (rememberProfile) {
      localStorage.setItem(COMPETITION_PROFILE_KEY, JSON.stringify(profile));
      localStorage.removeItem(getTodayProfileKey());
    } else {
      localStorage.removeItem(COMPETITION_PROFILE_KEY);
      localStorage.setItem(getTodayProfileKey(), JSON.stringify(profile));
    }
    setCompetitionProfile(profile);
    setShowCompetitionJoin(false);
  }, [competitionJoinName, competitionJoinCity, rememberProfile]);

  const openEditProfile = useCallback(() => {
    const effective = getEffectiveProfile();
    setCompetitionJoinName(effective?.name ?? '');
    setCompetitionJoinCity(effective?.city ?? '');
    setRememberProfile(effective?.isPermanent ?? true);
    setShowCompetitionJoin(true);
  }, []);

  // ── Block A handlers ──
  const loadClinicalCategory = useCallback(async (cat: ClinicalCategory) => {
    setClinicalCategory(cat);
    setClinicalAnsweredIdx(null);
    setClinicalTimeTaken(null);
    setShowClinicalExpl(false);
    trackEvent('daily_challenge_category_selected', { category: cat });

    const seeded = loadCachedStats(cat);
    setGlobalStats(seeded);

    const cached = loadCache<ClinicalQuestion>(CACHE_KEYS[cat]);
    if (cached) {
      setClinicalQuestion(cached.data);
      if (cached.answeredIdx !== null && cached.answeredIdx !== undefined) {
        setClinicalAnsweredIdx(cached.answeredIdx);
        setClinicalTimeTaken(cached.timeTaken ?? null);
      } else {
        setClinicalAnsweredIdx(null);
        setClinicalTimeTaken(null);
        questionStartRef.current = Date.now();
      }
      setClinicalStatus('ready');
      fetchGlobalStats(cat, cached.data.correct_index).then(({ stats, offline }) => {
        setGlobalStats((prev) => (prev && stats.total < prev.total ? prev : stats));
        setIsStatsOffline(offline);
      });
      return;
    }

    setClinicalStatus('loading');
    try {
      const q = await fetchOrCreateClinical(cat);
      setClinicalQuestion(q);
      saveCache(CACHE_KEYS[cat], q, null);
      setClinicalStatus('ready');
      questionStartRef.current = Date.now();
      fetchGlobalStats(cat, q.correct_index).then(({ stats, offline }) => {
        setGlobalStats((prev) => (prev && stats.total < prev.total ? prev : stats));
        setIsStatsOffline(offline);
      });
    } catch {
      setClinicalStatus('error');
    }
  }, []);

  const handleClinicalAnswer = useCallback(async (idx: number) => {
    if (!clinicalQuestion || !clinicalCategory || clinicalAnsweredIdx !== null) return;
    const elapsed = questionStartRef.current ? Math.round((Date.now() - questionStartRef.current) / 1000) : 0;
    const isCorrect = idx === clinicalQuestion.correct_index;
    setClinicalAnsweredIdx(idx);
    setClinicalTimeTaken(elapsed);
    saveCache(CACHE_KEYS[clinicalCategory], clinicalQuestion, idx, elapsed);
    setGlobalStats((prev) => {
      const base = prev ?? { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] };
      const counts = [...base.answer_counts];
      counts[idx] = (counts[idx] ?? 0) + 1;
      return { total: base.total + 1, correct: base.correct + (isCorrect ? 1 : 0), answer_counts: counts };
    });
    setIsStatsOffline(false);
    trackEvent('daily_challenge_complete', { category: clinicalCategory, is_correct: isCorrect, time_taken: elapsed });
    perBlockTimeRef.current['A'] = elapsed;
    if (competitionProfile) {
      const totalTime = (Object.values(perBlockTimeRef.current) as number[]).reduce((a, b) => a + (b ?? 0), 0);
      upsertCompetitionEntry(competitionProfile, score + (isCorrect ? 1 : 0), totalTime, blocksCompleted + 1);
    }
    await saveClinicalResponse(clinicalCategory, isCorrect, elapsed, idx);
    const { stats, offline } = await fetchGlobalStats(clinicalCategory, clinicalQuestion.correct_index);
    setGlobalStats((prev) => (prev && stats.total < prev.total ? prev : stats));
    setIsStatsOffline(offline);
  }, [clinicalQuestion, clinicalCategory, clinicalAnsweredIdx, competitionProfile, score, blocksCompleted]);

  // ── Block B handler ──
  const handleMedAnswer = useCallback(async (idx: number) => {
    if (!medData || medAnsweredIdx !== null) return;
    const isCorrect = idx === medData.correct_index;
    setMedAnsweredIdx(idx);
    saveCache(CACHE_KEYS.med, medData, idx);
    setMedStats((prev) => {
      const base = prev ?? { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] };
      const counts = [...base.answer_counts];
      counts[idx] = (counts[idx] ?? 0) + 1;
      return { total: base.total + 1, correct: base.correct + (isCorrect ? 1 : 0), answer_counts: counts };
    });
    setBlockParticipants((prev) => ({ ...prev, B: (prev.B ?? 0) + 1 }));
    trackEvent('daily_challenge_med_answered', { correct: isCorrect });
    perBlockTimeRef.current['B'] = blockReadyTimeRef.current['B']
      ? Math.round((Date.now() - blockReadyTimeRef.current['B']) / 1000) : 0;
    if (competitionProfile) {
      const totalTime = (Object.values(perBlockTimeRef.current) as number[]).reduce((a, b) => a + (b ?? 0), 0);
      upsertCompetitionEntry(competitionProfile, score + (isCorrect ? 1 : 0), totalTime, blocksCompleted + 1);
    }
    await saveClinicalResponse('med_v3', isCorrect, 0, idx);
    const { stats } = await fetchGlobalStats('med_v3', medData.correct_index);
    setMedStats((prev) => (prev && stats.total < prev.total ? prev : stats));
  }, [medData, medAnsweredIdx, competitionProfile, score, blocksCompleted]);

  // ── Block C handler ──
  const handleImprovAnswer = useCallback(async (idx: number) => {
    if (!improvQuestion || improvAnsweredIdx !== null) return;
    const isCorrect = idx === improvQuestion.correct_index;
    setImprovAnsweredIdx(idx);
    saveCache(CACHE_KEYS.improvised, improvQuestion, idx);
    setImprovStats((prev) => {
      const base = prev ?? { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] };
      const counts = [...base.answer_counts];
      counts[idx] = (counts[idx] ?? 0) + 1;
      return { total: base.total + 1, correct: base.correct + (isCorrect ? 1 : 0), answer_counts: counts };
    });
    setBlockParticipants((prev) => ({ ...prev, C: (prev.C ?? 0) + 1 }));
    trackEvent('daily_challenge_improvised_answered', { correct: isCorrect });
    perBlockTimeRef.current['C'] = blockReadyTimeRef.current['C']
      ? Math.round((Date.now() - blockReadyTimeRef.current['C']) / 1000) : 0;
    if (competitionProfile) {
      const totalTime = (Object.values(perBlockTimeRef.current) as number[]).reduce((a, b) => a + (b ?? 0), 0);
      upsertCompetitionEntry(competitionProfile, score + (isCorrect ? 1 : 0), totalTime, blocksCompleted + 1);
    }
    await saveClinicalResponse('improvised', isCorrect, 0, idx);
    const { stats } = await fetchGlobalStats('improvised', improvQuestion.correct_index);
    setImprovStats((prev) => (prev && stats.total < prev.total ? prev : stats));
  }, [improvQuestion, improvAnsweredIdx, competitionProfile, score, blocksCompleted]);

  // ── Block D handler ──
  const handleRedAnswer = useCallback(async (idx: number) => {
    if (!redQuestion || redAnsweredIdx !== null) return;
    const isCorrect = idx === redQuestion.correct_index;
    setRedAnsweredIdx(idx);
    saveCache(CACHE_KEYS.red_flag, redQuestion, idx);
    setRedStats((prev) => {
      const base = prev ?? { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] };
      const counts = [...base.answer_counts];
      counts[idx] = (counts[idx] ?? 0) + 1;
      return { total: base.total + 1, correct: base.correct + (isCorrect ? 1 : 0), answer_counts: counts };
    });
    setBlockParticipants((prev) => ({ ...prev, D: (prev.D ?? 0) + 1 }));
    trackEvent('daily_challenge_redflag_answered', { correct: isCorrect });
    perBlockTimeRef.current['D'] = blockReadyTimeRef.current['D']
      ? Math.round((Date.now() - blockReadyTimeRef.current['D']) / 1000) : 0;
    if (competitionProfile) {
      const totalTime = (Object.values(perBlockTimeRef.current) as number[]).reduce((a, b) => a + (b ?? 0), 0);
      upsertCompetitionEntry(competitionProfile, score + (isCorrect ? 1 : 0), totalTime, blocksCompleted + 1);
    }
    await saveClinicalResponse('red_flag', isCorrect, 0, idx);
    const { stats } = await fetchGlobalStats('red_flag', redQuestion.correct_index);
    setRedStats((prev) => (prev && stats.total < prev.total ? prev : stats));
  }, [redQuestion, redAnsweredIdx, competitionProfile, score, blocksCompleted]);

  // ── Block E handler ──
  const handleSpotAnswer = useCallback(async (idx: number) => {
    if (!spotQuestion || spotAnsweredIdx !== null) return;
    const isCorrect = idx === spotQuestion.correct_index;
    setSpotAnsweredIdx(idx);
    saveCache(CACHE_KEYS.spot_error, spotQuestion, idx);
    setSpotStats((prev) => {
      const base = prev ?? { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] };
      const counts = [...base.answer_counts];
      counts[idx] = (counts[idx] ?? 0) + 1;
      return { total: base.total + 1, correct: base.correct + (isCorrect ? 1 : 0), answer_counts: counts };
    });
    trackEvent('daily_challenge_spot_answered', { correct: isCorrect });
    perBlockTimeRef.current['E'] = blockReadyTimeRef.current['E']
      ? Math.round((Date.now() - blockReadyTimeRef.current['E']) / 1000) : 0;
    if (competitionProfile) {
      const totalTime = (Object.values(perBlockTimeRef.current) as number[]).reduce((a, b) => a + (b ?? 0), 0);
      upsertCompetitionEntry(competitionProfile, score + (isCorrect ? 1 : 0), totalTime, blocksCompleted + 1);
    }
    await saveClinicalResponse('spot_error', isCorrect, 0, idx);
    const { stats } = await fetchGlobalStats('spot_error', spotQuestion.correct_index);
    setSpotStats((prev) => (prev && stats.total < prev.total ? prev : stats));
  }, [spotQuestion, spotAnsweredIdx, competitionProfile, score, blocksCompleted]);

  // ── Block F handler ──
  const handleMedBagAnswer = useCallback(async (idx: number) => {
    if (!medBagQuestion || medBagAnsweredIdx !== null) return;
    const isCorrect = idx === medBagQuestion.correct_index;
    setMedBagAnsweredIdx(idx);
    saveCache(CACHE_KEYS.med_bag, medBagQuestion, idx);
    setMedBagStats((prev) => {
      const base = prev ?? { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] };
      const counts = [...base.answer_counts];
      counts[idx] = (counts[idx] ?? 0) + 1;
      return { total: base.total + 1, correct: base.correct + (isCorrect ? 1 : 0), answer_counts: counts };
    });
    trackEvent('daily_challenge_medbag_answered', { correct: isCorrect });
    perBlockTimeRef.current['F'] = blockReadyTimeRef.current['F']
      ? Math.round((Date.now() - blockReadyTimeRef.current['F']) / 1000) : 0;
    if (competitionProfile) {
      const totalTime = (Object.values(perBlockTimeRef.current) as number[]).reduce((a, b) => a + (b ?? 0), 0);
      upsertCompetitionEntry(competitionProfile, score + (isCorrect ? 1 : 0), totalTime, blocksCompleted + 1);
    }
    await saveClinicalResponse('med_bag', isCorrect, 0, idx);
    const { stats } = await fetchGlobalStats('med_bag', medBagQuestion.correct_index);
    setMedBagStats((prev) => (prev && stats.total < prev.total ? prev : stats));
  }, [medBagQuestion, medBagAnsweredIdx, competitionProfile, score, blocksCompleted]);

  if (!isOpen) return null;

  // ── Expanded block header ──
  const renderExpandedHeader = (blockId: BlockId) => {
    const cfg = BLOCK_CONFIGS[blockId];
    const isAnswered = blockIsAnswered(blockId);
    const isCorrect = blockIsCorrect(blockId);

    return (
      <div className="ios-safe-header shrink-0 flex items-center gap-3 px-4 py-3 border-b border-emt-border">
        <HapticButton
          onClick={() => setActiveBlock(null)}
          hapticPattern={8}
          pressScale={0.9}
          className="w-9 h-9 rounded-xl bg-emt-gray border border-emt-border flex items-center justify-center text-emt-muted hover:text-emt-light transition-colors shrink-0"
        >
          <ChevronLeft size={18} />
        </HapticButton>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg} border ${cfg.iconBorder}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-emt-light font-black text-[15px] leading-tight truncate">{cfg.blockTitle}</p>
        </div>
        {isAnswered && (
          isCorrect
            ? <CheckCircle size={18} className="text-green-400 shrink-0" />
            : <XCircle size={18} className="text-red-400 shrink-0" />
        )}
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-emt-gray border border-emt-border flex items-center justify-center active:scale-90 transition-transform text-emt-muted hover:text-emt-light shrink-0"
          aria-label="סגור"
        >
          <X size={18} />
        </button>
      </div>
    );
  };

  // ── Block A content ──
  const renderBlockA = () => (
    <div className="flex flex-col gap-5">
      {!clinicalCategory && (
        <div className="flex flex-col gap-4">
          <p className="text-emt-muted text-sm font-semibold text-center">בחר קטגוריה לשאלה של היום</p>
          <div className="flex gap-3">
            {(['bls', 'als'] as ClinicalCategory[]).map((cat) => (
              <HapticButton
                key={cat}
                onClick={() => loadClinicalCategory(cat)}
                hapticPattern={10}
                pressScale={0.94}
                className={`flex-1 py-6 rounded-2xl border flex flex-col items-center gap-1.5 ${
                  cat === 'bls'
                    ? 'bg-blue-500/10 border-blue-500/25 text-blue-300 hover:bg-blue-500/20'
                    : 'bg-red-500/10 border-red-500/25 text-red-300 hover:bg-red-500/20'
                }`}
              >
                <span className="text-3xl leading-none">{cat === 'bls' ? '🫀' : '⚡'}</span>
                <span className="text-2xl font-black leading-none">{CATEGORY_LABELS[cat]}</span>
                <span className="text-[11px] font-semibold opacity-55">{CATEGORY_FULL[cat]}</span>
              </HapticButton>
            ))}
          </div>
        </div>
      )}

      {clinicalCategory && clinicalStatus === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
          <p className="text-emt-muted text-xs font-semibold">מייצר שאלה...</p>
        </div>
      )}

      {clinicalCategory && clinicalStatus === 'error' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <XCircle size={28} className="text-red-400" />
          <p className="text-emt-muted text-xs text-center">שגיאה בטעינת השאלה</p>
          <HapticButton onClick={() => loadClinicalCategory(clinicalCategory)} hapticPattern={10} pressScale={0.95}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold text-xs">
            <RefreshCw size={13} />נסה שוב
          </HapticButton>
        </div>
      )}

      {clinicalCategory && clinicalStatus === 'ready' && clinicalQuestion && (
        <>
          {/* Category toggle tabs — always clickable */}
          <div className="flex gap-3 self-stretch">
            {(['bls', 'als'] as ClinicalCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => loadClinicalCategory(cat)}
                className={`flex-1 py-3.5 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${
                  clinicalCategory === cat
                    ? cat === 'bls'
                      ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 shadow-[0_0_16px_rgba(59,130,246,0.25)]'
                      : 'bg-red-500/20 border-red-500/60 text-red-300 shadow-[0_0_16px_rgba(239,68,68,0.25)]'
                    : 'bg-white/5 border-white/15 text-emt-muted hover:bg-white/10'
                }`}
              >
                <span className="text-2xl leading-none">{cat === 'bls' ? '🫀' : '⚡'}</span>
                <span className="text-base font-black leading-none">{CATEGORY_LABELS[cat]}</span>
                <span className="text-[10px] font-semibold opacity-60">{CATEGORY_FULL[cat]}</span>
              </button>
            ))}
          </div>

          {/* Live participants */}
          <div className="self-center flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5">
            <Users size={11} className="text-emt-muted shrink-0" />
            <span className="text-[10px] text-emt-muted font-semibold">{isStatsOffline ? 'מתחבר...' : 'משתתפים:'}</span>
            <motion.span key={clinicalParticipantCount} initial={{ scale: 0.9, opacity: 0.7 }} animate={{ scale: 1, opacity: 1 }}
              className="text-[11px] font-black text-emt-light tabular-nums">{clinicalParticipantCount.toLocaleString('he-IL')}
            </motion.span>
            {!isStatsOffline && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
          </div>

          {/* Result banner */}
          {clinicalIsAnswered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 border ${
                clinicalAnsweredIdx === clinicalQuestion.correct_index
                  ? 'bg-green-500/15 border-green-500/35' : 'bg-red-500/12 border-red-500/30'
              }`}
            >
              {clinicalAnsweredIdx === clinicalQuestion.correct_index
                ? <CheckCircle size={20} className="text-green-400 shrink-0" />
                : <XCircle size={20} className="text-red-400 shrink-0" />}
              <div className="flex-1">
                <span className={`font-black text-base ${clinicalAnsweredIdx === clinicalQuestion.correct_index ? 'text-green-300' : 'text-red-300'}`}>
                  {clinicalAnsweredIdx === clinicalQuestion.correct_index ? 'תשובה נכונה!' : 'תשובה שגויה'}
                </span>
                {clinicalTimeTaken !== null && (
                  <div className="flex items-center gap-1 mt-0.5 text-emt-muted/55 text-[10px]">
                    <Clock size={9} /><span>ענית תוך {clinicalTimeTaken} שניות</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Trap warning */}
          {!clinicalIsAnswered && (
            <div className="flex items-center gap-3 rounded-2xl bg-orange-500/8 border border-orange-400/20 px-4 py-3">
              <span className="text-lg shrink-0">⚠️</span>
              <div>
                <span className="text-orange-300/90 text-sm font-bold">שאלות טריקיות — מקרי קיצון</span>
                <span className="block text-orange-200/50 text-xs mt-0.5">קרא היטב את כל התשובות לפני שתענה</span>
              </div>
            </div>
          )}

          {/* Question — accent-colored card */}
          <div
            className={`rounded-3xl border p-5 ${clinicalCategory === 'als' ? 'bg-gradient-to-b from-red-950/40 to-slate-950/60 border-red-400/30' : 'bg-gradient-to-b from-amber-950/40 to-slate-950/60 border-amber-400/30'}`}
          >
            <p className="text-white font-black text-[17px] leading-[1.55] text-center">{clinicalQuestion.question}</p>
          </div>

          {/* Divider */}
          <p className="text-center text-white/25 text-[11px] font-semibold tracking-widest uppercase">— בחר תשובה —</p>

          <MCQOptions
            options={clinicalQuestion.options}
            correctIndex={clinicalQuestion.correct_index}
            answeredIdx={clinicalAnsweredIdx}
            onAnswer={handleClinicalAnswer}
            stats={globalStats}
          />

          {clinicalIsAnswered && !showClinicalExpl && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <HapticButton onClick={() => setShowClinicalExpl(true)} hapticPattern={10} pressScale={0.96}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-400/15 border border-amber-400/35 px-4 py-3.5 text-amber-300 font-bold text-sm">
                <Brain size={15} />הצג הסבר
              </HapticButton>
            </motion.div>
          )}
        </>
      )}
    </div>
  );

  // ── Block B content ──
  const renderBlockB = () => {
    if (medStatus === 'loading') {
      return (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-green-400/60 animate-spin" />
          <p className="text-emt-muted text-xs font-semibold">מייצר תרופת היום...</p>
        </div>
      );
    }
    if (medStatus === 'error') {
      return (
        <div className="flex flex-col items-center gap-3 py-8">
          <XCircle size={28} className="text-red-400" />
          <p className="text-emt-muted text-xs text-center">שגיאה בטעינה</p>
          <HapticButton
            onClick={() => { setMedStatus('loading'); setMedData(null); fetchOrCreateBlock<MedOfDay>('med_v4', generateMed).then(med => { setMedData(med); saveCache(CACHE_KEYS.med, med); setMedStatus('ready'); }).catch(() => setMedStatus('error')); }}
            hapticPattern={10} pressScale={0.95}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 font-bold text-xs">
            <RefreshCw size={13} />נסה שוב
          </HapticButton>
        </div>
      );
    }
    if (!medData) return null;

    const medCorrect = medAnsweredIdx === medData.correct_index;

    return (
      <div className="flex flex-col gap-5">
        {/* Drug header — name + class + description */}
        <div className="rounded-3xl bg-gradient-to-b from-emerald-950/55 to-slate-950 border border-emerald-500/35 p-5"
          style={{ boxShadow: '0 0 28px rgba(16,185,129,0.14)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-400/20 border border-emerald-400/35 flex items-center justify-center shrink-0"
              style={{ boxShadow: '0 0 16px rgba(16,185,129,0.3)' }}>
              <Pill size={20} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-emerald-200 font-black text-xl leading-tight">
                {medData.name_he ?? medData.name.replace(/\s*\(.*\)/, '').trim()}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-emerald-300/80 text-[13px] font-semibold leading-tight">
                  {medData.name_en ?? (medData.name.match(/\(([^)]+)\)/)?.[1] ?? '')}
                </span>
                <button
                  onClick={() => {
                    const nameToSpeak = medData.name_en ?? (medData.name.match(/\(([^)]+)\)/)?.[1] ?? medData.name);
                    const utter = new SpeechSynthesisUtterance(nameToSpeak);
                    utter.lang = 'en-US';
                    utter.rate = 0.85;
                    window.speechSynthesis.cancel();
                    window.speechSynthesis.speak(utter);
                  }}
                  className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-400/15 border border-emerald-400/30 hover:bg-emerald-400/25 active:scale-90 transition-all shrink-0"
                  aria-label="הגה את שם התרופה"
                >
                  <Volume2 size={12} className="text-emerald-400" />
                </button>
              </div>
              <p className="text-emerald-400/70 text-[11px] font-semibold mt-0.5 leading-tight">{medData.drug_class}</p>
            </div>
          </div>
          {medData.description && (
            <>
              <div className="h-px bg-emerald-500/20 mb-3" />
              <p className="text-white/85 text-[14px] font-medium leading-relaxed">{medData.description}</p>
            </>
          )}
        </div>

        {/* Participant count */}
        {blockParticipants['B'] !== undefined && blockParticipants['B'] > 0 && (
          <div className="self-center flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5">
            <Users size={11} className="text-emt-muted shrink-0" />
            <span className="text-[10px] text-emt-muted font-semibold">משתתפים:</span>
            <span className="text-[11px] font-black text-emt-light tabular-nums">{(blockParticipants['B'] ?? 0).toLocaleString('he-IL')}</span>
          </div>
        )}

        {/* Result banner */}
        {medIsAnswered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 border ${
              medCorrect ? 'bg-green-500/15 border-green-500/35' : 'bg-red-500/12 border-red-500/30'
            }`}
          >
            {medCorrect ? <CheckCircle size={20} className="text-green-400 shrink-0" /> : <XCircle size={20} className="text-red-400 shrink-0" />}
            <span className={`font-black text-base ${medCorrect ? 'text-green-300' : 'text-red-300'}`}>
              {medCorrect ? 'תשובה נכונה!' : 'תשובה שגויה'}
            </span>
          </motion.div>
        )}

        {/* Question */}
        <div className="rounded-3xl bg-gradient-to-b from-emerald-950/40 to-slate-950/60 border border-emerald-400/30 p-5">
          <p className="text-white font-black text-[17px] leading-[1.55] text-center">{medData.question}</p>
        </div>

        <p className="text-center text-white/25 text-[11px] font-semibold tracking-widest uppercase">— בחר תשובה —</p>

        <MCQOptions
          options={medData.options}
          correctIndex={medData.correct_index}
          answeredIdx={medAnsweredIdx}
          onAnswer={handleMedAnswer}
          stats={medStats}
          accentCorrect="border-emerald-400/55 bg-emerald-500/12 text-emerald-100"
          accentWrong="border-red-400/50 bg-red-500/10 text-red-200"
        />

        {/* Clinical pearl + emergency note — distinct framed cards */}
        {medIsAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex flex-col gap-3"
          >
            {/* Pearl card */}
            <div className="rounded-2xl overflow-hidden border border-emerald-500/40"
              style={{ boxShadow: '0 0 20px rgba(16,185,129,0.12)' }}>
              <div className="bg-emerald-500/20 px-4 py-2.5 flex items-center gap-2 border-b border-emerald-500/25">
                <Brain size={14} className="text-emerald-300 shrink-0" />
                <p className="text-emerald-200 text-xs font-black uppercase tracking-widest">דגש קליני</p>
              </div>
              <div className="bg-emerald-950/30 px-4 py-3.5">
                <p className="text-white/90 text-[14px] leading-relaxed font-medium">{medData.clinical_pearl}</p>
              </div>
            </div>
            {/* Emergency note card */}
            <div className="rounded-2xl overflow-hidden border border-amber-500/40"
              style={{ boxShadow: '0 0 20px rgba(245,158,11,0.12)' }}>
              <div className="bg-amber-500/20 px-4 py-2.5 flex items-center gap-2 border-b border-amber-500/25">
                <AlertTriangle size={14} className="text-amber-300 shrink-0" />
                <p className="text-amber-200 text-xs font-black uppercase tracking-widest">אזהרה</p>
              </div>
              <div className="bg-amber-950/25 px-4 py-3.5">
                <p className="text-white/90 text-[14px] leading-relaxed font-medium">{medData.emergency_note}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // ── Block C content ──
  const renderBlockC = () => {
    if (improvStatus === 'loading') {
      return (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-teal-400/60 animate-spin" />
          <p className="text-emt-muted text-xs font-semibold">מייצר תרחיש...</p>
        </div>
      );
    }
    if (improvStatus === 'error') {
      return (
        <div className="flex flex-col items-center gap-3 py-8">
          <XCircle size={28} className="text-red-400" />
          <p className="text-emt-muted text-xs text-center">שגיאה בטעינה</p>
          <HapticButton onClick={() => { setImprovStatus('loading'); fetchOrCreateBlock<ImprovisedQ>('improvised', generateImprovised).then(q => { setImprovQuestion(q); saveCache(CACHE_KEYS.improvised, q); setImprovStatus('ready'); }).catch(() => setImprovStatus('error')); }} hapticPattern={10} pressScale={0.95} className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-400/15 border border-teal-400/30 text-teal-300 font-bold text-xs">
            <RefreshCw size={13} />נסה שוב
          </HapticButton>
        </div>
      );
    }
    if (!improvQuestion) return null;

    const improvCorrect = improvAnsweredIdx === improvQuestion.correct_index;

    return (
      <div className="flex flex-col gap-5">
        {/* Game explanation */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-teal-500/8 border border-teal-400/20">
          <Wrench size={14} className="text-teal-400 shrink-0" />
          <p className="text-teal-300/80 text-[13px] font-semibold leading-snug">אתה בשטח ללא תיק — חשוב יצירתי ובחר את הפתרון הטוב ביותר עם מה שיש.</p>
        </div>

        {/* Participant count */}
        {blockParticipants['C'] !== undefined && blockParticipants['C'] > 0 && (
          <div className="self-center flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5">
            <Users size={11} className="text-emt-muted shrink-0" />
            <span className="text-[10px] text-emt-muted font-semibold">משתתפים:</span>
            <span className="text-[11px] font-black text-emt-light tabular-nums">{(blockParticipants['C'] ?? 0).toLocaleString('he-IL')}</span>
          </div>
        )}

        {/* Scenario card */}
        <div className="rounded-3xl bg-gradient-to-b from-teal-950/50 to-slate-950 border border-teal-500/30 p-5"
          style={{ boxShadow: '0 0 26px rgba(20,184,166,0.12)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Wrench size={14} className="text-teal-400 shrink-0" />
            <p className="text-teal-400 text-[11px] font-black uppercase tracking-widest">אומנות האלתור</p>
          </div>
          <p className="text-white/90 text-[15px] leading-[1.65] font-medium">{improvQuestion.scenario}</p>
        </div>

        {/* Question */}
        <div className="rounded-3xl bg-gradient-to-b from-teal-950/40 to-slate-950/60 border border-teal-400/30 p-5">
          <p className="text-white font-black text-[17px] leading-[1.55] text-center">{improvQuestion.question}</p>
        </div>

        {/* Result banner */}
        {improvIsAnswered && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 border ${improvCorrect ? 'bg-green-500/15 border-green-500/35' : 'bg-red-500/12 border-red-500/30'}`}>
            {improvCorrect ? <CheckCircle size={20} className="text-green-400 shrink-0" /> : <XCircle size={20} className="text-red-400 shrink-0" />}
            <span className={`font-black text-base ${improvCorrect ? 'text-green-300' : 'text-red-300'}`}>
              {improvCorrect ? 'פתרון נכון!' : 'לא הפתרון האופטימלי'}
            </span>
          </motion.div>
        )}

        <p className="text-center text-white/25 text-[11px] font-semibold tracking-widest uppercase">— בחר תשובה —</p>

        <MCQOptions
          options={improvQuestion.options}
          correctIndex={improvQuestion.correct_index}
          answeredIdx={improvAnsweredIdx}
          onAnswer={handleImprovAnswer}
          stats={improvStats}
          accentCorrect="border-teal-400/55 bg-teal-500/12 text-teal-100"
          accentWrong="border-red-400/50 bg-red-500/10 text-red-200"
        />

        {improvIsAnswered && !showImprovExpl && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <HapticButton onClick={() => setShowImprovExpl(true)} hapticPattern={10} pressScale={0.96}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-teal-400/15 border border-teal-400/35 py-3.5 text-teal-300 font-bold text-sm">
              <Brain size={14} />הצג הסבר
            </HapticButton>
          </motion.div>
        )}
      </div>
    );
  };

  // ── Block D content ──
  const renderBlockD = () => {
    if (redStatus === 'loading') {
      return (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-orange-400/60 animate-spin" />
          <p className="text-emt-muted text-xs font-semibold">טוען מקרה...</p>
        </div>
      );
    }
    if (redStatus === 'error') {
      return (
        <div className="flex flex-col items-center gap-3 py-8">
          <XCircle size={28} className="text-red-400" />
          <p className="text-emt-muted text-xs text-center">שגיאה בטעינה</p>
          <HapticButton onClick={() => { setRedStatus('loading'); setRedQuestion(null); fetchOrCreateBlock<RedFlagQ>('red_flag', generateRedFlag).then(q => { setRedQuestion(q); saveCache(CACHE_KEYS.red_flag, q); setRedStatus('ready'); }).catch(() => setRedStatus('error')); }} hapticPattern={10} pressScale={0.95} className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-400/15 border border-orange-400/30 text-orange-300 font-bold text-xs">
            <RefreshCw size={13} />נסה שוב
          </HapticButton>
        </div>
      );
    }
    if (!redQuestion) return null;

    return (
      <div className="flex flex-col gap-5">
        {/* Participant count */}
        {blockParticipants['D'] !== undefined && blockParticipants['D'] > 0 && (
          <div className="self-center flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5">
            <Users size={11} className="text-emt-muted shrink-0" />
            <span className="text-[10px] text-emt-muted font-semibold">משתתפים:</span>
            <span className="text-[11px] font-black text-emt-light tabular-nums">{(blockParticipants['D'] ?? 0).toLocaleString('he-IL')}</span>
          </div>
        )}

        {/* Scenario card */}
        <div className="rounded-3xl bg-gradient-to-b from-orange-950/50 to-slate-950 border border-orange-500/30 p-5"
          style={{ boxShadow: '0 0 26px rgba(249,115,22,0.12)' }}>
          <div className="flex items-center gap-2 mb-3">
            <OctagonAlert size={14} className="text-orange-400 shrink-0" />
            <p className="text-orange-400 text-[11px] font-black uppercase tracking-widest">מקרה חירום</p>
          </div>
          <p className="text-white/90 text-[15px] leading-[1.65] font-medium">{redQuestion.scenario}</p>
        </div>

        {/* Question */}
        <div className="rounded-3xl bg-gradient-to-b from-orange-950/40 to-slate-950/60 border border-orange-400/30 p-5">
          <p className="text-white font-black text-[17px] leading-[1.55] text-center">{redQuestion.question}</p>
        </div>

        {/* Result banner */}
        {redIsAnswered && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 border ${redAnsweredIdx === redQuestion.correct_index ? 'bg-green-500/15 border-green-500/35' : 'bg-red-500/12 border-red-500/30'}`}>
            {redAnsweredIdx === redQuestion.correct_index ? <CheckCircle size={20} className="text-green-400 shrink-0" /> : <XCircle size={20} className="text-red-400 shrink-0" />}
            <span className={`font-black text-base ${redAnsweredIdx === redQuestion.correct_index ? 'text-green-300' : 'text-red-300'}`}>
              {redAnsweredIdx === redQuestion.correct_index ? 'זיהית נכון!' : 'שגוי'}
            </span>
          </motion.div>
        )}

        <p className="text-center text-white/25 text-[11px] font-semibold tracking-widest uppercase">— בחר תשובה —</p>

        <MCQOptions
          options={redQuestion.options}
          correctIndex={redQuestion.correct_index}
          answeredIdx={redAnsweredIdx}
          onAnswer={handleRedAnswer}
          stats={redStats}
          accentCorrect="border-orange-400/55 bg-orange-500/12 text-orange-100"
          accentWrong="border-red-400/50 bg-red-500/10 text-red-200"
        />

        {redIsAnswered && !showRedExpl && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <HapticButton onClick={() => setShowRedExpl(true)} hapticPattern={10} pressScale={0.96}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-400/15 border border-orange-400/35 py-3.5 text-orange-300 font-bold text-sm">
              <Brain size={14} />הצג הסבר קליני
            </HapticButton>
          </motion.div>
        )}
      </div>
    );
  };

  // ── Block E content ──
  const renderBlockE = () => {
    if (spotStatus === 'loading') {
      return (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-rose-400/60 animate-spin" />
          <p className="text-emt-muted text-xs font-semibold">מייצר תרחיש...</p>
        </div>
      );
    }
    if (spotStatus === 'error') {
      return (
        <div className="flex flex-col items-center gap-3 py-8">
          <XCircle size={28} className="text-red-400" />
          <p className="text-emt-muted text-xs text-center">שגיאה בטעינה</p>
          <HapticButton onClick={() => { setSpotStatus('loading'); fetchOrCreateBlock<SpotErrorQ>('spot_error', generateSpotError).then(q => { setSpotQuestion(q); saveCache(CACHE_KEYS.spot_error, q); setSpotStatus('ready'); }).catch(() => setSpotStatus('error')); }} hapticPattern={10} pressScale={0.95} className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-400/15 border border-rose-400/30 text-rose-300 font-bold text-xs">
            <RefreshCw size={13} />נסה שוב
          </HapticButton>
        </div>
      );
    }
    if (!spotQuestion) return null;

    const spotCorrect = spotAnsweredIdx === spotQuestion.correct_index;

    return (
      <div className="flex flex-col gap-5">
        {/* Game explanation */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-rose-500/8 border border-rose-400/20">
          <Search size={14} className="text-rose-400 shrink-0" />
          <p className="text-rose-300/80 text-[13px] font-semibold leading-snug">קרא את התרחיש — טעות מקצועית אחת מוסתרת בנרטיב. זהה אותה מבין 4 אפשרויות.</p>
        </div>

        {/* Participant count */}
        {blockParticipants['E'] !== undefined && blockParticipants['E'] > 0 && (
          <div className="self-center flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5">
            <Users size={11} className="text-emt-muted shrink-0" />
            <span className="text-[10px] text-emt-muted font-semibold">משתתפים:</span>
            <span className="text-[11px] font-black text-emt-light tabular-nums">{(blockParticipants['E'] ?? 0).toLocaleString('he-IL')}</span>
          </div>
        )}

        {/* Scenario card */}
        <div className="rounded-3xl bg-gradient-to-b from-rose-950/50 to-slate-950 border border-rose-500/30 p-5"
          style={{ boxShadow: '0 0 26px rgba(244,63,94,0.12)' }}>
          {spotQuestion.dispatch_opener ? (
            <>
              <p className="text-rose-200/90 text-[14px] font-semibold leading-relaxed mb-3">{spotQuestion.dispatch_opener}</p>
              <div className="h-px bg-rose-500/20 mb-3" />
            </>
          ) : null}
          <p className="text-white/90 text-[14px] leading-[1.65] font-medium">{spotQuestion.scenario}</p>
        </div>

        {/* Question */}
        <div className="rounded-3xl bg-gradient-to-b from-rose-950/40 to-slate-950/60 border border-rose-400/30 p-5">
          <p className="text-white font-black text-[17px] leading-[1.55] text-center">{spotQuestion.question}</p>
        </div>

        {/* Result banner */}
        {spotIsAnswered && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 border ${spotCorrect ? 'bg-green-500/15 border-green-500/35' : 'bg-red-500/12 border-red-500/30'}`}>
            {spotCorrect ? <CheckCircle size={20} className="text-green-400 shrink-0" /> : <XCircle size={20} className="text-red-400 shrink-0" />}
            <span className={`font-black text-base ${spotCorrect ? 'text-green-300' : 'text-red-300'}`}>
              {spotCorrect ? 'מצאת את הטעות!' : 'לא בדיוק — ראה הסבר'}
            </span>
          </motion.div>
        )}

        <p className="text-center text-white/25 text-[11px] font-semibold tracking-widest uppercase">— בחר תשובה —</p>

        <MCQOptions
          options={spotQuestion.options}
          correctIndex={spotQuestion.correct_index}
          answeredIdx={spotAnsweredIdx}
          onAnswer={handleSpotAnswer}
          stats={spotStats}
          accentCorrect="border-rose-400/55 bg-rose-500/12 text-rose-100"
          accentWrong="border-red-400/50 bg-red-500/10 text-red-200"
        />

        {spotIsAnswered && !showSpotExpl && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <HapticButton onClick={() => setShowSpotExpl(true)} hapticPattern={10} pressScale={0.96}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-400/15 border border-rose-400/35 py-3.5 text-rose-300 font-bold text-sm">
              <Brain size={14} />הצג הסבר קליני
            </HapticButton>
          </motion.div>
        )}
      </div>
    );
  };

  // ── Block F content ──
  const renderBlockF = () => {
    if (medBagStatus === 'loading') {
      return (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-indigo-400/60 animate-spin" />
          <p className="text-emt-muted text-xs font-semibold">מייצר תיק תרופות...</p>
        </div>
      );
    }
    if (medBagStatus === 'error') {
      return (
        <div className="flex flex-col items-center gap-3 py-8">
          <XCircle size={28} className="text-red-400" />
          <p className="text-emt-muted text-xs text-center">שגיאה בטעינה</p>
          <HapticButton onClick={() => { setMedBagStatus('loading'); fetchOrCreateBlock<MedBagQ>('med_bag', generateMedBag).then(q => { setMedBagQuestion(q); saveCache(CACHE_KEYS.med_bag, q); setMedBagStatus('ready'); }).catch(() => setMedBagStatus('error')); }} hapticPattern={10} pressScale={0.95} className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-400/15 border border-indigo-400/30 text-indigo-300 font-bold text-xs">
            <RefreshCw size={13} />נסה שוב
          </HapticButton>
        </div>
      );
    }
    if (!medBagQuestion) return null;

    const medBagCorrect = medBagAnsweredIdx === medBagQuestion.correct_index;

    return (
      <div className="flex flex-col gap-5">
        {/* Game explanation */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-indigo-500/8 border border-indigo-400/20">
          <Stethoscope size={14} className="text-indigo-400 shrink-0" />
          <p className="text-indigo-300/80 text-[13px] font-semibold leading-snug">קרא את הסיטואציה ואת תרופות המטופל — ואז זהה את הסכנה הקריטית.</p>
        </div>

        {/* Participant count — always show at least PARTICIPANT_BASE */}
        <div className="self-center flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5">
          <Users size={11} className="text-emt-muted shrink-0" />
          <span className="text-[10px] text-emt-muted font-semibold">משתתפים:</span>
          <motion.span
            key={blockParticipants['F'] ?? getParticipantBase()}
            initial={{ scale: 0.9, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[11px] font-black text-emt-light tabular-nums"
          >
            {(blockParticipants['F'] ?? getParticipantBase()).toLocaleString('he-IL')}
          </motion.span>
        </div>

        {/* Situation card */}
        <div className="rounded-3xl bg-gradient-to-b from-indigo-950/50 to-slate-950 border border-indigo-500/30 p-5"
          style={{ boxShadow: '0 0 26px rgba(99,102,241,0.12)' }}>
          <p className="text-indigo-200/70 text-[11px] font-black uppercase tracking-widest mb-2">הסיטואציה</p>
          <p className="text-white/90 text-[14px] leading-[1.65] font-medium">{medBagQuestion.situation}</p>
        </div>

        {/* Medications card */}
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/12 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/50 text-[11px] font-black uppercase tracking-widest">תרופות שנמצאו על השולחן</p>
            <span className="text-indigo-400/60 text-[10px] font-semibold flex items-center gap-1"><Info size={9} />לחץ לפרטים</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {medBagQuestion.medications.map((med, i) => (
              <button
                key={i}
                onClick={() => setActiveMedPopup(activeMedPopup === med ? null : med)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${activeMedPopup === med ? 'bg-indigo-500/30 border-indigo-400/60' : 'bg-indigo-500/15 border-indigo-400/30'}`}
              >
                <Pill size={12} className="text-indigo-300 shrink-0" />
                <span className="text-indigo-200 text-[13px] font-bold">{med}</span>
              </button>
            ))}
          </div>
          <AnimatePresence>
            {activeMedPopup && (
              <motion.div
                key={activeMedPopup}
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 overflow-hidden"
              >
                <div className="rounded-2xl bg-indigo-950/70 border border-indigo-400/25 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Pill size={11} className="text-indigo-300 shrink-0" />
                    <span className="text-indigo-200 text-[12px] font-black">{activeMedPopup}</span>
                  </div>
                  {medBagQuestion.med_descriptions?.[activeMedPopup] ? (
                    <p className="text-white/70 text-[12px] leading-relaxed">{medBagQuestion.med_descriptions[activeMedPopup]}</p>
                  ) : (
                    <p className="text-white/35 text-[11px] leading-relaxed">התיאור יופיע עם השאלה הבאה</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Question */}
        <div className="rounded-3xl bg-gradient-to-b from-indigo-950/40 to-slate-950/60 border border-indigo-400/30 p-5">
          <p className="text-white font-black text-[17px] leading-[1.55] text-center">{medBagQuestion.question}</p>
        </div>

        {/* Result banner */}
        {medBagIsAnswered && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 border ${medBagCorrect ? 'bg-green-500/15 border-green-500/35' : 'bg-red-500/12 border-red-500/30'}`}>
            {medBagCorrect ? <CheckCircle size={20} className="text-green-400 shrink-0" /> : <XCircle size={20} className="text-red-400 shrink-0" />}
            <span className={`font-black text-base ${medBagCorrect ? 'text-green-300' : 'text-red-300'}`}>
              {medBagCorrect ? 'זיהוי מדויק!' : 'לא בדיוק — ראה הסבר'}
            </span>
          </motion.div>
        )}

        <p className="text-center text-white/25 text-[11px] font-semibold tracking-widest uppercase">— מה הסכנה הקריטית? —</p>

        <MCQOptions
          options={medBagQuestion.options}
          correctIndex={medBagQuestion.correct_index}
          answeredIdx={medBagAnsweredIdx}
          onAnswer={handleMedBagAnswer}
          stats={medBagStats}
          accentCorrect="border-indigo-400/55 bg-indigo-500/12 text-indigo-100"
          accentWrong="border-red-400/50 bg-red-500/10 text-red-200"
        />

        {medBagIsAnswered && !showMedBagExpl && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <HapticButton onClick={() => setShowMedBagExpl(true)} hapticPattern={10} pressScale={0.96}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-400/15 border border-indigo-400/35 py-3.5 text-indigo-300 font-bold text-sm">
              <Brain size={14} />הצג הסבר
            </HapticButton>
          </motion.div>
        )}
      </div>
    );
  };

  // ── Block status helpers (for grid cards) ──
  const blockStatus = (id: BlockId): LoadStatus => {
    if (id === 'A') return clinicalStatus === 'idle' ? 'ready' : clinicalStatus;
    if (id === 'B') return medStatus;
    if (id === 'C') return improvStatus;
    if (id === 'D') return redStatus;
    if (id === 'E') return spotStatus;
    return medBagStatus;
  };

  const blockIsAnswered = (id: BlockId): boolean => {
    if (id === 'A') return clinicalIsAnswered;
    if (id === 'B') return medIsAnswered;
    if (id === 'C') return improvIsAnswered;
    if (id === 'D') return redIsAnswered;
    if (id === 'E') return spotIsAnswered;
    return medBagIsAnswered;
  };

  const blockIsCorrect = (id: BlockId): boolean => {
    if (id === 'A') return clinicalIsAnswered && clinicalAnsweredIdx === clinicalQuestion?.correct_index;
    if (id === 'B') return medIsAnswered && medAnsweredIdx === medData?.correct_index;
    if (id === 'C') return improvIsAnswered && improvAnsweredIdx === improvQuestion?.correct_index;
    if (id === 'D') return redIsAnswered && redAnsweredIdx === redQuestion?.correct_index;
    if (id === 'E') return spotIsAnswered && spotAnsweredIdx === spotQuestion?.correct_index;
    return medBagIsAnswered && medBagAnsweredIdx === medBagQuestion?.correct_index;
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-emt-dark overflow-hidden" dir="rtl">

      {/* ── Header ── only when on grid overview */}
      {activeBlock === null && <div className="ios-safe-header shrink-0 border-b border-emt-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
              <Trophy size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-emt-light font-black text-lg leading-none">אתגר יומי</h2>
              <p className="text-emt-muted text-[11px] mt-0.5">
                {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-emt-gray border border-emt-border flex items-center justify-center active:scale-90 transition-transform text-emt-muted hover:text-emt-light"
              aria-label="סגור"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Podium leaderboard */}
        <div className="px-4 pb-2 pt-1 relative overflow-hidden">
          {/* Spotlight animation — only when there are real entries */}
          {leaderboard.length > 0 && (
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              {/* Golden glow pulsing behind 1st place (center) */}
              <div className="absolute left-1/2 bottom-0 w-28 h-16 rounded-full"
                style={{
                  background: 'radial-gradient(ellipse, rgba(251,191,36,0.28) 0%, transparent 70%)',
                  animation: 'podium-glow-pulse 2.6s ease-in-out infinite',
                }}
              />
              {/* Sweeping light beam */}
              <div className="absolute inset-y-0 w-12"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                  animation: 'podium-beam 4.5s ease-in-out infinite',
                }}
              />
              {/* Subtle top sparkle on 1st place */}
              <div className="absolute left-1/2 top-0 w-16 h-6 rounded-full"
                style={{
                  background: 'radial-gradient(ellipse, rgba(251,191,36,0.18) 0%, transparent 80%)',
                  animation: 'podium-sparkle 3.2s ease-in-out infinite',
                }}
              />
            </div>
          )}
          {/* grid-cols-3 guarantees all three columns are exactly 1/3 width */}
          <div dir="ltr" className="grid grid-cols-3 gap-2 items-end w-full">

            {/* 2nd place — left column */}
            <div className="flex flex-col">
              <div className="flex flex-col items-center gap-0.5 justify-end min-h-[68px] pb-1">
                {leaderboard[1] ? (
                  <>
                    <span className="text-xl leading-none">🥈</span>
                    <span className="text-emt-light font-black text-[9px] text-center leading-tight w-full px-1 break-words whitespace-normal">{leaderboard[1].display_name}</span>
                    {leaderboard[1].city ? <span className="text-emt-muted text-[9px] leading-none break-words whitespace-normal w-full text-center">{leaderboard[1].city}</span> : <span className="h-3" />}
                    <span className="text-slate-300 text-[10px] font-bold leading-none">{leaderboard[1].correct_answers}/6</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl leading-none opacity-20">🥈</span>
                    <span className="text-emt-border/40 text-[10px]">—</span>
                  </>
                )}
              </div>
              <div className={`h-10 rounded-t-xl flex items-center justify-center ${leaderboard[1] ? 'bg-slate-500/25 border border-slate-400/30' : 'bg-white/3 border border-white/8'}`}>
                <span className={`text-base font-black ${leaderboard[1] ? 'text-slate-300' : 'text-white/15'}`}>2</span>
              </div>
            </div>

            {/* 1st place — center column, tallest bar */}
            <div className="flex flex-col">
              <div className="flex flex-col items-center gap-0.5 justify-end min-h-[68px] pb-1">
                {leaderboard[0] ? (
                  <>
                    <span className="text-2xl leading-none">🥇</span>
                    <span className="text-emt-light font-black text-[10px] text-center leading-tight w-full px-1 break-words whitespace-normal">{leaderboard[0].display_name}</span>
                    {leaderboard[0].city ? <span className="text-emt-muted text-[9px] leading-none break-words whitespace-normal w-full text-center">{leaderboard[0].city}</span> : <span className="h-3" />}
                    <span className="text-amber-400 text-[11px] font-black leading-none">{leaderboard[0].correct_answers}/6</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl leading-none opacity-20">🥇</span>
                    <span className="text-emt-border/40 text-[10px]">—</span>
                  </>
                )}
              </div>
              <div className={`h-16 rounded-t-xl flex items-center justify-center ${leaderboard[0] ? 'bg-amber-400/18 border border-amber-400/35 shadow-[0_0_18px_rgba(251,191,36,0.14)]' : 'bg-white/3 border border-white/8'}`}>
                <span className={`text-2xl font-black ${leaderboard[0] ? 'text-amber-400' : 'text-white/15'}`}>1</span>
              </div>
            </div>

            {/* 3rd place — right column */}
            <div className="flex flex-col">
              <div className="flex flex-col items-center gap-0.5 justify-end min-h-[68px] pb-1">
                {leaderboard[2] ? (
                  <>
                    <span className="text-lg leading-none">🥉</span>
                    <span className="text-emt-light font-bold text-[9px] text-center leading-tight w-full px-1 break-words whitespace-normal">{leaderboard[2].display_name}</span>
                    {leaderboard[2].city ? <span className="text-emt-muted text-[9px] leading-none break-words whitespace-normal w-full text-center">{leaderboard[2].city}</span> : <span className="h-3" />}
                    <span className="text-orange-300 text-[10px] font-bold leading-none">{leaderboard[2].correct_answers}/6</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg leading-none opacity-20">🥉</span>
                    <span className="text-emt-border/40 text-[10px]">—</span>
                  </>
                )}
              </div>
              <div className={`h-10 rounded-t-xl flex items-center justify-center ${leaderboard[2] ? 'bg-orange-400/15 border border-orange-400/25' : 'bg-white/3 border border-white/8'}`}>
                <span className={`text-base font-black ${leaderboard[2] ? 'text-orange-400' : 'text-white/15'}`}>3</span>
              </div>
            </div>

          </div>

          {/* Edit profile link */}
          <div className="flex justify-center mt-1">
            {competitionProfile ? (
              <button
                onClick={openEditProfile}
                className="flex items-center gap-1.5 text-emt-muted/70 text-xs font-semibold hover:text-emt-light transition-colors py-1.5 px-3 rounded-xl hover:bg-white/6 active:scale-95"
              >
                <span>✏️</span>
                <span>משתתף: {competitionProfile.name}{competitionProfile.city ? ` · ${competitionProfile.city}` : ''}</span>
              </button>
            ) : !isCompetitionOptedOut() ? (
              <button
                onClick={() => setShowCompetitionJoin(true)}
                className="flex items-center gap-1.5 text-amber-400/60 text-xs font-semibold hover:text-amber-400/90 transition-colors py-1.5 px-3 rounded-xl hover:bg-amber-400/8 active:scale-95"
              >
                <Trophy size={11} />
                <span>הצטרף לתחרות</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Streak strip — 7 day dots */}
        {(() => {
          const dayLabels = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
          const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return { date, label: dayLabels[d.getDay()], isToday: i === 6 };
          });
          const currentStreak = allAnswered ? streak : streak;
          return (
            <div className="px-4 pb-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5" style={{ direction: 'ltr' }}>
                {days.map(({ date, label, isToday }) => {
                  const done = completedDates.includes(date) || (isToday && anyAnswered);
                  return (
                    <div key={date} className="flex flex-col items-center gap-0.5">
                      <motion.div
                        animate={done ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ duration: 0.3 }}
                        className={[
                          'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors duration-300',
                          done
                            ? 'bg-orange-500 text-white'
                            : isToday
                            ? 'border border-orange-400/50 bg-orange-400/10 text-orange-400/60'
                            : 'bg-white/6 text-transparent',
                        ].join(' ')}
                      >
                        {done ? '✓' : isToday ? '◦' : ''}
                      </motion.div>
                      <span className={`text-[8px] font-semibold leading-none ${isToday ? 'text-orange-300/80' : done ? 'text-orange-400/50' : 'text-emt-border'}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Flame size={13} className={currentStreak > 0 ? 'text-orange-400' : 'text-emt-border'} />
                <span className={`font-black text-xs ${currentStreak > 0 ? 'text-orange-300' : 'text-emt-border'}`}>
                  {currentStreak} ימים ברצף
                </span>
              </div>
            </div>
          );
        })()}

      </div>}

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {activeBlock === null ? (
            /* ═══ GRID VIEW ═══ */
            <motion.div
              key="grid"
              variants={gridVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="absolute inset-0 p-4"
            >
              <div className="grid grid-cols-2 grid-rows-3 gap-3 h-full">
                {(['A', 'B', 'C', 'D', 'E', 'F'] as BlockId[]).map((id) => (
                  <GridCard
                    key={id}
                    config={BLOCK_CONFIGS[id]}
                    status={blockStatus(id)}
                    isAnswered={blockIsAnswered(id)}
                    isCorrect={blockIsCorrect(id)}
                    participantCount={blockParticipants[id]}
                    onClick={() => setActiveBlock(id)}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            /* ═══ EXPANDED BLOCK VIEW ═══ */
            <motion.div
              key={activeBlock}
              variants={expandedVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="absolute inset-0 flex flex-col"
            >
              {renderExpandedHeader(activeBlock)}
              <div className="flex-1 overflow-y-auto">
                <div className="p-5 pb-12">
                  {activeBlock === 'A' && renderBlockA()}
                  {activeBlock === 'B' && renderBlockB()}
                  {activeBlock === 'C' && renderBlockC()}
                  {activeBlock === 'D' && renderBlockD()}
                  {activeBlock === 'E' && renderBlockE()}
                  {activeBlock === 'F' && renderBlockF()}
                </div>
              </div>

              {/* Back to grid — shown after answering */}
              {blockIsAnswered(activeBlock) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="shrink-0 px-4 pb-6 pt-2 border-t border-emt-border"
                >
                  <HapticButton
                    onClick={() => setActiveBlock(null)}
                    hapticPattern={10}
                    pressScale={0.97}
                    className="w-full py-3 rounded-2xl bg-white/6 border border-white/12 text-emt-muted font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    חזרה לרשימת האתגרים
                  </HapticButton>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showClinicalExpl && clinicalQuestion && clinicalCategory && clinicalAnsweredIdx !== null && (
          <ExplanationModal
            explanation={clinicalQuestion.clinical_explanation}
            category={clinicalCategory}
            isCorrect={clinicalAnsweredIdx === clinicalQuestion.correct_index}
            onClose={() => setShowClinicalExpl(false)}
          />
        )}
        {showMedExpl && medData && medAnsweredIdx !== null && (
          <SimpleExplanationModal
            explanation={`${medData.clinical_pearl} ${medData.emergency_note}`}
            isCorrect={medAnsweredIdx === medData.correct_index}
            accentColor="green"
            onClose={() => setShowMedExpl(false)}
          />
        )}
        {showImprovExpl && improvQuestion && improvAnsweredIdx !== null && (
          <SimpleExplanationModal
            explanation={improvQuestion.explanation}
            isCorrect={improvAnsweredIdx === improvQuestion.correct_index}
            accentColor="green"
            onClose={() => setShowImprovExpl(false)}
          />
        )}
        {showRedExpl && redQuestion && redAnsweredIdx !== null && (
          <SimpleExplanationModal
            explanation={redQuestion.explanation}
            isCorrect={redAnsweredIdx === redQuestion.correct_index}
            accentColor="orange"
            onClose={() => setShowRedExpl(false)}
          />
        )}
        {showSpotExpl && spotQuestion && spotAnsweredIdx !== null && (
          <SimpleExplanationModal
            explanation={spotQuestion.explanation}
            isCorrect={spotAnsweredIdx === spotQuestion.correct_index}
            accentColor="purple"
            onClose={() => setShowSpotExpl(false)}
          />
        )}
        {showMedBagExpl && medBagQuestion && medBagAnsweredIdx !== null && (
          <SimpleExplanationModal
            explanation={medBagQuestion.explanation}
            isCorrect={medBagAnsweredIdx === medBagQuestion.correct_index}
            accentColor="purple"
            onClose={() => setShowMedBagExpl(false)}
          />
        )}
        {showSuccess && (
          <SuccessScreen
            score={score}
            streak={streak}
            onClose={() => setShowSuccess(false)}
          />
        )}
        {showCompetitionJoin && (
          <motion.div
            key="competition-join"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-center justify-center p-6"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="bg-emt-dark border border-amber-400/25 rounded-3xl p-6 w-full max-w-sm shadow-[0_0_60px_rgba(251,191,36,0.12)]"
            >
              <div className="flex flex-col items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shadow-[0_0_24px_rgba(251,191,36,0.2)]">
                  <Trophy size={30} className="text-amber-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-emt-light font-black text-xl leading-tight">
                    {competitionProfile ? 'עריכת פרטים' : 'תחרות היומית'}
                  </h3>
                  {!competitionProfile && (
                    <>
                      <p className="text-emt-light/80 text-base font-semibold mt-2 leading-snug">
                        התמודד מול שאר המשיבים
                      </p>
                      <p className="text-emt-muted text-sm mt-1 leading-relaxed">
                        מי ענה הכי הרבה תשובות נכונות והכי מהר?
                      </p>
                    </>
                  )}
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <input
                    type="text"
                    placeholder="שם *"
                    value={competitionJoinName}
                    onChange={e => setCompetitionJoinName(e.target.value)}
                    className="w-full border border-white/12 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-amber-400/50 transition-colors"
                    style={{ colorScheme: 'dark', backgroundColor: 'rgba(255,255,255,0.08)', color: 'white' }}
                    dir="rtl"
                    autoComplete="off"
                  />
                  <input
                    type="text"
                    placeholder="עיר (אופציונלי)"
                    value={competitionJoinCity}
                    onChange={e => setCompetitionJoinCity(e.target.value)}
                    className="w-full border border-white/12 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-amber-400/50 transition-colors"
                    style={{ colorScheme: 'dark', backgroundColor: 'rgba(255,255,255,0.08)', color: 'white' }}
                    dir="rtl"
                    autoComplete="off"
                    onKeyDown={e => e.key === 'Enter' && handleJoinCompetition()}
                  />

                  {/* Remember me checkbox */}
                  <button
                    onClick={() => setRememberProfile(p => !p)}
                    className="flex items-center gap-3 w-full py-2 text-right"
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${rememberProfile ? 'bg-amber-400 border-amber-400' : 'bg-transparent border-white/30'}`}>
                      {rememberProfile && <span className="text-black text-xs font-black leading-none">✓</span>}
                    </div>
                    <div className="text-right flex-1">
                      <p className="text-emt-light text-sm font-semibold leading-tight">זכור אותי</p>
                      <p className="text-emt-muted text-xs mt-0.5">השם ייטען אוטומטית בכל יום</p>
                    </div>
                  </button>
                </div>
                <HapticButton
                  onClick={handleJoinCompetition}
                  hapticPattern={15}
                  pressScale={0.96}
                  disabled={!competitionJoinName.trim()}
                  className="w-full py-4 rounded-2xl bg-amber-400 text-black font-black text-base transition-opacity disabled:opacity-35"
                >
                  {competitionProfile ? 'שמור שינויים' : 'השתתף בתחרות! 🏆'}
                </HapticButton>
                <div className="flex items-center gap-4 -mt-1">
                  <button
                    onClick={() => setShowCompetitionJoin(false)}
                    className="text-emt-muted text-sm font-semibold hover:text-emt-light transition-colors py-1"
                  >
                    ביטול
                  </button>
                  {!competitionProfile && (
                    <>
                      <span className="text-emt-border text-xs">|</span>
                      <button
                        onClick={() => {
                          localStorage.setItem(COMPETITION_OPT_OUT_KEY, 'true');
                          setShowCompetitionJoin(false);
                        }}
                        className="text-emt-muted/60 text-sm font-semibold hover:text-emt-muted transition-colors py-1"
                      >
                        אל תציג שוב
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
