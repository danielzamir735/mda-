import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Trophy, Brain, CheckCircle, XCircle, RefreshCw, Users, Clock,
  Share2, Pill, BookOpen, AlertTriangle, OctagonAlert, Zap, Flame, Star, ChevronLeft, Volume2,
  Search, Mic,
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackEvent } from '../../../utils/analytics';
import HapticButton from '../../../components/HapticButton';
import { supabase } from '../../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type ClinicalCategory = 'bls' | 'als';
type QuizCategory = ClinicalCategory | 'med_v3' | 'abbr' | 'red_flag' | 'spot_error' | 'radio_challenge';
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

interface AbbreviationQ {
  abbreviation: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface RedFlagQ {
  scenario: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
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

interface RadioChallengeQ {
  dispatch_opener: string;
  scenario: string;
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

interface StreakData {
  lastCompletedDate: string;
  streak: number;
  bestStreak: number;
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
  bls: 'daily_challenge_bls_v7',
  als: 'daily_challenge_als_v7',
  med: 'daily_challenge_med_v4',
  abbr: 'daily_challenge_abbr_v2',
  red_flag: 'daily_challenge_redflag_v2',
  spot_error: 'daily_challenge_spoterror_v1',
  radio: 'daily_challenge_radio_v1',
} as const;

const STATS_CACHE_KEY: Record<QuizCategory, string> = {
  bls: 'daily_stats_bls_v1',
  als: 'daily_stats_als_v1',
  med_v3: 'daily_stats_med_v1',
  abbr: 'daily_stats_abbr_v1',
  red_flag: 'daily_stats_redflag_v1',
  spot_error: 'daily_stats_spoterror_v1',
  radio_challenge: 'daily_stats_radio_v1',
};

const PARTICIPANT_BASE = 430;

const CATEGORY_LABELS: Record<ClinicalCategory, string> = { bls: 'BLS', als: 'ALS' };
const CATEGORY_FULL: Record<ClinicalCategory, string> = { bls: 'החייאה בסיסית', als: 'החייאה מתקדמת' };

// ─── Prompts ──────────────────────────────────────────────────────────────────

function buildClinicalPrompt(type: 'BLS' | 'ALS'): string {
  const focus = type === 'BLS'
    ? 'תחום: BLS בלבד — סבב בין כל התחומים הבאים. כלל גיוון קפדני: לא יותר מ-20% מהשאלות יהיו CPR/דום לב טהור; חובה לסבב בין: (1) טראומה — עצירת דימום (טורניקט, חבישת פצע, דימום צמתים), קיבוע שברים, קבלת החלטות בהגבלת תנועת עמוד שדרה, פגיעת פיצוץ/מחיצה; (2) מצוקה נשימתית — אסתמה/ברונכוספאזם, אנפילקסיס (עיתוי מתן אפינפרין, תנוחת מטופל, מנה חוזרת), חסימת נתיב אוויר בגוף זר, זיהוי קרופ לעומת אפיגלוטיטיס בילדים; (3) חירום סביבתי — מכת חום לעומת התשת חום, ניהול היפותרמיה, טביעה/שקיעה, פגיעת ברק; (4) קורס רפואי — חירומי סוכרת (הבחנה היפוגליקמיה/היפרגליקמיה), ניהול פרכוסים, זיהוי שבץ מוחי (FAST + פרוטוקול שדה), אבחנות מבדלות סינקופה; (5) CPR/AED — מיקום רפידות, עיתוי מעצור היפותרמי, סיכון שוק בחזה רטוב, עומק לחיצה תינוק לעומת ילד, זיהוי ROSC. ללא תרופות ALS, ללא נתיב אוויר מתקדם, ללא פרשנות 12 ערוצים.'
    : 'תחום: ALS בלבד — סבב בין כל התחומים הבאים. כלל גיוון קפדני: לא יותר מ-20% מהשאלות יהיו CPR/דום לב; חובה לסבב בין: (1) הפרעות קצב — טכי-אריתמיות (SVT, Afib RVR, VT עם דופק, AF עם מוליכות עוקפת), ברדי-אריתמיות (חסם AV מלא, תסמונת סינוס חולה, חסם AV דרגה גבוהה, קיצוב טרנסעורי ואימות לכידה), הבחנה יציב לעומת לא יציב; (2) לב מעבר לדום — תסמונת כלילית חריפה (מחקות STEMI, MI אחורי, התוויות נגד ב-RV infarct), אי ספיקת לב חריפה (CPAP, עיתוי חנקנים, הימנעות מאינטובציה), חירום יתר לחץ דם עם פגיעת מטרה; (3) מלכודות פרמקולוגיות — אדנוזין ב-AF מוליך עוקף, בחירת אמיודרון לעומת לידוקאין, סידן לעומת ביקרבונאט בהיפרקלמיה, ניטרוגליצרין ב-MI תחתון עם מעורבות RV, כישלון אטרופין; (4) ניהול פוסט-ROSC — בקרת טמפרטורה, יעדים המודינמיים, החלטות נתיב אוויר, גורמים הפיכים (H&Ts) גישה שיטתית; (5) פרמקולוגיה מורכבת — מינון, מסלול מתן, עיתוי, אינטראקציות, התוויות נגד בתנאי שדה.';

  return (
    `אתה מדריך פרמדיק בכיר של מד"א (מגן דוד אדום) ומשרד הבריאות הישראלי. תפקידך לאתגר פרמדיקים וחובשים ישראלים עם שאלות קליניות ברמה גבוהה, בעברית רפואית מקצועית.\n\n` +
    `חשוב ביותר: כל שאלה, תשובה והסבר חייבים להתבסס אך ורק על פרוטוקולי מד"א ומשרד הבריאות הישראלי. אין להתייחס לפרוטוקולי AHA, ERC, PHTLS או כל גוף בינלאומי אחר — במקרה של סתירה, ההנחיות הישראליות גוברות תמיד.\n\n` +
    `משימה: כתוב תרחיש קליני מאתגר עבור ${type} בעברית רפואית מקצועית גבוהה. התרחיש יכול להיות מקרה שגרתי עם סיבוך עדין, מקרה קצה, או מצב שבו ההחלטה הנכונה דורשת שיפוט שדה מנוסה.\n\n` +
    `כתיבת התרחיש — כללים מחייבים: (1) שפה ניטרלית מקצועית בלבד — ללא קידומות שיגור, ללא מספרי קריאה, ללא "קריאה דחופה", ללא "דיווח מקבלה", ללא כל סגנון רדיו/משגר. (2) התחל ישירות בהערכת המטופל: "בהגיעך למקום מצאת..." / "מטופל בן X שנים..." / "אישה כבת X מציגה עם..." — ישירות לעובדות הקליניות. (3) כלול: גיל/מין, תלונה עיקרית, סימנים חיוניים רלוונטיים, ממצאים פיזיקליים. 2-4 משפטים ספציפיים, קליניים.\n\n` +
    `${focus}\n\n` +
    'תשובות: בדיוק 4 אפשרויות בעברית רפואית מקצועית. כל אפשרות: משפט פעולה קליני אחד, שלם ומוחלט, 15-25 מילים. פורמט: "[פועל] [פעולה ספציפית / תרופה-מינון-מסלול / הגדרת אנרגיה או מכשיר] [הקשר קליני]". אין אפשרות עמומה או מהססת.\n' +
    'כלל הסחות הדעת: לפחות שתי תשובות שגויות חייבות להיות טעויות שכיחות בשדה או פרוטוקולים מיושנים. תשובה שגויה אחת תישמע כמו תשובת ספר לימוד שמתעלמת מהפרט הקליני העדין בתרחיש. בדיוק תשובה אחת עוקבת אחר פרוטוקולי מד"א ומשרד הבריאות העדכניים. כל הסחות הדעת סבירות לחובש מתחיל.\n\n' +
    'הסבר קליני: בדיוק 3-4 משפטים תמציתיים בעברית, סה"כ פחות מ-60 מילים. חייב להתחיל במשפט: "על פי הפרוטוקולים בישראל...". לאחר מכן: (1) הסבר המנגנון הפיזיולוגי שהופך את הפעולה הנכונה לעדיפה. (2) נתח את הסחת הדעת המפתה ביותר והנזק הספציפי שהיא גורמת. (3) סיים עם פנינת ידע קלינית אחת שמפרידה בין אנשי שדה מצטיינים לממוצעים.\n\n' +
    'דיוק: כל מינון תרופה, הגדרת ג\'ול, סף קצב ומסגרת זמן חייבים להתאים בדיוק לפרוטוקולי מד"א ומשרד הבריאות הישראלי העדכניים. אין קירובים. שפה: עברית רפואית מקצועית גבוהה — ללא תרגום מילולי מאנגלית. מינוח נכון: "נתיב אוויר", "קיבוע", "סביבת עבודה", "ניטור", "הנשמה", "פינוי", "הכרה", "דופק", "לחץ דם", "נשימה" וכדומה.\n\n' +
    'פלט JSON תקני בלבד, ללא פרוזה, ללא markdown: { "question": string, "options": string[], "correct_index": number, "clinical_explanation": string }'
  );
}

const CLINICAL_PROMPTS: Record<ClinicalCategory, string> = {
  bls: buildClinicalPrompt('BLS'),
  als: buildClinicalPrompt('ALS'),
};

function buildMedPrompt(): string {
  const today = getToday();
  // Deterministic seed from date so Gemini varies by day
  let hash = 0;
  for (let i = 0; i < today.length; i++) hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
  const drugPool = [
    'Eliquis (Apixaban)', 'Xarelto (Rivaroxaban)', 'Aspirin', 'Clopidogrel (Plavix)',
    'Warfarin (Coumadin)', 'Bisoprolol', 'Metoprolol', 'Amlodipine', 'Furosemide',
    'Metformin', 'Empagliflozin (Jardiance)', 'Levothyroxine', 'Omeprazole',
    'Atorvastatin', 'Losartan', 'Ramipril', 'Digoxin', 'Amiodarone', 'Prednisolone',
    'Nitroglycerin', 'Adenosine', 'Atropine', 'Epinephrine', 'Morphine', 'Midazolam',
  ];
  const todayDrug = drugPool[hash % drugPool.length];

  return `אתה מדריך פרמדיק בכיר ישראלי. משימתך: צור שאלת MCQ אינטראקטיבית על "תרופת היום" לחובשים ולפרמדיקים ישראלים.
תאריך היום: ${today}. תרופת היום המוקצית: ${todayDrug}.
חובה להשתמש בתרופה ${todayDrug} כנושא השאלה. ערבב את מיקום התשובה הנכונה — correct_index לא תמיד 0.
השאלה חייבת להיות מעשית — על סכנה קלינית, אינדיקציה, או זהירות בשטח — לא שאלת טריוויה.
שפה: עברית רפואית מקצועית.
פלט JSON בלבד, ללא markdown:
{
  "name": "שם מסחרי ישראלי + גנרי — לדוגמה: אליקוויס (Apixaban)",
  "name_he": "שם מסחרי בעברית בלבד — לדוגמה: אליקוויס",
  "name_en": "שם גנרי באנגלית בלבד — לדוגמה: Apixaban",
  "drug_class": "קבוצה ומנגנון קצר — לדוגמה: NOAC — מעכב פקטור Xa",
  "description": "הסבר בשורה-שורה וחצי: מה התרופה הזאת עושה בגוף ולמה רושמים אותה — בשפה ברורה שכל חובש יבין. לדוגמה: תרופה מדללת דם — מונעת קרישי דם בחולים עם פרפור פרוזדורים, לאחר ניתוח אורתופדי, או לטיפול בתסחיף ריאתי.",
  "question": "שאלת MCQ על הסכנה/אינדיקציה/זהירות — לדוגמה: מטופל על אליקוויס חווה טראומה בטנית. מה החשש הקריטי ביותר?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "clinical_pearl": "דגש קליני חשוב למדיק (1-2 משפטים)",
  "emergency_note": "אזהרת חירום ספציפית (1-2 משפטים)"
}`;
}

const ABBR_PROMPT = `אתה מדריך פרמדיק בכיר ישראלי. צור שאלת MCQ על קיצור רפואי חשוב בעולם ההצלה הישראלי.
בחר קיצור מהרשימה: GCS, AVPU, FAST, OPQRST, SAMPLE, MIST, AED, BVM, CPAP, PEEP, MAP, SpO2, EtCO2, IM, IV, IO, ROSC, PEA, VF, VT, SVT, CVA, MI, AMI, STEMI, NSTEMI, CHF, COPD, DKA, MCI, JVD, EMT, MICU, HR, BP, RR, LOC.
ערבב את מיקום התשובה הנכונה — correct_index לא תמיד 0.
פלט JSON בלבד, ללא markdown:
{
  "abbreviation": "הקיצור",
  "question": "מה המשמעות של [קיצור]?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "explanation": "הסבר קצר (1-2 משפטים) — משמעות הקיצור ושימושו הקליני"
}`;

const RED_FLAG_PROMPT = `אתה מדריך פרמדיק בכיר ישראלי. צור מקרה חירום קצר שבו יש לזהות סימן אדום קריטי מסכן חיים.
המקרה: תיאור ספציפי — גיל, מנגנון/תלונה, סימנים חיוניים, תסמינים. 2-3 משפטים.
ערבב את מיקום התשובה הנכונה — correct_index לא תמיד 0.
פלט JSON בלבד, ללא markdown:
{
  "scenario": "תיאור המקרה (2-3 משפטים בעברית מקצועית, עם גיל, מנגנון/תלונה, סימנים חיוניים רלוונטיים)",
  "question": "מה הסימן האדום הקריטי המצריך התערבות מיידית?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "explanation": "הסבר קליני (2-3 משפטים) — מדוע זהו הסימן הקריטי ומה ההשלכות הפיזיולוגיות"
}`;

function buildSpotErrorPrompt(recentTopics: string[]): string {
  const avoidSection = recentTopics.length > 0
    ? `\nנושאים שנשאלו לאחרונה — חובה לבחור נושא שונה לחלוטין: ${recentTopics.join(', ')}.\n`
    : '';
  return `אתה מדריך פרמדיק בכיר של מד"א (מגן דוד אדום). משימתך: כתוב תרחיש BLS קצר המכיל טעות מקצועית אחת ברורה, מוטמעת בתוך הנרטיב.

תחום: BLS בלבד — טראומה, נשימה, CPR בסיסי, אנפילקסיס, שבץ, סוכר. ללא תרופות ALS, ללא קצבים, ללא נתיב אוויר מתקדם.

כללים מחייבים:
1. פתח ישירות בתרחיש: "[גבר/אישה] בן/בת [גיל], [תלונה/מנגנון]" — ללא ניסוח שיגור.
2. תאר את ההתערבות בעברית רפואית (2 משפטים בלבד) — כולל פעולה אחת שגויה לפי פרוטוקולי מד"א. דוגמאות: ממצא שהוחמץ, סדר עדיפויות שגוי, פרוטוקול מיושן, התוויית נגד שנעלמה.
3. השאלה: "מה הטעות המקצועית שזוהתה בטיפול?"
4. 4 תשובות קצרות: אחת היא הטעות האמיתית, השאר — פעולות שלא קרו או נראות חשודות אך נכונות.
5. הסבר (2 משפטים): הטעות, הנזק הפוטנציאלי, והנכון לפי פרוטוקולי מד"א.
${avoidSection}
פלט JSON תקני בלבד, ללא markdown:
{
  "dispatch_opener": "",
  "scenario": "תיאור קצר עם הטעות המוטמעת (2 משפטים בלבד)",
  "question": "מה הטעות המקצועית שזוהתה בטיפול?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "explanation": "הסבר קצר (2 משפטים): הטעות, הנזק הפוטנציאלי, והנכון לפי פרוטוקולי מד\\"א",
  "topic_tag": "נושא קצר בעברית (1-3 מילים)"
}`;
}

function buildRadioChallengePrompt(recentTopics: string[]): string {
  const avoidSection = recentTopics.length > 0
    ? `\nנושאים שנשאלו לאחרונה — חובה לבחור נושא שונה לחלוטין: ${recentTopics.join(', ')}.\n`
    : '';
  return `אתה מדריך פרמדיק בכיר של מד"א. משימתך: כתוב תרחיש BLS קצר ו-4 סיכומי SBAR לדיווח לרופא המאשר.

תחום: BLS בלבד — טראומה, נשימה, CPR בסיסי, אנפילקסיס, שבץ, סוכר. ללא תרופות ALS, ללא קצבים, ללא נתיב אוויר מתקדם.

כללים מחייבים:
1. פתח ישירות בתרחיש: "[גבר/אישה] בן/בת [גיל], [תלונה]" — ללא ניסוח שיגור.
2. תאר תרחיש עם הממצאים הרלוונטיים (2-3 משפטים בלבד): סימנים חיוניים, ממצאים, פעולות שבוצעו.
3. השאלה: "מה הסיכום הטוב ביותר בפורמט SBAR לדיווח לרופא המאשר?"
4. 4 אפשרויות SBAR קצרות (לא יותר מ-2 משפטים כל אחת):
   - אחת אידיאלית: מדויקת, תמציתית, סדורה (Situation → Background → Assessment → Recommendation).
   - שלוש עם פגם אחד: מידע קריטי חסר, הערכה שגויה, או המלצה לא מתאימה.
5. הסבר (2 משפטים): מה מייחד את הסיכום הנכון ומה הבעיה בשאר.
${avoidSection}
פלט JSON תקני בלבד, ללא markdown:
{
  "dispatch_opener": "",
  "scenario": "תיאור קצר (2-3 משפטים בלבד) עם ממצאים רלוונטיים",
  "question": "מה הסיכום הטוב ביותר בפורמט SBAR לדיווח לרופא המאשר?",
  "options": ["SBAR א — ...", "SBAR ב — ...", "SBAR ג — ...", "SBAR ד — ..."],
  "correct_index": X,
  "explanation": "הסבר (2 משפטים): מה מייחד את הסיכום הנכון ומה חסר/שגוי בשאר",
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
  const updated: StreakData = {
    lastCompletedDate: today,
    streak: newStreak,
    bestStreak: Math.max(newStreak, data.bestStreak),
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

// ─── Gemini ───────────────────────────────────────────────────────────────────

function getGeminiModel() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY missing');
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-2.5-flash' });
}

async function parseGeminiJSON<T>(prompt: string): Promise<T> {
  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();
  const clean = raw.replace(/^```(?:json)?/m, '').replace(/```$/m, '').trim();
  return JSON.parse(clean) as T;
}

async function generateClinical(cat: ClinicalCategory): Promise<ClinicalQuestion> {
  const q = await withRetry(() => parseGeminiJSON<ClinicalQuestion>(CLINICAL_PROMPTS[cat]));
  if (
    typeof q.question !== 'string' || !Array.isArray(q.options) ||
    q.options.length !== 4 || typeof q.correct_index !== 'number' ||
    typeof q.clinical_explanation !== 'string'
  ) throw new Error('Invalid clinical question format');
  return q;
}

async function generateMed(): Promise<MedOfDay> {
  const m = await withRetry(() => parseGeminiJSON<MedOfDay>(buildMedPrompt()));
  if (!m.name || !m.drug_class || !m.question || !Array.isArray(m.options) || m.options.length !== 4 || typeof m.correct_index !== 'number') {
    throw new Error('Invalid med format');
  }
  return m;
}

async function generateAbbreviation(): Promise<AbbreviationQ> {
  const a = await withRetry(() => parseGeminiJSON<AbbreviationQ>(ABBR_PROMPT));
  if (!a.abbreviation || !a.question || !Array.isArray(a.options) || a.options.length !== 4) throw new Error('Invalid abbr format');
  return a;
}

async function generateRedFlag(): Promise<RedFlagQ> {
  const r = await withRetry(() => parseGeminiJSON<RedFlagQ>(RED_FLAG_PROMPT));
  if (!r.scenario || !r.question || !Array.isArray(r.options) || r.options.length !== 4) throw new Error('Invalid red flag format');
  return r;
}

async function getRecentTopicsForDiversity(): Promise<string[]> {
  const { data } = await supabase
    .from('daily_questions')
    .select('content')
    .in('question_type', ['bls', 'als', 'spot_error', 'radio_challenge'])
    .order('question_date', { ascending: false })
    .limit(60);
  if (!data) return [];
  return data
    .map((r: { content?: { topic_tag?: string } }) => r.content?.topic_tag as string)
    .filter(Boolean);
}

async function generateSpotError(): Promise<SpotErrorQ> {
  const recentTopics = await getRecentTopicsForDiversity().catch(() => [] as string[]);
  const q = await withRetry(() => parseGeminiJSON<SpotErrorQ>(buildSpotErrorPrompt(recentTopics)));
  if (!q.dispatch_opener || !q.scenario || !q.question || !Array.isArray(q.options) || q.options.length !== 4) {
    throw new Error('Invalid spot error format');
  }
  return q;
}

async function generateRadioChallenge(): Promise<RadioChallengeQ> {
  const recentTopics = await getRecentTopicsForDiversity().catch(() => [] as string[]);
  const q = await withRetry(() => parseGeminiJSON<RadioChallengeQ>(buildRadioChallengePrompt(recentTopics)));
  if (!q.dispatch_opener || !q.scenario || !q.question || !Array.isArray(q.options) || q.options.length !== 4) {
    throw new Error('Invalid radio challenge format');
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
  const existing = await withRetry(async () => {
    const { data, error } = await supabase.from('daily_questions').select('*')
      .eq('question_date', today).eq('question_type', cat).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });
  if (existing?.content) return parseClinicalContent(existing.content as ClinicalQuestion);

  const generated = await withRetry(() => generateClinical(cat));
  const { data: inserted, error: insertError } = await supabase.from('daily_questions')
    .insert({ question_date: today, question_type: cat, content: generated }).select().single();
  if (!insertError && inserted?.content) return parseClinicalContent(inserted.content as ClinicalQuestion);

  const { data: canonical } = await supabase.from('daily_questions').select('*')
    .eq('question_date', today).eq('question_type', cat).maybeSingle();
  if (canonical?.content) return parseClinicalContent(canonical.content as ClinicalQuestion);

  return generated;
}

async function fetchOrCreateBlock<T>(questionType: string, generate: () => Promise<T>): Promise<T> {
  const today = getToday();
  try {
    const { data, error } = await supabase.from('daily_questions').select('*')
      .eq('question_date', today).eq('question_type', questionType).maybeSingle();
    if (!error && data?.content) return data.content as T;

    const generated = await generate();
    const { data: inserted, error: insertError } = await supabase.from('daily_questions')
      .insert({ question_date: today, question_type: questionType, content: generated }).select().single();
    if (!insertError && inserted?.content) return inserted.content as T;

    const { data: canonical } = await supabase.from('daily_questions').select('*')
      .eq('question_date', today).eq('question_type', questionType).maybeSingle();
    if (canonical?.content) return canonical.content as T;

    return generated;
  } catch {
    return generate();
  }
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
          else cls = 'border-white/6 bg-white/3 text-emt-muted/60';
        }
        const fillColor = isCorrect ? 'bg-green-500/20' : isSelected ? 'bg-red-500/20' : 'bg-white/6';

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
                    className={`text-xs font-black tabular-nums ${isCorrect ? 'text-green-300' : isSelected ? 'text-red-300' : 'text-emt-muted/50'}`}
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

  // Block C — Abbreviation
  const [abbrStatus, setAbbrStatus] = useState<LoadStatus>('idle');
  const [abbrQuestion, setAbbrQuestion] = useState<AbbreviationQ | null>(null);
  const [abbrAnsweredIdx, setAbbrAnsweredIdx] = useState<number | null>(null);
  const [showAbbrExpl, setShowAbbrExpl] = useState(false);
  const [abbrStats, setAbbrStats] = useState<GlobalStats | null>(null);

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

  // Block F — Radio Challenge
  const [radioStatus, setRadioStatus] = useState<LoadStatus>('idle');
  const [radioQuestion, setRadioQuestion] = useState<RadioChallengeQ | null>(null);
  const [radioAnsweredIdx, setRadioAnsweredIdx] = useState<number | null>(null);
  const [showRadioExpl, setShowRadioExpl] = useState(false);
  const [radioStats, setRadioStats] = useState<GlobalStats | null>(null);

  // Overall
  const [streak, setStreak] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [blockParticipants, setBlockParticipants] = useState<Partial<Record<BlockId, number>>>({});

  const questionStartRef = useRef<number | null>(null);

  // ── Derived ──
  const clinicalIsAnswered = clinicalAnsweredIdx !== null;
  const medIsAnswered = medAnsweredIdx !== null;
  const abbrIsAnswered = abbrAnsweredIdx !== null;
  const redIsAnswered = redAnsweredIdx !== null;
  const spotIsAnswered = spotAnsweredIdx !== null;
  const radioIsAnswered = radioAnsweredIdx !== null;
  const allAnswered = clinicalIsAnswered && medIsAnswered && abbrIsAnswered && redIsAnswered && spotIsAnswered && radioIsAnswered;

  const score = [
    clinicalIsAnswered && clinicalAnsweredIdx === clinicalQuestion?.correct_index,
    medIsAnswered && medAnsweredIdx === medData?.correct_index,
    abbrIsAnswered && abbrAnsweredIdx === abbrQuestion?.correct_index,
    redIsAnswered && redAnsweredIdx === redQuestion?.correct_index,
    spotIsAnswered && spotAnsweredIdx === spotQuestion?.correct_index,
    radioIsAnswered && radioAnsweredIdx === radioQuestion?.correct_index,
  ].filter(Boolean).length;

  const blocksCompleted = [clinicalIsAnswered, medIsAnswered, abbrIsAnswered, redIsAnswered, spotIsAnswered, radioIsAnswered].filter(Boolean).length;

  const clinicalParticipantCount = (globalStats?.total ?? 0) + PARTICIPANT_BASE;

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
      neonBorder: 'border-violet-500/55',
      glowColor: '0 0 30px rgba(139,92,246,0.22)',
      cardBg: 'bg-gradient-to-b from-violet-950/50 to-slate-950',
      topGlow: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.7) 0%, transparent 70%)',
      iconGlow: '0 0 22px rgba(139,92,246,0.4)',
      labelColor: 'text-violet-400',
      icon: <BookOpen size={20} className="text-violet-400" />,
      iconBg: 'bg-violet-400/20',
      iconBorder: 'border-violet-400/35',
      blockTitle: 'קיצורים רפואיים',
      emoji: '📋',
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
      neonBorder: 'border-cyan-500/55',
      glowColor: '0 0 30px rgba(6,182,212,0.22)',
      cardBg: 'bg-gradient-to-b from-cyan-950/50 to-slate-950',
      topGlow: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.7) 0%, transparent 70%)',
      iconGlow: '0 0 22px rgba(6,182,212,0.4)',
      labelColor: 'text-cyan-400',
      icon: <Mic size={20} className="text-cyan-400" />,
      iconBg: 'bg-cyan-400/20',
      iconBorder: 'border-cyan-400/35',
      blockTitle: 'תיעוד ב-60 שניות',
      emoji: '🎙️',
    },
  };

  // ── Load B, C, D on open ──
  useEffect(() => {
    if (!isOpen) return;
    getSessionId();
    trackEvent('daily_challenge_modal_opened');
    setStreak(getStreak().streak);

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

    const cachedAbbr = loadCache<AbbreviationQ>(CACHE_KEYS.abbr);
    if (cachedAbbr) {
      setAbbrQuestion(cachedAbbr.data);
      setAbbrAnsweredIdx(cachedAbbr.answeredIdx ?? null);
      setAbbrStatus('ready');
      if (cachedAbbr.answeredIdx !== null && cachedAbbr.answeredIdx !== undefined) {
        const seeded = loadCachedStats('abbr');
        if (seeded) setAbbrStats(seeded);
        fetchGlobalStats('abbr', cachedAbbr.data.correct_index).then(({ stats }) => {
          setAbbrStats((prev) => (prev && stats.total < prev.total ? prev : stats));
        });
      }
    } else {
      setAbbrStatus('loading');
      fetchOrCreateBlock<AbbreviationQ>('abbr', generateAbbreviation).then((q) => {
        setAbbrQuestion(q);
        saveCache(CACHE_KEYS.abbr, q);
        setAbbrStatus('ready');
      }).catch(() => setAbbrStatus('error'));
    }

    const cachedRed = loadCache<RedFlagQ>(CACHE_KEYS.red_flag);
    if (cachedRed) {
      setRedQuestion(cachedRed.data);
      setRedAnsweredIdx(cachedRed.answeredIdx ?? null);
      setRedStatus('ready');
      if (cachedRed.answeredIdx !== null && cachedRed.answeredIdx !== undefined) {
        fetchGlobalStats('spot_error', null).then(() => {}); // warm connection
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

    const cachedRadio = loadCache<RadioChallengeQ>(CACHE_KEYS.radio);
    if (cachedRadio) {
      setRadioQuestion(cachedRadio.data);
      setRadioAnsweredIdx(cachedRadio.answeredIdx ?? null);
      setRadioStatus('ready');
      if (cachedRadio.answeredIdx !== null && cachedRadio.answeredIdx !== undefined) {
        const seeded = loadCachedStats('radio_challenge');
        if (seeded) setRadioStats(seeded);
        fetchGlobalStats('radio_challenge', cachedRadio.data.correct_index).then(({ stats }) => {
          setRadioStats((prev) => (prev && stats.total < prev.total ? prev : stats));
        });
      }
    } else {
      setRadioStatus('loading');
      fetchOrCreateBlock<RadioChallengeQ>('radio_challenge', generateRadioChallenge).then((q) => {
        setRadioQuestion(q);
        saveCache(CACHE_KEYS.radio, q);
        setRadioStatus('ready');
      }).catch(() => setRadioStatus('error'));
    }

    // Fetch all participant counts for grid tiles
    const fetchParticipants = async () => {
      const t = getToday();
      try {
        const { data } = await supabase
          .from('daily_responses')
          .select('question_type')
          .eq('question_date', t)
          .in('question_type', ['bls', 'als', 'med_v3', 'abbr', 'red_flag', 'spot_error', 'radio_challenge']);
        if (!data) return;
        const counts: Record<string, number> = {};
        data.forEach((r: { question_type: string }) => {
          counts[r.question_type] = (counts[r.question_type] ?? 0) + 1;
        });
        setBlockParticipants({
          A: ((counts['bls'] ?? 0) + (counts['als'] ?? 0)) + PARTICIPANT_BASE,
          B: (counts['med_v3'] ?? 0) + PARTICIPANT_BASE,
          C: (counts['abbr'] ?? 0) + PARTICIPANT_BASE,
          D: (counts['red_flag'] ?? 0) + PARTICIPANT_BASE,
          E: (counts['spot_error'] ?? 0) + PARTICIPANT_BASE,
          F: (counts['radio_challenge'] ?? 0) + PARTICIPANT_BASE,
        });
      } catch { /* noop */ }
    };
    fetchParticipants();
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
      setAbbrStatus('idle'); setAbbrQuestion(null); setAbbrAnsweredIdx(null); setShowAbbrExpl(false); setAbbrStats(null);
      setRedStatus('idle'); setRedQuestion(null); setRedAnsweredIdx(null); setShowRedExpl(false); setRedStats(null);
      setSpotStatus('idle'); setSpotQuestion(null); setSpotAnsweredIdx(null); setShowSpotExpl(false); setSpotStats(null);
      setRadioStatus('idle'); setRadioQuestion(null); setRadioAnsweredIdx(null); setShowRadioExpl(false); setRadioStats(null);
      setShowSuccess(false);
    }
  }, [isOpen]);

  // Trigger success screen — only once per day, never on re-open from cache
  useEffect(() => {
    if (allAnswered && !showSuccess && !hasSeenSuccessToday()) {
      const t = setTimeout(() => {
        setShowSuccess(true);
        markSuccessSeenToday();
        const s = markDayComplete();
        setStreak(s.streak);
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
    } else if (activeBlock === 'C' && abbrStatus !== 'loading') {
      if (!loadCache<AbbreviationQ>(CACHE_KEYS.abbr)) {
        setAbbrStatus('loading'); setAbbrQuestion(null); setAbbrAnsweredIdx(null);
        fetchOrCreateBlock<AbbreviationQ>('abbr', generateAbbreviation)
          .then(q => { setAbbrQuestion(q); saveCache(CACHE_KEYS.abbr, q); setAbbrStatus('ready'); })
          .catch(() => setAbbrStatus('error'));
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
    } else if (activeBlock === 'F' && radioStatus !== 'loading') {
      if (!loadCache<RadioChallengeQ>(CACHE_KEYS.radio)) {
        setRadioStatus('loading'); setRadioQuestion(null); setRadioAnsweredIdx(null);
        fetchOrCreateBlock<RadioChallengeQ>('radio_challenge', generateRadioChallenge)
          .then(q => { setRadioQuestion(q); saveCache(CACHE_KEYS.radio, q); setRadioStatus('ready'); })
          .catch(() => setRadioStatus('error'));
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
    await saveClinicalResponse(clinicalCategory, isCorrect, elapsed, idx);
    const { stats, offline } = await fetchGlobalStats(clinicalCategory, clinicalQuestion.correct_index);
    setGlobalStats((prev) => (prev && stats.total < prev.total ? prev : stats));
    setIsStatsOffline(offline);
  }, [clinicalQuestion, clinicalCategory, clinicalAnsweredIdx]);

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
    trackEvent('daily_challenge_med_answered', { correct: isCorrect });
    await saveClinicalResponse('med_v3', isCorrect, 0, idx);
    const { stats } = await fetchGlobalStats('med_v3', medData.correct_index);
    setMedStats((prev) => (prev && stats.total < prev.total ? prev : stats));
  }, [medData, medAnsweredIdx]);

  // ── Block C handler ──
  const handleAbbrAnswer = useCallback(async (idx: number) => {
    if (!abbrQuestion || abbrAnsweredIdx !== null) return;
    const isCorrect = idx === abbrQuestion.correct_index;
    setAbbrAnsweredIdx(idx);
    saveCache(CACHE_KEYS.abbr, abbrQuestion, idx);
    setAbbrStats((prev) => {
      const base = prev ?? { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] };
      const counts = [...base.answer_counts];
      counts[idx] = (counts[idx] ?? 0) + 1;
      return { total: base.total + 1, correct: base.correct + (isCorrect ? 1 : 0), answer_counts: counts };
    });
    trackEvent('daily_challenge_abbr_answered', { correct: isCorrect });
    await saveClinicalResponse('abbr', isCorrect, 0, idx);
    const { stats } = await fetchGlobalStats('abbr', abbrQuestion.correct_index);
    setAbbrStats((prev) => (prev && stats.total < prev.total ? prev : stats));
  }, [abbrQuestion, abbrAnsweredIdx]);

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
    trackEvent('daily_challenge_redflag_answered', { correct: isCorrect });
    await saveClinicalResponse('red_flag', isCorrect, 0, idx);
    const { stats } = await fetchGlobalStats('red_flag', redQuestion.correct_index);
    setRedStats((prev) => (prev && stats.total < prev.total ? prev : stats));
  }, [redQuestion, redAnsweredIdx]);

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
    await saveClinicalResponse('spot_error', isCorrect, 0, idx);
    const { stats } = await fetchGlobalStats('spot_error', spotQuestion.correct_index);
    setSpotStats((prev) => (prev && stats.total < prev.total ? prev : stats));
  }, [spotQuestion, spotAnsweredIdx]);

  // ── Block F handler ──
  const handleRadioAnswer = useCallback(async (idx: number) => {
    if (!radioQuestion || radioAnsweredIdx !== null) return;
    const isCorrect = idx === radioQuestion.correct_index;
    setRadioAnsweredIdx(idx);
    saveCache(CACHE_KEYS.radio, radioQuestion, idx);
    setRadioStats((prev) => {
      const base = prev ?? { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] };
      const counts = [...base.answer_counts];
      counts[idx] = (counts[idx] ?? 0) + 1;
      return { total: base.total + 1, correct: base.correct + (isCorrect ? 1 : 0), answer_counts: counts };
    });
    trackEvent('daily_challenge_radio_answered', { correct: isCorrect });
    await saveClinicalResponse('radio_challenge', isCorrect, 0, idx);
    const { stats } = await fetchGlobalStats('radio_challenge', radioQuestion.correct_index);
    setRadioStats((prev) => (prev && stats.total < prev.total ? prev : stats));
  }, [radioQuestion, radioAnsweredIdx]);

  if (!isOpen) return null;

  // ── Expanded block header ──
  const renderExpandedHeader = (blockId: BlockId) => {
    const cfg = BLOCK_CONFIGS[blockId];
    const isAnswered = blockIsAnswered(blockId);
    const isCorrect = blockIsCorrect(blockId);

    return (
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-emt-border">
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
                <p className="text-amber-200 text-xs font-black uppercase tracking-widest">אזהרת חירום</p>
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
    if (abbrStatus === 'loading') {
      return (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-purple-400/60 animate-spin" />
          <p className="text-emt-muted text-xs font-semibold">טוען קיצור...</p>
        </div>
      );
    }
    if (abbrStatus === 'error') {
      return (
        <div className="flex flex-col items-center gap-3 py-8">
          <XCircle size={28} className="text-red-400" />
          <p className="text-emt-muted text-xs text-center">שגיאה בטעינה</p>
        </div>
      );
    }
    if (!abbrQuestion) return null;

    return (
      <div className="flex flex-col gap-5">
        {/* Abbreviation hero badge */}
        <div className="rounded-3xl bg-gradient-to-b from-violet-950/55 to-slate-950 border border-violet-500/35 p-6 flex flex-col items-center gap-2"
          style={{ boxShadow: '0 0 28px rgba(139,92,246,0.14)' }}>
          <span className="text-violet-200 font-black text-5xl tracking-[0.2em] leading-none" dir="ltr">
            {abbrQuestion.abbreviation}
          </span>
          <p className="text-violet-400/60 text-xs font-semibold mt-1">{abbrQuestion.question}</p>
        </div>

        {/* Result banner */}
        {abbrIsAnswered && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 border ${abbrAnsweredIdx === abbrQuestion.correct_index ? 'bg-green-500/15 border-green-500/35' : 'bg-red-500/12 border-red-500/30'}`}>
            {abbrAnsweredIdx === abbrQuestion.correct_index ? <CheckCircle size={20} className="text-green-400 shrink-0" /> : <XCircle size={20} className="text-red-400 shrink-0" />}
            <span className={`font-black text-base ${abbrAnsweredIdx === abbrQuestion.correct_index ? 'text-green-300' : 'text-red-300'}`}>
              {abbrAnsweredIdx === abbrQuestion.correct_index ? 'נכון!' : 'שגוי'}
            </span>
          </motion.div>
        )}

