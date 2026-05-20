import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getIsraelDate(): string {
  // Uses IANA timezone — handles DST between UTC+2 (winter) and UTC+3 (summer)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

// ─── Gemini API ───────────────────────────────────────────────────────────────

async function callGemini(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })
  if (!res.ok) throw new Error(`Gemini error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return raw.replace(/^```(?:json)?/m, '').replace(/```$/m, '').trim()
}

async function parseGeminiJSON<T>(prompt: string): Promise<T> {
  const text = await callGemini(prompt)
  return JSON.parse(text) as T
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i <= retries; i++) {
    try { return await fn() }
    catch (e) {
      lastErr = e
      if (i < retries) await new Promise((r) => setTimeout(r, 2000 * (i + 1)))
    }
  }
  throw lastErr
}

// ─── Tracking helpers ─────────────────────────────────────────────────────────

type SupabaseClient = ReturnType<typeof createClient>

async function getRecentClinicalTopics(supabase: SupabaseClient, type: 'bls' | 'als', days: number): Promise<string[]> {
  const { data } = await supabase
    .from('daily_questions')
    .select('content')
    .eq('question_type', type)
    .order('question_date', { ascending: false })
    .limit(days)
  if (!data) return []
  return data
    // deno-lint-ignore no-explicit-any
    .map((r: any) => r.content?.topic_tag as string)
    .filter(Boolean)
}

async function getAllRecentTopics(supabase: SupabaseClient, days: number): Promise<string[]> {
  const { data } = await supabase
    .from('daily_questions')
    .select('content')
    .in('question_type', ['bls', 'als', 'spot_error', 'radio_challenge', 'red_flag'])
    .order('question_date', { ascending: false })
    .limit(days * 5)
  if (!data) return []
  return data
    // deno-lint-ignore no-explicit-any
    .map((r: any) => r.content?.topic_tag as string)
    .filter(Boolean)
}

async function getUsedAbbreviations(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase
    .from('daily_questions')
    .select('content')
    .eq('question_type', 'abbr')
    .order('question_date', { ascending: false })
    .limit(42) // slightly more than the 37-item list to ensure full cycle detection
  if (!data) return []
  return data
    // deno-lint-ignore no-explicit-any
    .map((r: any) => r.content?.abbreviation as string)
    .filter(Boolean)
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

function buildClinicalPrompt(type: 'BLS' | 'ALS', recentTopics: string[]): string {
  const focus = type === 'BLS'
    ? 'תחום: BLS בלבד — סבב בין כל התחומים הבאים. כלל גיוון קפדני: לא יותר מ-20% מהשאלות יהיו CPR/דום לב טהור; חובה לסבב בין: (1) טראומה — עצירת דימום (טורניקט, חבישת פצע, דימום צמתים), קיבוע שברים, קבלת החלטות בהגבלת תנועת עמוד שדרה, פגיעת פיצוץ/מחיצה; (2) מצוקה נשימתית — אסתמה/ברונכוספאזם, אנפילקסיס (עיתוי מתן אפינפרין, תנוחת מטופל, מנה חוזרת), חסימת נתיב אוויר בגוף זר, זיהוי קרופ לעומת אפיגלוטיטיס בילדים; (3) חירום סביבתי — מכת חום לעומת התשת חום, ניהול היפותרמיה, טביעה/שקיעה, פגיעת ברק; (4) קורס רפואי — חירומי סוכרת (הבחנה היפוגליקמיה/היפרגליקמיה), ניהול פרכוסים, זיהוי שבץ מוחי (FAST + פרוטוקול שדה), אבחנות מבדלות סינקופה; (5) CPR/AED — מיקום רפידות, עיתוי מעצור היפותרמי, סיכון שוק בחזה רטוב, עומק לחיצה תינוק לעומת ילד, זיהוי ROSC. ללא תרופות ALS, ללא נתיב אוויר מתקדם, ללא פרשנות 12 ערוצים.'
    : 'תחום: ALS בלבד — סבב בין כל התחומים הבאים. כלל גיוון קפדני: לא יותר מ-20% מהשאלות יהיו CPR/דום לב; חובה לסבב בין: (1) הפרעות קצב — טכי-אריתמיות (SVT, Afib RVR, VT עם דופק, AF עם מוליכות עוקפת), ברדי-אריתמיות (חסם AV מלא, תסמונת סינוס חולה, חסם AV דרגה גבוהה, קיצוב טרנסעורי ואימות לכידה), הבחנה יציב לעומת לא יציב; (2) לב מעבר לדום — תסמונת כלילית חריפה (מחקות STEMI, MI אחורי, התוויות נגד ב-RV infarct), אי ספיקת לב חריפה (CPAP, עיתוי חנקנים, הימנעות מאינטובציה), חירום יתר לחץ דם עם פגיעת מטרה; (3) מלכודות פרמקולוגיות — אדנוזין ב-AF מוליך עוקף, בחירת אמיודרון לעומת לידוקאין, סידן לעומת ביקרבונאט בהיפרקלמיה, ניטרוגליצרין ב-MI תחתון עם מעורבות RV, כישלון אטרופין; (4) ניהול פוסט-ROSC — בקרת טמפרטורה, יעדים המודינמיים, החלטות נתיב אוויר, גורמים הפיכים (H&Ts) גישה שיטתית; (5) פרמקולוגיה מורכבת — מינון, מסלול מתן, עיתוי, אינטראקציות, התוויות נגד בתנאי שדה.'

  const avoidSection = recentTopics.length > 0
    ? `\nנושאים שנשאלו לאחרונה — חובה לבחור נושא שונה לחלוטין: ${recentTopics.join(', ')}.\n`
    : ''

  return (
    `אתה מדריך פרמדיק בכיר ישראלי. תפקידך לאתגר פרמדיקים וחובשים ישראלים עם שאלות קליניות ברמה גבוהה, בעברית רפואית מקצועית.\n\n` +
    `חשוב ביותר: כל שאלה, תשובה והסבר חייבים להתבסס אך ורק על הפרוטוקולים הישראליים ומשרד הבריאות. אין להתייחס לפרוטוקולי AHA, ERC, PHTLS או כל גוף בינלאומי אחר — במקרה של סתירה, ההנחיות הישראליות גוברות תמיד.\n\n` +
    `משימה: כתוב תרחיש קליני מאתגר עבור ${type} בעברית רפואית מקצועית גבוהה. התרחיש יכול להיות מקרה שגרתי עם סיבוך עדין, מקרה קצה, או מצב שבו ההחלטה הנכונה דורשת שיפוט שדה מנוסה.\n\n` +
    `כתיבת התרחיש — כללים מחייבים: (1) שפה ניטרלית מקצועית בלבד. (2) פתח עם משפט הקשר שיגור אחד: "הוזנקת לקריאה על [גבר/אישה] כבן/כבת [גיל] ב[מקום/נסיבות קצרות]" — משפט אחד בלבד, ישיר ותמציתי. (3) המשך ישירות לממצאים הקליניים: "בהגיעך למקום מצאת..." / "המטופל/ת מציג/ה..." — 2-3 משפטים קליניים ספציפיים עם תלונה עיקרית, סימנים חיוניים רלוונטיים, ממצאים פיזיקליים. (4) שדה question חייב להסתיים בשאלת פעולה ברורה, ללא יוצא דופן. לדוגמה: "מה הפעולה הנכונה?", "מה הצעד המיידי הנכון?", "מה הטיפול המתאים ביותר?", "מה צריך לעשות עכשיו?".\n\n` +
    avoidSection +
    `${focus}\n\n` +
    'תשובות: בדיוק 4 אפשרויות בעברית רפואית מקצועית. כל אפשרות: משפט פעולה קליני אחד, שלם ומוחלט, 15-25 מילים. פורמט: "[פועל] [פעולה ספציפית / תרופה-מינון-מסלול / הגדרת אנרגיה או מכשיר] [הקשר קליני]". אין אפשרות עמומה או מהססת.\n' +
    'כלל הסחות הדעת: לפחות שתי תשובות שגויות חייבות להיות טעויות שכיחות בשדה או פרוטוקולים מיושנים. תשובה שגויה אחת תישמע כמו תשובת ספר לימוד שמתעלמת מהפרט הקליני העדין בתרחיש. בדיוק תשובה אחת עוקבת אחר הפרוטוקולים הישראליים העדכניים. כל הסחות הדעת סבירות לחובש מתחיל.\n\n' +
    'הסבר קליני: בדיוק 3-4 משפטים תמציתיים בעברית, סה"כ פחות מ-60 מילים. חייב להתחיל במשפט: "על פי הפרוטוקולים בישראל...". לאחר מכן: (1) הסבר המנגנון הפיזיולוגי שהופך את הפעולה הנכונה לעדיפה. (2) נתח את הסחת הדעת המפתה ביותר והנזק הספציפי שהיא גורמת. (3) סיים עם פנינת ידע קלינית אחת שמפרידה בין אנשי שדה מצטיינים לממוצעים.\n\n' +
    'דיוק: כל מינון תרופה, הגדרת ג\'ול, סף קצב ומסגרת זמן חייבים להתאים בדיוק לפרוטוקולים הישראליים העדכניים. אין קירובים. שפה: עברית רפואית מקצועית גבוהה — ללא תרגום מילולי מאנגלית. מינוח נכון: "נתיב אוויר", "קיבוע", "סביבת עבודה", "ניטור", "הנשמה", "פינוי", "הכרה", "דופק", "לחץ דם", "נשימה" וכדומה.\n\n' +
    'topic_tag: תג נושא קצר בעברית (מילה אחת עד שלוש מילים) שמזהה את הנושא הקליני המרכזי. לדוגמה: "אנפילקסיס", "SVT", "STEMI", "היפוגליקמיה", "שבץ", "CPR", "פרכוסים", "מכת חום", "חסימת נתיב אוויר", "VF", "חסם AV", "טביעה", "דימום טראומה", "אסתמה".\n\n' +
    'פלט JSON תקני בלבד, ללא פרוזה, ללא markdown: { "question": string, "options": string[], "correct_index": number, "clinical_explanation": string, "topic_tag": string }'
  )
}

function buildMedPrompt(today: string): string {
  let hash = 0
  for (let i = 0; i < today.length; i++) hash = (hash * 31 + today.charCodeAt(i)) >>> 0
  const drugPool = [
    'Eliquis (Apixaban)', 'Xarelto (Rivaroxaban)', 'Aspirin', 'Clopidogrel (Plavix)',
    'Warfarin (Coumadin)', 'Bisoprolol', 'Metoprolol', 'Amlodipine', 'Furosemide',
    'Metformin', 'Empagliflozin (Jardiance)', 'Levothyroxine', 'Omeprazole',
    'Atorvastatin', 'Losartan', 'Ramipril', 'Digoxin', 'Amiodarone', 'Prednisolone',
    'Nitroglycerin', 'Adenosine', 'Atropine', 'Epinephrine', 'Morphine', 'Midazolam',
  ]
  const todayDrug = drugPool[hash % drugPool.length]

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
  "description": "הסבר בשורה-שורה וחצי: מה התרופה הזאת עושה בגוף ולמה רושמים אותה — בשפה ברורה שכל חובש יבין.",
  "question": "שאלת MCQ על הסכנה/אינדיקציה/זהירות",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "clinical_pearl": "דגש קליני חשוב למדיק (1-2 משפטים)",
  "emergency_note": "אזהרת חירום ספציפית (1-2 משפטים)"
}`
}

