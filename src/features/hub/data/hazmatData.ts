// Hazardous-materials quick reference.
// UN numbers, material names and response-guide assignments were checked against the
// NOAA CAMEO Chemicals UN/NA datasheets; distances and first-aid notes are summarised
// from the matching guides of the Emergency Response Guidebook (ERG 2024).
// Hazard classes follow the UN Model Regulations. Emergency action codes follow HAZCHEM.

export interface HazGuide {
  title: string;
  dangers: string[];
  /** Immediate isolation distance in all directions */
  isolate: string;
  /** Downwind evacuation to consider for a large spill */
  largeSpill?: string;
  /** Isolation when a tank / tanker is involved in a fire */
  fire?: string;
  firstAid: string[];
}

export interface HazMaterial {
  un: number;
  he: string;
  en: string;
  cls: string;
  guide: number;
  /** Toxic-by-inhalation: downwind protective distances can reach kilometres */
  tih?: boolean;
  note?: string;
}

const LIQ_SOLID = '50 מ׳ לנוזל · 25 מ׳ למוצק';
const BURNS = 'כוויה: לקרר במים קרים זמן ממושך. לא להסיר בגד שנדבק לעור.';
const FROST = 'מגע עם גז מונזל: כוויית קור. בגד שקפא לעור מפשירים לפני שמסירים.';
const FLUSH_30 = 'מגע בעור או בעיניים: שטיפה מיידית במים זורמים לפחות 30 דקות.';

