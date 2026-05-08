// Adult ALS drug protocol — NATAN April 2024
// Most doses are fixed; weight-based doses use a function + doseSummary fallback.

export interface AdultDrugRoute {
  route: string;
  dose: string | ((w: number) => string);
  doseSummary?: string; // shown when dose is a function but no weight entered
  max?: string;
  note?: string;
}

export interface AdultDrug {
  name: string;
  sub: string;
  color: string;
  routes: AdultDrugRoute[];
  note?: string;
}

export interface AdultScenario {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  solidBg: string;
  drugs: AdultDrug[];
}

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
const fmt0 = (n: number) => Math.round(n).toString();
const fmt1 = (n: number) => parseFloat(n.toFixed(1)).toString();

export const ADULT_SCENARIOS: AdultScenario[] = [

  // ── 1. דום לב ────────────────────────────────────────────────────────────────
  {
    id: 'cardiac-arrest',
    label: 'דום לב',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    solidBg: 'bg-red-600',
    drugs: [
      {
        name: 'אדרנלין',
        sub: 'Epinephrine — VF / PEA / Asystole',
        color: 'text-red-500',
        routes: [
          { route: 'IV / IO', dose: '1 mg', max: 'כל 3–5 דקות ללא הגבלה', note: 'ממשיכים עד ROSC' },
          { route: 'ET', dose: '3 mg', note: 'כלל ETx3' },
        ],
      },
      {
        name: 'אמיודרון',
        sub: 'Amiodarone — VF / VT ללא דופק',
        color: 'text-orange-400',
        routes: [
          { route: 'IV Push — מנה 1', dose: '300 mg' },
          { route: 'IV Push — מנה 2', dose: '150 mg', max: 'כ"סה 450 mg (3 מנות)' },
        ],
        note: 'VF / VT ללא דופק בלבד',
      },
      {
        name: 'ביקרבונט',
        sub: 'Sodium Bicarbonate',
        color: 'text-slate-400',
        routes: [
          {
            route: 'IV',
            dose: (w) => `${fmt0(clamp(w, 40, 100))} meq`,
            doseSummary: '1 meq/kg',
            max: '50–100 meq',
          },
        ],
        note: 'VF ממושך / אסיסטולה / היפרקלמיה',
      },
    ],
  },

  // ── 2. ברדיקרדיה ─────────────────────────────────────────────────────────────
  {
    id: 'bradycardia',
    label: 'ברדיקרדיה',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    borderColor: 'border-amber-400/30',
    solidBg: 'bg-amber-500',
    drugs: [
      {
        name: 'אטרופין',
        sub: 'Atropine',
        color: 'text-amber-400',
        routes: [
          { route: 'IV / IO', dose: '1 mg', max: '3 mg סה"כ', note: 'כל 3–5 דקות' },
        ],
      },
      {
        name: 'אדרנלין',
        sub: 'Epinephrine — ברדיקרדיה עם היפופרפוזיה',
        color: 'text-red-500',
        routes: [
          { route: 'IV Push', dose: '10–20 mcg', note: 'כל 2 דקות' },
          { route: 'IV Drip', dose: '2–10 mcg/דקה' },
        ],
      },
    ],
  },

  // ── 3. טכיקרדיה NCT/WCT ──────────────────────────────────────────────────────
  {
    id: 'tachycardia',
    label: 'טכיקרדיה',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
    borderColor: 'border-cyan-400/30',
    solidBg: 'bg-cyan-500',
    drugs: [
      {
        name: 'אדנוזין',
        sub: 'Adenosine — SVT / NCT / WCT',
        color: 'text-cyan-400',
        routes: [
          { route: 'IV Push מהיר — מנה 1', dose: '6 mg', max: '2 מנות מקסימום' },
          { route: 'IV Push מהיר — מנה 2', dose: '12 mg' },
        ],
        note: 'IV Push מהיר מאוד — flush מיד אחרי',
      },
      {
        name: 'איקקור',
        sub: 'Verapamil — NCT בלבד',
        color: 'text-sky-400',
        routes: [
          { route: 'IV איטי (10 דקות)', dose: '2.5 → 5 mg', max: '20 mg סה"כ' },
        ],
        note: 'NCT בלבד — אסור ב-WCT / WPW / א"ס',
      },
      {
        name: 'אמיודרון',
        sub: 'Amiodarone — NCT / WCT',
        color: 'text-orange-400',
        routes: [
          { route: 'IV (10 דקות)', dose: '150 mg', max: '300 mg סה"כ' },
          { route: 'IV Drip (לאחר המרה)', dose: '1 mg/דקה' },
        ],
      },
      {
        name: 'מגנזיום',
        sub: 'Magnesium — TdP / WCT פולימורפי',
        color: 'text-lime-400',
        routes: [
          { route: 'IV (5–10 דקות)', dose: '1–2 g', note: 'מהול ב-100cc' },
        ],
        note: 'VT פולימורפי / TdP בלבד',
      },
    ],
  },

  // ── 4. ACS ────────────────────────────────────────────────────────────────────
  {
    id: 'acs',
    label: 'ACS',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-400/30',
    solidBg: 'bg-orange-500',
    drugs: [
      {
        name: 'אספירין',
        sub: 'Aspirin',
        color: 'text-orange-400',
        routes: [
          { route: 'PO (לעיסה)', dose: '160–325 mg' },
        ],
      },
      {
        name: 'ניטרולינגואל',
        sub: 'Nitrolingual — SL spray',
        color: 'text-yellow-400',
        routes: [
          { route: 'SL', dose: '0.4 mg', max: '3 מנות בהפרש 3–5 דקות', note: 'לא לתת אם ל"ד <90 / PDE5 inhibitors' },
        ],
      },
      {
        name: 'פנטניל',
        sub: 'Fentanyl — כאב חזה',
        color: 'text-purple-400',
        routes: [
          {
            route: 'IV איטי (10 דקות)',
            dose: (w) => `${fmt0(clamp(w * 1, 50, 100))} mcg`,
            doseSummary: '1 mcg/kg | מקס׳ 100 mcg',
            max: 'חזרה אחת לאחר 5–10 דקות',
          },
        ],
        note: 'גיל 75+ / CRF: 2/3 מנה',
      },
      {
        name: 'הפרין',
        sub: 'Heparin — ACS / PAF >48ש׳',
        color: 'text-rose-400',
        routes: [
          { route: 'IV Push', dose: '5,000 U', note: 'מנה יחידה' },
        ],
      },
    ],
  },

  // ── 5. בצקת ריאות ────────────────────────────────────────────────────────────
  {
    id: 'pulm-edema',
    label: 'בצקת ריאות',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/30',
    solidBg: 'bg-blue-500',
    drugs: [
      {
        name: 'ניטרולינגואל',
        sub: 'Nitrolingual SL',
        color: 'text-yellow-400',
        routes: [
          { route: 'SL', dose: '0.4 mg', max: 'כל 3–5 דקות', note: 'לא לתת אם ל"ד <90' },
        ],
      },
      {
        name: 'איזוסורביד דיניטרט',
        sub: 'Isosorbide Dinitrate — IV Drip',
        color: 'text-blue-400',
        routes: [
          { route: 'IV Drip', dose: '20 mcg/דקה', max: '200 mcg/דקה', note: 'הכפל מנה כל 5 דקות' },
        ],
      },
      {
        name: 'פוסיד',
        sub: 'Furosemide',
        color: 'text-indigo-400',
        routes: [
          {
            route: 'IV',
            dose: (w) => `${fmt0(clamp(w, 20, 120))} mg`,
            doseSummary: '1 mg/kg',
            max: '120 mg',
            note: 'מינון כפול לנוטלי פוסיד באופן קבוע',
          },
        ],
      },
      {
        name: 'דופמין',
        sub: 'Dopamine — בצקת ריאות עם היפוטנסיה',
        color: 'text-violet-400',
        routes: [
          { route: 'IV Drip', dose: '5–20 mcg/kg/דקה' },
        ],
      },
    ],
  },

  // ── 6. אנאפילקסיס ────────────────────────────────────────────────────────────
  {
    id: 'anaphylaxis',
    label: 'אנאפילקסיס',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    solidBg: 'bg-rose-600',
    drugs: [
      {
        name: 'אדרנלין',
        sub: 'Epinephrine 1:1,000 — IM',
        color: 'text-red-500',
        routes: [
          { route: 'IM (ירך) — קל/בינוני', dose: '0.3 mg SC', max: 'מנה יחידה' },
          { route: 'IM (ירך) — קשה', dose: '0.3–0.5 mg', max: '3 מנות | כל 10 דקות', note: 'זהירות גיל >40 / IHD' },
          { route: 'IV Push — קשה', dose: '10–20 mcg', max: 'כל 2 דקות' },
        ],
      },
      {
        name: 'ונטולין',
        sub: 'Salbutamol — ברונכוספזם',
        color: 'text-teal-400',
        routes: [
          { route: 'אינהלציה', dose: '2.5–5 mg', max: '3 מנות | כל 20 דקות' },
        ],
      },
      {
        name: 'סולמדרול',
        sub: 'Methylprednisolone',
        color: 'text-orange-400',
        routes: [
          { route: 'IV', dose: '125 mg', note: 'מנה יחידה' },
        ],
      },
      {
        name: 'נוזלים',
        sub: 'NaCl 0.9% — שוק',
        color: 'text-blue-300',
        routes: [
          { route: 'IV', dose: '250–500 cc', note: 'בולוסים חוזרים לפי מצב' },
        ],
      },
    ],
  },

  // ── 7. אסתמה / COPD ──────────────────────────────────────────────────────────
  {
    id: 'respiratory',
    label: 'אסתמה / COPD',
    color: 'text-teal-400',
    bgColor: 'bg-teal-400/10',
    borderColor: 'border-teal-400/30',
    solidBg: 'bg-teal-500',
    drugs: [
      {
        name: 'ונטולין',
        sub: 'Salbutamol',
        color: 'text-teal-400',
        routes: [
          { route: 'אינהלציה — קל/בינוני', dose: '2.5 mg', max: '3 מנות | כל 20 דקות' },
          { route: 'אינהלציה — קשה', dose: '5 mg', max: '3 מנות' },
          { route: 'ET', dose: '2.5–5 mg', note: '+ 2–3cc סליין' },
        ],
      },
      {
        name: 'אירובנט',
        sub: 'Ipratropium',
        color: 'text-teal-300',
        routes: [
          { route: 'אינהלציה — אסתמה', dose: '0.5 mg', max: '3 מנות (קשה)' },
          { route: 'אינהלציה — COPD', dose: '0.5 mg', note: 'מנה יחידה' },
        ],
        note: 'ניתן לשלב עם ונטולין',
      },
      {
        name: 'מגנזיום',
        sub: 'Magnesium — אסתמה קשה',
        color: 'text-lime-400',
        routes: [
          { route: 'IV (20 דקות)', dose: '2–3 g', note: 'אסתמה קשה בלבד' },
        ],
      },
      {
        name: 'סולמדרול',
        sub: 'Methylprednisolone',
        color: 'text-orange-400',
        routes: [
          { route: 'IV', dose: '125 mg', note: 'מנה יחידה' },
        ],
      },
      {
        name: 'אדרנלין',
        sub: 'Epinephrine — אסתמה / סטרידור',
        color: 'text-red-500',
        routes: [
          { route: 'SC', dose: '0.3 mg', note: 'מנה יחידה' },
        ],
      },
    ],
  },

  // ── 8. סדציה / אינטובציה ──────────────────────────────────────────────────────
  {
    id: 'sedation',
    label: 'סדציה',
    color: 'text-sky-400',
    bgColor: 'bg-sky-400/10',
    borderColor: 'border-sky-400/30',
    solidBg: 'bg-sky-500',
    drugs: [
      {
        name: 'אטומידאט',
        sub: 'Etomidate — RSI',
        color: 'text-sky-400',
        routes: [
          {
            route: 'IV (30–60 שניות) — RSI',
            dose: (w) => `${fmt0(clamp(w * 0.3, 10, 30))} mg`,
            doseSummary: '0.3 mg/kg',
            note: 'מנה יחידה',
          },
          {
            route: 'IV — היפוך חשמלי',
            dose: (w) => `${fmt0(clamp(w * 0.2, 8, 20))} mg`,
            doseSummary: '0.2 mg/kg',
          },
        ],
      },
      {
        name: 'קטמין',
        sub: 'Ketamine — RSI / DSI',
        color: 'text-amber-400',
        routes: [
          {
            route: 'IV — RSI',
            dose: (w) => `${fmt0(clamp(w * 2, 80, 200))}–${fmt0(clamp(w * 3, 120, 300))} mg`,
            doseSummary: '2–3 mg/kg',
          },
          {
            route: 'IM — RSI',
            dose: (w) => `${fmt0(clamp(w * 5, 200, 500))}–${fmt0(clamp(w * 6, 240, 600))} mg`,
            doseSummary: '5–6 mg/kg',
          },
          {
            route: 'IV — DSI',
            dose: (w) => `${fmt0(clamp(w * 1, 40, 100))} mg`,
            doseSummary: '1 mg/kg',
          },
        ],
      },
      {
        name: 'מידזולם',
        sub: 'Midazolam / Dormicum — סדציה',
        color: 'text-violet-400',
        routes: [
          { route: 'IV — שטחית (היפוך חשמלי)', dose: '2.5–5 mg' },
          {
            route: 'IV — עמוקה (אינטובציה)',
            dose: (w) => `${fmt1(clamp(w * 0.1, 2.5, 10))} mg`,
            doseSummary: '0.1 mg/kg | מקס׳ 10 mg',
          },
          {
            route: 'IN / IM',
            dose: (w) => `${fmt1(clamp(w * 0.2, 5, 10))} mg`,
            doseSummary: '0.2 mg/kg | מקס׳ 10 mg',
          },
        ],
        note: 'גיל 75+: חצי מינון',
      },
      {
        name: 'אטרופין',
        sub: 'Atropine — לפני אינטובציה',
        color: 'text-amber-400',
        routes: [
          { route: 'IV', dose: '1 mg', note: 'לפני אינטובציה / ארס' },
        ],
      },
    ],
  },

  // ── 9. כאב ───────────────────────────────────────────────────────────────────
  {
    id: 'pain',
    label: 'כאב',
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/10',
    borderColor: 'border-pink-400/30',
    solidBg: 'bg-pink-500',
    drugs: [
      {
        name: 'פנטניל',
        sub: 'Fentanyl — כאב חזק 7–10',
        color: 'text-purple-400',
        routes: [
          {
            route: 'IV איטי (10 דקות)',
            dose: (w) => `${fmt0(clamp(w * 1.5, 50, 100))} mcg`,
            doseSummary: '1–2 mcg/kg | מקס׳ 100 mcg',
            max: 'חזרה אחת לאחר 5–10 דקות',
          },
          {
            route: 'IN',
            dose: (w) => `${fmt0(clamp(w * 1.5, 50, 200))} mcg`,
            doseSummary: '1.5 mcg/kg | מקס׳ 200 mcg',
          },
          {
            route: 'IM',
            dose: (w) => `${fmt0(clamp(w * 1.5, 50, 100))} mcg`,
            doseSummary: '1–2 mcg/kg | מקס׳ 100 mcg',
          },
        ],
        note: 'גיל 75+ / COPD: 2/3 מנה | CRF: חצי מנה',
      },
      {
        name: 'קטמין',
        sub: 'Ketamine — low-dose analgesia',
        color: 'text-amber-400',
        routes: [
          {
            route: 'IV — סינרגיסטי',
            dose: (w) => `${fmt0(clamp(w * 0.2, 8, 20))} mg`,
            doseSummary: '0.2 mg/kg',
          },
          {
            route: 'IV — אנלגטי',
            dose: (w) => `${fmt0(clamp(w * 0.4, 15, 40))} mg`,
            doseSummary: '0.3–0.5 mg/kg',
          },
          {
            route: 'IM',
            dose: (w) => `${fmt0(clamp(w * 0.75, 30, 80))} mg`,
            doseSummary: '0.5–1 mg/kg',
            note: 'חזרה אחת לאחר 10 דקות',
          },
        ],
      },
      {
        name: 'אקמול',
        sub: 'Paracetamol',
        color: 'text-pink-400',
        routes: [
          { route: 'IV (10 דקות)', dose: '1,000 mg' },
          { route: 'PO', dose: '500–1,000 mg' },
        ],
      },
      {
        name: 'אפטלגין',
        sub: 'Metamizole / Dipyrone',
        color: 'text-rose-400',
        routes: [
          { route: 'IV איטי', dose: '1,000 mg' },
        ],
      },
      {
        name: 'פראמין',
        sub: 'Metoclopramide — בחילות',
        color: 'text-indigo-400',
        routes: [
          { route: 'IV / IM', dose: '10 mg', note: 'גיל 75+ / CRF: 5 mg | גיל 14+ בלבד' },
        ],
      },
      {
        name: 'זופרן',
        sub: 'Ondansetron — בחילות',
        color: 'text-cyan-400',
        routes: [
          { route: 'IV / IM', dose: '4 mg', note: 'מנה יחידה' },
        ],
      },
    ],
  },

  // ── 10. הרעלות ────────────────────────────────────────────────────────────────
  {
    id: 'poisoning',
    label: 'הרעלות',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/30',
    solidBg: 'bg-green-600',
    drugs: [
      {
        name: 'נרקן',
        sub: 'Naloxone — הרעלת אופייטים',
        color: 'text-green-400',
        routes: [
          { route: 'IN', dose: '0.4 mg', max: 'חזרה לאחר 5–10 דקות' },
          { route: 'IV איטי', dose: '0.4 mg', note: 'מהול ב-10cc סליין, לאט', max: 'חזרה לאחר 5–10 דקות' },
        ],
      },
      {
        name: 'אטרופין',
        sub: 'Atropine — זרחנים אורגניים / קרבמטים',
        color: 'text-amber-400',
        routes: [
          { route: 'IV — קל/בינוני', dose: '1–2 mg', max: 'כל 5 דקות עד אטרופינזציה' },
          { route: 'IV — קשה', dose: '2–4 mg', max: 'כל 5 דקות עד אטרופינזציה' },
        ],
        note: 'סימני אטרופינזציה: יובש ריריות, דופק >80, אישונים מורחבים',
      },
      {
        name: 'הידרוקסיקובלמין',
        sub: 'Hydroxocobalamin — הרעלת ציאניד',
        color: 'text-red-500',
        routes: [
          { route: 'IV (15 דקות)', dose: '5 g', note: 'מהול ב-200cc D5W/NS' },
        ],
      },
      {
        name: 'תיאוסולפט',
        sub: 'Sodium Thiosulfate — הרעלת ציאניד',
        color: 'text-slate-400',
        routes: [
          { route: 'IV (10 דקות)', dose: '12.5 g' },
        ],
      },
    ],
  },
];