const ALL_ABBREVIATIONS = [
  'GCS', 'AVPU', 'FAST', 'OPQRST', 'SAMPLE', 'MIST', 'AED', 'BVM', 'CPAP', 'PEEP',
  'MAP', 'SpO2', 'EtCO2', 'IM', 'IV', 'IO', 'ROSC', 'PEA', 'VF', 'VT', 'SVT', 'CVA',
  'MI', 'AMI', 'STEMI', 'NSTEMI', 'CHF', 'COPD', 'DKA', 'MCI', 'JVD', 'EMT', 'MICU',
  'HR', 'BP', 'RR', 'LOC',
]

function buildAbbrPrompt(usedAbbreviations: string[]): string {
  const unused = ALL_ABBREVIATIONS.filter(a => !usedAbbreviations.includes(a))
  const list = unused.length > 0 ? unused : ALL_ABBREVIATIONS

  return `אתה מדריך פרמדיק בכיר ישראלי. צור שאלת MCQ על קיצור רפואי חשוב בעולם ההצלה הישראלי.
בחר קיצור מהרשימה הבאה (${unused.length > 0 ? 'קיצורים שעוד לא נשאלו — יש לסקור את כולם לפני חזרה' : 'כל הקיצורים נשאלו — התחל מחזור חדש'}): ${list.join(', ')}.
ערבב את מיקום התשובה הנכונה — correct_index לא תמיד 0.
פלט JSON בלבד, ללא markdown:
{
  "abbreviation": "הקיצור",
  "question": "מה המשמעות של [קיצור]?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "explanation": "הסבר קצר (1-2 משפטים) — משמעות הקיצור ושימושו הקליני"
}`
}

