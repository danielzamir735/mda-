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

// Shared language + difficulty rules injected into every question prompt
const HEBREW_RULES =
  'כללי עברית — מחייבים: עברית תקנית ומדוקדקת בלבד. אסור בהחלט להשתמש בתרגומי שאילה מאנגלית: לעולם לא "המטופל מציג", "מציגה עם", "מדגים" — ביטויים כאלה אינם קיימים בעברית. במקומם: "המטופל סובל מ...", "המטופל מתלונן על...", "בבדיקתך נמצא...", "בהערכתך ניכר...". ללא תעתיקים מאנגלית: "ריווי חמצן" ולא "סטורציה", "בלבול" ולא "קונפוזיה", "ירידה בהכרה" ולא "סמי הכרה". כל משפט חייב להישמע טבעי לדובר עברית יליד — קרא כל משפט ותקן כל ניסוח שנשמע מתורגם.'

const DIFFICULTY_RULES =
  'רמת קושי — מחייבת: השאלה חייבת להיות קשה, טריקית ומכשילה. הפרט הקליני המכריע מוסתר בין פרטים שגרתיים בתרחיש; כל מסיח נשמע נכון ומקצועי ממבט ראשון ובנוי להכשיל גם משיבים מנוסים. אסור לכתוב שאלה קלה או ישירה שהתשובה עליה מובנת מאליה מקריאת התרחיש.'

function buildTodayTopicsSection(todayTopics: string[]): string {
  return todayTopics.length > 0
    ? `\nנושאים שכבר נבחרו היום ברובריקות אחרות — אסור בהחלט לחזור עליהם, חובה לבחור נושא שונה לחלוטין: ${todayTopics.join(', ')}.\n`
    : ''
}

function buildClinicalPrompt(type: 'BLS' | 'ALS', recentTopics: string[], todayTopics: string[]): string {
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
    `כתיבת התרחיש — כללים מחייבים: (1) שפה ניטרלית מקצועית בלבד. (2) פתח עם משפט הקשר שיגור אחד: "הוזנקת לקריאה על [גבר/אישה] כבן/כבת [גיל] ב[מקום/נסיבות קצרות]" — משפט אחד בלבד, ישיר ותמציתי. אסור בהחלט להתחיל את התרחיש במילים "בהגיעך למקום" ללא משפט הקשר שיגור שקודם לו. (3) המשך ישירות לממצאים הקליניים: "בהגיעך למקום מצאת..." / "המטופל מתלונן על..." / "בבדיקתך נמצא..." — 2-3 משפטים קליניים ספציפיים עם תלונה עיקרית, סימנים חיוניים רלוונטיים, ממצאים פיזיקליים. (4) שדה question חייב להסתיים בשאלת פעולה ברורה, ללא יוצא דופן. לדוגמה: "מה הפעולה הנכונה?", "מה הצעד המיידי הנכון?", "מה הטיפול המתאים ביותר?", "מה צריך לעשות עכשיו?".\n\n` +
    `${HEBREW_RULES}\n\n${DIFFICULTY_RULES}\n\n` +
    avoidSection +
    buildTodayTopicsSection(todayTopics) +
    `${focus}\n\n` +
    'תשובות: בדיוק 4 אפשרויות בעברית רפואית מקצועית. כל אפשרות: משפט פעולה קליני אחד, שלם ומוחלט, 15-25 מילים. פורמט: "[פועל] [פעולה ספציפית / תרופה-מינון-מסלול / הגדרת אנרגיה או מכשיר] [הקשר קליני]". אין אפשרות עמומה או מהססת.\n' +
    'כלל הסחות הדעת: לפחות שתי תשובות שגויות חייבות להיות טעויות שכיחות בשדה או פרוטוקולים מיושנים. תשובה שגויה אחת תישמע כמו תשובת ספר לימוד שמתעלמת מהפרט הקליני העדין בתרחיש. בדיוק תשובה אחת עוקבת אחר הפרוטוקולים הישראליים העדכניים. כל הסחות הדעת סבירות לחובש מתחיל.\n\n' +
    'הסבר קליני: בדיוק 3-4 משפטים תמציתיים בעברית, סה"כ פחות מ-60 מילים. חייב להתחיל במשפט: "על פי הפרוטוקולים בישראל...". לאחר מכן: (1) הסבר המנגנון הפיזיולוגי שהופך את הפעולה הנכונה לעדיפה. (2) נתח את הסחת הדעת המפתה ביותר והנזק הספציפי שהיא גורמת. (3) סיים עם פנינת ידע קלינית אחת שמפרידה בין אנשי שדה מצטיינים לממוצעים.\n\n' +
    'דיוק: כל מינון תרופה, הגדרת ג\'ול, סף קצב ומסגרת זמן חייבים להתאים בדיוק לפרוטוקולים הישראליים העדכניים. אין קירובים. שפה: עברית רפואית מקצועית גבוהה — ללא תרגום מילולי מאנגלית. מינוח נכון: "נתיב אוויר", "קיבוע", "סביבת עבודה", "ניטור", "הנשמה", "פינוי", "הכרה", "דופק", "לחץ דם", "נשימה" וכדומה.\n\n' +
    'topic_tag: תג נושא קצר בעברית (מילה אחת עד שלוש מילים) שמזהה את הנושא הקליני המרכזי. לדוגמה: "אנפילקסיס", "SVT", "STEMI", "היפוגליקמיה", "שבץ", "CPR", "פרכוסים", "מכת חום", "חסימת נתיב אוויר", "VF", "חסם AV", "טביעה", "דימום טראומה", "אסתמה".\n\n' +
    'פלט JSON תקני בלבד, ללא פרוזה, ללא markdown: { "question": string, "options": string[], "correct_index": number, "clinical_explanation": string, "topic_tag": string }'
  )
}

// Single source of truth for "common medicines" — must stay identical to
// COMMON_MED_POOL in DailyChallengeModal.tsx, which derives it live from
// src/features/hub/data/commonMedsData.ts (MED_CATEGORIES). Deno can't import
// from src/, so this is a hand-maintained literal copy — update both together
// whenever MED_CATEGORIES changes.
const COMMON_MED_POOL = [
  'קפטופריל / קפוטן / אצריל (Captopril / Capoten / Aceril)', 'טריטייס (Tritace)',
  'וסקייס (Vascace)', 'אנלפריל (Enalapril / Enalapril)',
  'ולסרטן / דיובאן (Valsartan / Diovan)', 'לוסרטן / אוסקר (Losartan / oscaar)',
  'אלדקטון / אלדוספירון / ספירונולקטון (Aldacton / Aldospiron / Spironolactone)',
  'מניטול / אוסמיטרול (Manitol / Osmitrol)', 'דיוריל (Diuril)',
  'פורוסמיד / פוסיד / לאסיקס (Furesamide / Fusid / Lasix)',
  'אצטזולאמיד / דיאמוקס (Acetazolamide / Diamox)', 'דיסותיאזיד (Disothiazide)',
  'קווינידין / ריתמקס (Quinidine, Rythmex)', 'אמיודארון / פרוקור (Amiodarne, Procor)',
  'דיגוקסין / דיגיטליס (Digoxin / Digitalis)', 'ביסופרולול / קונקור (Bisoprolol / Concor)',
  'קרוודילול / דילפרס (Carvedilol / Dilapress)', 'פרופרנולול / דרלין (Propranlol / Deralin)',
  'אטנולול / נורמיטן (Atenolol / Normiten)', 'מטופרולול / מטופרס (Metoprolol / Metopress)',
  'לבטלול / טרנדייט (Labetalol / Trandate)', 'נורווסק / אמלודיפין / אמלאו (Norvasc / Amlodipine / Amlow)',
  'דילטיאזם / דיליטאם (Diltiiazem / dilitam)', 'איקקור / ורפמיל (Ikacor / Verapamil)',
  'ניפדיפין / אוסמו-אדלאט / פרסולט (Nifedipine / Osmo-Adalat / Pressolat)',
  'ואזודיפ (Vasodip)', 'ורפרס (Verapress)',
  'איזוקרדיד / איזוטרד (Isocardide / Isotard)', 'ניטרודרם (Nitrderm)',
  'איזוסורביד מונוניטרט / מונוניט / מונוקורד (Isorbid mononitrate / Mononit / Monocord)',
  'איזוסורביד דיניטרט / איזוקט / קורדיל (Isoorbid Dinitrate / Isoket / Cordil)',
  'ניטרוגליצרין / ניטרוסטט (Nitroglycerin / Nitrostat)', 'ניפריד / ניטרופרוסיד (Nipride / Nitroprusside)',
  'קלקסן (Clexane)', 'קומדין / וורפרין (Coumadin / Warfarin)', 'הפרין (Heparin)',
  'אליקוויס / קסרלטו (Eliquis / Xarelto)', 'פרדקסה (דביגטראן) (Pradaxa (Dabigatran))',
  'אספירין / מיקרופירין / קרטיה (Aspirin / Micropirin / Cartia)',
  'פלאביקס / קלופידוגרל (Plavix / Clopidogrel)', 'פרסוגרל / אפיאנט (Prasugrel / Effient)',
  'טיקגרלור / ברילינטה (Ticagrelor / Brilinta)',
  'בריקלין / ונטולין / סלבוטמול (Bricalin / Ventolin / Salbutamol)', 'אירובנט (Aerovent)',
  'סרטייד (Seretide)', 'סינגולר / מונטלוקאסט (Singulair / Montelukast)',
  'זולאייר / אומליזומאב (Xolair / Omalizumab)', 'אמינופילין (Aminophylline)',
  'ויקטוזה (Victoza)', 'לירגלוטייד (Liraglutide)', 'פרנדייז (Prandase)',
  "ג'נוביה (Januvia)", "ג'ארדיאנס (Jardiance)",
  'אינסולין (נובולוג, לנטוס, אפידרה) (Insulin (Novolog, Lantus, Epidra))',
  "מטפורמין / גלוקומין / גלוקופאג' (Metformin / Glucomin / Glucophage)",
  'גלובן / גליבטיק (Gluben / Glibetic)', "טרג'נטה (Trajenta)", "ג'נואט (Januet)",
  'ליתיום (Lithium)', 'זיפרקסה (Zyprexa)', 'פרוזק (Prozac)', 'ציפרלקס (Cipralex)',
  'פריזמה (Prizma)', 'סרוקסט (Seroxat)', 'רסיטל (Recital)', 'לוסטרל (Lustral)',
  'סימבלטה (Cymbalta)', 'בונדורמין (Bondormin)', 'קלונקס / קלונאזפאם (Clonex / Clonazepam)',
  'לוריבן / לוראזפאם (Lorivan / Lorazepam)', 'אסיוול / ואליום / דיאזפאם (Assival / Valium / Diazepam)',
  'ואבן (Vaben)', 'דורמיקום / מידאזולם / מידולאם (Dormicum / Midazolam / Midolam)',
  'קפרה (Keppra)', 'טרילפטין (Trileptin)', 'טופמקס (Topamax)', 'פניטואין (Phenytoin)',
  'דפלפט / ולפרואט (Depalept / Valporate)', 'לומינל / פנוברביטל (Luminal / phenobarbital)',
  'טגרטול / קרבמזפין (Tegretol / Carbamezapine)', "למיקטל / למוטריג'ין (Lamictal / Lamotrigine)",
  'טאמס (Tums (סותר חומצה))', 'מאלוקס (Maalox (סותר חומצה))',
  'גסטרו / פמוטידין (Gastro / Famotidine (H2 Blocker))',
  'זנטק / רניטידין (Zantac / Ranitidine (H2 Blocker))',
  'לוזק / אומפרדקס (Losec / Omepradex (PPI))', 'נקסיום (Nexium (PPI))',
  'אספירין (Aspirin)', 'איבופרופן / איבופן / אדוויל / נורופן (Ibuprofen / Ibufen / Advil / Nurofen)',
  'וולטרן (Voltaren)', 'אתופן (Etopan)', 'נקסין (Naxin)',
  'אצטמינופן / פרצטמול (Acetaminophen / paracetamol)', 'אופטלגין / דיפירון (Optalgin / dipyrone)',
  'ליריקה (Lyrica)', 'מורפין (Morphine)', 'אוקסיקודון / פרקוסט (Oxycodone / percocet)',
  'פנטניל (Fentanyl)', 'טרגין (Targin)', 'אלגוליזין (Algolysin)',
  'מרקפטיזול (Mercaptizol)', 'פרופילתיאורציל (Propylthouracil (PPU))',
  'אלטרוקסין (Eltroxin)', 'יוטירוקס (Euthyrox)',
]

