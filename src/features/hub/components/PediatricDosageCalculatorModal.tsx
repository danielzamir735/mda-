import { useState } from 'react';
import { X, Baby, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackEvent } from '../../../utils/analytics';
import { PEDIATRIC_SCENARIOS } from '../data/pediatricProtocolData';
import type { Drug } from '../data/pediatricProtocolData';

interface Props { isOpen: boolean; onClose: () => void; }

// ─── Weight estimation ────────────────────────────────────────────────────────

function estimateWeight(ageMo: number): number {
  if (ageMo < 1) return 3;
  if (ageMo <= 12) return 3 + ageMo;           // +1 kg/month from 3kg
  const ageYr = ageMo / 12;
  return Math.round(ageYr * 2 + 8);            // (age × 2) + 8
}

// ─── Drug Card ────────────────────────────────────────────────────────────────

function resolvePrep(prep: string | ((w: number) => string) | undefined, w: number): string | undefined {
  if (!prep) return undefined;
  return typeof prep === 'function' ? prep(w) : prep;
}

function DrugCard({ drug, w }: { drug: Drug; w: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasPrep = drug.routes.some(r => r.prep);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray overflow-hidden">
      <div className="p-5">
        {/* Drug name + sub */}
        <div className="mb-4">
          <p className={`font-bold text-2xl ${drug.color}`}>{drug.name}</p>
          <p className="text-gray-400 dark:text-emt-muted text-base mt-0.5">{drug.sub}</p>
          {drug.note && (
            <p className="text-gray-500 dark:text-emt-muted text-sm mt-1 leading-relaxed">{drug.note}</p>
          )}
        </div>

        {/* Routes — each in its own stacked block */}
        <div className="flex flex-col gap-4">
          {drug.routes.map((r, i) => (
            <div key={i} className={i > 0 ? 'border-t border-gray-100 dark:border-emt-border pt-4' : ''}>
              <span className="inline-block text-base font-bold text-gray-500 dark:text-emt-muted bg-gray-100 dark:bg-emt-dark px-4 py-1.5 rounded-full mb-2">
                {r.route}
              </span>
              <p className="text-gray-900 dark:text-emt-light font-bold text-4xl leading-tight whitespace-pre-line" dir="ltr">
                {r.dose(w)}
              </p>
              {r.max && (
                <p className="text-gray-400 dark:text-emt-muted text-sm mt-1.5 leading-relaxed" dir="ltr">{r.max}</p>
              )}
            </div>
          ))}
        </div>

        {hasPrep && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-5 flex items-center justify-center gap-2 text-base font-bold text-gray-600 dark:text-emt-muted
                       bg-gray-100 dark:bg-emt-dark rounded-xl px-4 py-3 w-full active:opacity-70 transition-opacity"
          >
            {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            הכנת תרופה
          </button>
        )}
      </div>

      {expanded && hasPrep && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-emt-border">
          {drug.routes.filter(r => r.prep).map((r, i) => (
            <div key={i} className="mt-4">
              <p className="text-base font-bold text-gray-500 dark:text-emt-muted mb-1">{r.route}</p>
              <p className="text-lg text-gray-800 dark:text-emt-light leading-relaxed">{resolvePrep(r.prep, w)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Solid background colors for the ACTIVE scenario button (white text on top)
const SCENARIO_SOLID: Record<string, string> = {
  airway:      'bg-sky-500',
  respiratory: 'bg-teal-500',
  cardiac:     'bg-red-500',
  neuro:       'bg-violet-500',
  anaphylaxis: 'bg-red-600',
  pain:        'bg-pink-500',
  trauma:      'bg-amber-500',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PediatricDosageCalculatorModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [ageInput, setAgeInput] = useState('');
  const [ageUnit, setAgeUnit] = useState<'months' | 'years'>('years');
  const [weightInput, setWeightInput] = useState('');
  const [calculated, setCalculated] = useState(false);
  const [activeScenario, setActiveScenario] = useState(0);

  if (!isOpen) return null;

  const ageNum = ageInput !== '' ? Number(ageInput) : null;
  const ageMo = ageNum !== null ? (ageUnit === 'years' ? ageNum * 12 : ageNum) : null;
  const estimatedWeight = ageMo !== null ? estimateWeight(ageMo) : null;
  const displayWeight = weightInput !== '' ? Number(weightInput) : estimatedWeight;
  const isEstimated = weightInput === '' && estimatedWeight !== null;
  const w = displayWeight ?? 0;
  const scenario = PEDIATRIC_SCENARIOS[activeScenario];

  function handleCalculate() {
    if (displayWeight && displayWeight > 0) {
      setCalculated(true);
      trackEvent('calculate_pediatric_dosage_v2', {
        weight: displayWeight,
        is_estimated: isEstimated,
        scenario: scenario.id,
      });
    }
  }

  function handleScenarioChange(i: number) {
    setActiveScenario(i);
    if (calculated) {
      trackEvent('pediatric_scenario_switch', { scenario: PEDIATRIC_SCENARIOS[i].id });
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <Baby size={22} className="text-emt-green" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מינון תרופות ילדים ALS</h2>
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

      <div className="flex-1 overflow-y-auto">

        {/* Hero */}
        <div className="flex flex-col items-center text-center px-6 pt-6 pb-5">
          <div className="w-16 h-16 rounded-full bg-emt-green/15 border-2 border-emt-green/30 flex items-center justify-center mb-3">
            <Baby size={30} className="text-emt-green" />
          </div>
          <h3 className="text-gray-900 dark:text-emt-light font-bold text-xl mb-1">מינון תרופות ילדים</h3>
          <p className="text-gray-400 dark:text-emt-muted text-sm">הזן גיל ומשקל לחישוב מינונים מדויק</p>
        </div>

        {/* Inputs */}
        <div className="px-4 flex flex-col gap-4 pb-7">

          {/* Age input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700 dark:text-emt-light">גיל הילד</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="הזן גיל"
              value={ageInput}
              onChange={e => { setAgeInput(e.target.value); setCalculated(false); }}
              className="w-full rounded-xl border-2 border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray
                         px-4 py-3 text-gray-900 dark:text-emt-light text-lg placeholder-gray-300 dark:placeholder-emt-muted
                         focus:outline-none focus:border-emt-green transition-colors"
            />
          </div>

          {/* Unit toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700 dark:text-emt-light">יחידת גיל</label>
            <div className="grid grid-cols-2 gap-2">
              {(['years', 'months'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => { setAgeUnit(u); setCalculated(false); }}
                  className={`py-3 rounded-xl text-base font-bold transition-all border-2 ${
                    ageUnit === u
                      ? 'bg-emt-green text-white border-emt-green shadow-md'
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
              <label className="text-sm font-bold text-gray-700 dark:text-emt-light">משקל (ק"ג)</label>
              {isEstimated && estimatedWeight && (
                <span className="text-xs font-bold text-emt-yellow bg-emt-yellow/10 border border-emt-yellow/30 px-2.5 py-0.5 rounded-full">
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
                         px-4 py-3 text-gray-900 dark:text-emt-light text-lg placeholder-gray-300 dark:placeholder-emt-muted
                         focus:outline-none focus:border-emt-green transition-colors"
            />
          </div>

          {/* Estimated weight warning */}
          {isEstimated && (
            <div className="flex items-start gap-2 rounded-xl bg-emt-yellow/10 border border-emt-yellow/30 px-3 py-2.5">
              <AlertCircle size={14} className="text-emt-yellow shrink-0 mt-0.5" />
              <p className="text-emt-yellow text-xs font-medium">משקל מוערך לפי גיל. הזן משקל מדויק לתוצאות מיטביות.</p>
            </div>
          )}

          {/* Calculate button */}
          <button
            onClick={handleCalculate}
            disabled={!displayWeight || displayWeight <= 0}
            className="w-full rounded-xl bg-emt-green text-white font-bold text-lg py-4 mt-1
                       active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed
                       shadow-md shadow-emt-green/25"
          >
            חשב מינונים
          </button>
        </div>

        {/* Results */}
        {calculated && w > 0 && (
          <>
            {/* Weight badge */}
            <div className="px-4 mt-4 flex items-center justify-between">
              <p className="text-gray-900 dark:text-emt-light font-bold text-xl">בחר תרחיש</p>
              <span className="text-sm font-bold text-emt-green bg-emt-green/10 px-3 py-1 rounded-full border border-emt-green/30">
                {w} ק"ג{isEstimated ? ' (הערכה)' : ''}
              </span>
            </div>

            {/* Scenario grid — all visible at once */}
            <div className="grid grid-cols-2 gap-3 px-4 mt-3">
              {PEDIATRIC_SCENARIOS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => handleScenarioChange(i)}
                  className={`rounded-2xl py-5 text-lg font-bold border-2 transition-all w-full
                    ${i === PEDIATRIC_SCENARIOS.length - 1 && PEDIATRIC_SCENARIOS.length % 2 !== 0 ? 'col-span-2' : ''}
                    ${i === activeScenario
                      ? `${SCENARIO_SOLID[s.id]} text-white border-transparent shadow-lg scale-[1.02]`
                      : `bg-white dark:bg-emt-gray ${s.color} ${s.borderColor}`
                    }
                  `}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Drug cards */}
            <div className="flex flex-col gap-2 p-4 pt-3">
              {scenario.drugs.map(drug => (
                <DrugCard key={`${drug.name}-${drug.sub}`} drug={drug} w={w} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