function buildRedFlagPrompt(recentTopics: string[]): string {
  const avoidSection = recentTopics.length > 0
    ? `\nנושאים שנשאלו לאחרונה — חובה לבחור נושא שונה לחלוטין: ${recentTopics.join(', ')}.\n`
    : ''
  return `אתה מדריך פרמדיק בכיר ישראלי. צור מקרה חירום קצר שבו יש לזהות סימן אדום קריטי מסכן חיים.
סבב בין הנושאים הבאים: טראומה, קרדיולוגיה, נשימה, נוירולוגיה, חירום סביבתי, רעלנות, ילדים, אינטרנה. לא יותר מ-25% מהשאלות יהיו מאותו תחום.
המקרה: תיאור ספציפי — גיל, מנגנון/תלונה, סימנים חיוניים, תסמינים. 2-3 משפטים.
ערבב את מיקום התשובה הנכונה — correct_index לא תמיד 0.
${avoidSection}
פלט JSON בלבד, ללא markdown:
{
  "scenario": "תיאור המקרה (2-3 משפטים בעברית מקצועית, עם גיל, מנגנון/תלונה, סימנים חיוניים רלוונטיים)",
  "question": "מה הסימן האדום הקריטי המצריך התערבות מיידית?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "explanation": "הסבר קליני (2-3 משפטים) — מדוע זהו הסימן הקריטי ומה ההשלכות הפיזיולוגיות",
  "topic_tag": "נושא קצר בעברית (1-3 מילים)"
}`
}