function buildMedPrompt(today: string): string {
  let hash = 0
  for (let i = 0; i < today.length; i++) hash = (hash * 31 + today.charCodeAt(i)) >>> 0
  const todayDrug = COMMON_MED_POOL[hash % COMMON_MED_POOL.length]

  return `אתה מדריך פרמדיק בכיר ישראלי. משימתך: צור שאלת MCQ אינטראקטיבית על "תרופת היום" לחובשים ולפרמדיקים ישראלים.
תאריך היום: ${today}. תרופת היום המוקצית: ${todayDrug}.
חובה להשתמש בתרופה ${todayDrug} כנושא השאלה. ערבב את מיקום התשובה הנכונה — correct_index לא תמיד 0.
השאלה חייבת להיות מעשית — על סכנה קלינית, אינדיקציה, או זהירות בשטח — לא שאלת טריוויה.
שפה: עברית רפואית מקצועית.
${HEBREW_RULES}
${DIFFICULTY_RULES}
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

// "מושגים" pool — must stay identical to CONCEPT_POOL in
// src/features/hub/data/medicalConceptsPool.ts. Deno can't import from src/, so
// this is a hand-maintained literal copy.
interface ConceptEntry { topic: string; fact: string }

const CONCEPT_POOL: ConceptEntry[] = [
  { topic: 'שכבות הלב', fact: 'מבפנים כלפי חוץ: אנדוקרדיום (Endocardium) ← מיוקרדיום (Myocardium) ← אפיקרדיום (Epicardium).' },
  { topic: 'שכבות קרומי המוח (מנינגים)', fact: 'מבחוץ כלפי פנים: דורה מאטר (Dura Mater) ← ארכנואיד (Arachnoid Mater) ← פיה מאטר (Pia Mater).' },
  { topic: 'שכבות העור', fact: 'מבחוץ כלפי פנים: אפידרמיס (Epidermis) ← דרמיס (Dermis) ← היפודרמיס/רקמת תת-עורית (Hypodermis).' },
  { topic: 'שכבות דופן העורק', fact: 'מבפנים כלפי חוץ: טוניקה אינטימה (Tunica Intima) ← טוניקה מדיה (Tunica Media) ← טוניקה אדוונטיציה (Tunica Adventitia).' },
  { topic: 'שכבות דופן מערכת העיכול', fact: 'מבפנים כלפי חוץ: רירית (Mucosa) ← תת-רירית (Submucosa) ← שכבת שריר (Muscularis) ← סרוזה (Serosa).' },
  { topic: 'שכבות הקרנית בעין', fact: 'מבחוץ כלפי פנים: אפיתל ← ממברנת באומן ← סטרומה ← ממברנת דסמט ← אנדותל.' },
  { topic: 'חלוקת האוזן', fact: 'שלושה חלקים: אוזן חיצונית, אוזן תיכונה, אוזן פנימית.' },
  { topic: 'שכבות הרחם', fact: 'מבפנים כלפי חוץ: אנדומטריום (Endometrium) ← מיומטריום (Myometrium) ← פרימטריום (Perimetrium).' },
  { topic: 'שכבות דופן הריאה (פלאורה)', fact: 'שני עלים: פלאורה ויסצרלית (צמודה לריאה) ופלאורה פריאטלית (צמודה לדופן החזה), עם חלל פלאורלי ביניהם.' },
  { topic: 'שכבות עצם ארוכה', fact: 'מבחוץ כלפי פנים: פריאוסטאום (קרום העצם) ← עצם קורטיקלית (קומפקטית) ← עצם ספוגית (טרבקולרית) ← חלל מח העצם.' },
  { topic: 'עצם החזה', fact: 'שלושה חלקים: מנוברייום (Manubrium) למעלה, גוף עצם החזה (Body) באמצע, ותהליך החרבי (Xiphoid Process) בקצה התחתון.' },
  { topic: 'מספר צלעות באדם', fact: '12 זוגות צלעות (24 צלעות בסך הכול) — 7 זוגות אמיתיות, 3 זוגות כוזבות, 2 זוגות צפות.' },
  { topic: 'חוליות עמוד השדרה', fact: '7 חוליות צוואריות (Cervical), 12 חוליות גביות (Thoracic), 5 חוליות מותניות (Lumbar), 5 חוליות עצה מאוחות (Sacral), 4 חוליות זנב מאוחות (Coccygeal).' },
  { topic: 'עצם הבריח', fact: 'קלוויקולה (Clavicle) — העצם המחברת את עצם החזה ללוח השכמה, מעל בית החזה.' },
  { topic: 'לוח השכמה', fact: 'סקפולה (Scapula) — עצם שטוחה משולשת בגב העליון, חלק מחגורת הכתפיים.' },
  { topic: 'עצמות הזרוע התחתונה', fact: 'שתי עצמות: רדיוס (Radius, בצד האגודל) ואולנה (Ulna, בצד הזרת).' },
  { topic: 'עצמות השוק', fact: 'שתי עצמות: טיביה (Tibia, עצם השוק הגדולה, פנימית) ופיבולה (Fibula, עצם השוק הקטנה, חיצונית).' },
  { topic: 'עצם הירך', fact: 'פמור (Femur) — העצם הארוכה והחזקה ביותר בגוף.' },
  { topic: 'עצם הפיקה', fact: 'פטלה (Patella) — עצם ססמואידית מעל מפרק הברך.' },
  { topic: 'עצם הלסת התחתונה', fact: 'מנדיבולה (Mandible) — העצם הנעה היחידה בגולגולת.' },
  { topic: 'עצמות הגולגולת החזיתיות', fact: 'עצם המצח (Frontal), שתי עצמות הרקה (Temporal), שתי עצמות הלחי (Zygomatic), עצם הלסת העליונה (Maxilla).' },
  { topic: 'מספר שיניים במבוגר', fact: '32 שיניים קבועות במבוגר.' },
  { topic: 'מבנה חגורת האגן', fact: 'שלוש עצמות מאוחות: איליום (Ilium), איסכיום (Ischium), ופוביס (Pubis).' },
  { topic: 'תהליך החרבי', fact: 'Xiphoid Process — קצה סחוסי-עצמי בתחתית עצם החזה; משמש נקודת ציון למיקום הלחיצות ב-CPR.' },
  { topic: 'זווית לואי', fact: 'Angle of Louis (Sternal Angle) — נקודת החיבור בין המנוברייום לגוף עצם החזה, בגובה הצלע השנייה; נקודת ציון לספירת צלעות.' },
  { topic: 'פרוקסימלי לעומת דיסטלי', fact: 'פרוקסימלי (Proximal) = קרוב יותר לגו/למרכז הגוף; דיסטלי (Distal) = רחוק יותר ממנו.' },
  { topic: 'אנטריורי לעומת פוסטריורי', fact: 'אנטריורי (Anterior) = צד הקדמי של הגוף; פוסטריורי (Posterior) = הצד האחורי.' },
  { topic: 'סופריורי לעומת אינפריורי', fact: 'סופריורי (Superior) = כלפי מעלה/ראש; אינפריורי (Inferior) = כלפי מטה/רגליים.' },
  { topic: 'מדיאלי לעומת לטראלי', fact: 'מדיאלי (Medial) = קרוב יותר לקו האמצע של הגוף; לטראלי (Lateral) = רחוק יותר ממנו, לצדדים.' },
  { topic: 'סופרפיציאלי לעומת עמוק', fact: 'סופרפיציאלי (Superficial) = קרוב יותר לפני השטח של העור; עמוק (Deep) = רחוק יותר מפני השטח, פנימה.' },
  { topic: 'תנוחת שכיבה — סופיין לעומת פרון', fact: 'סופיין (Supine) = שכיבה על הגב; פרון (Prone) = שכיבה על הבטן.' },
  { topic: 'פלקציה לעומת אקסטנציה', fact: 'פלקציה (Flexion) = כיפוף המפרק, מקטין את הזווית; אקסטנציה (Extension) = יישור המפרק, מגדיל את הזווית.' },
  { topic: 'מישור סגיטלי', fact: 'מישור אורכי המחלק את הגוף לצד ימין וצד שמאל.' },
  { topic: 'מישור קורונלי', fact: 'מישור המחלק את הגוף לחלק קדמי (אנטריורי) וחלק אחורי (פוסטריורי).' },
  { topic: 'מישור טרנסברסלי', fact: 'מישור אופקי המחלק את הגוף לחלק עליון וחלק תחתון.' },
  { topic: 'קו אמצע הבריח', fact: 'Midclavicular Line — קו אנכי דמיוני העובר במרכז עצם הבריח; משמש נקודת ציון למיקום הלחיצות ב-CPR ולנקז חזה.' },
  { topic: 'קידומת Cardio-', fact: 'מתייחסת ללב — לדוגמה Cardiomyopathy = מחלת שריר הלב.' },
  { topic: 'קידומת Neuro-', fact: 'מתייחסת למערכת העצבים — לדוגמה Neuropathy = מחלה/פגיעה בעצבים.' },
  { topic: 'קידומת Hepato-', fact: 'מתייחסת לכבד — לדוגמה Hepatitis = דלקת כבד.' },
  { topic: 'קידומת Nephro-', fact: 'מתייחסת לכליה — לדוגמה Nephrolithiasis = אבנים בכליות.' },
  { topic: 'קידומת Gastro-', fact: 'מתייחסת לקיבה/מערכת העיכול — לדוגמה Gastritis = דלקת קיבה.' },
  { topic: 'קידומת Dermato-', fact: 'מתייחסת לעור — לדוגמה Dermatitis = דלקת עור.' },
  { topic: 'קידומת Osteo-', fact: 'מתייחסת לעצם — לדוגמה Osteoporosis = בריחת סידן מהעצם.' },
  { topic: 'קידומת Brady-', fact: 'מציינת קצב איטי — לדוגמה Bradycardia = דופק לב איטי מהתקין.' },
  { topic: 'קידומת Tachy-', fact: 'מציינת קצב מהיר — לדוגמה Tachycardia = דופק לב מהיר מהתקין.' },
  { topic: 'קידומת Hyper-', fact: 'מציינת עודף/יתר — לדוגמה Hypertension = יתר לחץ דם.' },
  { topic: 'קידומת Hypo-', fact: 'מציינת חוסר/תת — לדוגמה Hypoglycemia = רמת סוכר נמוכה מהתקין בדם.' },
  { topic: 'סיומת -itis', fact: 'מציינת דלקת — לדוגמה Appendicitis = דלקת התוספתן.' },
  { topic: 'סיומת -osis', fact: 'מציינת מצב/תהליך כרוני, לרוב לא דלקתי — לדוגמה Cirrhosis = שחמת הכבד.' },
  { topic: 'סיומת -ectomy', fact: 'מציינת כריתה ניתוחית של איבר — לדוגמה Appendectomy = כריתת התוספתן.' },
  { topic: 'סיומת -otomy', fact: 'מציינת חתך/פתיחה ניתוחית — לדוגמה Tracheotomy = חתך בקנה הנשימה.' },
  { topic: 'סיומת -ostomy', fact: 'מציינת יצירת פתח קבוע (סטומה) — לדוגמה Colostomy = פתח קבוע מהמעי הגס לדופן הבטן.' },
  { topic: 'סיומת -algia', fact: 'מציינת כאב — לדוגמה Neuralgia = כאב עצבי.' },
  { topic: 'סיומת -emia', fact: 'מציינת מצב הקשור בדם — לדוגמה Anemia = מיעוט תאי דם אדומים/המוגלובין.' },
  { topic: 'קידומת Dys-', fact: 'מציינת קושי/הפרעה בתפקוד — לדוגמה Dyspnea = קושי בנשימה.' },
  { topic: 'קידומת A- / An-', fact: 'מציינת היעדר/חוסר — לדוגמה Apnea = היעדר נשימה.' },
  { topic: 'קידומת Poly-', fact: 'מציינת ריבוי — לדוגמה Polyuria = הטלת שתן מרובה.' },
  { topic: 'הקרינה (Carina)', fact: 'נקודת ההתפצלות של קנה הנשימה לשתי הסמפונות הראשיות (ברונכוסים), בגובה הצלע הרביעית בערך.' },
  { topic: 'סחוס הקריקואיד', fact: 'Cricoid Cartilage — הטבעת הסחוסית התחתונה ביותר בגרון; נקודת ציון לחסימת הוושט (תמרון סליק) ולקוניקוטומיה.' },
  { topic: 'סחוס התירואיד ופיקת הגרגרת', fact: 'Thyroid Cartilage — הסחוס הבולט בקדמת הגרון ("תפוח אדם"), מעל סחוס הקריקואיד.' },
  { topic: 'הממברנה הקריקותירואידית', fact: 'הרקמה הרכה בין סחוס התירואיד לסחוס הקריקואיד; נקודת הכניסה בקוניקוטומיה.' },
  { topic: 'תהליך המסטואיד', fact: 'Mastoid Process — הבליטה העצמית מאחורי האוזן; שטף דם מקומי (Battle Sign) מעיד על שבר בבסיס הגולגולת.' },
  { topic: 'נקודת מקברני', fact: "McBurney's Point — נקודה בין הטבור לעצם האגן הימנית, רגישה במיוחד בדלקת התוספתן." },
  { topic: 'הקשת הקוסטלית', fact: 'Costal Margin — הגבול התחתון של בית החזה, נוצר מהחיבור של הצלעות הכוזבות.' },
  { topic: 'מספר אונות הריאות', fact: 'הריאה הימנית מחולקת ל-3 אונות; הריאה השמאלית מחולקת ל-2 אונות (מקום ללב).' },
  { topic: 'מספר חדרי הלב', fact: '4 חדרים: עלייה ימנית, חדר ימני, עלייה שמאלית, חדר שמאלי.' },
  { topic: 'מספר הכליות ומיקומן', fact: '2 כליות, ממוקמות רטרופריטונאלית (מאחורי חלל הצפק), משני צדי עמוד השדרה.' },
  { topic: 'מספר עצבי הגולגולת', fact: '12 זוגות עצבי גולגולת (Cranial Nerves), היוצאים ישירות מהמוח.' },
  { topic: 'החלוקה של חוט השדרה', fact: 'ארבעה אזורים: צווארי (Cervical), גבי (Thoracic), מותני (Lumbar), עצה (Sacral).' },
  { topic: 'שקית המים העוברית', fact: 'Amniotic Sac — השק המכיל את הנוזל השפיר המקיף את העובר.' },
  { topic: 'המחיצה הבין-חדרית', fact: 'Interventricular Septum — הדופן השרירית המפרידה בין החדר הימני לחדר השמאלי בלב.' },
  { topic: 'מספר עצמות בגוף המבוגר', fact: '206 עצמות בשלד המבוגר.' },
  { topic: 'המערכת הלימפטית', fact: 'רשת כלים ובלוטות (Lymph Nodes) שתפקידה ניקוז נוזלים והשתתפות בתגובה החיסונית.' },
  { topic: 'הצומת הסינוסי (SA Node)', fact: 'קוצב הלב הטבעי, ממוקם בעלייה הימנית; יוזם את הדחף החשמלי לכל פעימת לב.' },
  { topic: 'הצומת האטריו-חדרי (AV Node)', fact: 'מעביר את הדחף החשמלי מהעליות לחדרים, ומעכב אותו מעט כדי לאפשר מילוי חדרים לפני התכווצות.' },
  { topic: 'הסרעפת', fact: 'Diaphragm — השריר העיקרי בנשימה, מפריד בין בית החזה לחלל הבטן.' },
  { topic: 'האפיגלוטיס', fact: 'Epiglottis — מכסה סחוסי בבסיס הלשון החוסם את הקנה בזמן בליעה, ומונע שאיפת מזון לריאות.' },
  { topic: 'בלוטת התריס', fact: 'Thyroid Gland — בלוטה בצוואר האחראית על ייצור הורמוני מטבוליזם (T3, T4).' },
  { topic: 'בלוטת יותרת הכליה', fact: 'Adrenal Gland — ממוקמת מעל כל כליה, מייצרת אדרנלין וקורטיזול.' },
  { topic: 'הלבלב', fact: 'Pancreas — איבר בבטן העליונה בעל תפקיד כפול: הפרשת אנזימי עיכול ואינסולין/גלוקגון לוויסות סוכר.' },
  { topic: 'הטחול', fact: 'Spleen — איבר בבטן שמאלית עליונה, מסנן דם ומאחסן תאי דם; רגיש לקרע בטראומה בוטה.' },
  { topic: 'המרה וכיס המרה', fact: 'כיס המרה (Gallbladder) מאחסן מרה המיוצרת בכבד, ומשחרר אותה לעיכול שומנים.' },

  // ── מסגרות הערכה בסיסיות (חובה להכיר) ──
  { topic: 'סולם GCS — מרכיבים וטווח', fact: 'Glasgow Coma Scale מורכב משלושה מרכיבים: פקיחת עיניים (עד 4), תגובה מילולית (עד 5), תגובה מוטורית (עד 6). הטווח הכולל הוא 3 (הכי גרוע) עד 15 (הכי טוב).' },
  { topic: 'סולם AVPU', fact: 'הערכת הכרה מהירה: Alert (ער), Verbal (מגיב לקול), Pain (מגיב לכאב), Unresponsive (אינו מגיב).' },
  { topic: 'OPQRST', fact: 'מסגרת לבירור כאב: Onset (התחלה), Provocation/Palliation (מחמיר/מקל), Quality (איכות), Radiation (הקרנה), Severity (חומרה), Time (משך).' },
  { topic: 'SAMPLE history', fact: 'מסגרת לאיסוף היסטוריה רפואית: Signs/Symptoms, Allergies, Medications, Past medical history, Last oral intake, Events leading up.' },
  { topic: 'גישת ABCDE', fact: 'סדר הערכה וטיפול בחולה קשה: Airway (נתיב אוויר), Breathing (נשימה), Circulation (מחזור דם), Disability (הכרה/נוירולוגי), Exposure (חשיפה/סביבה).' },
  { topic: 'צבעי מיון (טריאז)', fact: 'אדום = דחוף/מסכן חיים, צהוב = דחוף אך יציב, ירוק = קל, שחור = נפגע ללא סיכוי הצלה (מיון המוני נפגעים).' },
  { topic: 'כלל תשיעיות (Rule of Nines)', fact: 'שיטה להערכת אחוז שטח גוף כווה במבוגר: ראש 9%, כל יד 9%, חזית הגוף 18%, גב הגוף 18%, כל רגל 18%, מפשעה 1%.' },
  { topic: 'שרשרת ההישרדות', fact: 'Chain of Survival: זיהוי מוקדם והפעלת מד"א, החייאה מוקדמת (CPR), דפיברילציה מוקדמת, טיפול מתקדם, טיפול פוסט-החייאה.' },
  { topic: 'קצב ועומק לחיצות חזה במבוגר', fact: 'קצב 100-120 לחיצות בדקה, בעומק 5-6 ס"מ, עם החזרה מלאה של בית החזה בין לחיצות.' },
  { topic: 'טווח דופק תקין למבוגר במנוחה', fact: '60-100 פעימות בדקה.' },
  { topic: 'טווח נשימות תקין למבוגר במנוחה', fact: '12-20 נשימות בדקה.' },
  { topic: 'לחץ דם תקין למבוגר', fact: 'בסביבות 120/80 מ"מ כספית; יתר לחץ דם מוגדר בדרך כלל מעל 140/90.' },
  { topic: 'ריווי חמצן תקין (SpO2)', fact: '94-100% נחשב תקין באוויר החדר; מתחת ל-94% מעיד על היפוקסמיה.' },
  { topic: 'טווח סוכר תקין בדם', fact: 'כ-70-100 מ"ג/ד"ל בצום; מתחת ל-70 = היפוגליקמיה, מעל 180-200 (לא בצום) = היפרגליקמיה משמעותית.' },

  // ── מחלות ומצבים נפוצים (חשוב להכיר) ──
  { topic: 'שבץ איסכמי לעומת המורגי', fact: 'שבץ איסכמי (כ-85% מהמקרים) נגרם מחסימת כלי דם בקריש; שבץ המורגי (כ-15%) נגרם מדימום מכלי דם שנקרע במוח.' },
  { topic: 'STEMI לעומת NSTEMI', fact: 'STEMI = אוטם שריר הלב עם עליית מקטע ST ב-ECG, המעיד על חסימה מלאה של עורק כלילי; NSTEMI = אוטם ללא עליית ST, לרוב חסימה חלקית.' },
  { topic: 'סוכרת סוג 1 לעומת סוג 2', fact: 'סוג 1 — הלבלב אינו מייצר אינסולין כלל (אוטואימוני, לרוב מאובחן בילדות); סוג 2 — תנגודת לאינסולין או ייצור לא מספיק (לרוב נרכש, קשור להשמנה וגנטיקה).' },
  { topic: 'אסתמה לעומת COPD', fact: 'אסתמה — היצרות סימפונות הפיכה, לרוב מגיל צעיר, מגיבה היטב למרחיבי סימפונות; COPD — פגיעה כרונית בלתי הפיכה (לרוב מעישון), מופיעה בגיל מבוגר יותר.' },
  { topic: 'אנפילקסיס — הגדרה', fact: 'תגובה אלרגית מערכתית, חריפה ומסכנת חיים, עם מעורבות של יותר ממערכת אחת בגוף (למשל עור, נשימה ומחזור דם יחד).' },
  { topic: 'אלח דם (Sepsis) — הגדרה', fact: 'תגובה מערכתית מסכנת חיים לזיהום, הגורמת לפגיעה באיברים; מאופיינת לרוב בחום/היפותרמיה, דופק מהיר, נשימה מהירה ולחץ דם נמוך.' },
  { topic: 'סוגי הלם עיקריים', fact: 'היפוולמי (איבוד נוזלים/דם), קרדיוגני (כשל שאיבת הלב), דיסטריביוטיבי (ספטי/אנפילקטי/נוירוגני — הרחבת כלי דם), אובסטרוקטיבי (חסימה מכנית של זרימת הדם).' },
  { topic: 'הלם מפוצה לעומת לא מפוצה', fact: 'הלם מפוצה — לחץ הדם עדיין תקין בזכות מנגנוני פיצוי (דופק מהיר, כיווץ כלי דם); הלם לא מפוצה — לחץ הדם כבר יורד, מצב קריטי.' },
  { topic: 'דרגות כוויה', fact: 'דרגה ראשונה — פגיעה באפידרמיס בלבד (אדמומיות); דרגה שנייה — מגיעה לדרמיס (שלפוחיות); דרגה שלישית — פגיעה בכל עובי העור (עור לבן/משוחם, ללא כאב).' },
  { topic: 'שלבי היפותרמיה', fact: 'קלה (35-32°C) — רעד ובלבול קל; בינונית (32-28°C) — הפסקת רעד, ירידה בהכרה; קשה (מתחת ל-28°C) — סיכון גבוה להפרעות קצב ודום לב.' },
  { topic: 'אנגינה לעומת אוטם שריר הלב', fact: 'אנגינה — כאב חזה זמני עקב אספקת חמצן לא מספקת ללב במאמץ, חולף במנוחה/בניטרו; אוטם — חסימה ממשית הגורמת לנזק בלתי הפיך לשריר הלב, אינו חולף במנוחה.' },
  { topic: 'פרכוס חום (Febrile Seizure)', fact: 'פרכוס אצל ילד צעיר (לרוב 6 חודשים עד 5 שנים) הנגרם מעליית חום מהירה, ללא זיהום או פגיעה במערכת העצבים המרכזית.' },
  { topic: 'הערכה ראשונית לעומת משנית', fact: 'הערכה ראשונית — זיהוי ותיקון מיידי של איומי חיים (ABCDE); הערכה משנית — בדיקה מפורטת מכף רגל ועד ראש לאחר ייצוב המצב הדחוף.' },
  { topic: 'תמרון היימליך', fact: 'Heimlich Maneuver — לחיצות בטן תת-אפיגסטריות לפינוי חסימת נתיב אוויר מגוף זר במבוגר בהכרה.' },
]

function buildConceptPrompt(today: string): string {
  let hash = 0
  for (let i = 0; i < today.length; i++) hash = (hash * 71 + today.charCodeAt(i)) >>> 0
  const entry = CONCEPT_POOL[hash % CONCEPT_POOL.length]

  return `אתה מדריך פרמדיק בכיר ישראלי. משימתך: צור שאלת MCQ אינטראקטיבית על "מושג היום" — טריוויה באנטומיה ובמינוח רפואי לחובשים ולפרמדיקים ישראלים.
נושא היום: ${entry.topic}.
העובדה הנכונה (חובה להתבסס עליה בדיוק, ללא סטייה): ${entry.fact}
חובה לבנות שאלת MCQ אחת סביב הנושא הזה בלבד, שהתשובה הנכונה שלה תואמת בדיוק את העובדה שסופקה. ערבב את מיקום התשובה הנכונה — correct_index לא תמיד 0.
3 המסיחות חייבות להיות שגויות אך סבירות (לדוגמה: סדר הפוך, מספר שגוי, מבנה דומה אך שגוי) — לא אבסורדיות.
שפה: עברית רפואית מקצועית, תמציתית וברורה.
${HEBREW_RULES}
פלט JSON בלבד, ללא markdown:
{
  "topic": "${entry.topic}",
  "question": "שאלת MCQ ברורה על ${entry.topic}",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "explanation": "הסבר קצר (1-2 משפטים) המבוסס על העובדה שסופקה"
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
${HEBREW_RULES}
המסיחים: קרובים מאוד למשמעות האמיתית של הקיצור — הבדל של מילה אחת או סדר מילים — כך שהשאלה מכשילה גם מי שמכיר את הקיצור באופן שטחי.
פלט JSON בלבד, ללא markdown:
{
  "abbreviation": "הקיצור",
  "question": "מה המשמעות של [קיצור]?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "explanation": "הסבר קצר (1-2 משפטים) — משמעות הקיצור ושימושו הקליני"
}`
}

function buildRedFlagPrompt(recentTopics: string[], todayTopics: string[]): string {
  const avoidSection = recentTopics.length > 0
    ? `\nנושאים שנשאלו לאחרונה — חובה לבחור נושא שונה לחלוטין: ${recentTopics.join(', ')}.\n`
    : ''
  return `אתה מדריך פרמדיק בכיר ישראלי. צור מקרה חירום קצר שבו יש לזהות סימן אדום קריטי מסכן חיים.
סבב בין הנושאים הבאים: טראומה, קרדיולוגיה, נשימה, נוירולוגיה, חירום סביבתי, רעלנות, ילדים, אינטרנה. לא יותר מ-25% מהשאלות יהיו מאותו תחום.
המקרה: תיאור ספציפי — גיל, מנגנון/תלונה, סימנים חיוניים, תסמינים. 2-3 משפטים.
ערבב את מיקום התשובה הנכונה — correct_index לא תמיד 0.
${HEBREW_RULES}
${DIFFICULTY_RULES}
${avoidSection}${buildTodayTopicsSection(todayTopics)}
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

function buildSpotErrorPrompt(recentTopics: string[], todayTopics: string[]): string {
  const avoidSection = recentTopics.length > 0
    ? `\nנושאים שנשאלו לאחרונה — חובה לבחור נושא שונה לחלוטין: ${recentTopics.join(', ')}.\n`
    : ''
  return `אתה מדריך פרמדיק בכיר ישראלי. משימתך: כתוב תרחיש קליני ריאליסטי המכיל טעות מקצועית אחת — מוסתרת היטב בתוך נרטיב שנראה שלם ומקצועי.

1. פתח עם משפט שיגור: "הוזנק לקריאה על [גבר/אישה] כבן/כבת [גיל] ב[מקום]"
2. תאר ההתערבות (3-4 משפטים) — כולל פעולה אחת שגויה לפי הפרוטוקולים בישראל, מוסתרת בין פרטים נכונים. כלול לפחות פרט אחד שנראה חשוד אך נכון לחלוטין (הסחת דעת).
3. שאלה: "מה הטעות המקצועית שזוהתה בטיפול?"
4. 4 תשובות: אחת היא הטעות האמיתית, השאר — שגיאות שלא קרו או פעולות שנראות חשודות אך נכונות. המסיחים משכנעים ולא ניתנים לפסילה קלה.
5. הסבר (2-3 משפטים): הטעות, הנזק, והנכון לפי הפרוטוקולים בישראל.
6. שפה: עברית רפואית מקצועית גבוהה.
${HEBREW_RULES}
${DIFFICULTY_RULES}
${avoidSection}${buildTodayTopicsSection(todayTopics)}
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

function buildRadioChallengePrompt(recentTopics: string[], todayTopics: string[]): string {
  const avoidSection = recentTopics.length > 0
    ? `\nנושאים שנשאלו לאחרונה — חובה לבחור נושא שונה לחלוטין: ${recentTopics.join(', ')}.\n`
    : ''
  return `אתה מדריך פרמדיק בכיר ישראלי. משימתך: כתוב תרחיש מורכב וכאוטי ו-4 סיכומי SBAR.

1. פתח עם משפט שיגור: "הוזנק לקריאה על [גבר/אישה] כבן/כבת [גיל] ב[מקום]"
2. תאר תרחיש עם ממצאים מרובים (4-5 משפטים).
3. שאלה: "מה הסיכום הטוב ביותר בפורמט SBAR לדיווח לרופא המאשר?"
4. אחת אידיאלית, שלוש עם פגמים עדינים וקשים לזיהוי (מידע חסר, סדר לא נכון, הערכה שגויה).
5. הסבר (2-3 משפטים).
${HEBREW_RULES}
${DIFFICULTY_RULES}
${avoidSection}${buildTodayTopicsSection(todayTopics)}
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
]

function getImprovisedSettingForDate(dateStr: string): string {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0
  return IMPROVISED_SETTINGS[hash % IMPROVISED_SETTINGS.length]
}

function getImprovisedTopicForDate(dateStr: string): string {
  let hash = 17
  for (let i = 0; i < dateStr.length; i++) hash = (hash * 37 + dateStr.charCodeAt(i)) >>> 0
  return IMPROVISED_TOPICS[hash % IMPROVISED_TOPICS.length]
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

function buildImprovisedPrompt(dateStr: string, _recentTopics: string[]): string {
  const setting = getImprovisedSettingForDate(dateStr)
  const topic = getImprovisedTopicForDate(dateStr)

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
${HEBREW_RULES}
${DIFFICULTY_RULES}

פלט JSON תקני בלבד, ללא markdown:
{
  "scenario": "תיאור (2-3 משפטים — גיל, מין, ${topic} ב${setting}, מה זמין)",
  "question": "מה הפעולה המאולתרת הטובה ביותר שניתן לבצע כאן?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "explanation": "הסבר (2-3 משפטים) — מדוע זהו הפתרון הנכון ואיך הוא עוזר",
  "topic_tag": "${topic}"
}`
}

// ─── Med bag helpers ──────────────────────────────────────────────────────────
// Must stay identical to MED_BAG_SCENARIOS in DailyChallengeModal.tsx.

const MED_BAG_SCENARIOS = [
  'ערפול הכרה', 'קוצר נשימה', 'כאב חזה', 'נפילה בבית',
  'חולשה כללית פתאומית', 'סחרחורת', 'בחילות והקאות ממושכות', 'כאבי בטן חדים',
  'בלבול פתאומי / שינוי התנהגות', 'חום גבוה', 'כאבי גב פתאומיים', 'פרכוס',
  'אי-שקט וחרדה קשה', 'קוצר נשימה במאמץ קל', 'ירידה חדה בתפקוד היומיומי',
  'פגיעה קלה בבית (חבלה/שריטה) עם ממצא נלווה חשוד', 'עייפות קיצונית ואדישות',
  'דופק לא סדיר מורגש',
]

function getTodayMedBagScenario(dateStr: string): string {
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) hash = (hash * 37 + dateStr.charCodeAt(i)) >>> 0
  return MED_BAG_SCENARIOS[hash % MED_BAG_SCENARIOS.length]
}

async function getRecentMedBagTopics(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase
    .from('daily_questions')
    .select('content')
    .in('question_type', ['bls', 'als', 'spot_error', 'med_bag', 'red_flag'])
    .order('question_date', { ascending: false })
    .limit(75)
  if (!data) return []
  // deno-lint-ignore no-explicit-any
  return data.map((r: any) => r.content?.topic_tag as string).filter(Boolean)
}

function buildMedBagPrompt(dateStr: string, recentTopics: string[]): string {
  const avoidSection = recentTopics.length > 0
    ? `\nנושאים שנשאלו לאחרונה — חובה לבחור נושא שונה לחלוטין: ${recentTopics.join(', ')}.\n`
    : ''
  const scenarioTheme = getTodayMedBagScenario(dateStr)
  return `אתה מדריך פרמדיק בכיר ישראלי. משימה: צור אתגר "תיק התרופות" — חובש מגיע לביתו של מטופל ומוצא את תרופותיו הכרוניות על השולחן. מהתרופות בלבד יש לנתח את הרקע הרפואי ולזהות את הסכנה הקריטית לטיפול.

כללים מחייבים:
1. סיטואציה (2 משפטים): תרחיש ביתי מציאותי סביב הנושא **${scenarioTheme}** (חובה להשתמש בנושא הזה). גוון בכל יום מחדש: גיל ספציפי בטווח רחב — מבוגר צעיר (25-40), גיל ביניים (41-64) או קשיש (65+), לא תמיד קשיש; מין (גבר/אישה); וסוג מגורים (דירה בעיר, בית פרטי, דיור מוגן, קיבוץ, יישוב כפרי). המשפחה/הסביבה אינם יודעים לדווח על רקע רפואי.
2. תרופות: רשימה של 3-4 תרופות כרוניות ביתיות בלבד (לא תרופות חירום ולא עירויים). בחר אך ורק מהרשימה הבאה — תרופות ישראליות נפוצות בבתי מטופלים (רשימת "תרופות נפוצות" הרשמית של האפליקציה, יש לבחור מתוכה בלבד): ${COMMON_MED_POOL.join(', ')}
3. שאלה: "לפי תיק התרופות, מאיזה רקע רפואי עליך לחשוש במיוחד בטיפול בו?"
4. 4 תשובות MCQ: אחת נכונה (הסכנה הקריטית המרכזית הנובעת מהשילוב), שלוש מסיחות סבירות לחובש מתחיל. ערבב מיקום התשובה — correct_index לא תמיד 0.
5. הסבר (2-3 משפטים): אילו תרופות מצביעות על מה, מהי הסכנה הקריטית הספציפית, ומה יש לדווח לצוות המקבל.
6. topic_tag: נושא קצר בעברית (1-3 מילים) לגיוון.
7. med_descriptions: עבור כל תרופה ברשימה — משפט אחד קצר בעברית שמסביר למה היא נועדה (מה היא מטפלת). פשוט ובסיסי, לא טכני.
${HEBREW_RULES}
${DIFFICULTY_RULES}
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
}`
}

// ─── Active diagnoses helpers ─────────────────────────────────────────────────
// Must stay identical to DIAGNOSIS_POOL in src/features/hub/data/activeDiagnosesPool.ts.

interface DiagnosisEntry { abbr: string; en: string; he: string }

const DIAGNOSIS_POOL: DiagnosisEntry[] = [
  { abbr: 'HTN', en: 'Hypertension', he: 'יתר לחץ דם' },
  { abbr: 'IHD', en: 'Ischemic Heart Disease', he: 'מחלת לב איסכמית' },
  { abbr: 's/p MI', en: 'Myocardial Infarction', he: 'אוטם שריר הלב (בעבר)' },
  { abbr: 'CHF', en: 'Congestive Heart Failure', he: 'אי ספיקת לב' },
  { abbr: 'AFib', en: 'Atrial Fibrillation', he: 'פרפור עליות' },
  { abbr: 's/p CABG', en: 'Coronary Artery Bypass Graft', he: 'ניתוח מעקפים (בעבר)' },
  { abbr: 'Pacemaker', en: 'Pacemaker', he: 'קוצב לב' },
  { abbr: 's/p PTCA', en: 'Percutaneous Coronary Angioplasty', he: 'צנתור לב — בלון/תומכן (בעבר)' },
  { abbr: 'Angina', en: 'Angina Pectoris', he: 'תעוקת חזה' },
  { abbr: 'VHD', en: 'Valvular Heart Disease', he: 'מחלת מסתמי לב' },
  { abbr: 'PVD', en: 'Peripheral Vascular Disease', he: 'מחלת כלי דם היקפיים' },
  { abbr: 'AAA', en: 'Abdominal Aortic Aneurysm', he: 'מפרצת אבי העורקים הבטני' },
  { abbr: 'DVT', en: 'Deep Vein Thrombosis', he: 'פקקת ורידים עמוקים' },
  { abbr: 'ICD', en: 'Implantable Cardioverter Defibrillator', he: 'דפיברילטור מושתל' },
  { abbr: 'Cardiomyopathy', en: 'Cardiomyopathy', he: 'מיופתיה של שריר הלב' },
  { abbr: 'Pericarditis', en: 'Pericarditis', he: 'דלקת קרום הלב' },
  { abbr: 'Endocarditis', en: 'Endocarditis', he: 'דלקת פנים הלב' },
  { abbr: 'HLD', en: 'Hyperlipidemia', he: 'כולסטרול גבוה (היפרליפידמיה)' },
  { abbr: 'SVT', en: 'Paroxysmal Supraventricular Tachycardia', he: 'טכיקרדיה על-חדרית התקפית' },
  { abbr: 'Long QT', en: 'Long QT Syndrome', he: 'תסמונת QT ארוך' },
  { abbr: 'Ao. Stenosis', en: 'Aortic Valve Stenosis', he: 'היצרות מסתם אאורטלי' },
  { abbr: 'MR', en: 'Mitral Regurgitation', he: 'אי ספיקת מסתם מיטרלי' },
  { abbr: 'Claudication', en: 'Intermittent Claudication', he: 'צליעה לסירוגין' },
  { abbr: 'Asthma', en: 'Asthma', he: 'אסתמה' },
  { abbr: 'COPD', en: 'Chronic Obstructive Pulmonary Disease', he: 'מחלת ריאות חסימתית כרונית' },
  { abbr: 'OSA', en: 'Obstructive Sleep Apnea', he: 'דום נשימה חסימתי בשינה' },
  { abbr: 'Home O2', en: 'Home Oxygen Therapy', he: 'טיפול בחמצן ביתי' },
  { abbr: 's/p PE', en: 'Pulmonary Embolism', he: 'תסחיף ריאתי (בעבר)' },
  { abbr: 'Pulm. Fibrosis', en: 'Pulmonary Fibrosis', he: 'פיברוזיס ריאתי' },
  { abbr: 'Bronchiectasis', en: 'Bronchiectasis', he: 'ברונכיאקטזיס' },
  { abbr: 's/p TB', en: 'Tuberculosis', he: 'שחפת (בעבר)' },
  { abbr: 'Lung Ca', en: 'Lung Cancer', he: 'סרטן ריאה' },
  { abbr: 'Trach.', en: 'Tracheostomy', he: 'פיום קנה' },
  { abbr: 'Sarcoidosis', en: 'Sarcoidosis', he: 'סרקואידוזיס' },
  { abbr: 'Pulm. HTN', en: 'Pulmonary Hypertension', he: 'יתר לחץ דם ריאתי' },
  { abbr: 's/p CVA', en: 'Cerebrovascular Accident', he: 'שבץ מוחי (בעבר)' },
  { abbr: 's/p TIA', en: 'Transient Ischemic Attack', he: 'אירוע איסכמי חולף (בעבר)' },
  { abbr: 'Epilepsy', en: 'Epilepsy', he: 'אפילפסיה' },
  { abbr: 'Dementia', en: 'Dementia', he: 'שיטיון' },
  { abbr: "Alzheimer's", en: "Alzheimer's Disease", he: 'מחלת אלצהיימר' },
  { abbr: "Parkinson's", en: "Parkinson's Disease", he: 'מחלת פרקינסון' },
  { abbr: 'MS', en: 'Multiple Sclerosis', he: 'טרשת נפוצה' },
  { abbr: 'Migraine', en: 'Migraine', he: 'מיגרנה' },
  { abbr: 'Neuropathy', en: 'Peripheral Neuropathy', he: 'נוירופתיה היקפית' },
  { abbr: 'VP Shunt', en: 'Ventriculoperitoneal Shunt', he: 'שאנט מוחי' },
  { abbr: 's/p TBI', en: 'Traumatic Brain Injury', he: 'פגיעת ראש טראומטית (בעבר)' },
  { abbr: 'Myasthenia Gravis', en: 'Myasthenia Gravis', he: 'מיאסתניה גרביס' },
  { abbr: 'ALS', en: 'Amyotrophic Lateral Sclerosis', he: 'טרשת צידית חד-גבית' },
  { abbr: 'Cognitive Dis.', en: 'Cognitive Disorder', he: 'הפרעה קוגניטיבית' },
  { abbr: 'Guillain-Barré', en: 'Guillain-Barré Syndrome', he: 'תסמונת גיאן-בארה' },
  { abbr: "Huntington's", en: "Huntington's Disease", he: 'מחלת הנטינגטון' },
  { abbr: 'Trigeminal Neuralgia', en: 'Trigeminal Neuralgia', he: 'נוירלגיה של העצב השלישי' },
  { abbr: 'DM1', en: 'Diabetes Mellitus Type 1', he: 'סוכרת נעורים (סוג 1)' },
  { abbr: 'DM2', en: 'Diabetes Mellitus Type 2', he: 'סוכרת סוג 2' },
  { abbr: 'Hypothyroid', en: 'Hypothyroidism', he: 'תת-פעילות בלוטת התריס' },
  { abbr: 'Hyperthyroid', en: 'Hyperthyroidism', he: 'יתר-פעילות בלוטת התריס' },
  { abbr: 'Obesity', en: 'Obesity', he: 'השמנת יתר' },
  { abbr: 'Gout', en: 'Gout', he: 'גאוט (שיגדון)' },
  { abbr: 'Osteoporosis', en: 'Osteoporosis', he: 'אוסטיאופורוזיס' },
  { abbr: 'Adrenal Insuff.', en: 'Adrenal Insufficiency', he: 'אי ספיקת יותרת הכליה' },
  { abbr: 'Metabolic Syndrome', en: 'Metabolic Syndrome', he: 'תסמונת מטבולית' },
  { abbr: 'Vit. D Deficiency', en: 'Vitamin D Deficiency', he: 'חוסר ויטמין D' },
  { abbr: 'Hyperparathyroidism', en: 'Hyperparathyroidism', he: 'יתר-פעילות בלוטת יותרת התריס' },
  { abbr: "Cushing's", en: "Cushing's Syndrome", he: 'תסמונת קושינג' },
  { abbr: "Addison's", en: "Addison's Disease", he: 'מחלת אדיסון' },
  { abbr: 'CRF', en: 'Chronic Renal Failure', he: 'אי ספיקת כליות כרונית' },
  { abbr: 'ESRD', en: 'End Stage Renal Disease (Dialysis)', he: 'אי ספיקת כליות סופנית (דיאליזה)' },
  { abbr: 'Nephrolithiasis', en: 'Kidney Stones', he: 'אבנים בכליות' },
  { abbr: 'BPH', en: 'Benign Prostatic Hyperplasia', he: 'הגדלה שפירה של הערמונית' },
  { abbr: 'Recurrent UTI', en: 'Recurrent Urinary Tract Infections', he: 'זיהומים חוזרים בדרכי השתן' },
  { abbr: 'Neurogenic Bladder', en: 'Neurogenic Bladder', he: 'שלפוחית נוירוגנית' },
  { abbr: 'Foley Catheter', en: 'Indwelling Urinary Catheter', he: 'קטטר שתן קבוע' },
  { abbr: 'PKD', en: 'Polycystic Kidney Disease', he: 'מחלת כליות פוליציסטית' },
  { abbr: 'Hydronephrosis', en: 'Hydronephrosis', he: 'הידרונפרוזיס' },
  { abbr: 'GERD', en: 'Gastroesophageal Reflux Disease', he: 'ריפלוקס קיבתי-ושטי' },
  { abbr: 'PUD', en: 'Peptic Ulcer Disease', he: 'כיב פפטי' },
  { abbr: 'IBD', en: 'Inflammatory Bowel Disease', he: 'מחלת מעי דלקתית' },
  { abbr: "Crohn's", en: "Crohn's Disease", he: 'מחלת קרוהן' },
  { abbr: 'UC', en: 'Ulcerative Colitis', he: 'קוליטיס כיבית' },
  { abbr: 'Cirrhosis', en: 'Liver Cirrhosis', he: 'שחמת הכבד' },
  { abbr: 'Chronic Hepatitis', en: 'Chronic Hepatitis', he: 'דלקת כבד כרונית' },
  { abbr: 'Cholelithiasis', en: 'Gallstones', he: 'אבני מרה' },
  { abbr: 'Celiac', en: 'Celiac Disease', he: 'מחלת צליאק' },
  { abbr: 's/p Bariatric Surgery', en: 'Bariatric Surgery', he: 'ניתוח בריאטרי (בעבר)' },
  { abbr: 'Diverticulitis', en: 'Recurrent Diverticulitis', he: 'דיברטיקוליטיס חוזר' },
  { abbr: 'Chronic Pancreatitis', en: 'Chronic Pancreatitis', he: 'דלקת לבלב כרונית' },
  { abbr: 'Anemia', en: 'Chronic Anemia', he: 'אנמיה כרונית' },
  { abbr: 'Leukemia', en: 'Leukemia', he: 'לוקמיה' },
  { abbr: 'Lymphoma', en: 'Lymphoma', he: 'לימפומה' },
  { abbr: 'Multiple Myeloma', en: 'Multiple Myeloma', he: 'מיאלומה נפוצה' },
  { abbr: 'Thrombocytopenia', en: 'Thrombocytopenia', he: 'ירידה בטסיות דם' },
  { abbr: 'Hemophilia', en: 'Hemophilia', he: 'המופיליה' },
  { abbr: 'Sickle Cell', en: 'Sickle Cell Disease', he: 'אנמיה חרמשית' },
  { abbr: 'Malignancy', en: 'Active Malignancy', he: 'גידול סרטני פעיל' },
  { abbr: 'Breast Ca', en: 'Breast Cancer', he: 'סרטן שד' },
  { abbr: 'Colon Ca', en: 'Colorectal Cancer', he: 'סרטן המעי הגס' },
  { abbr: 'Depression', en: 'Major Depressive Disorder', he: 'דיכאון' },
  { abbr: 'Anxiety', en: 'Anxiety Disorder', he: 'חרדה' },
  { abbr: 'Bipolar', en: 'Bipolar Disorder', he: 'הפרעה דו-קוטבית' },
  { abbr: 'Schizophrenia', en: 'Schizophrenia', he: 'סכיזופרניה' },
  { abbr: 'PTSD', en: 'Post-Traumatic Stress Disorder', he: 'הפרעת דחק פוסט-טראומטית' },
  { abbr: 'OCD', en: 'Obsessive-Compulsive Disorder', he: 'הפרעה טורדנית-כפייתית' },
  { abbr: 'Substance Abuse', en: 'Substance Use Disorder', he: 'שימוש כרוני בסמים' },
  { abbr: 'Alcohol Use Disorder', en: 'Alcohol Use Disorder', he: 'שימוש כרוני באלכוהול' },
  { abbr: 'Eating Disorder', en: 'Eating Disorder', he: 'הפרעת אכילה' },
  { abbr: 'ADHD', en: 'Attention Deficit Hyperactivity Disorder', he: 'הפרעת קשב וריכוז' },
  { abbr: 'Panic Disorder', en: 'Panic Disorder', he: 'הפרעת פאניקה' },
  { abbr: 'Personality Disorder', en: 'Personality Disorder', he: 'הפרעת אישיות' },
  { abbr: 'RA', en: 'Rheumatoid Arthritis', he: 'דלקת מפרקים שגרונית' },
  { abbr: 'OA', en: 'Osteoarthritis', he: 'ניוון מפרקים (אוסטיאוארתריטיס)' },
  { abbr: 'Lupus', en: 'Systemic Lupus Erythematosus', he: 'זאבת' },
  { abbr: 'Fibromyalgia', en: 'Fibromyalgia', he: 'פיברומיאלגיה' },
  { abbr: 'Ankylosing Spondylitis', en: 'Ankylosing Spondylitis', he: 'ספונדיליטיס מקשחת' },
  { abbr: 's/p Hip Replacement', en: 'Total Hip Replacement', he: 'החלפת מפרק ירך (בעבר)' },
  { abbr: 's/p Knee Replacement', en: 'Total Knee Replacement', he: 'החלפת מפרק ברך (בעבר)' },
  { abbr: 'Chronic Osteomyelitis', en: 'Chronic Osteomyelitis', he: 'דלקת עצם כרונית' },
  { abbr: 'Scoliosis', en: 'Scoliosis', he: 'עקמת' },
  { abbr: 'Chronic Back Pain', en: 'Chronic Low Back Pain', he: 'כאבי גב תחתון כרוניים' },
  { abbr: 'Spinal Stenosis', en: 'Spinal Stenosis', he: 'היצרות תעלת השדרה' },
  { abbr: 'Herniated Disc', en: 'Herniated Disc', he: 'בקע דיסק' },
  { abbr: 'Hx Anaphylaxis', en: 'History of Anaphylaxis', he: 'היסטוריה של אנפילקסיס' },
  { abbr: 'Food Allergy', en: 'Severe Food Allergy', he: 'אלרגיה חמורה למזון' },
  { abbr: 'Drug Allergy', en: 'Drug Allergy', he: 'אלרגיה לתרופות' },
  { abbr: 'Psoriasis', en: 'Psoriasis', he: 'פסוריאזיס' },
  { abbr: 'Immunosuppressed', en: 'Immunosuppression', he: 'דיכוי חיסוני' },
  { abbr: 'HIV', en: 'HIV Infection', he: 'נשא HIV' },
  { abbr: "Sjögren's", en: "Sjögren's Syndrome", he: 'תסמונת שגרן' },
  { abbr: 'Scleroderma', en: 'Scleroderma', he: 'טרשת עור' },
  { abbr: 'Pregnancy', en: 'Current Pregnancy', he: 'הריון נוכחי' },
  { abbr: 's/p Hysterectomy', en: 'Hysterectomy', he: 'כריתת רחם (בעבר)' },
  { abbr: 'Menopause', en: 'Menopause', he: 'גיל המעבר' },
  { abbr: 'Smoking', en: 'Chronic Smoking', he: 'עישון כרוני' },
  { abbr: 'Bedridden', en: 'Bedridden / Immobile', he: 'מרותק למיטה' },
  { abbr: 'Fall Risk', en: 'High Fall Risk', he: 'סיכון גבוה לנפילות' },
  { abbr: 'Malnutrition', en: 'Malnutrition', he: 'תת-תזונה' },
  { abbr: 'Glaucoma', en: 'Glaucoma', he: 'גלאוקומה' },
  { abbr: 's/p Cataract Surgery', en: 'Cataract Surgery', he: 'ניתוח קטרקט (בעבר)' },
  { abbr: 'Hearing Impairment', en: 'Hearing Impairment', he: 'לקות שמיעה' },
  { abbr: 'Legal Blindness', en: 'Legal Blindness', he: 'עיוורון' },
  { abbr: 'Recurrent Vertigo', en: 'Recurrent Vertigo', he: 'סחרחורות חוזרות' },
  { abbr: "Ménière's", en: "Ménière's Disease", he: 'מחלת מנייר' },
  { abbr: 'Diabetic Retinopathy', en: 'Diabetic Retinopathy', he: 'רטינופתיה סוכרתית' },
  { abbr: 'Down Syndrome', en: 'Down Syndrome', he: 'תסמונת דאון' },
  { abbr: 'Cerebral Palsy', en: 'Cerebral Palsy', he: 'שיתוק מוחין' },
  { abbr: 'Autism', en: 'Autism Spectrum Disorder', he: 'הפרעת קשת האוטיזם' },
  { abbr: 'Congenital Heart Disease', en: 'Congenital Heart Disease', he: 'מחלת לב מולדת' },
  { abbr: 'Cystic Fibrosis', en: 'Cystic Fibrosis', he: 'פיברוזיס כיסתי' },
  { abbr: 'Developmental Delay', en: 'Developmental Delay', he: 'עיכוב התפתחותי' },
  { abbr: 'Recurrent Sepsis', en: 'Recurrent Sepsis', he: 'אלח דם חוזר' },
  { abbr: 'MRSA Carrier', en: 'MRSA Carrier', he: 'נשא MRSA' },
  { abbr: 'Recurrent Cellulitis', en: 'Recurrent Cellulitis', he: 'זיהומי עור חוזרים (צלוליטיס)' },
  { abbr: 'Pressure Ulcer', en: 'Chronic Pressure Ulcer', he: 'פצע לחץ כרוני' },
  { abbr: 'Chronic Wound', en: 'Chronic Non-Healing Wound', he: 'פצע כרוני שאינו מחלים' },
  { abbr: 'Lymphedema', en: 'Chronic Lymphedema', he: 'בצקת לימפטית כרונית' },
  { abbr: 's/p Amputation', en: 'Limb Amputation', he: 'קטיעת גפה (בעבר)' },
  { abbr: 's/p Organ Transplant', en: 'Organ Transplant', he: 'השתלת איבר (בעבר)' },
]

// Deterministic "active diagnoses" question — no story, no AI call, so the "correct"
// option is always guaranteed correct. Must stay identical to buildActiveDxQuestion()
// in DailyChallengeModal.tsx.
function hashStr(s: string, mult: number): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = (hash * mult + s.charCodeAt(i)) >>> 0
  return hash
}

const PERMUTATIONS_4 = [
  [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 2, 3, 1], [0, 3, 1, 2], [0, 3, 2, 1],
  [1, 0, 2, 3], [1, 0, 3, 2], [1, 2, 0, 3], [1, 2, 3, 0], [1, 3, 0, 2], [1, 3, 2, 0],
  [2, 0, 1, 3], [2, 0, 3, 1], [2, 1, 0, 3], [2, 1, 3, 0], [2, 3, 0, 1], [2, 3, 1, 0],
  [3, 0, 1, 2], [3, 0, 2, 1], [3, 1, 0, 2], [3, 1, 2, 0], [3, 2, 0, 1], [3, 2, 1, 0],
]

function buildActiveDxQuestion(dateStr: string): ActiveDxQ {
  const poolSize = DIAGNOSIS_POOL.length

  const baseIdx = hashStr(dateStr, 41) % poolSize
  const indices = [baseIdx]
  for (let salt = 0; indices.length < 4; salt++) {
    const idx = hashStr(`${dateStr}_pick_${salt}`, 43) % poolSize
    if (!indices.includes(idx)) indices.push(idx)
  }
  const entries = indices.map((i) => DIAGNOSIS_POOL[i])
  const todayEntry = entries[0]

  const dispPerm = PERMUTATIONS_4[hashStr(`${dateStr}_disp`, 47) % 24]
  const shown = dispPerm.map((i) => entries[i])
  const correctAnswer = shown.map((e) => e.he).join(', ')

  const decoyPermIdxs: number[] = []
  for (let salt = 0; decoyPermIdxs.length < 3; salt++) {
    const idx = hashStr(`${dateStr}_decoy_${salt}`, 53) % 24
    if (idx !== 0 && !decoyPermIdxs.includes(idx)) decoyPermIdxs.push(idx)
  }
  const wrongAnswers = decoyPermIdxs.map((pIdx) =>
    PERMUTATIONS_4[pIdx].map((i) => shown[i].he).join(', '),
  )

  const correctIndex = hashStr(`${dateStr}_pos`, 67) % 4
  const options = ['', '', '', '']
  let wrongCursor = 0
  for (let i = 0; i < 4; i++) {
    options[i] = i === correctIndex ? correctAnswer : wrongAnswers[wrongCursor++]
  }

  const explanation =
    shown.map((e) => `${e.abbr} = ${e.he}`).join(' | ') +
    `. שימו לב במיוחד ל-${todayEntry.abbr} (${todayEntry.en}) — ${todayEntry.he}.`

  const diagnosisMeanings: Record<string, string> = {}
  shown.forEach((e) => { diagnosisMeanings[e.abbr] = e.he })

  return {
    diagnoses: shown.map((e) => e.abbr),
    diagnosis_meanings: diagnosisMeanings,
    question: 'אילו אבחנות פעילות רשומות למעלה — ומה משמעותן, לפי הסדר?',
    options,
    correct_index: correctIndex,
    explanation,
    topic_tag: todayEntry.abbr,
  }
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

async function generateClinical(type: 'BLS' | 'ALS', supabase: SupabaseClient, todayTopics: string[]): Promise<ClinicalQuestion> {
  const recentTopics = await getRecentClinicalTopics(supabase, type.toLowerCase() as 'bls' | 'als', 30)
  const q = await withRetry(() => parseGeminiJSON<ClinicalQuestion>(buildClinicalPrompt(type, recentTopics, todayTopics)))
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

interface ConceptQ {
  topic: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

async function generateConcept(today: string): Promise<ConceptQ> {
  const c = await withRetry(() => parseGeminiJSON<ConceptQ>(buildConceptPrompt(today)))
  if (!c.topic || !c.question || !Array.isArray(c.options) || c.options.length !== 4 || typeof c.correct_index !== 'number') {
    throw new Error('Invalid concept format')
  }
  return c
}

async function generateAbbreviation(supabase: SupabaseClient): Promise<AbbreviationQ> {
  const used = await getUsedAbbreviations(supabase)
  const a = await withRetry(() => parseGeminiJSON<AbbreviationQ>(buildAbbrPrompt(used)))
  if (!a.abbreviation || !a.question || !Array.isArray(a.options) || a.options.length !== 4) throw new Error('Invalid abbr format')
  return a
}

async function generateRedFlag(supabase: SupabaseClient, todayTopics: string[]): Promise<RedFlagQ> {
  const recentTopics = await getAllRecentTopics(supabase, 15)
  const r = await withRetry(() => parseGeminiJSON<RedFlagQ>(buildRedFlagPrompt(recentTopics, todayTopics)))
  if (!r.scenario || !r.question || !Array.isArray(r.options) || r.options.length !== 4) throw new Error('Invalid red flag format')
  return r
}

async function generateSpotError(supabase: SupabaseClient, todayTopics: string[]): Promise<SpotErrorQ> {
  const recentTopics = await getAllRecentTopics(supabase, 15)
  const q = await withRetry(() => parseGeminiJSON<SpotErrorQ>(buildSpotErrorPrompt(recentTopics, todayTopics)))
  if (!q.dispatch_opener || !q.scenario || !q.question || !Array.isArray(q.options) || q.options.length !== 4) {
    throw new Error('Invalid spot error format')
  }
  return q
}

async function generateRadioChallenge(supabase: SupabaseClient, todayTopics: string[]): Promise<RadioChallengeQ> {
  const recentTopics = await getAllRecentTopics(supabase, 15)
  const q = await withRetry(() => parseGeminiJSON<RadioChallengeQ>(buildRadioChallengePrompt(recentTopics, todayTopics)))
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

interface MedBagQ {
  situation: string
  medications: string[]
  med_descriptions: Record<string, string>
  question: string
  options: string[]
  correct_index: number
  explanation: string
  topic_tag: string
}

async function generateMedBag(supabase: SupabaseClient, today: string): Promise<MedBagQ> {
  const recentTopics = await getRecentMedBagTopics(supabase)
  const q = await withRetry(() => parseGeminiJSON<MedBagQ>(buildMedBagPrompt(today, recentTopics)))
  if (!q.situation || !Array.isArray(q.medications) || q.medications.length < 2 || !q.question || !Array.isArray(q.options) || q.options.length !== 4) {
    throw new Error('Invalid med bag format')
  }
  return q
}

interface ActiveDxQ {
  diagnoses: string[]
  diagnosis_meanings: Record<string, string>
  question: string
  options: string[]
  correct_index: number
  explanation: string
  topic_tag: string
}

// deno-lint-ignore require-await
async function generateActiveDx(today: string): Promise<ActiveDxQ> {
  // Deterministic — no Gemini call, see buildActiveDxQuestion() above.
  return buildActiveDxQuestion(today)
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

  // Topics already chosen today across rubrics — each new question must pick a different one
  const todayTopics: string[] = []

  const categories: Array<{ type: string; generate: () => Promise<unknown> }> = [
    { type: 'bls', generate: () => generateClinical('BLS', supabase, todayTopics) },
    { type: 'als', generate: () => generateClinical('ALS', supabase, todayTopics) },
    { type: 'med_v4', generate: () => generateMed(today) },
    { type: 'abbr', generate: () => generateAbbreviation(supabase) },
    { type: 'improvised', generate: () => generateImprovised(supabase, today) },
    { type: 'red_flag', generate: () => generateRedFlag(supabase, todayTopics) },
    { type: 'spot_error', generate: () => generateSpotError(supabase, todayTopics) },
    { type: 'radio_challenge', generate: () => generateRadioChallenge(supabase, todayTopics) },
    { type: 'med_bag', generate: () => generateMedBag(supabase, today) },
    { type: 'active_dx', generate: () => generateActiveDx(today) },
    { type: 'concept', generate: () => generateConcept(today) },
  ]

  for (const { type, generate } of categories) {
    // Check if today's question already exists (idempotency)
    const { data: existing } = await supabase
      .from('daily_questions')
      .select('id, content')
      .eq('question_date', today)
      .eq('question_type', type)
      .maybeSingle()

    if (existing) {
      // deno-lint-ignore no-explicit-any
      const existingTag = (existing as any).content?.topic_tag as string | undefined
      if (existingTag) todayTopics.push(existingTag)
      results[type] = 'already_exists'
      continue
    }

    try {
      const content = await generate()
      // deno-lint-ignore no-explicit-any
      const tag = (content as any)?.topic_tag as string | undefined
      if (tag) todayTopics.push(tag)
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
