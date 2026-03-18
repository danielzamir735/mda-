export type MedicalTerm = { he: string; en: string; description?: string };

export type TabletItem = { abbr: string; en: string; he: string };
export type TabletCategory = { category: string; items: TabletItem[] };

export type MedicalCategory = {
  title: string;
  color: string;
  bg: string;
  border: string;
  terms: MedicalTerm[];
};

export const TABLET_CATEGORIES: TabletCategory[] = [
  {
    category: 'מחלות נשימה (Respiratory)',
    items: [
      { abbr: 'Asthma', en: 'Asthma', he: 'אסטמה' },
      { abbr: 'COPD', en: 'Chronic Obstructive Pulmonary Disease', he: 'מחלת ריאות חסימתית כרונית' },
    ],
  },
  {
    category: 'מחלות ובעיות בלב (Cardiovascular)',
    items: [
      { abbr: 'Hypertension', en: 'Hypertension', he: 'יתר לחץ דם (כרוני)' },
      { abbr: 'Chr.IHD', en: 'Chronic Ischemic Heart Disease', he: 'מחלת לב איסכמית כרונית' },
      { abbr: 's/p MI', en: 'Myocardial Infarction', he: 'אוטם בשריר הלב (לאחר אירוע)' },
      { abbr: 'CHF', en: 'Congestive Heart Failure', he: 'אי ספיקת לב' },
      { abbr: 'Atrial fib', en: 'Atrial fibrillation', he: 'פרפור עליות' },
      { abbr: 's/p CABG', en: 'Coronary Artery Bypass Grafting', he: 'ניתוח מעקפים' },
      { abbr: 'Pacemaker', en: 'Pacemaker', he: 'קוצב לב' },
      { abbr: 's/p PTCA', en: 'Percutaneous Transluminal Coronary Angioplasty', he: 'צנתור (בלון/תומכן)' },
    ],
  },
  {
    category: 'מחלות נוירולוגיות (Neurology)',
    items: [
      { abbr: 's/p CVA', en: 'Cerebro Vascular Accident / Stroke', he: 'שבץ מוחי' },
      { abbr: 's/p TIA', en: 'Transient Ischemic Attack', he: 'שבץ איסכמי חולף' },
      { abbr: 's/p Epilepsy', en: 'Epilepsy', he: 'אפילפסיה / כפיון' },
      { abbr: 'Cognitive Dis.', en: 'Cognitive Disorder', he: 'הפרעות בתפקודי חשיבה וזיכרון' },
    ],
  },
  {
    category: 'מערכות נוספות והפרעות מטבוליות',
    items: [
      { abbr: 'CRF', en: 'Chronic Renal Failure', he: 'אי ספיקת כליות כרונית' },
      { abbr: 'Diabetes Mellitus', en: 'Diabetes Mellitus', he: 'סכרת' },
      { abbr: 'Lipid disorder', en: 'Lipid disorder', he: 'בעיות ברמות השומנים בדם (היפרליפידמיה)' },
      { abbr: 'Thyroid Disorder', en: 'Thyroid Disorder', he: 'בעיות בלוטת התריס' },
      { abbr: 'Malignancy', en: 'Malignancy / Cancer', he: 'גידולים סרטניים' },
      { abbr: 'Gastrointestinal', en: 'Gastrointestinal', he: 'מחלות מערכת העיכול' },
      { abbr: 'Hematologic', en: 'Hematologic', he: 'מחלות הקשורות לדם ומרכיביו' },
      { abbr: 'Psychiatric', en: 'Psychiatric', he: 'מחלות ובעיות נפשיות' },
      { abbr: 'Orthopedic', en: 'Orthopedic', he: 'פגיעות עצמות ושרירים' },
      { abbr: 'Genitourinary', en: 'Genitourinary', he: 'מחלות מין ודרכי השתן' },
    ],
  },
  {
    category: 'הרגלים ואחר (Habits & Other)',
    items: [
      { abbr: 'Obesity', en: 'Obesity', he: 'השמנת יתר' },
      { abbr: 'Smoking', en: 'Smoking', he: 'עישון' },
      { abbr: 'Drug Abuse', en: 'Chronic Drug Use', he: 'שימוש כרוני בסמים' },
      { abbr: 'Alcohol', en: 'Alcoholism', he: 'שתיית אלכוהול' },
    ],
  },
];

