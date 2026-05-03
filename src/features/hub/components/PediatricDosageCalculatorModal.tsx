import { useState } from 'react';
import { X, Baby, AlertCircle } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackEvent } from '../../../utils/analytics';

interface Props { isOpen: boolean; onClose: () => void; }

// ─── Medication Data ──────────────────────────────────────────────────────────

interface Med {
  name: string;
  sub: string;
  color: string;
  dose: (w: number) => string;
  route: string;
  note?: (w: number) => string;
}

const MEDS: Med[] = [
  {
    name: 'אדרנלין', sub: 'Adrenaline (1:10,000)',
    color: 'text-emt-red',
    dose: w => `${Math.min(w * 0.01, 1).toFixed(2)} mg`,
    route: 'IV/IO',
    note: w => `${Math.min(w * 0.1, 10).toFixed(1)} מ"ל של 1:10,000 | מקס׳ 1 מ"ג`,
  },
  {
    name: 'אטרופין', sub: 'Atropine',
    color: 'text-amber-400',
    dose: w => `${Math.min(Math.max(w * 0.02, 0.1), 1).toFixed(2)} mg`,
    route: 'IV/IO',
    note: () => 'מינ׳ 0.1 מ"ג | מקס׳ 1 מ"ג',
  },
  {
    name: 'אמיודרון', sub: 'Amiodarone',
    color: 'text-orange-400',
    dose: w => `${Math.min(w * 5, 300).toFixed(0)} mg`,
    route: 'IV/IO',
    note: () => 'מקס׳ 300 מ"ג — עירוי איטי 10-20 דקות',
  },
  {
    name: 'אדנוזין', sub: 'Adenosine',
    color: 'text-cyan-400',
    dose: w => `${Math.min(w * 0.1, 6).toFixed(1)} mg`,
    route: 'IV מהיר',
    note: () => 'מקס׳ 6 מ"ג — זריקה מהירה + שטיפה',
  },
  {
    name: 'מידזולם', sub: 'Midazolam',
    color: 'text-violet-400',
    dose: w => `${Math.min(w * 0.1, 5).toFixed(2)} mg`,
    route: 'IV/IM/IN',
    note: () => 'מקס׳ 5 מ"ג IV | 10 מ"ג IM',
  },
  {
    name: 'דיאזפם', sub: 'Diazepam',
    color: 'text-purple-400',
    dose: w => `${Math.min(w * 0.3, 10).toFixed(1)} mg`,
    route: 'IV/IO/PR',
    note: () => 'מקס׳ 10 מ"ג',
  },
  {
    name: 'נלוקסון', sub: 'Naloxone',
    color: 'text-emt-green',
    dose: w => `${Math.min(w * 0.01, 2).toFixed(2)} mg`,
    route: 'IV/IM',
    note: () => 'מקס׳ 2 מ"ג',
  },
  {
    name: 'גלוקוז 10%', sub: 'Glucose 10%',
    color: 'text-yellow-400',
    dose: w => `${(w * 5).toFixed(0)} מ"ל`,
    route: 'IV/IO',
    note: w => `= ${(w * 0.5).toFixed(1)} גרם גלוקוז`,
  },
  {
    name: 'נוזלים — NS', sub: 'Normal Saline Bolus',
    color: 'text-emt-blue',
    dose: w => `${(w * 20).toFixed(0)} מ"ל`,
    route: 'IV/IO',
    note: () => '20 מ"ל/ק"ג — ניתן לחזור עד 3×',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function PediatricDosageCalculatorModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [calculated, setCalculated] = useState(false);

  if (!isOpen) return null;

  const estimatedWeight = age !== '' ? Math.round(Number(age) * 2 + 8) : null;
  const displayWeight = weight !== '' ? Number(weight) : estimatedWeight;

  function handleAgeChange(v: string) {
    setAge(v);
    setCalculated(false);
    if (weight === '' && v !== '') {
      // auto-fill weight suggestion when age entered and weight empty
    }
  }

  function handleWeightChange(v: string) {
    setWeight(v);
    setCalculated(false);
  }

  function handleCalculate() {
    if (displayWeight && displayWeight > 0) {
      setCalculated(true);
      trackEvent('calculate_pediatric_dosage', { weight: displayWeight, is_estimated: isEstimated });
    }
  }

  const w = displayWeight ?? 0;
  const isEstimated = weight === '' && estimatedWeight !== null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark" role="dialog" aria-modal="true">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <Baby size={22} className="text-emt-green" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">פרוטוקול מינון תרופות ילדים</h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
          aria-label="סגור"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Inputs */}
        <div className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-emt-muted">גיל הילד (בשנים)</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="לדוגמה: 5"
              value={age}
              onChange={e => handleAgeChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-emt-border bg-gray-50 dark:bg-emt-dark
                         px-4 py-3 text-gray-900 dark:text-emt-light text-lg placeholder-gray-400 dark:placeholder-emt-muted
                         focus:outline-none focus:ring-2 focus:ring-emt-green/50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-emt-muted">
              משקל (ק"ג)
              {isEstimated && estimatedWeight && (
                <span className="mr-2 text-emt-yellow font-normal">
                  — הערכה לפי גיל: ~{estimatedWeight} ק"ג
                </span>
              )}
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder={estimatedWeight ? `~${estimatedWeight} ק"ג (הערכה)` : 'לדוגמה: 18'}
              value={weight}
              onChange={e => handleWeightChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-emt-border bg-gray-50 dark:bg-emt-dark
                         px-4 py-3 text-gray-900 dark:text-emt-light text-lg placeholder-gray-400 dark:placeholder-emt-muted
                         focus:outline-none focus:ring-2 focus:ring-emt-green/50"
            />
          </div>
          {isEstimated && (
            <div className="flex items-start gap-2 rounded-xl bg-emt-yellow/10 border border-emt-yellow/30 px-3 py-2">
              <AlertCircle size={14} className="text-emt-yellow shrink-0 mt-0.5" />
              <p className="text-emt-yellow text-xs">משקל מוערך לפי הנוסחה: גיל × 2 + 8. הזן משקל מדויק לתוצאות מיטביות.</p>
            </div>
          )}
          <button
            onClick={handleCalculate}
            disabled={!displayWeight || displayWeight <= 0}
            className="w-full rounded-xl bg-emt-green text-white font-bold text-base py-3
                       active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          >
            חשב מינונים
          </button>
        </div>

        {/* Results */}
        {calculated && w > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-gray-900 dark:text-emt-light font-bold text-base">מינונים לפי משקל</p>
              <span className="text-sm font-bold text-emt-green bg-emt-green/10 px-3 py-1 rounded-full border border-emt-green/30">
                {w} ק"ג {isEstimated ? '(הערכה)' : ''}
              </span>
            </div>
            {MEDS.map(med => (
              <div
                key={med.name}
                className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className={`font-bold text-base ${med.color}`}>{med.name}</p>
                    <p className="text-gray-400 dark:text-emt-muted text-xs">{med.sub}</p>
                    {med.note && (
                      <p className="text-gray-500 dark:text-emt-muted text-xs mt-1">{med.note(w)}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <p className="text-gray-900 dark:text-emt-light font-bold text-lg">{med.dose(w)}</p>
                    <span className="text-xs text-gray-400 dark:text-emt-muted bg-gray-100 dark:bg-emt-dark px-2 py-0.5 rounded-full mt-1">
                      {med.route}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