function buildSpotErrorPrompt(recentTopics: string[]): string {
  const avoidSection = recentTopics.length > 0
    ? `\nנושאים שנשאלו לאחרונה — חובה לבחור נושא שונה לחלוטין: ${recentTopics.join(', ')}.\n`
    : ''
  return `אתה מדריך פרמדיק בכיר ישראלי. משימתך: כתוב תרחיש קליני ריאליסטי המכיל טעות מקצועית אחת ברורה.

1. פתח עם משפט שיגור: "הוזנק לקריאה על [גבר/אישה] כבן/כבת [גיל] ב[מקום]"
2. תאר ההתערבות (3-4 משפטים) — כולל פעולה אחת שגויה לפי הפרוטוקולים בישראל.
3. שאלה: "מה הטעות המקצועית שזוהתה בטיפול?"
4. 4 תשובות: אחת היא הטעות האמיתית, השאר — שגיאות שלא קרו או פעולות נכונות.
5. הסבר (2-3 משפטים): הטעות, הנזק, והנכון לפי הפרוטוקולים בישראל.
6. שפה: עברית רפואית מקצועית גבוהה.
${avoidSection}
פלט JSON בלבד, ללא markdown:
{
  "dispatch_opener": "משפט שיגור אחד",
  "scenario": "תיאור עם הטעות המוטמעת (3-4 משפטים)",
  "question": "מה הטעות המקצועית שזוהתה בטיפול?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "explanation": "הסבר קליני (2-3 משפטים)",
  "topic_tag": "נושא קצר בעברית (1-3 מילים)"
}`
}

function buildRadioChallengePrompt(recentTopics: string[]): string {
  const avoidSection = recentTopics.length > 0
    ? `\nנושאים שנשאלו לאחרונה — חובה לבחור נושא שונה לחלוטין: ${recentTopics.join(', ')}.\n`
    : ''
  return `אתה מדריך פרמדיק בכיר ישראלי. משימתך: כתוב תרחיש מורכב וכאוטי ו-4 סיכומי SBAR.

1. פתח עם משפט שיגור: "הוזנק לקריאה על [גבר/אישה] כבן/כבת [גיל] ב[מקום]"
2. תאר תרחיש עם ממצאים מרובים (4-5 משפטים).
3. שאלה: "מה הסיכום הטוב ביותר בפורמט SBAR לדיווח לרופא המאשר?"
4. אחת אידיאלית, שלוש עם פגמים (מידע חסר, סדר לא נכון, הערכה שגויה).
5. הסבר (2-3 משפטים).
${avoidSection}
פלט JSON בלבד, ללא markdown:
{
  "dispatch_opener": "משפט שיגור אחד",
  "scenario": "תיאור מורכב (4-5 משפטים)",
  "question": "מה הסיכום הטוב ביותר בפורמט SBAR לדיווח לרופא המאשר?",
  "options": ["SBAR א — ...", "SBAR ב — ...", "SBAR ג — ...", "SBAR ד — ..."],
  "correct_index": X,
  "explanation": "הסבר (2-3 משפטים)",
  "topic_tag": "נושא קצר בעברית (1-3 מילים)"
}`
}

