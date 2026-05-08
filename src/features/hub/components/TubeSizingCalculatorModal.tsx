import { useState } from 'react';
import { X, Wind, AlertCircle } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackEvent } from '../../../utils/analytics';

interface Props { isOpen: boolean; onClose: () => void; }

// ─── Calculation logic ────────────────────────────────────────────────────────

interface TubeResult {
  label: string;
  withCuff: string;
  withoutCuff: string;
  depth: string;
  note?: string;
}

interface LmaResult {
  size: string;
  cuffVolume: string;
}

function calcTube(ageMo: number | null, weightKg: number | null): TubeResult | null {
  if (ageMo === null && weightKg === null) return null;

  // Preterm / very low weight
  if (weightKg !== null && weightKg < 1) {
    return {
      label: 'פג',
      withCuff: '–',
      withoutCuff: '2.5 מ"מ',
      depth: 'מנשך 8',
      note: 'גודל ללא בלונית — הוסף 0.5 לגודל עם בלונית',
    };
  }
  if (weightKg !== null && weightKg < 3) {
    return {
      label: 'ילוד',
      withCuff: '–',
      withoutCuff: '3.0 מ"מ',
      depth: 'מנשך 9',
    };
  }
  if (weightKg !== null && weightKg < 5 && (ageMo === null || ageMo < 2)) {
    return {
      label: 'ילוד ≥ 3 ק"ג',
      withCuff: '3.0 מ"מ',
      withoutCuff: '3.5 מ"מ',
      depth: 'מנשך 9–10',
    };
  }

  // Age-based from here
  const ageYr = ageMo !== null ? ageMo / 12 : null;

  if (ageMo !== null && ageMo <= 12) {
    return {
      label: 'תינוק עד שנה',
      withCuff: '3.5 מ"מ',
      withoutCuff: '4.0 מ"מ',
      depth: 'מנשך 10.5–12',
    };
  }

  if (ageYr !== null && ageYr > 1) {
    const withCuff = parseFloat(((ageYr / 4) + 3.5).toFixed(1));
    const withoutCuff = parseFloat(((ageYr / 4) + 4).toFixed(1));
    const depth = parseFloat(((ageYr / 2) + 12).toFixed(1));
    return {
      label: `ילד ${ageYr.toFixed(0)} שנים`,
      withCuff: `${withCuff} מ"מ`,
      withoutCuff: `${withoutCuff} מ"מ`,
      depth: `${depth} ס"מ | או: טובוס × 3`,
      note: 'נוסחה: (גיל/4)+3.5 עם בלונית | (גיל/4)+4 ללא בלונית',
    };
  }

  return null;
}

function calcLma(weightKg: number): LmaResult {
  if (weightKg <= 5) return { size: '1', cuffVolume: '5 מ"ל' };
  if (weightKg <= 10) return { size: '1.5', cuffVolume: '7 מ"ל' };
  if (weightKg <= 20) return { size: '2', cuffVolume: '10 מ"ל' };
  if (weightKg <= 30) return { size: '2.5', cuffVolume: '15 מ"ל' };
  if (weightKg <= 50) return { size: '3', cuffVolume: '20 מ"ל' };
  if (weightKg <= 70) return { size: '4', cuffVolume: '30 מ"ל' };
  return { size: '5', cuffVolume: '40 מ"ל' };
}

function estimateWeightFromAge(ageMo: number): number {
  if (ageMo < 1) return 3;
  if (ageMo <= 12) return 3 + ageMo;
  return Math.round((ageMo / 12) * 2 + 8);
}

