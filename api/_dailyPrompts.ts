// Prompts for the daily-challenge fallback generation, built server-side so that
// /api/gemini never accepts free-form prompt text from the browser.
// Must stay aligned with the constants in supabase/functions/generate-daily-questions/index.ts
import { MED_CATEGORIES } from '../src/features/hub/data/commonMedsData.js';
import { CONCEPT_POOL } from '../src/features/hub/data/medicalConceptsPool.js';
import { pickClinicalFact } from '../src/features/hub/data/clinicalFactsPool.js';

const HEBREW_RULES =
  'כללי עברית — מחייבים: עברית תקנית ומדוקדקת בלבד. אסור בהחלט להשתמש בתרגומי שאילה מאנגלית: לעולם לא "המטופל מציג", "מציגה עם", "מדגים" — ביטויים כאלה אינם קיימים בעברית. במקומם: "המטופל סובל מ...", "המטופל מתלונן על...", "בבדיקתך נמצא...", "בהערכתך ניכר...". ללא תעתיקים מאנגלית: "ריווי חמצן" ולא "סטורציה", "בלבול" ולא "קונפוזיה", "ירידה בהכרה" ולא "סמי הכרה". כל משפט חייב להישמע טבעי לדובר עברית יליד — קרא כל משפט ותקן כל ניסוח שנשמע מתורגם.';

const DIFFICULTY_RULES =
  'רמת קושי — מחייבת: השאלה חייבת להיות קשה, טריקית ומכשילה. הפרט הקליני המכריע מוסתר בין פרטים שגרתיים בתרחיש; כל מסיח נשמע נכון ומקצועי ממבט ראשון ובנוי להכשיל גם משיבים מנוסים. אסור לכתוב שאלה קלה או ישירה שהתשובה עליה מובנת מאליה מקריאת התרחיש.';

// No organisation is ever named in the generated text — the app only says "על פי הפרוטוקולים".
const NO_ORG_RULE =
  'כלל מקור — מחייב: אסור בהחלט להזכיר שם של ארגון, גוף או מסמך כלשהו (ארגוני הצלה, איגודים מקצועיים, משרדי ממשלה, שמות הנחיות או קורסים) — לא בשאלה, לא בתשובות ולא בהסבר. מותר לכתוב רק "על פי הפרוטוקולים". אם אינך בטוח בפרט פרוטוקולי מדויק (מינון, אנרגיה, סף, מסגרת זמן) — אל תבסס עליו את התשובה הנכונה ואל תציין אותו.';

// The correct answer of every protocol-dependent question is pinned to one verified
// fact from clinicalFactsPool.ts — the model only writes the scenario and distractors.
function buildFactAnchor(fact: string): string {
  return `עובדת העוגן — מחייבת, זהו המקור היחיד לתשובה הנכונה: ${fact}
התשובה הנכונה חייבת לנבוע ישירות מעובדת העוגן ולהתאים לה במדויק. אסור לסתור אותה, ואסור להוסיף לתשובה הנכונה או להסבר מינון, אנרגיה, סף או מסגרת זמן שאינם מופיעים בה. אם ידוע לך כלל אחר או ישן יותר — עובדת העוגן גוברת תמיד.`;
}

