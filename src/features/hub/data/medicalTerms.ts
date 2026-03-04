export type MedicalTerm = { he: string; en: string };

export type MedicalCategory = {
  title: string;
  color: string;
  bg: string;
  border: string;
  terms: MedicalTerm[];
};

export const MEDICAL_CATEGORIES: MedicalCategory[] = [
  {
    title: 'לב וכלי דם',
    color: 'text-red-400',
    bg: 'bg-red-400/5',
    border: 'border-red-400/20',
    terms: [
      { he: 'התקף לב', en: 'Heart Attack (MI)' },
      { he: 'שבץ מוחי', en: 'Stroke (CVA)' },
      { he: 'יתר לחץ דם', en: 'Hypertension' },
      { he: 'פרפור פרוזדורים', en: 'Atrial Fibrillation' },
      { he: 'אי ספיקת לב', en: 'Heart Failure' },
      { he: 'אנגינה פקטוריס', en: 'Angina Pectoris' },
      { he: 'ניתוח מעקפים', en: 'Coronary Bypass' },
      { he: 'קוצב לב', en: 'Pacemaker' },
    ],
  },
  {
    title: 'נשימה',
    color: 'text-blue-400',
    bg: 'bg-blue-400/5',
    border: 'border-blue-400/20',
    terms: [
      { he: 'אסתמה', en: 'Asthma' },
      { he: 'מחלת ריאות חסימתית', en: 'COPD' },
      { he: 'דלקת ריאות', en: 'Pneumonia' },
      { he: 'תסחיף ריאתי', en: 'Pulmonary Embolism' },
      { he: 'קוצר נשימה', en: 'Dyspnea' },
      { he: 'תסמונת דום נשימה', en: 'Sleep Apnea' },
    ],
  },
  {
    title: 'עצבים ומוח',
    color: 'text-purple-400',
    bg: 'bg-purple-400/5',
    border: 'border-purple-400/20',
    terms: [
      { he: 'אפילפסיה', en: 'Epilepsy' },
      { he: 'דמנציה', en: 'Dementia' },
      { he: 'מחלת אלצהיימר', en: "Alzheimer's Disease" },
      { he: 'מחלת פרקינסון', en: "Parkinson's Disease" },
      { he: 'טרשת נפוצה', en: 'Multiple Sclerosis' },
      { he: 'TIA - שבץ חולף', en: 'TIA (Mini-Stroke)' },
      { he: 'מיגרנה', en: 'Migraine' },
    ],
  },
  {
    title: 'סוכר ובלוטות',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/5',
    border: 'border-yellow-400/20',
    terms: [
      { he: 'סוכרת סוג 1', en: 'Diabetes Type 1' },
      { he: 'סוכרת סוג 2', en: 'Diabetes Type 2' },
      { he: 'היפוגליקמיה', en: 'Hypoglycemia' },
      { he: 'היפרגליקמיה', en: 'Hyperglycemia' },
      { he: 'תת-פעילות בלוטת התריס', en: 'Hypothyroidism' },
      { he: 'יתר-פעילות בלוטת התריס', en: 'Hyperthyroidism' },
    ],
  },
  {
    title: 'כליות ועיכול',
    color: 'text-green-400',
    bg: 'bg-green-400/5',
    border: 'border-green-400/20',
    terms: [
      { he: 'אי ספיקת כליות', en: 'Kidney Failure (CKD)' },
      { he: 'דיאליזה', en: 'Dialysis' },
      { he: 'כיב קיבה', en: 'Peptic Ulcer' },
      { he: "מחלת קרוהן", en: "Crohn's Disease" },
      { he: 'קוליטיס כיבית', en: 'Ulcerative Colitis' },
      { he: 'שחמת הכבד', en: 'Liver Cirrhosis' },
    ],
  },
  {
    title: 'כללי ואחר',
    color: 'text-gray-400',
    bg: 'bg-gray-400/5',
    border: 'border-gray-200 dark:border-emt-border',
    terms: [
      { he: 'סרטן', en: 'Cancer (Malignancy)' },
      { he: 'אלרגיה', en: 'Allergy' },
      { he: 'אנפילקסיס', en: 'Anaphylaxis' },
      { he: 'קריש דם / DVT', en: 'Deep Vein Thrombosis' },
      { he: 'HIV / איידס', en: 'HIV / AIDS' },
      { he: 'לופוס', en: 'Lupus (SLE)' },
      { he: 'דלקת מפרקים שגרונית', en: 'Rheumatoid Arthritis' },
      { he: 'אוסטיאופורוזיס', en: 'Osteoporosis' },
    ],
  },
];