// ─── Result Row ───────────────────────────────────────────────────────────────

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-emt-border last:border-0">
      <p className="text-sm text-gray-500 dark:text-emt-muted">{label}</p>
      <p className={`font-bold text-base ${highlight ? 'text-sky-400' : 'text-gray-900 dark:text-emt-light'}`}>{value}</p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TubeSizingCalculatorModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [ageInput, setAgeInput] = useState('');
  const [ageUnit, setAgeUnit] = useState<'months' | 'years'>('years');
  const [weightInput, setWeightInput] = useState('');
  const [calculated, setCalculated] = useState(false);

  if (!isOpen) return null;

  const ageNum = ageInput !== '' ? Number(ageInput) : null;
  const ageMo = ageNum !== null ? (ageUnit === 'years' ? ageNum * 12 : ageNum) : null;
  const estimatedWeight = ageMo !== null ? estimateWeightFromAge(ageMo) : null;
  const displayWeight = weightInput !== '' ? Number(weightInput) : estimatedWeight;
  const isEstimated = weightInput === '' && estimatedWeight !== null;
  const w = displayWeight ?? 0;

  function handleCalculate() {
    if (displayWeight && displayWeight > 0) {
      setCalculated(true);
      trackEvent('calculate_tube_sizing', { weight: displayWeight, ...(ageMo !== null && { age_months: ageMo }) });
    }
  }

  const tubeResult = calculated ? calcTube(ageMo, w) : null;
  const lmaResult = calculated && w > 0 ? calcLma(w) : null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <Wind size={22} className="text-sky-400" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">גדלי טיובוס ו-LMA</h2>
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
        {/* Input card */}
        <div className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray p-4 flex flex-col gap-4">

          {/* Age input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-emt-light">גיל הילד</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="הזן גיל"
              value={ageInput}
              onChange={e => { setAgeInput(e.target.value); setCalculated(false); }}
              className="w-full rounded-xl border-2 border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray
                         px-3 py-2.5 text-gray-900 dark:text-emt-light text-base placeholder-gray-300 dark:placeholder-emt-muted
                         focus:outline-none focus:border-sky-400 transition-colors"
            />
          </div>

          {/* Age unit toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-emt-light">יחידת גיל</label>
            <div className="grid grid-cols-2 gap-2">
              {(['years', 'months'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => { setAgeUnit(u); setCalculated(false); }}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                    ageUnit === u
                      ? 'bg-sky-400 text-white border-sky-400 shadow-sm'
                      : 'bg-white dark:bg-emt-gray text-gray-500 dark:text-emt-muted border-gray-200 dark:border-emt-border'
                  }`}
                >
                  {u === 'years' ? 'שנים' : 'חודשים'}
                </button>
              ))}
            </div>
          </div>

          {/* Weight input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-emt-light">משקל (ק"ג)</label>
              {isEstimated && estimatedWeight && (
                <span className="text-xs font-bold text-emt-yellow bg-emt-yellow/10 border border-emt-yellow/30 px-2 py-0.5 rounded-full">
                  הערכה: ~{estimatedWeight} ק"ג
                </span>
              )}
            </div>
            <input
              type="number"
              inputMode="decimal"
              placeholder={estimatedWeight ? `~${estimatedWeight} (הערכה לפי גיל)` : 'הזן משקל'}
              value={weightInput}
              onChange={e => { setWeightInput(e.target.value); setCalculated(false); }}
              className="w-full rounded-xl border-2 border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray
                         px-3 py-2.5 text-gray-900 dark:text-emt-light text-base placeholder-gray-300 dark:placeholder-emt-muted
                         focus:outline-none focus:border-sky-400 transition-colors"
            />
          </div>

          {isEstimated && (
            <div className="flex items-start gap-2 rounded-xl bg-emt-yellow/10 border border-emt-yellow/30 px-3 py-2">
              <AlertCircle size={13} className="text-emt-yellow shrink-0 mt-0.5" />
              <p className="text-emt-yellow text-xs font-medium">משקל מוערך לפי גיל — הזן משקל מדויק לתוצאות מיטביות.</p>
            </div>
          )}

          <button
            onClick={handleCalculate}
            disabled={!displayWeight || displayWeight <= 0}
            className="w-full rounded-xl bg-sky-400 text-white font-bold text-base py-3 mt-1
                       active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed
                       shadow-md shadow-sky-400/25"
          >
            חשב גדלים
          </button>
        </div>

        {/* ETT Results */}
        {tubeResult && (
          <div className="rounded-2xl border border-sky-400/30 bg-sky-400/5 p-4 flex flex-col gap-0">
            <div className="flex items-center gap-2 mb-3">
              <Wind size={16} className="text-sky-400" />
              <p className="text-sky-400 font-bold text-base">טובוס ETT — {tubeResult.label}</p>
            </div>
            <Row label="עם בלונית (cuffed)" value={tubeResult.withCuff} highlight />
            <Row label="ללא בלונית (uncuffed)" value={tubeResult.withoutCuff} highlight />
            <Row label="עומק הכנסה (מנשך)" value={tubeResult.depth} />
            {tubeResult.note && (
              <p className="text-xs text-gray-400 dark:text-emt-muted mt-2 leading-relaxed">{tubeResult.note}</p>
            )}
          </div>
        )}

        {/* LMA Results */}
        {lmaResult && (
          <div className="rounded-2xl border border-violet-400/30 bg-violet-400/5 p-4 flex flex-col gap-0">
            <div className="flex items-center gap-2 mb-3">
              <Wind size={16} className="text-violet-400" />
              <p className="text-violet-400 font-bold text-base">LMA — לפי משקל {w} ק"ג</p>
            </div>
            <Row label="גודל LMA" value={lmaResult.size} highlight />
            <Row label="נפח בלונית" value={lmaResult.cuffVolume} />
          </div>
        )}

        {/* Reference table */}
        <div className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray p-4">
          <p className="text-gray-900 dark:text-emt-light font-bold text-sm mb-3">טבלת עזר — LMA לפי משקל</p>
          {[
            ['0–5 ק"ג', '1', '5 מ"ל'],
            ['5–10 ק"ג', '1.5', '7 מ"ל'],
            ['10–20 ק"ג', '2', '10 מ"ל'],
            ['20–30 ק"ג', '2.5', '15 מ"ל'],
            ['30–50 ק"ג', '3', '20 מ"ל'],
            ['50–70 ק"ג', '4', '30 מ"ל'],
            ['70–100 ק"ג', '5', '40 מ"ל'],
          ].map(([wRange, size, vol]) => (
            <div
              key={wRange}
              className={`flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-emt-border last:border-0 ${
                lmaResult?.size === size ? 'text-violet-400' : 'text-gray-700 dark:text-emt-light'
              }`}
            >
              <p className="text-xs">{wRange}</p>
              <p className="text-xs font-bold">גודל {size}</p>
              <p className="text-xs">{vol}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
