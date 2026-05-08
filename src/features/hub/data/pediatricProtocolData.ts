// Pediatric emergency drug protocol data
// Weight-based dosing designed for 0.5–80 kg (pediatric + adolescent).
// Structure is extensible: adult flat-dose tables can be added alongside these.

export interface DrugRoute {
  route: string;
  dose: (w: number) => string;
  max?: string;
  prep?: string | ((w: number) => string);
}

export interface Drug {
  name: string;       // Hebrew name
  sub: string;        // English / generic
  color: string;      // Tailwind text-* class
  routes: DrugRoute[];
  note?: string;
}

export interface Scenario {
  id: string;
  label: string;
  color: string;      // Tailwind text-* class
  bgColor: string;    // Tailwind bg-*/10 class
  borderColor: string;
  drugs: Drug[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, decimals = 2) => parseFloat(n.toFixed(decimals)).toString();
const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

// ─── Scenarios ────────────────────────────────────────────────────────────────

export const PEDIATRIC_SCENARIOS: Scenario[] = [
  // ── 1. Airway ───────────────────────────────────────────────────────────────
  {
    id: 'airway',
    label: 'אירווי',
    color: 'text-sky-400',
    bgColor: 'bg-sky-400/10',
    borderColor: 'border-sky-400/30',
    drugs: [
      {
        name: 'אטומידאט',
        sub: 'Etomidate — סדציה RSI',
        color: 'text-sky-400',
        routes: [
          {
            route: 'IV',
            dose: w => `${fmt(clamp(w * 0.3, 0.15, 20))} mg`,
            max: '0.2–0.3 mg/kg | מקס׳ 20 mg',
            prep: (w: number) => w < 10
              ? 'שאבי 1cc (2mg) במזרק 10 — לכל 1 ק"ג תני 1–1.5cc'
              : 'לכל 10 ק"ג שאבי 1cc (2mg), עוד שנתה (0.4mg) לכל 2 ק"ג',
          },
        ],
      },
      {
        name: 'קטמין',
        sub: 'Ketamine — סדציה RSI',
        color: 'text-amber-400',
        routes: [
          {
            route: 'IV',
            dose: w => `${fmt(clamp(w * 2.5, 1, 100), 1)} mg`,
            max: '2–3 mg/kg',
            prep: (w: number) => w <= 25
              ? 'שאבי 1cc (50mg) במזרק 5 — כל 1 ק"ג = שנתה אחת'
              : 'מינון ישיר לפי חישוב',
          },
          {
            route: 'IM',
            dose: w => `${fmt(clamp(w * 5.5, 2.5, 200), 1)} mg`,
            max: '5–6 mg/kg',
            prep: 'שאבי 5cc במזרק 10, השלם עם סליין — כל ק"ג = שנתה (5mg)',
          },
        ],
      },
      {
        name: 'מידזולם',
        sub: 'Midazolam / Dormicum — סדציה',
        color: 'text-violet-400',
        routes: [
          {
            route: 'IV',
            dose: w => `${fmt(clamp(w * 0.1, 0.05, 5))} mg`,
            max: '0.1 mg/kg | מקס׳ 5 mg',
            prep: 'שאבי אמפולה (5mg) למזרק 10 — לכל ק"ג שנתה אחת',
          },
        ],
      },
      {
        name: 'מידזולם',
        sub: 'Midazolam — שימור סדציה (Drip)',
        color: 'text-violet-300',
        routes: [
          {
            route: 'IV Drip',
            dose: w => `${fmt(clamp(w * 0.1, 0.05, 5))} mg בולוס\n${fmt(clamp(w * 0.03, 0.005, 3))} mg/hr`,
            max: '0.01–0.06 mg/kg/hr',
          },
        ],
      },
      {
        name: 'קטמין',
        sub: 'Ketamine — שימור סדציה (Drip)',
        color: 'text-amber-300',
        routes: [
          {
            route: 'IV Drip',
            dose: w => `${fmt(clamp(w * 0.5, 0.25, 20))} mg בולוס\n${fmt(clamp(w * 0.5, 0.25, 20))} mg/hr`,
            max: '0.5 mg/kg בולוס | 0.5 mg/kg/hr',
          },
        ],
      },
    ],
  },

  // ── 2. Respiratory ──────────────────────────────────────────────────────────
  {
    id: 'respiratory',
    label: 'נשימה',
    color: 'text-teal-400',
    bgColor: 'bg-teal-400/10',
    borderColor: 'border-teal-400/30',
    drugs: [
      {
        name: 'ונטולין',
        sub: 'Salbutamol / Ventolin',
        color: 'text-teal-400',
        routes: [
          {
            route: 'אינהלציה',
            dose: w => `${fmt(clamp(w * 0.15, 0.075, 5))} mg`,
            max: '0.15 mg/kg | מקס׳ 5 mg',
            prep: 'שאבי 1cc, השלם ל5cc — כל שנתה קטנה = 0.2mg',
          },
          {
            route: 'דרך טובוס',
            dose: w => `${fmt(clamp(w * 0.15, 0.075, 5) * 0.2, 1)}–${fmt(clamp(w * 0.15, 0.075, 5) * 0.2, 1)} cc`,
            max: '0.5–1cc + 2–3cc סליין',
          },
        ],
      },
      {
        name: 'אירובנט',
        sub: 'Ipratropium',
        color: 'text-teal-300',
        routes: [
          {
            route: 'אינהלציה',
            dose: w => w <= 30 ? '0.25 mg' : '0.5 mg',
            max: 'מקס׳ 0.5 mg',
          },
        ],
      },
      {
        name: 'אדרנלין',
        sub: 'Epinephrine — אסתמה / אנאפילקסיס',
        color: 'text-emt-red',
        routes: [
          {
            route: 'IV/IO',
            dose: w => `${fmt(clamp(w * 0.01, 0.005, 0.4) * 1000, 0)} mcg`,
            max: '0.01 mg/kg | מקס׳ 0.4 mg',
            prep: 'אמפולה במזרק 10 — לכל 2 ק"ג שנתה אחת',
          },
          {
            route: 'אינהלציה (סטרידור)',
            dose: w => `${fmt(clamp(w * 0.375, 0.125, 5), 2)} mg`,
            max: '0.25–0.5 mg/kg | מקס׳ 5 mg',
            prep: 'שאבי חצי ממשקל הילד, השלם ל5cc',
          },
        ],
      },
      {
        name: 'סולמדרול',
        sub: 'Methylprednisolone',
        color: 'text-orange-400',
        routes: [
          {
            route: 'IV',
            dose: w => `${fmt(clamp(w * 2, 1, 125), 0)} mg`,
            max: '2 mg/kg | מקס׳ 125 mg',
            prep: 'שאבי חצי אמפולה (62.5mg/1cc), השלם ל3cc — כל שנתה = 2mg',
          },
        ],
      },
      {
        name: 'מגנזיום',
        sub: 'Magnesium Sulfate',
        color: 'text-lime-400',
        routes: [
          {
            route: 'IV איטי',
            dose: w => `${fmt(clamp(w * 37.5, 12.5, 2000), 0)} mg`,
            max: '25–50 mg/kg | מקס׳ 2g',
            prep: 'שאבי 2cc (1g) במזרק 10 — כל שנתה = 20mg',
          },
        ],
      },
    ],
  },

  // ── 3. Cardiac ──────────────────────────────────────────────────────────────
  {
    id: 'cardiac',
    label: 'לב',
    color: 'text-emt-red',
    bgColor: 'bg-emt-red/10',
    borderColor: 'border-emt-red/30',
    drugs: [
      {
        name: 'אדנוזין',
        sub: 'Adenosine — SVT',
        color: 'text-cyan-400',
        routes: [
          {
            route: 'IV מהיר — מנה 1',
            dose: w => `${fmt(clamp(w * 0.1, 0.05, 6))} mg`,
            max: '0.1 mg/kg | מקס׳ 6 mg',
            prep: (w: number) => w <= 10
              ? 'שאבי 1cc, השלם ל3cc — כל 1 ק"ג = שנתה'
              : 'שאבי אמפולה, השלם ל6cc — כל 10 ק"ג = 1cc',
          },
          {
            route: 'IV מהיר — מנה 2',
            dose: w => `${fmt(clamp(w * 0.2, 0.1, 12))} mg`,
            max: '0.2 mg/kg | מקס׳ 12 mg | הכפל מנה ראשונה',
          },
        ],
      },
      {
        name: 'אמיודרון',
        sub: 'Amiodarone',
        color: 'text-orange-400',
        routes: [
          {
            route: 'IV (10–20 דקות)',
            dose: w => `${fmt(clamp(w * 5, 2.5, 300), 0)} mg`,
            max: '5 mg/kg | מקס׳ 300 mg',
            prep: (w: number) => w <= 20
              ? 'שאבי 2cc, השלם ל10cc — לכל 1 ק"ג 0.5cc'
              : 'מינון ישיר לפי חישוב',
          },
        ],
      },
      {
        name: 'מגנזיום',
        sub: 'Magnesium Sulfate',
        color: 'text-lime-400',
        routes: [
          {
            route: 'IV איטי',
            dose: w => `${fmt(clamp(w * 37.5, 12.5, 2000), 0)} mg`,
            max: '25–50 mg/kg | מקס׳ 2g',
            prep: 'שאבי 2cc (1g) במזרק 10 — כל שנתה = 20mg',
          },
        ],
      },
      {
        name: 'קרדיוורסיה',
        sub: 'Cardioversion — טכיקרדיה לא יציבה',
        color: 'text-emt-red',
        routes: [
          {
            route: 'סינכרוני',
            dose: w => `${fmt(clamp(w * 0.75, 0.25, 50), 0)}–${fmt(clamp(w * 1, 0.5, 80), 0)} J`,
            max: '0.5–1 J/kg התחלתי | עד 2 J/kg',
          },
        ],
        note: 'סדציה לפני הפרוצדורה: דורמיקום / אטומידאט',
      },
      {
        name: 'אדרנלין',
        sub: 'Epinephrine — ברדיקרדיה',
        color: 'text-emt-red',
        routes: [
          {
            route: 'IV/IO',
            dose: w => `${fmt(clamp(w * 10, 5, 1000), 0)} mcg`,
            max: '0.01 mg/kg | מקס׳ 1 mg',
          },
          {
            route: 'ET',
            dose: w => `${fmt(clamp(w * 0.1, 0.05, 2.5))} mg`,
            max: '0.1 mg/kg | מקס׳ 2.5 mg',
          },
        ],
      },
      {
        name: 'אטרופין',
        sub: 'Atropine — ברדיקרדיה',
        color: 'text-amber-400',
        routes: [
          {
            route: 'IV/IO',
            dose: w => `${fmt(clamp(w * 0.02, 0.1, 0.5))} mg`,
            max: '0.02 mg/kg | מינ׳ 0.1 | מקס׳ 0.5 mg',
          },
          {
            route: 'ET',
            dose: w => `${fmt(clamp(w * 0.05, 0.025, 2))} mg`,
            max: '0.05 mg/kg',
          },
        ],
      },
    ],
  },

  // ── 4. Neuro ────────────────────────────────────────────────────────────────
  {
    id: 'neuro',
    label: 'נוירו',
    color: 'text-violet-400',
    bgColor: 'bg-violet-400/10',
    borderColor: 'border-violet-400/30',
    drugs: [
      {
        name: 'מידזולם',
        sub: 'Midazolam — פרכוסים',
        color: 'text-violet-400',
        routes: [
          {
            route: 'IV',
            dose: w => `${fmt(clamp(w * 0.1, 0.05, 5))} mg`,
            max: '0.1 mg/kg | מקס׳ 5 mg',
          },
          {
            route: 'IN / IM',
            dose: w => `${fmt(clamp(w * 0.2, 0.1, 10))} mg`,
            max: '0.2 mg/kg | מקס׳ 10 mg',
          },
        ],
      },
      {
        name: 'גלוקוז 10%',
        sub: 'Glucose 10%',
        color: 'text-yellow-400',
        routes: [
          {
            route: 'IV/IO',
            dose: w => `${fmt(clamp(w * 2.5, 1, 50), 0)} מ"ל`,
            max: '0.25 g/kg (2.5cc/kg של גלוקוז 10%)',
          },
        ],
      },
      {
        name: 'נרקן',
        sub: 'Naloxone',
        color: 'text-emt-green',
        routes: [
          {
            route: 'IV/IO',
            dose: w => `${fmt(clamp(w * 0.1, 0.05, 2))} mg`,
            max: '0.1 mg/kg | מקס׳ 2 mg',
          },
          {
            route: 'IN',
            dose: () => '2 mg במנות של 0.4 mg',
          },
        ],
      },
    ],
  },

  // ── 5. Anaphylaxis ──────────────────────────────────────────────────────────
  {
    id: 'anaphylaxis',
    label: 'אנאפילקסיס',
    color: 'text-emt-red',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    drugs: [
      {
        name: 'אדרנלין',
        sub: 'Epinephrine 1:1,000 — IM',
        color: 'text-emt-red',
        routes: [
          {
            route: 'IM (ירך)',
            dose: w => `${fmt(clamp(w * 0.01, 0.005, 0.4))} mg`,
            max: '0.01 mg/kg | מקס׳ 0.4 mg',
            prep: 'אמפולה 1:1,000 — כל 1 ק"ג = 0.01mL',
          },
        ],
        note: 'בחר מצב אנאפילקסיס — EpiPen Jr לילדים <30kg',
      },
      {
        name: 'ונטולין',
        sub: 'Salbutamol — ברונכוספזם',
        color: 'text-teal-400',
        routes: [
          {
            route: 'אינהלציה',
            dose: w => `${fmt(clamp(w * 0.15, 0.075, 5))} mg`,
            max: '0.15 mg/kg | מקס׳ 5 mg',
          },
        ],
      },
      {
        name: 'סולמדרול',
        sub: 'Methylprednisolone',
        color: 'text-orange-400',
        routes: [
          {
            route: 'IV',
            dose: w => `${fmt(clamp(w * 2, 1, 125), 0)} mg`,
            max: '2 mg/kg | מקס׳ 125 mg',
          },
        ],
      },
    ],
  },

  // ── 6. Pain ─────────────────────────────────────────────────────────────────
  {
    id: 'pain',
    label: 'כאב',
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/10',
    borderColor: 'border-pink-400/30',
    drugs: [
      {
        name: 'אקמול',
        sub: 'Paracetamol',
        color: 'text-pink-400',
        routes: [
          {
            route: 'PO',
            dose: w => `${fmt(clamp(w * 15, 7.5, 250), 0)} mg`,
            max: '15 mg/kg | מקס׳ 250 mg',
          },
          {
            route: 'IV',
            dose: w => `${fmt(clamp(w * 15, 7.5, 1000), 0)} mg`,
            max: '15 mg/kg | מקס׳ 1g',
          },
        ],
      },
      {
        name: 'אפטלגין',
        sub: 'Metamizole / Dipyrone',
        color: 'text-rose-400',
        routes: [
          {
            route: 'IV איטי',
            dose: w => `${fmt(clamp(w * 20, 10, 500), 0)} mg`,
            max: '20 mg/kg | מקס׳ 500 mg',
          },
        ],
      },
      {
        name: 'פנטניל',
        sub: 'Fentanyl',
        color: 'text-purple-400',
        routes: [
          {
            route: 'IV/IN',
            dose: w => `${fmt(clamp(w * 1.5, 0.75, 100), 0)} mcg`,
            max: '1–2 mcg/kg | מקס׳ 100 mcg',
          },
        ],
      },
      {
        name: 'קטמין',
        sub: 'Ketamine — אנלגזיה (low-dose)',
        color: 'text-amber-400',
        routes: [
          {
            route: 'IV — סינרגיסטי',
            dose: w => `${fmt(clamp(w * 0.2, 0.1, 10))} mg`,
            max: '0.2 mg/kg',
          },
          {
            route: 'IV — אנלגטי',
            dose: w => `${fmt(clamp(w * 0.4, 0.2, 20))} mg`,
            max: '0.3–0.5 mg/kg',
          },
        ],
      },
      {
        name: 'זופרן',
        sub: 'Ondansetron — אנטי-בחילה',
        color: 'text-indigo-400',
        routes: [
          {
            route: 'IV',
            dose: () => '0.15 mg/kg | מקס׳ 4 mg',
          },
        ],
      },
    ],
  },

  // ── 7. Trauma ───────────────────────────────────────────────────────────────
  {
    id: 'trauma',
    label: 'טראומה',
    color: 'text-emt-yellow',
    bgColor: 'bg-emt-yellow/10',
    borderColor: 'border-emt-yellow/30',
    drugs: [
      {
        name: 'הקסקפרון',
        sub: 'Tranexamic Acid (TXA)',
        color: 'text-emt-yellow',
        routes: [
          {
            route: 'IV (10 דקות)',
            dose: w => `${fmt(clamp(w * 15, 7.5, 1000), 0)} mg`,
            max: '15 mg/kg | מקס׳ 1g',
            prep: 'מהר מהרה — בתוך 3 שעות מהפציעה',
          },
        ],
      },
      {
        name: 'הידרוקסיקובלמין',
        sub: 'Hydroxocobalamin — הרעלת ציאניד',
        color: 'text-red-500',
        routes: [
          {
            route: 'IV',
            dose: w => `${fmt(clamp(w * 70, 35, 5000), 0)} mg`,
            max: '70 mg/kg | מקס׳ 5g',
          },
        ],
      },
      {
        name: 'תיאוסולפט',
        sub: 'Sodium Thiosulfate',
        color: 'text-slate-400',
        routes: [
          {
            route: 'IV',
            dose: w => `${fmt(clamp(w * 400, 200, 12500), 0)} mg`,
            max: '400 mg/kg | מקס׳ 12.5g',
          },
        ],
      },
    ],
  },
];
