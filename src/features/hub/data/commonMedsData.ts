// מאגר "תרופות נפוצות" — מבוסס על מצגות ההדרכה לצוותי רפואת חירום.
// en: השם המסחרי/גנרי בדיוק כפי שמופיע במצגות (כולל חלופות עם לוכסנים).
// he: תעתיק פונטי בעברית (כיצד הוגים את השם).

export interface CommonMed {
  en: string;
  he: string;
}

export interface MedGroup {
  title?: string;
  image?: string;
  meds: CommonMed[];
}

export interface MedCategory {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  image?: string;
  color: string;
  border: string;
  bg: string;
  divider: string;
  groups: MedGroup[];
}

export const MED_CATEGORIES: MedCategory[] = [
  {
    id: 'cardiovascular',
    title: 'מערכת לב וכלי דם',
    titleEn: 'Cardiovascular',
    description:
      'תרופות המיועדות לטיפול ביתר לחץ דם, אי-ספיקת לב והפרעות קצב. פועלות להרחבת כלי דם, הפחתת עומס מהלב והסדרת הולכה חשמלית.',
    color: 'text-red-400',
    border: 'border-red-400/30',
    bg: 'bg-red-400/5',
    divider: 'border-b border-red-400/20',
    groups: [
      {
        title: 'מעכבי ACE (להורדת לחץ דם)',
        meds: [
          { en: 'Captopril / Capoten / Aceril', he: 'קפטופריל / קפוטן / אצריל' },
          { en: 'Tritace', he: 'טריטייס' },
          { en: 'Vascace', he: 'וסקייס' },
          { en: 'Enalapril / Enalapril', he: 'אנלפריל' },
          { en: 'Valsartan / Diovan', he: 'ולסרטן / דיובאן' },
          { en: 'Losartan / oscaar', he: 'לוסרטן / אוסקר' },
        ],
      },
      {
        title: 'משתנים (Diuretics)',
        meds: [
          { en: 'Aldacton / Aldospiron / Spironolactone', he: 'אלדקטון / אלדוספירון / ספירונולקטון' },
          { en: 'Manitol / Osmitrol', he: 'מניטול / אוסמיטרול' },
          { en: 'Diuril', he: 'דיוריל' },
          { en: 'Furesamide / Fusid / Lasix', he: 'פורוסמיד / פוסיד / לאסיקס' },
          { en: 'Acetazolamide / Diamox', he: 'אצטזולאמיד / דיאמוקס' },
          { en: 'Disothiazide', he: 'דיסותיאזיד' },
        ],
      },
      {
        title: 'אנטי-אריתמיות (הפרעות קצב)',
        meds: [
          { en: 'Quinidine, Rythmex', he: 'קווינידין / ריתמקס' },
          { en: 'Amiodarne, Procor', he: 'אמיודארון / פרוקור' },
          { en: 'Digoxin / Digitalis', he: 'דיגוקסין / דיגיטליס' },
        ],
      },
      {
        title: 'חוסמי בטא (Beta Blockers)',
        meds: [
          { en: 'Bisoprolol / Concor', he: 'ביסופרולול / קונקור' },
          { en: 'Carvedilol / Dilapress', he: 'קרוודילול / דילפרס' },
          { en: 'Propranlol / Deralin', he: 'פרופרנולול / דרלין' },
          { en: 'Atenolol / Normiten', he: 'אטנולול / נורמיטן' },
          { en: 'Metoprolol / Metopress', he: 'מטופרולול / מטופרס' },
          { en: 'Labetalol / Trandate', he: 'לבטלול / טרנדייט' },
        ],
      },
      {
        title: 'חוסמי תעלות סידן (Calcium Channel Blockers)',
        meds: [
          { en: 'Norvasc / Amlodipine / Amlow', he: 'נורווסק / אמלודיפין / אמלאו' },
          { en: 'Diltiiazem / dilitam', he: 'דילטיאזם / דיליטאם' },
          { en: 'Ikacor / Verapamil', he: 'איקקור / ורפמיל' },
          { en: 'Nifedipine / Osmo-Adalat / Pressolat', he: 'ניפדיפין / אוסמו-אדלאט / פרסולט' },
          { en: 'Vasodip', he: 'ואזודיפ' },
          { en: 'Verapress', he: 'ורפרס' },
        ],
      },
      {
        title: 'ניטרטים (מרחיבי כלי דם)',
        meds: [
          { en: 'Isocardide / Isotard', he: 'איזוקרדיד / איזוטרד' },
          { en: 'Nitrderm', he: 'ניטרודרם' },
          { en: 'Isorbid mononitrate / Mononit / Monocord', he: 'איזוסורביד מונוניטרט / מונוניט / מונוקורד' },
          { en: 'Isoorbid Dinitrate / Isoket / Cordil', he: 'איזוסורביד דיניטרט / איזוקט / קורדיל' },
          { en: 'Nitroglycerin / Nitrostat', he: 'ניטרוגליצרין / ניטרוסטט' },
          { en: 'Nipride / Nitroprusside', he: 'ניפריד / ניטרופרוסיד' },
        ],
      },
    ],
  },
  {
    id: 'blood-thinners',
    title: 'מדללי דם ונוגדי קרישה',
    titleEn: 'Blood Thinners',
    description:
      'תרופות למניעת יצירת קרישי דם ואירועים מוחיים, מחולקות לנוגדי קרישה ונוגדי טסיות.',
    color: 'text-rose-400',
    border: 'border-rose-400/30',
    bg: 'bg-rose-400/5',
    divider: 'border-b border-rose-400/20',
    groups: [
      {
        title: 'Anti-Coagulants',
        meds: [
          { en: 'Clexane', he: 'קלקסן' },
          { en: 'Coumadin / Warfarin', he: 'קומדין / וורפרין' },
          { en: 'Heparin', he: 'הפרין' },
          { en: 'Eliquis / Xarelto', he: 'אליקוויס / קסרלטו' },
          { en: 'Pradaxa (Dabigatran)', he: 'פרדקסה (דביגטראן)' },
        ],
      },
      {
        title: 'Anti-Aggregants',
        meds: [
          { en: 'Aspirin / Micropirin / Cartia', he: 'אספירין / מיקרופירין / קרטיה' },
          { en: 'Plavix / Clopidogrel', he: 'פלאביקס / קלופידוגרל' },
          { en: 'Prasugrel / Effient', he: 'פרסוגרל / אפיאנט' },
          { en: 'Ticagrelor / Brilinta', he: 'טיקגרלור / ברילינטה' },
        ],
      },
    ],
  },
  {
    id: 'respiratory',
    title: 'מערכת הנשימה (אסתמה, COPD)',
    titleEn: 'Respiratory',
    description:
      'תרופות להרחבת דרכי הנשימה (ברונכודילטורים) הניתנות לרוב במשאף או אינהלציה.',
    color: 'text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/5',
    divider: 'border-b border-sky-400/20',
    groups: [
      {
        meds: [
          { en: 'Bricalin / Ventolin / Salbutamol', he: 'בריקלין / ונטולין / סלבוטמול' },
          { en: 'Aerovent', he: 'אירובנט' },
          { en: 'Seretide', he: 'סרטייד' },
          { en: 'Singulair / Montelukast', he: 'סינגולר / מונטלוקאסט' },
          { en: 'Xolair / Omalizumab', he: 'זולאייר / אומליזומאב' },
          { en: 'Aminophylline', he: 'אמינופילין' },
        ],
      },
    ],
  },
  {
    id: 'diabetes',
    title: 'סוכרת',
    titleEn: 'Diabetes',
    description:
      'תרופות הפועלות במנגנונים שונים לוויסות רמות הגלוקוז בדם והאינסולין.',
    color: 'text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/5',
    divider: 'border-b border-amber-400/20',
    groups: [
      {
        meds: [
          { en: 'Victoza', he: 'ויקטוזה' },
          { en: 'Liraglutide', he: 'לירגלוטייד' },
          { en: 'Prandase', he: 'פרנדייז' },
          { en: 'Januvia', he: "ג'נוביה" },
          { en: 'Jardiance', he: "ג'ארדיאנס" },
          { en: 'Insulin (Novolog, Lantus, Epidra)', he: 'אינסולין (נובולוג, לנטוס, אפידרה)' },
          { en: 'Metformin / Glucomin / Glucophage', he: "מטפורמין / גלוקומין / גלוקופאג'" },
          { en: 'Gluben / Glibetic', he: 'גלובן / גליבטיק' },
          { en: 'Trajenta', he: "טרג'נטה" },
          { en: 'Januet', he: "ג'נואט" },
        ],
      },
    ],
  },
  {
    id: 'neuro-psych',
    title: 'מערכת העצבים והנפש',
    titleEn: 'Neurology & Psychiatry',
    description:
      'תרופות המשפיעות על מערכת העצבים ומשמשות לטיפול בדיכאון, חרדה, הרגעה ומניעת פרכוסים.',
    color: 'text-violet-400',
    border: 'border-violet-400/30',
    bg: 'bg-violet-400/5',
    divider: 'border-b border-violet-400/20',
    groups: [
      {
        title: 'נוגדי דיכאון',
        meds: [
          { en: 'Lithium', he: 'ליתיום' },
          { en: 'Zyprexa', he: 'זיפרקסה' },
          { en: 'Prozac', he: 'פרוזק' },
          { en: 'Cipralex', he: 'ציפרלקס' },
          { en: 'Prizma', he: 'פריזמה' },
          { en: 'Seroxat', he: 'סרוקסט' },
          { en: 'Recital', he: 'רסיטל' },
          { en: 'Lustral', he: 'לוסטרל' },
          { en: 'Cymbalta', he: 'סימבלטה' },
        ],
      },
      {
        title: 'בנזודיאזפינים (הרגעה)',
        meds: [
          { en: 'Bondormin', he: 'בונדורמין' },
          { en: 'Clonex / Clonazepam', he: 'קלונקס / קלונאזפאם' },
          { en: 'Lorivan / Lorazepam', he: 'לוריבן / לוראזפאם' },
          { en: 'Assival / Valium / Diazepam', he: 'אסיוול / ואליום / דיאזפאם' },
          { en: 'Vaben', he: 'ואבן' },
          { en: 'Dormicum / Midazolam / Midolam', he: 'דורמיקום / מידאזולם / מידולאם' },
        ],
      },
      {
        title: 'תרופות אנטי-אפילפטיות (מניעת פרכוסים)',
        meds: [
          { en: 'Keppra', he: 'קפרה' },
          { en: 'Trileptin', he: 'טרילפטין' },
          { en: 'Topamax', he: 'טופמקס' },
          { en: 'Phenytoin', he: 'פניטואין' },
          { en: 'Depalept / Valporate', he: 'דפלפט / ולפרואט' },
          { en: 'Luminal / phenobarbital', he: 'לומינל / פנוברביטל' },
          { en: 'Tegretol / Carbamezapine', he: 'טגרטול / קרבמזפין' },
          { en: 'Lamictal / Lamotrigine', he: "למיקטל / למוטריג'ין" },
        ],
      },
    ],
  },
  {
    id: 'gastro',
    title: 'מערכת העיכול (כיב קיבה, צרבת)',
    titleEn: 'Gastrointestinal',
    description: 'תרופות המיועדות לסתור או למנוע עודף חומציות בקיבה.',
    color: 'text-emerald-400',
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-400/5',
    divider: 'border-b border-emerald-400/20',
    groups: [
      {
        meds: [
          { en: 'Tums (סותר חומצה)', he: 'טאמס' },
          { en: 'Maalox (סותר חומצה)', he: 'מאלוקס' },
          { en: 'Gastro / Famotidine (H2 Blocker)', he: 'גסטרו / פמוטידין' },
          { en: 'Zantac / Ranitidine (H2 Blocker)', he: 'זנטק / רניטידין' },
          { en: 'Losec / Omepradex (PPI)', he: 'לוזק / אומפרדקס' },
          { en: 'Nexium (PPI)', he: 'נקסיום' },
        ],
      },
    ],
  },
  {
    id: 'analgesics',
    title: 'משככי כאבים וחום',
    titleEn: 'Analgesics',
    description:
      'תרופות נוגדות דלקת שאינן סטרואידים (NSAIDs) ואופיואידים חזקים לשיכוך כאב.',
    color: 'text-orange-400',
    border: 'border-orange-400/30',
    bg: 'bg-orange-400/5',
    divider: 'border-b border-orange-400/20',
    groups: [
      {
        title: 'NSAIDs / שונות',
        meds: [
          { en: 'Aspirin', he: 'אספירין' },
          { en: 'Ibuprofen / Ibufen / Advil / Nurofen', he: 'איבופרופן / איבופן / אדוויל / נורופן' },
          { en: 'Voltaren', he: 'וולטרן' },
          { en: 'Etopan', he: 'אתופן' },
          { en: 'Naxin', he: 'נקסין' },
          { en: 'Acetaminophen / paracetamol', he: 'אצטמינופן / פרצטמול' },
          { en: 'Optalgin / dipyrone', he: 'אופטלגין / דיפירון' },
          { en: 'Lyrica', he: 'ליריקה' },
        ],
      },
      {
        title: 'Opioids (אופיואידים)',
        meds: [
          { en: 'Morphine', he: 'מורפין' },
          { en: 'Oxycodone / percocet', he: 'אוקסיקודון / פרקוסט' },
          { en: 'Fentanyl', he: 'פנטניל' },
          { en: 'Targin', he: 'טרגין' },
          { en: 'Algolysin', he: 'אלגוליזין' },
        ],
      },
    ],
  },
  {
    id: 'thyroid',
    title: 'בלוטת התריס',
    titleEn: 'Thyroid',
    description:
      'טיפול בעודף פעילות (על ידי תרופות מווסתות) או בחוסר פעילות (על ידי תחליפי הורמון).',
    color: 'text-teal-400',
    border: 'border-teal-400/30',
    bg: 'bg-teal-400/5',
    divider: 'border-b border-teal-400/20',
    groups: [
      {
        title: 'עודף פעילות (Hyperthyroidism)',
        meds: [
          { en: 'Mercaptizol', he: 'מרקפטיזול' },
          { en: 'Propylthouracil (PPU)', he: 'פרופילתיאורציל' },
        ],
      },
      {
        title: 'חוסר פעילות (Hypothyroidism)',
        meds: [
          { en: 'Eltroxin', he: 'אלטרוקסין' },
          { en: 'Euthyrox', he: 'יוטירוקס' },
        ],
      },
    ],
  },
];

export const TOTAL_MEDS = MED_CATEGORIES.reduce(
  (sum, cat) => sum + cat.groups.reduce((s, g) => s + g.meds.length, 0),
  0,
);