export const HAZ_GUIDES: Record<number, HazGuide> = {
  111: {
    title: 'מטען לא מזוהה / מעורב',
    dangers: ['עלול להתפוצץ, להתלקח או להגיב עם מים ואוויר', 'שאיפה או מגע עלולים לגרום לפגיעה קשה', 'גז בריכוז גבוה עלול לחנוק ללא התרעה'],
    isolate: '100 מ׳', fire: '800 מ׳',
    firstAid: [],
  },
  115: {
    title: 'גז דליק',
    dangers: ['דליק מאוד, יוצר תערובת נפיצה עם אוויר', 'אדי גז מונזל כבדים מהאוויר ומצטברים במקומות נמוכים', 'מכל שמתחמם עלול להתפוצץ (BLEVE)', 'חנק בחלל סגור'],
    isolate: '100 מ׳', largeSpill: '800 מ׳', fire: '1,600 מ׳',
    firstAid: [FROST, BURNS],
  },
  116: {
    title: 'גז דליק לא יציב',
    dangers: ['דליק מאוד ועלול להתפרק בפיצוץ', 'מכל שמתחמם עלול להתפוצץ', 'חנק בחלל סגור'],
    isolate: '100 מ׳', largeSpill: '800 מ׳', fire: '1,600 מ׳',
    firstAid: [FROST, BURNS],
  },
  117: {
    title: 'גז רעיל ודליק, סכנה קיצונית',
    dangers: ['קטלני בשאיפה או בספיגה דרך העור', 'הריח הראשוני נעלם, כי הגז משתק את חוש הריח', 'דליק מאוד, כבד מהאוויר ומתפשט על הקרקע'],
    isolate: '100 מ׳', fire: '1,600 מ׳',
    firstAid: [FROST, BURNS],
  },
  119: {
    title: 'גז רעיל ודליק',
    dangers: ['עלול להיות קטלני בשאיפה או בספיגה דרך העור', 'דליק, יוצר תערובת נפיצה עם אוויר', 'שריפה משחררת גזים רעילים ומגרים'],
    isolate: '100 מ׳', fire: '1,600 מ׳',
    firstAid: [FROST, BURNS],
  },
  120: {
    title: 'גז אינרטי (כולל נוזל מקורר)',
    dangers: ['דוחק חמצן: חנק ללא התרעה, בעיקר בחלל סגור', 'נוזל מקורר גורם לכוויות קור קשות', 'מכל שמתחמם עלול להתפוצץ'],
    isolate: '100 מ׳', largeSpill: '100 מ׳', fire: '800 מ׳',
    firstAid: [FROST],
  },
  122: {
    title: 'גז מחמצן',
    dangers: ['אינו בוער אך מלבה בעוצמה כל שריפה', 'עלול להצית חומרים דליקים: בגדים, שמן, עץ', 'נוזל מקורר גורם לכוויות קור קשות'],
    isolate: '100 מ׳', largeSpill: '500 מ׳', fire: '800 מ׳',
    firstAid: [FROST],
  },
  124: {
    title: 'גז רעיל / מאכל, מחמצן',
    dangers: ['עלול להיות קטלני בשאיפה או בספיגה דרך העור', 'אינו בוער אך מלבה שריפה ומגיב בעוצמה עם דלקים', 'כבד מהאוויר ומתפשט על הקרקע'],
    isolate: '100 מ׳', fire: '800 מ׳',
    firstAid: [FROST],
  },
  125: {
    title: 'גז רעיל / מאכל',
    dangers: ['עלול להיות קטלני בשאיפה, בבליעה או בספיגה דרך העור', 'אדים מגרים ומאכלים מאוד לעיניים ולדרכי הנשימה', 'כבד מהאוויר ומתפשט על הקרקע'],
    isolate: '100 מ׳', fire: '1,600 מ׳',
    firstAid: [FROST],
  },
  126: {
    title: 'גז דחוס או מונזל',
    dangers: ['מכל שמתחמם עלול להתפוצץ ולעוף', 'חלק מהגזים דליקים', 'חנק בחלל סגור'],
    isolate: '100 מ׳', largeSpill: '500 מ׳', fire: '800 מ׳',
    firstAid: [],
  },
  127: {
    title: 'נוזל דליק (מתערבב במים)',
    dangers: ['דליק מאוד: ניצת מחום, ניצוץ או להבה', 'האדים כבדים מהאוויר ויכולים להגיע למקור הצתה רחוק', 'סכנת פיצוץ אדים בחלל סגור ובביוב'],
    isolate: '50 מ׳', largeSpill: '300 מ׳', fire: '800 מ׳',
    firstAid: ['לשטוף עור במים וסבון.', BURNS],
  },
  128: {
    title: 'נוזל דליק (אינו מתערבב במים)',
    dangers: ['דליק מאוד: ניצת מחום, ניצוץ או להבה', 'האדים כבדים מהאוויר ויכולים להגיע למקור הצתה רחוק', 'סכנת פיצוץ אדים בחלל סגור ובביוב'],
    isolate: '50 מ׳', largeSpill: '300 מ׳', fire: '800 מ׳',
    firstAid: ['לשטוף עור במים וסבון.', BURNS],
  },
  129: {
    title: 'נוזל דליק (מתערבב במים, מזיק)',
    dangers: ['דליק מאוד: ניצת מחום, ניצוץ או להבה', 'האדים כבדים מהאוויר ויכולים להגיע למקור הצתה רחוק', 'שאיפה או ספיגה בעור עלולות לגרום להרעלה'],
    isolate: '50 מ׳', largeSpill: '300 מ׳', fire: '800 מ׳',
    firstAid: ['לשטוף עור במים וסבון.', BURNS],
  },
  130: {
    title: 'נוזל דליק (אינו מתערבב במים, מזיק)',
    dangers: ['דליק מאוד: ניצת מחום, ניצוץ או להבה', 'האדים כבדים מהאוויר ומצטברים במקומות נמוכים', 'שאיפה או ספיגה בעור עלולות לגרום להרעלה'],
    isolate: '50 מ׳', largeSpill: '300 מ׳', fire: '800 מ׳',
    firstAid: [],
  },
  131: {
    title: 'נוזל דליק ורעיל',
    dangers: ['עלול להיות קטלני בשאיפה, בבליעה או בספיגה דרך העור', 'דליק מאוד', 'האדים עלולים לגרום לסחרחורת ולחנק בחלל סגור'],
    isolate: '50 מ׳', fire: '800 מ׳',
    firstAid: ['לשטוף עור במים וסבון.', BURNS],
  },
  132: {
    title: 'נוזל דליק ומאכל',
    dangers: ['דליק, האדים יוצרים תערובת נפיצה עם אוויר', 'גורם לכוויות קשות בעור ובעיניים', 'שאיפה עלולה לגרום לפגיעה קשה'],
    isolate: '50 מ׳', fire: '800 מ׳',
    firstAid: [FLUSH_30, BURNS],
  },
  136: {
    title: 'חומר שמתלקח מעצמו באוויר, רעיל / מאכל',
    dangers: ['ניצת מעצמו במגע עם אוויר ועלול להתלקח שוב אחרי כיבוי', 'בוער במהירות ומשחרר עשן לבן, סמיך ומגרה', 'גורם לכוויות קשות; בליעה קטלנית'],
    isolate: LIQ_SOLID, fire: '800 מ׳',
    firstAid: ['מגע בעור: להשאיר את האזור טבול במים או מכוסה בחבישה רטובה עד לטיפול רפואי.', 'בגדים מזוהמים: להסיר ולהכניס למכל מתכת מלא מים. מתלקחים כשהם מתייבשים.'],
  },
  137: {
    title: 'חומר מאכל שמגיב עם מים',
    dangers: ['גורם לכוויות קשות בעור, בעיניים ובדרכי הנשימה', 'מגיב בעוצמה עם מים ומשחרר חום ואדים מאכלים', 'במגע עם מתכות עלול לשחרר מימן דליק'],
    isolate: LIQ_SOLID, fire: '800 מ׳',
    firstAid: [FLUSH_30],
  },
  138: {
    title: 'חומר שמגיב עם מים ופולט גז דליק',
    dangers: ['במגע עם מים משחרר גז דליק ועלול להתלקח או להתפוצץ', 'עלול להתלקח שוב אחרי כיבוי', 'עם מים עלול ליצור תמיסה מאכלת'],
    isolate: LIQ_SOLID, largeSpill: '300 מ׳', fire: '800 מ׳',
    firstAid: ['מגע בעור: קודם לנגב את החומר מהעור, ורק אז לשטוף במים זורמים לפחות 20 דקות.'],
  },
  140: {
    title: 'חומר מחמצן',
    dangers: ['מאיץ בעוצמה כל שריפה', 'עלול להתפוצץ מחום או מזיהום בדלק ובחומר אורגני', 'עלול להצית חומרים דליקים: בגדים, שמן, עץ'],
    isolate: LIQ_SOLID, largeSpill: '100 מ׳', fire: '800 מ׳',
    firstAid: ['בגד מזוהם עלול להתלקח כשהוא מתייבש: להסיר ולהרחיק.'],
  },
  147: {
    title: 'סוללות ליתיום-יון',
    dangers: ['סוללה פגועה או מחוממת עלולה להתלקח ולהצית סוללות סמוכות', 'השריפה משחררת גזים רעילים ומאכלים, כולל מימן פלואורי', 'העשן עלול לגרום לסחרחורת ולחנק'],
    isolate: '25 מ׳', fire: '500 מ׳ (משאית או נגרר בוערים)',
    firstAid: [],
  },
  153: {
    title: 'חומר רעיל / מאכל (דליק)',
    dangers: ['רעיל: שאיפה, בליעה או מגע בעור עלולים לגרום לפגיעה קשה או למוות', 'גורם לכוויות בעור ובעיניים', 'החומר דליק אך אינו ניצת בקלות'],
    isolate: LIQ_SOLID, fire: '800 מ׳',
    firstAid: [FLUSH_30],
  },
  154: {
    title: 'חומר רעיל / מאכל (אינו דליק)',
    dangers: ['רעיל: שאיפה, בליעה או מגע בעור עלולים לגרום לפגיעה קשה או למוות', 'גורם לכוויות קשות בעור ובעיניים', 'אינו בוער, אך בחום משחרר אדים רעילים ומאכלים'],
    isolate: LIQ_SOLID, fire: '800 מ׳',
    firstAid: [FLUSH_30],
  },
  157: {
    title: 'חומר רעיל / מאכל (אינו דליק, רגיש למים)',
    dangers: ['רעיל: שאיפה, בליעה או מגע בעור עלולים לגרום לפגיעה קשה או למוות', 'גורם לכוויות קשות בעור ובעיניים', 'במגע עם מים עלול לשחרר גזים רעילים או מאכלים'],
    isolate: LIQ_SOLID, fire: '800 מ׳',
    firstAid: [FLUSH_30],
  },
  158: {
    title: 'חומר מידבק',
    dangers: ['שאיפה או מגע עלולים לגרום להדבקה, למחלה או למוות', 'הנפגע עצמו עלול להיות מקור הדבקה', 'אריזה פגועה עם קרח יבש: לא לגעת בנוזל שעליה'],
    isolate: '25 מ׳',
    firstAid: ['להעביר את הנפגע לאזור מבודד, אם אפשר לעשות זאת בבטחה.', 'מגע: לשטוף עיניים במים זורמים ולרחוץ עור היטב במים וסבון, בלי לפצוע את העור.'],
  },
  171: {
    title: 'חומר בסיכון נמוך עד בינוני',
    dangers: ['חלק מהחומרים בוערים, אך אינם ניצתים בקלות', 'שאיפת אבק או אדים עלולה להזיק', 'מגע עם חומר חם גורם לכוויות'],
    isolate: LIQ_SOLID, fire: '800 מ׳',
    firstAid: [],
  },
};