function buildClinicalPrompt(type: 'BLS' | 'ALS', today: string): string {
  const entry = pickClinicalFact(type === 'BLS' ? 'bls' : 'als', today);
  const scope = type === 'BLS'
    ? 'תחום: BLS בלבד — ללא תרופות ALS, ללא נתיב אוויר מתקדם, ללא פרשנות 12 ערוצים.'
    : 'תחום: ALS — רמת פרמדיק.';

  return (
    `אתה מדריך פרמדיק בכיר ישראלי. תפקידך לאתגר פרמדיקים וחובשים ישראלים עם שאלות קליניות ברמה גבוהה, בעברית רפואית מקצועית.\n\n` +
    `נושא היום (חובה): ${entry.topic}.\n${buildFactAnchor(entry.fact)}\n\n${NO_ORG_RULE}\n\n` +
    `משימה: כתוב תרחיש קליני מאתגר עבור ${type} בעברית רפואית מקצועית גבוהה. התרחיש יכול להיות מקרה שגרתי עם סיבוך עדין, מקרה קצה, או מצב שבו ההחלטה הנכונה דורשת שיפוט שדה מנוסה.\n\n` +
    `כתיבת התרחיש — כללים מחייבים: (1) שפה ניטרלית מקצועית בלבד — ללא קידומות שיגור, ללא מספרי קריאה, ללא "קריאה דחופה", ללא "דיווח מקבלה", ללא כל סגנון רדיו/משגר. (2) פתח במשפט הקשר קצר אחד שמציג את המטופל, לפני כל תיאור של המקום או הממצאים — לדוגמה: "הוזעקת לטיפול בגבר בן X..." / "מטופל בן X שנים..." / "אישה כבת X המתלוננת על..." — אסור בהחלט להתחיל את התרחיש במילים "בהגיעך למקום" ללא משפט פתיחה שמציג קודם מי המטופל; ניתן להשתמש בביטוי "בהגיעך למקום מצאת..." רק כהמשך למשפט הפתיחה, לעולם לא כמשפט הראשון בתרחיש. (3) כלול: גיל/מין, תלונה עיקרית, סימנים חיוניים רלוונטיים, ממצאים פיזיקליים. 2-4 משפטים ספציפיים, קליניים.\n\n` +
    `${HEBREW_RULES}\n\n${DIFFICULTY_RULES}\n\n` +
    `${scope}\n\n` +
    'תשובות: בדיוק 4 אפשרויות בעברית רפואית מקצועית. כל אפשרות: משפט פעולה קליני אחד, שלם ומוחלט, 15-25 מילים. פורמט: "[פועל] [פעולה ספציפית / תרופה-מינון-מסלול / הגדרת אנרגיה או מכשיר] [הקשר קליני]". אין אפשרות עמומה או מהססת.\n' +
    'כלל הסחות הדעת: לפחות שתי תשובות שגויות חייבות להיות טעויות שכיחות בשדה או גרסאות שגויות של עובדת העוגן (מספר, סדר או עיתוי שונה). תשובה שגויה אחת תישמע כמו תשובת ספר לימוד שמתעלמת מהפרט הקליני העדין בתרחיש. בדיוק תשובה אחת תואמת את עובדת העוגן. כל הסחות הדעת סבירות לחובש מתחיל.\n\n' +
    'הסבר קליני: בדיוק 3-4 משפטים תמציתיים בעברית, סה"כ פחות מ-60 מילים. חייב להתחיל במילים: "על פי הפרוטוקולים". לאחר מכן: (1) הסבר המנגנון הפיזיולוגי שהופך את הפעולה הנכונה לעדיפה. (2) נתח את הסחת הדעת המפתה ביותר והנזק הספציפי שהיא גורמת. (3) סיים עם פנינת ידע קלינית אחת שמפרידה בין אנשי שדה מצטיינים לממוצעים.\n\n' +
    'דיוק: כל מינון תרופה, הגדרת ג\'ול, סף קצב ומסגרת זמן חייבים להתאים בדיוק לעובדת העוגן. אין קירובים. שפה: עברית רפואית מקצועית גבוהה — ללא תרגום מילולי מאנגלית. מינוח נכון: "נתיב אוויר", "קיבוע", "סביבת עבודה", "ניטור", "הנשמה", "פינוי", "הכרה", "דופק", "לחץ דם", "נשימה" וכדומה.\n\n' +
    'פלט JSON תקני בלבד, ללא פרוזה, ללא markdown: { "question": string, "options": string[], "correct_index": number, "clinical_explanation": string, "topic_tag": string }\n' +
    `topic_tag חייב להיות בדיוק: "${entry.topic}"`
  );
}


// Single source of truth for "common medicines" — derived from the reference glossary
// (commonMedsData.ts / MED_CATEGORIES, the same list shown in the "תרופות נפוצות" modal)
// so that both "תרופת היום" and "תיק התרופות" only ever surface drugs from that list.
// The Edge Function copy (generate-daily-questions/index.ts) must be updated by hand
// when MED_CATEGORIES changes, since Deno can't import from src/.
const COMMON_MED_POOL: string[] = MED_CATEGORIES.flatMap((cat) =>
  cat.groups.flatMap((g) => g.meds.map((m) => `${m.he} (${m.en})`)),
);

