import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
const VAPID_CONTACT_EMAIL = Deno.env.get('VAPID_CONTACT_EMAIL') ?? 'mailto:support@hovesh-plus.app'

// ─── Date/hour helpers ────────────────────────────────────────────────────────

function getIsraelDate(): string {
  // Uses IANA timezone — handles DST between UTC+2 (winter) and UTC+3 (summer)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function getIsraelHour(): number {
  const hourStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())
  return parseInt(hourStr, 10)
}

function hashStr(s: string, mult: number): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = (hash * mult + s.charCodeAt(i)) >>> 0
  return hash
}

// ─── Content pools ────────────────────────────────────────────────────────────
// Hand-maintained literal copies — Deno can't import from src/. Must stay
// identical to the copies in generate-daily-questions/index.ts and the source
// files they're derived from (commonMedsData.ts / medicalConceptsPool.ts /
// activeDiagnosesPool.ts). Update all together when a source pool changes.

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

// ─── Today's picks ────────────────────────────────────────────────────────────
// Distinct multiplier per category (31 / 71 / 53) — same technique as
// generate-daily-questions/index.ts, so the 3 picks don't land on related indices.

function getTodayMed(today: string): string {
  const hash = hashStr(today, 31)
  return COMMON_MED_POOL[hash % COMMON_MED_POOL.length]
}

function getTodayConcept(today: string): string {
  const hash = hashStr(today, 71)
  return CONCEPT_POOL[hash % CONCEPT_POOL.length].topic
}

function getTodayDiagnosis(today: string): string {
  const hash = hashStr(today, 53)
  return DIAGNOSIS_POOL[hash % DIAGNOSIS_POOL.length].he
}

// ─── Main handler ─────────────────────────────────────────────────────────────

interface PushSubscriptionRow {
  id: string
  endpoint: string
  p256dh: string
  auth: string
  medication: boolean
  disease: boolean
  concept: boolean
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response('Missing VAPID keys', { status: 500 })
  }

  webpush.setVapidDetails(VAPID_CONTACT_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const today = getIsraelDate()
  const hour = getIsraelHour()

  const todayMed = getTodayMed(today)
  const todayDisease = getTodayDiagnosis(today)
  const todayConcept = getTodayConcept(today)

  const { data: subs, error: fetchError } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth, medication, disease, concept')
    .eq('enabled', true)
    .eq('chosen_hour', hour)
    .or(`last_sent_date.is.null,last_sent_date.neq.${today}`)

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const results = { sent: 0, skipped: 0, removed: 0, failed: 0 }

  for (const sub of (subs ?? []) as PushSubscriptionRow[]) {
    const lines: string[] = []
    if (sub.medication) lines.push(`תרופה: ${todayMed}`)
    if (sub.disease) lines.push(`מחלה: ${todayDisease}`)
    if (sub.concept) lines.push(`מושג: ${todayConcept}`)

    if (lines.length === 0) {
      results.skipped++
      continue
    }

    const payload = JSON.stringify({
      title: 'פוש יומי — חובש+',
      body: lines.join(' · '),
      url: '/',
    })

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      )
      await supabase
        .from('push_subscriptions')
        .update({ last_sent_date: today, updated_at: new Date().toISOString() })
        .eq('id', sub.id)
      results.sent++
    } catch (e) {
      const statusCode = (e as { statusCode?: number })?.statusCode
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        results.removed++
      } else {
        results.failed++
        console.error(`[send-daily-push] failed for subscription ${sub.id}:`, e)
      }
    }
  }

  console.log(`[send-daily-push] ${today} ${hour}:00:`, results)

  return new Response(JSON.stringify({ date: today, hour, ...results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