// ─── Improvised helpers ───────────────────────────────────────────────────────

const IMPROVISED_SETTINGS = [
  'פיקניק בפארק ציבורי', 'קניון קומת מזון (פוד קורט)', 'אוטובוס בין-עירוני בנסיעה',
  'חדר אוכל של בית ספר תיכון', 'חתונה באולם שמחות', 'חוף הים (קייטנה)',
  'מסעדה שוקקת', 'שוק הכרמל / שוק מחנה יהודה', 'חדר כושר / ספורטק',
  'גן ילדים / פעוטון', 'מגרש כדורגל בשכונה', 'בית כנסת', 'סופרמרקט גדול',
  'מסיבת יום הולדת ביתית', 'פאב / בר', 'טיול שנתי בהר מירון',
  'קמפינג ביער הכרמל', 'בריכת שחייה ציבורית', 'תחנת רכבת / רציף', 'מוזיאון',
  'ספרייה עירונית', 'בית אבות', 'גינת שכונה', 'אצטדיון יציעים',
  'מספרה / סלון יופי', 'רכבת ישראל (קרון נוסעים)', 'שדה תעופה — טרמינל המתנה',
  'גן לאומי / שמורת טבע', 'פארק מים', 'אולם קולנוע', 'קמפוס אוניברסיטה',
  'מסדרון בית חולים (כמבקר)', 'מועדון לילה / דיסקוטק', 'אירוע חברה / כנס עסקי',
  'שוק פשפשים בשטח פתוח', 'גג בניין מגורים', 'מרפאה קהילתית — חדר המתנה',
  'משרד פתוח / קומת hi-tech', 'קניית מכוניות (מגרש מכוניות)', 'ים המלח / ספא',
]

function getImprovisedSettingForDate(dateStr: string): string {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0
  return IMPROVISED_SETTINGS[hash % IMPROVISED_SETTINGS.length]
}

function isSplintDay(dateStr: string): boolean {
  return parseInt(dateStr.slice(8), 10) % 2 === 0
}

async function getRecentImprovisedTopics(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase
    .from('daily_questions')
    .select('content')
    .eq('question_type', 'improvised')
    .order('question_date', { ascending: false })
    .limit(20)
  if (!data) return []
  // deno-lint-ignore no-explicit-any
  return data.map((r: any) => r.content?.topic_tag as string).filter(Boolean)
}