function buildMedPrompt(today: string): string {
  // Deterministic hash — identical algorithm to server-side so both pick the same drug
  let hash = 0;
  for (let i = 0; i < today.length; i++) hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
  const todayDrug = COMMON_MED_POOL[hash % COMMON_MED_POOL.length];

  return `אתה מדריך פרמדיק בכיר ישראלי. משימתך: צור שאלת MCQ אינטראקטיבית על "תרופת היום" לחובשים ולפרמדיקים ישראלים.
תרופת היום המוקצית: ${todayDrug}.
חובה להשתמש בתרופה ${todayDrug} כנושא השאלה. אסור בהחלט להזכיר תאריך כלשהו בשאלה, בתשובות או בהסבר — התוכן חייב לעסוק אך ורק בתרופה עצמה. ערבב את מיקום התשובה הנכונה — correct_index לא תמיד 0.
השאלה חייבת לבדוק שהמשתמש הבין למה התרופה נועדה — מהי האינדיקציה הקלינית שלה. ניסח שאלה שמחייבת הבנה אמיתית של מטרת התרופה, כגון: "לאיזו בעיה קלינית עיקרית נרשמת תרופה זו?" / "מטופל עם [מצב רפואי], באיזה מצב מוצדק לרשום לו ${todayDrug}?" — לא שאלת סכנה, לא שאלת מינון, לא שאלת זהירות.
שפה: עברית רפואית מקצועית.
${NO_ORG_RULE}
${HEBREW_RULES}
${DIFFICULTY_RULES}
פלט JSON בלבד, ללא markdown:
{
  "name": "שם מסחרי ישראלי + גנרי — לדוגמה: אליקוויס (Apixaban)",
  "name_he": "שם מסחרי/מותג בעברית בלבד — לדוגמה: אליקוויס, קרטיה, נורמיטן",
  "name_en": "שם מסחרי/מותג באנגלית באותיות לטיניות (כפי שמופיע על האריזה) — לדוגמה: Eliquis, Cartia, Normiten. לא שם גנרי.",
  "drug_class": "קבוצה ומנגנון קצר — לדוגמה: NOAC — מעכב פקטור Xa",
  "description": "הסבר בשורה-שורה וחצי: מה התרופה הזאת עושה בגוף ולמה רושמים אותה — בשפה ברורה שכל חובש יבין. לדוגמה: תרופה מדללת דם — מונעת קרישי דם בחולים עם פרפור פרוזדורים, לאחר ניתוח אורתופדי, או לטיפול בתסחיף ריאתי.",
  "question": "שאלת MCQ שבודקת הבנת האינדיקציה — לאיזה מצב קליני/מחלה נרשמת התרופה. לדוגמה: 'לאיזו בעיה עיקרית נרשמת אליקוויס?' / 'באיזה מצב רפואי יקבל מטופל אליקוויס?'",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "clinical_pearl": "דגש קליני חשוב למדיק (1-2 משפטים)",
  "emergency_note": "אזהרת חירום ספציפית (1-2 משפטים)"
}`;
}