// General first aid that applies to every hazmat casualty, shown above the guide-specific notes
export const HAZ_GENERAL_FIRST_AID = [
  'לא נכנסים לאזור המזוהם בלי מיגון. מטפלים רק בנפגע שהוצא ממנו.',
  'להעביר לאוויר צח ולתת חמצן אם יש קושי בנשימה.',
  'אין להנשים מפה לפה אם החומר נשאף או נבלע: להשתמש במסכת כיס או במפוח.',
  'להסיר ולבודד בגדים ונעליים מזוהמים.',
  'ההשפעה עלולה להופיע באיחור: להשאיר בהשגחה ולפנות.',
];

export const HAZ_CLASSES: { cls: string; name: string; color: string }[] = [
  { cls: '1',   name: 'חומרי נפץ',                              color: 'bg-orange-500 text-white' },
  { cls: '2.1', name: 'גז דליק',                                color: 'bg-red-600 text-white' },
  { cls: '2.2', name: 'גז לא דליק ולא רעיל',                    color: 'bg-green-600 text-white' },
  { cls: '2.3', name: 'גז רעיל',                                color: 'bg-white text-black border border-gray-400' },
  { cls: '3',   name: 'נוזל דליק',                              color: 'bg-red-600 text-white' },
  { cls: '4.1', name: 'מוצק דליק',                              color: 'bg-red-200 text-red-900' },
  { cls: '4.2', name: 'חומר שמתלקח מעצמו',                      color: 'bg-red-600 text-white' },
  { cls: '4.3', name: 'חומר שפולט גז דליק במגע עם מים',         color: 'bg-blue-600 text-white' },
  { cls: '5.1', name: 'חומר מחמצן',                             color: 'bg-yellow-400 text-black' },
  { cls: '5.2', name: 'פראוקסיד אורגני',                        color: 'bg-yellow-400 text-black' },
  { cls: '6.1', name: 'חומר רעיל',                              color: 'bg-white text-black border border-gray-400' },
  { cls: '6.2', name: 'חומר מידבק',                             color: 'bg-white text-black border border-gray-400' },
  { cls: '7',   name: 'חומר רדיואקטיבי',                        color: 'bg-yellow-300 text-black' },
  { cls: '8',   name: 'חומר מאכל',                              color: 'bg-gray-900 text-white border border-gray-500' },
  { cls: '9',   name: 'חומרים מסוכנים שונים',                   color: 'bg-gray-200 text-black' },
];