function buildImprovisedPrompt(dateStr: string, recentTopics: string[]): string {
  const setting = getImprovisedSettingForDate(dateStr)
  const splintDay = isSplintDay(dateStr)
  const avoidSection = recentTopics.length > 0
    ? `\nנושאי חירום שנשאלו לאחרונה — בחר סוג חירום שונה לחלוטין: ${recentTopics.join(', ')}.\n`
    : ''

  if (splintDay) {
    return `אתה מדריך חובשים ישראלי. משימתך: צור שאלת "חובש ללא ציוד" בנושא **קביעות מאולתרת** — תרחיש שבר או פגיעה הדורשת קיבוע, ללא תיק רפואי. החובש חייב לאלתר קיבוע מחפצים זמינים.

מיקום היום (חובה להשתמש): ${setting}

כללים מחייבים:
1. המיקום בתרחיש חייב להיות: ${setting}. הדגש שאין תיק רפואי ואין ציוד קיבוע.
2. תרחיש (2-3 משפטים): גיל, מין, מנגנון פגיעה (נפילה / פגיעת ספורט / תאונה קטנה), איבר פגוע, ומה זמין במקום (חפצים אופייניים ל${setting}).
3. שאלה: "מהו הפתרון המאולתר הטוב ביותר לקיבוע הפגיעה?"
4. 4 תשובות: חפצים ספציפיים ל${setting} — אחת נכונה (קיבוע יעיל ובטוח), שלוש מסיחות הגיוניות. ערבב מיקום התשובה.
5. הסבר (2-3 משפטים): למה זהו הפתרון הנכון, איך מבצעים, ומה הסכנה בקיבוע שגוי.
6. topic_tag: "קביעות מאולתרת"
${avoidSection}
פלט JSON תקני בלבד, ללא markdown:
{
  "scenario": "תיאור התרחיש (2-3 משפטים — גיל, מין, מנגנון, איבר פגוע, מה זמין ב${setting})",
  "question": "מהו הפתרון המאולתר הטוב ביותר לקיבוע הפגיעה?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "explanation": "הסבר (2-3 משפטים) — למה זהו הפתרון הנכון, כיצד מבצעים, ומה הסכנה בקיבוע שגוי",
  "topic_tag": "קביעות מאולתרת"
}`
  }

  return `אתה מדריך חובשים ישראלי. משימתך: צור שאלת "חובש ללא ציוד" — תרחיש חירום BLS אמיתי בחיי היומיום, ללא תיק רפואי. החובש צריך לחשוב יצירתית ולהשתמש בחפצים זמינים במקום.

מיקום היום (חובה להשתמש): ${setting}

כללים מחייבים:
1. המיקום בתרחיש חייב להיות: ${setting}. הדגש שאין תיק רפואי.
2. תרחיש (2-3 משפטים): תיאור ספציפי — גיל, מין, מנגנון/תסמינים, ומה זמין במקום (חפצים אופייניים למיקום זה).
3. שאלה: "מהו הפתרון המאולתר הטוב ביותר שניתן למצוא כאן?"
4. 4 תשובות: חפצים ופעולות ספציפיים למיקום זה — אחת נכונה, שלוש מסיחות הגיוניות. ערבב מיקום התשובה.
5. הסבר (2-3 משפטים): מדוע זהו הפתרון הטוב ביותר, כיצד הוא עוזר בפועל.
6. topic_tag: סוג החירום בלבד (1-3 מילים, לא המיקום).

סוגי חירום לסבב ביניהם (אסור לבחור שבר/קיבוע — זה נושא יום אחר): חנק, דימום פתוח, כוויה, אובדן הכרה, כאב לב/כאב חזה, אנפילקסיס, מכת חום, עקיצת דבורה/צרעה, טביעה, ילד בבכי ללא תגובה, היפוגליקמיה.
${avoidSection}
פלט JSON תקני בלבד, ללא markdown:
{
  "scenario": "תיאור התרחיש (2-3 משפטים — גיל, מין, מנגנון, מה זמין ב${setting})",
  "question": "מהו הפתרון המאולתר הטוב ביותר שניתן למצוא כאן?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "explanation": "הסבר (2-3 משפטים) — מדוע זהו הפתרון הטוב ביותר ואיך הוא מסייע בפועל",
  "topic_tag": "סוג החירום בלבד (1-3 מילים)"
}`
}

// ─── Category generators ──────────────────────────────────────────────────────

interface ClinicalQuestion {
  question: string
  options: string[]
  correct_index: number
  clinical_explanation: string
  topic_tag: string
}

interface MedOfDay {
  name: string
  name_he: string
  name_en: string
  drug_class: string
  description: string
  question: string
  options: string[]
  correct_index: number
  clinical_pearl: string
  emergency_note: string
}