// Deterministic "concept of the day" — identical hash technique to buildMedPrompt,
// over the independent CONCEPT_POOL (must match the Edge Function's copy). The
// ground-truth "fact" is fed into the prompt so the AI's correct answer is always
// factually accurate — it only handles phrasing and distractors.
function buildConceptPrompt(today: string): string {
  let hash = 0;
  for (let i = 0; i < today.length; i++) hash = (hash * 71 + today.charCodeAt(i)) >>> 0;
  const entry = CONCEPT_POOL[hash % CONCEPT_POOL.length];

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

function getTodayImprovisedSetting(today: string): string {
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

// Distinct offset per block, stepped by a number coprime with the topic-list
// length — guarantees the three topic-seeded rubrics never share a topic on
// the same day.
const TOPIC_BLOCK_OFFSETS: Record<string, number> = { improvised: 0, red_flag: 1 };

// Keeps "מצא את הטעות" on a different BLS fact than the BLS question of the same day.
const SPOT_ERROR_FACT_OFFSET = 17;

function getDailyTopic(blockType: string, today: string): string {
  let hash = 0;
  for (let i = 0; i < today.length; i++) hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
  const offset = TOPIC_BLOCK_OFFSETS[blockType] ?? 0;
  return IMPROVISED_TOPICS[(hash + offset * 7) % IMPROVISED_TOPICS.length];
}

function buildImprovisedPrompt(today: string): string {
  const setting = getTodayImprovisedSetting(today);
  const topic = getDailyTopic('improvised', today);

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
${NO_ORG_RULE}
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
}`;
}

function buildRedFlagPrompt(today: string): string {
  const topic = getDailyTopic('red_flag', today);
  return `אתה מדריך פרמדיק בכיר ישראלי. צור מקרה חירום קצר שבו יש לזהות סימן אדום קריטי מסכן חיים.
נושא היום (חובה): ${topic}. כל המקרה חייב להתמקד ב${topic}.
המקרה: תיאור ספציפי — גיל, מנגנון/תלונה, סימנים חיוניים, תסמינים. 2-3 משפטים.
ערבב את מיקום התשובה הנכונה — correct_index לא תמיד 0.
${NO_ORG_RULE}
${HEBREW_RULES}
${DIFFICULTY_RULES}
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

function buildSpotErrorPrompt(today: string): string {
  const entry = pickClinicalFact('bls', today, SPOT_ERROR_FACT_OFFSET);
  const topic = entry.topic;
  return `אתה מדריך פרמדיק בכיר ישראלי. משימתך: כתוב תרחיש BLS מפורט ומבלבל בנושא ${topic}, המכיל טעות מקצועית אחת — מוסתרת בתוך נרטיב שנראה שלם ומקצועי לחלוטין.

נושא היום (חובה): ${topic}. כל התרחיש חייב להתמקד ב${topic}.
תחום: BLS בלבד — ללא תרופות ALS, ללא קצבים, ללא נתיב אוויר מתקדם.
${buildFactAnchor(entry.fact)}
הטעות המוסתרת בתרחיש חייבת להיות הפרה של עובדת העוגן, והיא הטעות היחידה בתרחיש.
${NO_ORG_RULE}

כללים מחייבים:
1. פתח ישירות בתרחיש: "[גבר/אישה] בן/בת [גיל], [תלונה/מנגנון של ${topic}]" — ללא ניסוח שיגור.
2. תאר את ההתערבות בפירוט (5–8 שורות): כלול סימנים חיוניים ספציפיים, ממצאי בדיקה, פעולות שננקטו בסדר כרונולוגי — כדי שהנרטיב ייראה שלם ומקצועי. הטעות חייבת להיות מוסתרת היטב בתוך ים של פרטים נכונים. כלול לפחות שני פרטים שנראים חשודים אך נכונים לחלוטין (כדי להסיח דעת), ופרט אחד שנראה טבעי — שהוא הטעות האמיתית.
3. השאלה: "מה הטעות המקצועית שזוהתה בטיפול?"
4. 4 תשובות קצרות: אחת היא הטעות האמיתית, השאר — פעולות שלא קרו או שנראות חשודות אך נכונות לחלוטין. עשה את המסיחות משכנעות — לא תשובות ברורות שניתן לפסול בקלות.
5. הסבר (2 משפטים): הטעות, הנזק הפוטנציאלי, והנכון לפי הפרוטוקולים (כלומר לפי עובדת העוגן).
6. שפה: עברית רפואית תקנית בלבד.
${HEBREW_RULES}
${DIFFICULTY_RULES}
פלט JSON תקני בלבד, ללא markdown:
{
  "dispatch_opener": "",
  "scenario": "תיאור מפורט עם הטעות המוסתרת (5–8 שורות)",
  "question": "מה הטעות המקצועית שזוהתה בטיפול?",
  "options": ["תשובה א", "תשובה ב", "תשובה ג", "תשובה ד"],
  "correct_index": X,
  "explanation": "הסבר קצר (2 משפטים): הטעות, הנזק הפוטנציאלי, והנכון לפי הפרוטוקולים",
  "topic_tag": "${topic}"
}`;
}

// Situational themes for "תיק התרופות" — expanded pool + deterministic per-day
// rotation (same hash-of-date technique as getTodayImprovisedSetting), so the
// opening scenario varies day to day instead of always defaulting to "elderly
// patient found on the floor". Independent pool — no offset needed since it
// isn't shared with any other block.
const MED_BAG_SCENARIOS = [
  'ערפול הכרה', 'קוצר נשימה', 'כאב חזה', 'נפילה בבית',
  'חולשה כללית פתאומית', 'סחרחורת', 'בחילות והקאות ממושכות', 'כאבי בטן חדים',
  'בלבול פתאומי / שינוי התנהגות', 'חום גבוה', 'כאבי גב פתאומיים', 'פרכוס',
  'אי-שקט וחרדה קשה', 'קוצר נשימה במאמץ קל', 'ירידה חדה בתפקוד היומיומי',
  'פגיעה קלה בבית (חבלה/שריטה) עם ממצא נלווה חשוד', 'עייפות קיצונית ואדישות',
  'דופק לא סדיר מורגש',
];

function getTodayMedBagScenario(today: string): string {
  let hash = 0;
  for (let i = 0; i < today.length; i++) hash = (hash * 37 + today.charCodeAt(i)) >>> 0;
  return MED_BAG_SCENARIOS[hash % MED_BAG_SCENARIOS.length];
}

// Deterministic "mandatory drug of the day" for the med bag list — same hash
// technique as buildMedPrompt's todayDrug, salted differently so the two
// blocks don't always land on the same medication. Without this, Gemini tends
// to gravitate to the same handful of well-known drugs every day.
function getTodayMedBagDrug(today: string): string {
  const salted = `${today}_medbag`;
  let hash = 0;
  for (let i = 0; i < salted.length; i++) hash = (hash * 31 + salted.charCodeAt(i)) >>> 0;
  return COMMON_MED_POOL[hash % COMMON_MED_POOL.length];
}

function buildMedBagPrompt(today: string, recentTopics: string[] = [], recentMedications: string[] = []): string {
  const avoidSection = recentTopics.length > 0
    ? `\nנושאים שנשאלו לאחרונה — חובה לבחור נושא שונה לחלוטין: ${recentTopics.join(', ')}.\n`
    : '';
  const avoidMedsSection = recentMedications.length > 0
    ? `\nתרופות שנבחרו לאחרונה בימים האחרונים — הימנע ככל האפשר מלחזור על אותו שילוב תרופות: ${recentMedications.join(', ')}.\n`
    : '';
  const scenarioTheme = getTodayMedBagScenario(today);
  const mandatoryDrug = getTodayMedBagDrug(today);
  return `אתה מדריך פרמדיק בכיר ישראלי. משימה: צור אתגר "תיק התרופות" — חובש מגיע לביתו של מטופל ומוצא את תרופותיו הכרוניות על השולחן. מהתרופות בלבד יש לנתח את הרקע הרפואי ולזהות את הסכנה הקריטית לטיפול.

כללים מחייבים:
1. סיטואציה (2 משפטים): תרחיש ביתי מציאותי סביב הנושא **${scenarioTheme}** (חובה להשתמש בנושא הזה). גוון בכל יום מחדש: גיל ספציפי בטווח רחב — מבוגר צעיר (25-40), גיל ביניים (41-64) או קשיש (65+), לא תמיד קשיש; מין (גבר/אישה); וסוג מגורים (דירה בעיר, בית פרטי, דיור מוגן, קיבוץ, יישוב כפרי). המשפחה/הסביבה אינם יודעים לדווח על רקע רפואי.
2. תרופות: רשימה של 3-4 תרופות כרוניות ביתיות בלבד (לא תרופות חירום ולא עירויים). בחר אך ורק מהרשימה הבאה — תרופות ישראליות נפוצות בבתי מטופלים (רשימת "תרופות נפוצות" הרשמית של האפליקציה, יש לבחור מתוכה בלבד): ${COMMON_MED_POOL.join(', ')}. חובה לכלול ברשימה את התרופה ${mandatoryDrug}, ולבחור את שאר התרופות כך שהשילוב יהיה שונה מהימים האחרונים.${avoidMedsSection}
3. שאלה: "לפי תיק התרופות, מאיזה רקע רפואי עליך לחשוש במיוחד בטיפול בו?"
4. 4 תשובות MCQ: אחת נכונה (הסכנה הקריטית המרכזית הנובעת מהשילוב), שלוש מסיחות סבירות לחובש מתחיל. ערבב מיקום התשובה — correct_index לא תמיד 0.
5. הסבר (2-3 משפטים): אילו תרופות מצביעות על מה, מהי הסכנה הקריטית הספציפית, ומה יש לדווח לצוות המקבל.
6. topic_tag: נושא קצר בעברית (1-3 מילים) לגיוון.
7. med_descriptions: עבור כל תרופה ברשימה — משפט אחד קצר בעברית שמסביר למה היא נועדה (מה היא מטפלת). פשוט ובסיסי, לא טכני.
${NO_ORG_RULE}
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
}`;
}

export const DAILY_TYPES = ['bls', 'als', 'med_v4', 'concept', 'improvised', 'red_flag', 'spot_error', 'med_bag'] as const;
export type DailyType = (typeof DAILY_TYPES)[number];

// `today` is the caller's local date (YYYY-MM-DD) — it only seeds the deterministic
// drug/topic/setting picks, so it must be validated by the caller but is not trusted text.
export function buildDailyPrompt(type: DailyType, today: string): string {
  switch (type) {
    case 'bls': return buildClinicalPrompt('BLS', today);
    case 'als': return buildClinicalPrompt('ALS', today);
    case 'med_v4': return buildMedPrompt(today);
    case 'concept': return buildConceptPrompt(today);
    case 'improvised': return buildImprovisedPrompt(today);
    case 'red_flag': return buildRedFlagPrompt(today);
    case 'spot_error': return buildSpotErrorPrompt(today);
    case 'med_bag': return buildMedBagPrompt(today);
  }
}