export const MEDICAL_CATEGORIES: MedicalCategory[] = [
  {
    title: 'לב וכלי דם',
    color: 'text-red-400',
    bg: 'bg-red-400/5',
    border: 'border-red-400/20',
    terms: [
      {
        he: 'התקף לב',
        en: 'Heart Attack (MI)',
        description: 'אוטם שריר הלב (MI). נמק של חלק משריר הלב עקב חסימה מלאה או חלקית של עורק כלילי המספק לו דם וחמצן.',
      },
      {
        he: 'שבץ מוחי',
        en: 'Stroke (CVA)',
        description: 'הפרעה פתאומית באספקת הדם למוח. מתחלק לשניים: 1. שבץ איסכמי (חסימתי) - קריש דם החוסם עורק למוח (נפוץ יותר). 2. שבץ המורגי (דימומי) - קרע של כלי דם ודימום לתוך רקמת המוח.',
      },
      {
        he: 'יתר לחץ דם',
        en: 'Hypertension',
        description: 'מצב כרוני בו לחץ הדם בעורקים גבוה מהתקין (מעל 140/90). מכונה "הרוצח השקט" ומעלה סיכון לשבץ והתקפי לב.',
      },
      {
        he: 'פרפור פרוזדורים',
        en: 'Atrial Fibrillation',
        description: 'הפרעת הקצב השכיחה ביותר. העליות בלב מתכווצות במהירות ובחוסר סדירות, מה שעלול לגרום להיווצרות קרישי דם ולשבץ.',
      },
      {
        he: 'אי ספיקת לב',
        en: 'Heart Failure',
        description: 'מצב בו הלב אינו מצליח לשאוב ולהזרים דם בקצב העונה על צורכי הגוף, מוביל להצטברות נוזלים בריאות (בצקת) או ברגליים.',
      },
      {
        he: 'אנגינה פקטוריס',
        en: 'Angina Pectoris',
        description: 'תעוקת חזה. כאב או אי נוחות בחזה הנגרמים עקב היצרות בעורקים הכליליים, מה שמוביל לאספקת חמצן לקויה לשריר הלב בזמן מאמץ.',
      },
      {
        he: 'ניתוח מעקפים',
        en: 'Coronary Bypass',
        description: 'הליך כירורגי (CABG) בו יוצרים נתיב עוקף לעורק כלילי חסום באמצעות כלי דם שנלקח מאזור אחר בגוף.',
      },
      {
        he: 'קוצב לב',
        en: 'Pacemaker',
        description: 'מכשיר חשמלי קטן המושתל בחזה ונועד להסדיר את קצב הלב במקרים של דופק איטי מדי או הפרעות קצב מסכנות חיים.',
      },
    ],
  },
  {
    title: 'נשימה',
    color: 'text-blue-400',
    bg: 'bg-blue-400/5',
    border: 'border-blue-400/20',
    terms: [
      {
        he: 'אסתמה',
        en: 'Asthma',
        description: 'מחלה דלקתית כרונית של דרכי הנשימה. מתאפיינת בהתקפים של היצרות הסמפונות (ברונכוספאזם), ריבוי הפרשות וקוצר נשימה צפצפני.',
      },
      {
        he: 'מחלת ריאות חסימתית',
        en: 'COPD',
        description: 'מחלת ריאות חסימתית כרונית (לרוב עקב עישון). כוללת פגיעה בלתי הפיכה בנאדיות הריאה (אמפיזמה) ודלקת כרונית בסמפונות, המובילות לקושי מתמשך בנשיפה.',
      },
      {
        he: 'דלקת ריאות',
        en: 'Pneumonia',
        description: 'זיהום (חיידקי, נגיפי או פטרייתי) ברקמת הריאה, הגורם להצטברות נוזלים ומוגלה בנאדיות ופוגע בחילוף הגזים.',
      },
      {
        he: 'תסחיף ריאתי',
        en: 'Pulmonary Embolism',
        description: 'קריש דם (לרוב מגיע מוורידי הרגליים - DVT) שניתק ונדד עד שחסם עורק מרכזי בריאות. מצב חירום מסכן חיים.',
      },
      {
        he: 'קוצר נשימה',
        en: 'Dyspnea',
        description: 'דיספניאה. תחושה סובייקטיבית של חוסר אוויר או מאמץ נשימתי מוגבר. מהווה תסמין למגוון מצבי חירום נשימתיים ולבביים.',
      },
      {
        he: 'תסמונת דום נשימה',
        en: 'Sleep Apnea',
        description: 'דום נשימה בשינה (Sleep Apnea). הפסקות נשימה קצרות וחוזרות במהלך השינה עקב חסימת דרכי האוויר העליונות.',
      },
    ],
  },
  {
    title: 'עצבים ומוח',
    color: 'text-purple-400',
    bg: 'bg-purple-400/5',
    border: 'border-purple-400/20',
    terms: [
      {
        he: 'אפילפסיה',
        en: 'Epilepsy',
        description: 'מחלה נוירולוגית המתאפיינת בנטייה לפרכוסים חוזרים עקב התפרצויות של פעילות חשמלית לא תקינה ועודפת במוח.',
      },
      {
        he: 'דמנציה',
        en: 'Dementia',
        description: 'שיטיון. ירידה הדרגתית ובלתי הפיכה בתפקוד הקוגניטיבי (זיכרון, חשיבה, התמצאות) הפוגעת בתפקוד היומיומי.',
      },
      {
        he: 'מחלת אלצהיימר',
        en: "Alzheimer's Disease",
        description: 'הגורם הנפוץ ביותר לדמנציה. מחלה ניוונית של המוח המתאפיינת בהצטברות חלבונים פגומים הפוגעים בתאי העצב.',
      },
      {
        he: 'מחלת פרקינסון',
        en: "Parkinson's Disease",
        description: 'מחלה ניוונית של מערכת העצבים הפוגעת באזור במוח המייצר דופמין. מתבטאת ברעד במנוחה, נוקשות שרירים ואיטיות בתנועה.',
      },
      {
        he: 'טרשת נפוצה',
        en: 'Multiple Sclerosis',
        description: 'מחלה אוטואימונית בה מערכת החיסון תוקפת את מעטפת המיאלין של תאי העצב במוח ובחוט השדרה, מה שמשבש את העברת האותות.',
      },
      {
        he: 'TIA - שבץ חולף',
        en: 'TIA (Mini-Stroke)',
        description: 'אירוע איסכמי חולף. חסימה זמנית באספקת הדם למוח הגורמת לתסמיני שבץ שחולפים מעצמם (לרוב תוך פחות מ-24 שעות). מהווה תמרור אזהרה חמור לשבץ אמיתי.',
      },
      {
        he: 'מיגרנה',
        en: 'Migraine',
        description: 'התקפי כאב ראש פועם וחזק, לרוב בצד אחד של הראש, מלווים לעיתים בבחילות, הקאות ורגישות קיצונית לאור ולקול.',
      },
    ],
  },
  {
    title: 'סוכר ובלוטות',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/5',
    border: 'border-yellow-400/20',
    terms: [
      {
        he: 'סוכרת סוג 1',
        en: 'Diabetes Type 1',
        description: 'סוכרת נעורים. מחלה אוטואימונית בה הלבלב אינו מייצר אינסולין כלל. המטופל תלוי לחלוטין בהזרקת אינסולין.',
      },
      {
        he: 'סוכרת סוג 2',
        en: 'Diabetes Type 2',
        description: 'הסוג הנפוץ ביותר. הגוף מפתח תנגודת לאינסולין או שהלבלב לא מייצר מספיק ממנו. קשורה לרוב לגנטיקה, עודף משקל ואורח חיים.',
      },
      {
        he: 'היפוגליקמיה',
        en: 'Hypoglycemia',
        description: 'מצב חירום בו רמת הסוכר בדם יורדת מתחת לנורמה (לרוב מתחת ל-60 mg/dL). עלול לגרום לבלבול, פרכוסים ואובדן הכרה.',
      },
      {
        he: 'היפרגליקמיה',
        en: 'Hyperglycemia',
        description: 'רמת סוכר גבוהה בדם. אם לא מטופל, עלול להוביל למצבי חירום מסכני חיים כמו DKA (חמצת קטוטית דיאבטית).',
      },
      {
        he: 'תת-פעילות בלוטת התריס',
        en: 'Hypothyroidism',
        description: 'היפותירואידיזם. הבלוטה לא מייצרת מספיק הורמונים. מתבטא בעייפות, השמנה, רגישות לקור וקצב לב איטי.',
      },
      {
        he: 'יתר-פעילות בלוטת התריס',
        en: 'Hyperthyroidism',
        description: 'היפרתירואידיזם. ייצור עודף של הורמוני הבלוטה. מתבטא בירידה במשקל, דופק מהיר, הזעה ואי-שקט.',
      },
    ],
  },
  {
    title: 'כליות ועיכול',
    color: 'text-green-400',
    bg: 'bg-green-400/5',
    border: 'border-green-400/20',
    terms: [
      {
        he: 'אי ספיקת כליות',
        en: 'Kidney Failure (CKD)',
        description: 'אובדן הדרגתי של יכולת הכליות לסנן פסולת ועודפי נוזלים מהדם. בשלבים מתקדמים דורש דיאליזה או השתלה.',
      },
      {
        he: 'דיאליזה',
        en: 'Dialysis',
        description: 'טיפול רפואי מלאכותי המחליף את פעולת הכליות ומסנן את הדם מרעלים ונוזלים עודפים (לרוב דרך מכונה חיצונית - המודיאליזה).',
      },
      {
        he: 'כיב קיבה',
        en: 'Peptic Ulcer',
        description: 'אולקוס. פצע פתוח ברירית הקיבה או בתריסריון, לרוב עקב זיהום חיידקי (הליקובקטר פילורי) או שימוש ממושך במשככי כאבים. סכנה לדימום פנימי.',
      },
      {
        he: 'מחלת קרוהן',
        en: "Crohn's Disease",
        description: 'מחלת מעיים דלקתית כרונית היכולה לפגוע בכל חלק של מערכת העיכול (מהפה ועד פי הטבעת). פוגעת בכל שכבות דופן המעי.',
      },
      {
        he: 'קוליטיס כיבית',
        en: 'Ulcerative Colitis',
        description: 'מחלת מעיים דלקתית הפוגעת רק ברירית הפנימית של המעי הגס והרקטום, וגורמת לכיבים ולשלשולים דמיים.',
      },
      {
        he: 'שחמת הכבד',
        en: 'Liver Cirrhosis',
        description: 'הצטלקות בלתי הפיכה של רקמת הכבד המחליפה רקמה בריאה, לרוב עקב צריכת אלכוהול כרונית או צהבת נגיפית.',
      },
    ],
  },
  {
    title: 'כללי ואחר',
    color: 'text-gray-400',
    bg: 'bg-gray-400/5',
    border: 'border-gray-200 dark:border-emt-border',
    terms: [
      {
        he: 'סרטן',
        en: 'Cancer (Malignancy)',
        description: 'שם כולל למחלות בהן יש חלוקה לא מבוקרת של תאים חריגים היכולים לחדור לרקמות סמוכות ולשלוח גרורות לאיברים אחרים.',
      },
      {
        he: 'אלרגיה',
        en: 'Allergy',
        description: 'תגובת יתר של מערכת החיסון לחומרים שגרתיים בסביבה (אלרגנים) כמו אבק, מזון או ארס דבורים.',
      },
      {
        he: 'אנפילקסיס',
        en: 'Anaphylaxis',
        description: 'הלם אנפילקטי. תגובה אלרגית מערכתית, חריפה ומסכנת חיים. מתבטאת בירידת לחץ דם דרסטית, קוצר נשימה ונפיחות בדרכי האוויר.',
      },
      {
        he: 'קריש דם / DVT',
        en: 'Deep Vein Thrombosis',
        description: 'פקקת ורידים עמוקים. קריש דם שנוצר לרוב בוורידי הרגליים. הסכנה העיקרית היא ניתוק הקריש ונסיעתו לריאות (תסחיף ריאתי).',
      },
      {
        he: 'HIV / איידס',
        en: 'HIV / AIDS',
        description: 'HIV הוא הנגיף הפוגע במערכת החיסון. איידס (תסמונת הכשל החיסוני הנרכש) הוא השלב המתקדם של המחלה בו הגוף חשוף לזיהומים קטלניים.',
      },
      {
        he: 'לופוס',
        en: 'Lupus (SLE)',
        description: 'זאבת. מחלה אוטואימונית כרונית בה מערכת החיסון תוקפת רקמות ואיברים בריאים בגוף (עור, מפרקים, כליות, לב).',
      },
      {
        he: 'דלקת מפרקים שגרונית',
        en: 'Rheumatoid Arthritis',
        description: 'מחלה אוטואימונית הגורמת לדלקת כרונית, נפיחות, כאב ועיוות במפרקים (לרוב בכפות הידיים והרגליים).',
      },
      {
        he: 'אוסטיאופורוזיס',
        en: 'Osteoporosis',
        description: 'בריחת סידן. ירידה בצפיפות העצם ההופכת אותה לשבירה ופגיעה מאוד, גם מחבלות קלות (נפוץ אצל נשים מבוגרות).',
      },
    ],
  },
];