interface AbbreviationQ {
  abbreviation: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

interface RedFlagQ {
  scenario: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
  topic_tag: string
}

interface SpotErrorQ {
  dispatch_opener: string
  scenario: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
  topic_tag: string
}

interface RadioChallengeQ {
  dispatch_opener: string
  scenario: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
  topic_tag: string
}

async function generateClinical(type: 'BLS' | 'ALS', supabase: SupabaseClient): Promise<ClinicalQuestion> {
  const recentTopics = await getRecentClinicalTopics(supabase, type.toLowerCase() as 'bls' | 'als', 30)
  const q = await withRetry(() => parseGeminiJSON<ClinicalQuestion>(buildClinicalPrompt(type, recentTopics)))
  if (
    typeof q.question !== 'string' || !Array.isArray(q.options) ||
    q.options.length !== 4 || typeof q.correct_index !== 'number' ||
    typeof q.clinical_explanation !== 'string'
  ) throw new Error(`Invalid clinical ${type} format`)
  return q
}

async function generateMed(today: string): Promise<MedOfDay> {
  const m = await withRetry(() => parseGeminiJSON<MedOfDay>(buildMedPrompt(today)))
  if (!m.name || !m.drug_class || !m.question || !Array.isArray(m.options) || m.options.length !== 4 || typeof m.correct_index !== 'number') {
    throw new Error('Invalid med format')
  }
  return m
}

async function generateAbbreviation(supabase: SupabaseClient): Promise<AbbreviationQ> {
  const used = await getUsedAbbreviations(supabase)
  const a = await withRetry(() => parseGeminiJSON<AbbreviationQ>(buildAbbrPrompt(used)))
  if (!a.abbreviation || !a.question || !Array.isArray(a.options) || a.options.length !== 4) throw new Error('Invalid abbr format')
  return a
}

async function generateRedFlag(supabase: SupabaseClient): Promise<RedFlagQ> {
  const recentTopics = await getAllRecentTopics(supabase, 15)
  const r = await withRetry(() => parseGeminiJSON<RedFlagQ>(buildRedFlagPrompt(recentTopics)))
  if (!r.scenario || !r.question || !Array.isArray(r.options) || r.options.length !== 4) throw new Error('Invalid red flag format')
  return r
}

async function generateSpotError(supabase: SupabaseClient): Promise<SpotErrorQ> {
  const recentTopics = await getAllRecentTopics(supabase, 15)
  const q = await withRetry(() => parseGeminiJSON<SpotErrorQ>(buildSpotErrorPrompt(recentTopics)))
  if (!q.dispatch_opener || !q.scenario || !q.question || !Array.isArray(q.options) || q.options.length !== 4) {
    throw new Error('Invalid spot error format')
  }
  return q
}

async function generateRadioChallenge(supabase: SupabaseClient): Promise<RadioChallengeQ> {
  const recentTopics = await getAllRecentTopics(supabase, 15)
  const q = await withRetry(() => parseGeminiJSON<RadioChallengeQ>(buildRadioChallengePrompt(recentTopics)))
  if (!q.dispatch_opener || !q.scenario || !q.question || !Array.isArray(q.options) || q.options.length !== 4) {
    throw new Error('Invalid radio challenge format')
  }
  return q
}

interface ImprovisedQ {
  scenario: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
  topic_tag?: string
}

async function generateImprovised(supabase: SupabaseClient, today: string): Promise<ImprovisedQ> {
  const recentTopics = await getRecentImprovisedTopics(supabase)
  const q = await withRetry(() => parseGeminiJSON<ImprovisedQ>(buildImprovisedPrompt(today, recentTopics)))
  if (!q.scenario || !q.question || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.correct_index !== 'number') {
    throw new Error('Invalid improvised format')
  }
  return q
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Validate cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('Authorization') ?? ''
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const today = getIsraelDate()

  const results: Record<string, string> = {}

  const categories: Array<{ type: string; generate: () => Promise<unknown> }> = [
    { type: 'bls', generate: () => generateClinical('BLS', supabase) },
    { type: 'als', generate: () => generateClinical('ALS', supabase) },
    { type: 'med_v4', generate: () => generateMed(today) },
    { type: 'abbr', generate: () => generateAbbreviation(supabase) },
    { type: 'improvised', generate: () => generateImprovised(supabase, today) },
    { type: 'red_flag', generate: () => generateRedFlag(supabase) },
    { type: 'spot_error', generate: () => generateSpotError(supabase) },
    { type: 'radio_challenge', generate: () => generateRadioChallenge(supabase) },
  ]

  for (const { type, generate } of categories) {
    // Check if today's question already exists (idempotency)
    const { data: existing } = await supabase
      .from('daily_questions')
      .select('id')
      .eq('question_date', today)
      .eq('question_type', type)
      .maybeSingle()

    if (existing) {
      results[type] = 'already_exists'
      continue
    }

    try {
      const content = await generate()
      const { error } = await supabase.from('daily_questions').insert({
        question_date: today,
        question_type: type,
        content,
      })
      results[type] = error ? `insert_error: ${error.message}` : 'generated'
    } catch (e) {
      results[type] = `generation_error: ${e instanceof Error ? e.message : String(e)}`
    }
  }

  console.log(`[generate-daily-questions] ${today}:`, results)

  return new Response(JSON.stringify({ date: today, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