        <p className="text-center text-white/25 text-[11px] font-semibold tracking-widest uppercase">— בחר תשובה —</p>

        <MCQOptions
          options={abbrQuestion.options}
          correctIndex={abbrQuestion.correct_index}
          answeredIdx={abbrAnsweredIdx}
          onAnswer={handleAbbrAnswer}
          stats={abbrStats}
          accentCorrect="border-violet-400/55 bg-violet-500/12 text-violet-100"
          accentWrong="border-red-400/50 bg-red-500/10 text-red-200"
        />

        {abbrIsAnswered && !showAbbrExpl && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <HapticButton onClick={() => setShowAbbrExpl(true)} hapticPattern={10} pressScale={0.96}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-violet-400/15 border border-violet-400/35 py-3.5 text-violet-300 font-bold text-sm">
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
        </div>
      );
    }
    if (!redQuestion) return null;

    return (
      <div className="flex flex-col gap-5">
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
    if (radioStatus === 'loading') {
      return (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-cyan-400/60 animate-spin" />
          <p className="text-emt-muted text-xs font-semibold">מייצר תרחיש...</p>
        </div>
      );
    }
    if (radioStatus === 'error') {
      return (
        <div className="flex flex-col items-center gap-3 py-8">
          <XCircle size={28} className="text-red-400" />
          <p className="text-emt-muted text-xs text-center">שגיאה בטעינה</p>
          <HapticButton onClick={() => { setRadioStatus('loading'); fetchOrCreateBlock<RadioChallengeQ>('radio_challenge', generateRadioChallenge).then(q => { setRadioQuestion(q); saveCache(CACHE_KEYS.radio, q); setRadioStatus('ready'); }).catch(() => setRadioStatus('error')); }} hapticPattern={10} pressScale={0.95} className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 font-bold text-xs">
            <RefreshCw size={13} />נסה שוב
          </HapticButton>
        </div>
      );
    }
    if (!radioQuestion) return null;

    const radioCorrect = radioAnsweredIdx === radioQuestion.correct_index;

    return (
      <div className="flex flex-col gap-5">
        {/* Game explanation */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-cyan-500/8 border border-cyan-400/20">
          <Mic size={14} className="text-cyan-400 shrink-0" />
          <p className="text-cyan-300/80 text-[13px] font-semibold leading-snug">קרא את הסיכום הקליני ובחר את דיווח ה-SBAR הנכון לרופא המאשר.</p>
        </div>

        {/* Participant count */}
        {blockParticipants['F'] !== undefined && blockParticipants['F'] > 0 && (
          <div className="self-center flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5">
            <Users size={11} className="text-emt-muted shrink-0" />
            <span className="text-[10px] text-emt-muted font-semibold">משתתפים:</span>
            <span className="text-[11px] font-black text-emt-light tabular-nums">{(blockParticipants['F'] ?? 0).toLocaleString('he-IL')}</span>
          </div>
        )}

        {/* Scenario card */}
        <div className="rounded-3xl bg-gradient-to-b from-cyan-950/50 to-slate-950 border border-cyan-500/30 p-5"
          style={{ boxShadow: '0 0 26px rgba(6,182,212,0.12)' }}>
          {radioQuestion.dispatch_opener ? (
            <>
              <p className="text-cyan-200/90 text-[14px] font-semibold leading-relaxed mb-3">{radioQuestion.dispatch_opener}</p>
              <div className="h-px bg-cyan-500/20 mb-3" />
            </>
          ) : null}
          <p className="text-white/90 text-[14px] leading-[1.65] font-medium">{radioQuestion.scenario}</p>
        </div>

        {/* Question */}
        <div className="rounded-3xl bg-gradient-to-b from-cyan-950/40 to-slate-950/60 border border-cyan-400/30 p-5">
          <p className="text-white font-black text-[17px] leading-[1.55] text-center">{radioQuestion.question}</p>
        </div>

        {/* Result banner */}
        {radioIsAnswered && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 border ${radioCorrect ? 'bg-green-500/15 border-green-500/35' : 'bg-red-500/12 border-red-500/30'}`}>
            {radioCorrect ? <CheckCircle size={20} className="text-green-400 shrink-0" /> : <XCircle size={20} className="text-red-400 shrink-0" />}
            <span className={`font-black text-base ${radioCorrect ? 'text-green-300' : 'text-red-300'}`}>
              {radioCorrect ? 'דיווח מושלם!' : 'ניתן לשיפור — ראה הסבר'}
            </span>
          </motion.div>
        )}

        <p className="text-center text-white/25 text-[11px] font-semibold tracking-widest uppercase">— בחר סיכום SBAR —</p>

        <MCQOptions
          options={radioQuestion.options}
          correctIndex={radioQuestion.correct_index}
          answeredIdx={radioAnsweredIdx}
          onAnswer={handleRadioAnswer}
          stats={radioStats}
          accentCorrect="border-cyan-400/55 bg-cyan-500/12 text-cyan-100"
          accentWrong="border-red-400/50 bg-red-500/10 text-red-200"
        />

        {radioIsAnswered && !showRadioExpl && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <HapticButton onClick={() => setShowRadioExpl(true)} hapticPattern={10} pressScale={0.96}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-cyan-400/15 border border-cyan-400/35 py-3.5 text-cyan-300 font-bold text-sm">
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
    if (id === 'C') return abbrStatus;
    if (id === 'D') return redStatus;
    if (id === 'E') return spotStatus;
    return radioStatus;
  };

  const blockIsAnswered = (id: BlockId): boolean => {
    if (id === 'A') return clinicalIsAnswered;
    if (id === 'B') return medIsAnswered;
    if (id === 'C') return abbrIsAnswered;
    if (id === 'D') return redIsAnswered;
    if (id === 'E') return spotIsAnswered;
    return radioIsAnswered;
  };

  const blockIsCorrect = (id: BlockId): boolean => {
    if (id === 'A') return clinicalIsAnswered && clinicalAnsweredIdx === clinicalQuestion?.correct_index;
    if (id === 'B') return medIsAnswered && medAnsweredIdx === medData?.correct_index;
    if (id === 'C') return abbrIsAnswered && abbrAnsweredIdx === abbrQuestion?.correct_index;
    if (id === 'D') return redIsAnswered && redAnsweredIdx === redQuestion?.correct_index;
    if (id === 'E') return spotIsAnswered && spotAnsweredIdx === spotQuestion?.correct_index;
    return radioIsAnswered && radioAnsweredIdx === radioQuestion?.correct_index;
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-emt-dark overflow-hidden" dir="rtl">

      {/* ── Header ── */}
      <div className="ios-safe-header shrink-0 border-b border-emt-border">
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
            {streak > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30"
              >
                <Flame size={13} className="text-orange-400" />
                <span className="text-orange-300 font-black text-sm">{streak}</span>
              </motion.div>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-emt-gray border border-emt-border flex items-center justify-center active:scale-90 transition-transform text-emt-muted hover:text-emt-light"
              aria-label="סגור"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-emt-muted text-[11px] font-semibold">{blocksCompleted}/6 הושלמו</span>
            <span className="text-amber-400/70 text-[11px] font-semibold">{score} נק׳</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300"
              initial={{ width: '0%' }}
              animate={{ width: `${(blocksCompleted / 6) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

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
        {showAbbrExpl && abbrQuestion && abbrAnsweredIdx !== null && (
          <SimpleExplanationModal
            explanation={abbrQuestion.explanation}
            isCorrect={abbrAnsweredIdx === abbrQuestion.correct_index}
            accentColor="purple"
            onClose={() => setShowAbbrExpl(false)}
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
        {showRadioExpl && radioQuestion && radioAnsweredIdx !== null && (
          <SimpleExplanationModal
            explanation={radioQuestion.explanation}
            isCorrect={radioAnsweredIdx === radioQuestion.correct_index}
            accentColor="green"
            onClose={() => setShowRadioExpl(false)}
          />
        )}
        {showSuccess && (
          <SuccessScreen
            score={score}
            streak={streak}
            onClose={() => setShowSuccess(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