const PHOS_CL = 'הנזק לריאות עלול להופיע שעות אחרי החשיפה, גם אם הנפגע מרגיש טוב.';
const BLEVE = 'מכל בוער עלול להתפוצץ בכדור אש (BLEVE): להתרחק ולא להתקרב לקצוות המכל.';
const AN_FIRE = 'בשריפה של משאית או מכל: סכנת פיצוץ. בידוד ופינוי 1,600 מ׳ לכל הכיוונים, כולל כוחות ההצלה.';
const HF = 'מגע בעור: אם יש ג׳ל קלציום גלוקונאט, לשטוף 5 דקות ואז למרוח. אם אין, להמשיך לשטוף עד לטיפול רפואי.';
const CYANIDE = 'במגע עם מים או חומצה משחרר גז ציאניד קטלני. אין להנשים מפה לפה.';

export const HAZ_MATERIALS: HazMaterial[] = [
  { un: 1001, he: 'אצטילן',                          en: 'Acetylene, dissolved',            cls: '2.1', guide: 116 },
  { un: 1005, he: 'אמוניה (נטולת מים)',              en: 'Ammonia, anhydrous',              cls: '2.3', guide: 125, tih: true, note: PHOS_CL },
  { un: 1011, he: 'בוטאן',                           en: 'Butane',                          cls: '2.1', guide: 115, note: BLEVE },
  { un: 1013, he: 'פחמן דו-חמצני',                   en: 'Carbon dioxide',                  cls: '2.2', guide: 120 },
  { un: 1016, he: 'פחמן חד-חמצני',                   en: 'Carbon monoxide, compressed',     cls: '2.3', guide: 119, tih: true, note: 'חסר ריח וצבע. לתת חמצן בריכוז גבוה.' },
  { un: 1017, he: 'כלור',                            en: 'Chlorine',                        cls: '2.3', guide: 124, tih: true, note: PHOS_CL },
  { un: 1040, he: 'אתילן אוקסיד',                    en: 'Ethylene oxide',                  cls: '2.3', guide: 119, tih: true, note: 'עלול להתפוצץ גם ללא אוויר.' },
  { un: 1049, he: 'מימן דחוס',                       en: 'Hydrogen, compressed',            cls: '2.1', guide: 115, note: 'בוער בלהבה כמעט בלתי נראית.' },
  { un: 1050, he: 'מימן כלורי (גז)',                 en: 'Hydrogen chloride, anhydrous',    cls: '2.3', guide: 125, tih: true },
  { un: 1052, he: 'מימן פלואורי (נטול מים)',         en: 'Hydrogen fluoride, anhydrous',    cls: '8',   guide: 125, tih: true, note: HF },
  { un: 1053, he: 'מימן גופרי',                      en: 'Hydrogen sulfide',                cls: '2.3', guide: 117, tih: true, note: 'ריח ביצים סרוחות שנעלם בריכוז גבוה. היעדר ריח אינו סימן לבטיחות.' },
  { un: 1066, he: 'חנקן דחוס',                       en: 'Nitrogen, compressed',            cls: '2.2', guide: 120 },
  { un: 1072, he: 'חמצן דחוס',                       en: 'Oxygen, compressed',              cls: '2.2', guide: 122 },
  { un: 1073, he: 'חמצן נוזלי',                      en: 'Oxygen, refrigerated liquid',     cls: '2.2', guide: 122 },
  { un: 1075, he: 'גז פחמימני מעובה (גפ״מ, גז בישול)', en: 'Petroleum gases, liquefied (LPG)', cls: '2.1', guide: 115, note: BLEVE },
  { un: 1076, he: 'פוסגן',                           en: 'Phosgene',                        cls: '2.3', guide: 125, tih: true, note: PHOS_CL },
  { un: 1079, he: 'גופרית דו-חמצנית',                en: 'Sulfur dioxide',                  cls: '2.3', guide: 125, tih: true },
  { un: 1090, he: 'אצטון',                           en: 'Acetone',                         cls: '3',   guide: 127 },
  { un: 1114, he: 'בנזן',                            en: 'Benzene',                         cls: '3',   guide: 130 },
  { un: 1170, he: 'אתנול (כוהל)',                    en: 'Ethanol',                         cls: '3',   guide: 127 },
  { un: 1202, he: 'סולר',                            en: 'Diesel fuel / Gas oil',           cls: '3',   guide: 128 },
  { un: 1203, he: 'בנזין',                           en: 'Gasoline / Petrol',               cls: '3',   guide: 128 },
  { un: 1219, he: 'איזופרופנול',                     en: 'Isopropanol',                     cls: '3',   guide: 129 },
  { un: 1223, he: 'קרוסין (נפט)',                    en: 'Kerosene',                        cls: '3',   guide: 128 },
  { un: 1230, he: 'מתנול',                           en: 'Methanol',                        cls: '3',   guide: 131, note: 'בוער בלהבה בלתי נראית. רעיל בבליעה, בשאיפה ובספיגה בעור.' },
  { un: 1263, he: 'צבע וחומרים נלווים (דליק)',       en: 'Paint / Paint related material',  cls: '3',   guide: 128 },
  { un: 1267, he: 'נפט גולמי',                       en: 'Petroleum crude oil',             cls: '3',   guide: 128 },
  { un: 1268, he: 'תזקיקי נפט',                      en: 'Petroleum distillates, n.o.s.',   cls: '3',   guide: 128 },
  { un: 1294, he: 'טולואן',                          en: 'Toluene',                         cls: '3',   guide: 130 },
  { un: 1307, he: 'קסילן',                           en: 'Xylenes',                         cls: '3',   guide: 130 },
  { un: 1381, he: 'זרחן לבן',                        en: 'Phosphorus, white',               cls: '4.2', guide: 136 },
  { un: 1402, he: 'קלציום קרביד',                    en: 'Calcium carbide',                 cls: '4.3', guide: 138, note: 'במגע עם מים משחרר אצטילן דליק.' },
  { un: 1428, he: 'נתרן',                            en: 'Sodium',                          cls: '4.3', guide: 138 },
  { un: 1680, he: 'אשלגן ציאניד',                    en: 'Potassium cyanide, solid',        cls: '6.1', guide: 157, note: CYANIDE },
  { un: 1689, he: 'נתרן ציאניד',                     en: 'Sodium cyanide, solid',           cls: '6.1', guide: 157, note: CYANIDE },
  { un: 1744, he: 'ברום',                            en: 'Bromine',                         cls: '8',   guide: 154, tih: true },
  { un: 1748, he: 'סידן היפוכלוריט (כלור לבריכות)',  en: 'Calcium hypochlorite, dry',       cls: '5.1', guide: 140 },
  { un: 1760, he: 'נוזל מאכל, לא מפורט',             en: 'Corrosive liquid, n.o.s.',        cls: '8',   guide: 154 },
  { un: 1789, he: 'חומצה הידרוכלורית (חומצת מלח)',   en: 'Hydrochloric acid',               cls: '8',   guide: 157 },
  { un: 1790, he: 'חומצה הידרופלואורית',             en: 'Hydrofluoric acid',               cls: '8',   guide: 157, note: HF },
  { un: 1791, he: 'תמיסת היפוכלוריט (אקונומיקה)',    en: 'Hypochlorite solution',           cls: '8',   guide: 154, note: 'ערבוב עם חומצה משחרר גז כלור.' },
  { un: 1805, he: 'חומצה זרחתית',                    en: 'Phosphoric acid, solution',       cls: '8',   guide: 154 },
  { un: 1823, he: 'נתרן הידרוקסידי, מוצק (סודה קאוסטית)', en: 'Sodium hydroxide, solid',   cls: '8',   guide: 154 },
  { un: 1824, he: 'תמיסת נתרן הידרוקסידי (סודה קאוסטית)', en: 'Sodium hydroxide, solution', cls: '8',  guide: 154 },
  { un: 1830, he: 'חומצה גופרתית',                   en: 'Sulfuric acid',                   cls: '8',   guide: 137 },
  { un: 1845, he: 'קרח יבש',                         en: 'Carbon dioxide, solid (Dry ice)', cls: '9',   guide: 120 },
  { un: 1863, he: 'דלק סילוני',                      en: 'Fuel, aviation, turbine engine',  cls: '3',   guide: 128 },
  { un: 1942, he: 'אמוניום חנקתי',                   en: 'Ammonium nitrate',                cls: '5.1', guide: 140, note: AN_FIRE },
  { un: 1950, he: 'תרסיסים (אירוסולים)',             en: 'Aerosols',                        cls: '2',   guide: 126 },
  { un: 1965, he: 'תערובת גזים פחמימניים מעובה',     en: 'Hydrocarbon gas mixture, liquefied', cls: '2.1', guide: 115, note: BLEVE },
  { un: 1971, he: 'גז טבעי דחוס (מתאן)',             en: 'Natural gas, compressed',         cls: '2.1', guide: 115 },
  { un: 1972, he: 'גז טבעי נוזלי (LNG)',             en: 'Natural gas, refrigerated liquid', cls: '2.1', guide: 115 },
  { un: 1977, he: 'חנקן נוזלי',                      en: 'Nitrogen, refrigerated liquid',   cls: '2.2', guide: 120 },
  { un: 1978, he: 'פרופאן',                          en: 'Propane',                         cls: '2.1', guide: 115, note: BLEVE },
  { un: 1993, he: 'נוזל דליק, לא מפורט',             en: 'Flammable liquid, n.o.s.',        cls: '3',   guide: 128 },
  { un: 1999, he: 'זפת / אספלט נוזלי',               en: 'Tars, liquid / Asphalt',          cls: '3',   guide: 130 },
  { un: 2014, he: 'מי חמצן 20%–60%',                 en: 'Hydrogen peroxide, 20–60%',       cls: '5.1', guide: 140 },
  { un: 2031, he: 'חומצה חנקתית',                    en: 'Nitric acid',                     cls: '8',   guide: 157 },
  { un: 2067, he: 'דשן על בסיס אמוניום חנקתי',       en: 'Ammonium nitrate based fertilizer', cls: '5.1', guide: 140, note: AN_FIRE },
  { un: 2187, he: 'פחמן דו-חמצני נוזלי',             en: 'Carbon dioxide, refrigerated liquid', cls: '2.2', guide: 120 },
  { un: 2209, he: 'תמיסת פורמלדהיד (פורמלין)',       en: 'Formaldehyde, solution',          cls: '8',   guide: 153 },
  { un: 2672, he: 'תמיסת אמוניה 10%–35%',            en: 'Ammonia solution, 10–35%',        cls: '8',   guide: 154 },
  { un: 2789, he: 'חומצה אצטית מרוכזת',              en: 'Acetic acid, glacial',            cls: '8',   guide: 132 },
  { un: 2794, he: 'מצברים עם חומצה',                 en: 'Batteries, wet, filled with acid', cls: '8',  guide: 154 },
  { un: 2810, he: 'נוזל רעיל אורגני, לא מפורט',      en: 'Toxic liquid, organic, n.o.s.',   cls: '6.1', guide: 153 },
  { un: 2814, he: 'חומר מידבק לבני אדם',             en: 'Infectious substance, affecting humans', cls: '6.2', guide: 158 },
  { un: 3077, he: 'חומר מסוכן לסביבה, מוצק',         en: 'Environmentally hazardous substance, solid', cls: '9', guide: 171 },
  { un: 3082, he: 'חומר מסוכן לסביבה, נוזל',         en: 'Environmentally hazardous substance, liquid', cls: '9', guide: 171 },
  { un: 3090, he: 'סוללות ליתיום מתכתי',             en: 'Lithium metal batteries',         cls: '9',   guide: 138 },
  { un: 3257, he: 'נוזל בטמפרטורה גבוהה (מעל 100°C)', en: 'Elevated temperature liquid, n.o.s.', cls: '9', guide: 171 },
  { un: 3264, he: 'נוזל מאכל חומצי, אי-אורגני',      en: 'Corrosive liquid, acidic, inorganic, n.o.s.', cls: '8', guide: 154 },
  { un: 3291, he: 'פסולת רפואית',                    en: 'Clinical / Medical waste',        cls: '6.2', guide: 158 },
  { un: 3373, he: 'חומר ביולוגי, קטגוריה B',         en: 'Biological substance, category B', cls: '6.2', guide: 158 },
  { un: 3480, he: 'סוללות ליתיום-יון',               en: 'Lithium ion batteries',           cls: '9',   guide: 147 },
];

// ─── Emergency action code (HAZCHEM) ─────────────────────────────────────────
export const EAC_DIGITS: Record<string, string> = {
  '1': 'כיבוי: סילון מים',
  '2': 'כיבוי: ריסוס מים עדין / ערפל',
  '3': 'כיבוי: קצף',
  '4': 'כיבוי: אבקה / חומר יבש בלבד. אסור מים',
};

const FULL = 'חליפת מגן אטומה + מערכת נשימה';
const BA = 'מערכת נשימה + ביגוד כיבוי';
export const EAC_LETTERS: Record<string, { violent: boolean; ppe: string; spill: 'dilute' | 'contain' }> = {
  P: { violent: true,  ppe: FULL, spill: 'dilute' },
  R: { violent: false, ppe: FULL, spill: 'dilute' },
  S: { violent: true,  ppe: BA,   spill: 'dilute' },
  T: { violent: false, ppe: BA,   spill: 'dilute' },
  W: { violent: true,  ppe: FULL, spill: 'contain' },
  X: { violent: false, ppe: FULL, spill: 'contain' },
  Y: { violent: true,  ppe: BA,   spill: 'contain' },
  Z: { violent: false, ppe: BA,   spill: 'contain' },
};
