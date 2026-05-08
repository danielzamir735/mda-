import { useState, useRef } from 'react';
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
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-base ${drug.color}`}>{drug.name}</p>
            <p className="text-gray-400 dark:text-emt-muted text-xs mt-0.5">{drug.sub}</p>
            {drug.note && (
              <p className="text-gray-500 dark:text-emt-muted text-xs mt-1 leading-relaxed">{drug.note}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 items-end shrink-0">
            {drug.routes.map((r, i) => (
              <div key={i} className="flex flex-col items-end">
                <p className="text-gray-900 dark:text-emt-light font-bold text-base leading-tight whitespace-pre-line text-left" dir="ltr">
                  {r.dose(w)}
                </p>
                <span className="text-xs text-gray-400 dark:text-emt-muted bg-gray-100 dark:bg-emt-dark px-2 py-0.5 rounded-full mt-0.5">
                  {r.route}
                </span>
                {r.max && (
                  <p className="text-gray-400 dark:text-emt-muted text-xs mt-0.5 text-left" dir="ltr">{r.max}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {hasPrep && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-2 flex items-center gap-1 text-xs text-gray-400 dark:text-emt-muted active:opacity-70"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            הכנת תרופה
          </button>
        )}
      </div>

      {expanded && hasPrep && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-emt-border">
          {drug.routes.filter(r => r.prep).map((r, i) => (
            <div key={i} className="mt-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-emt-muted">{r.route}</p>
              <p className="text-xs text-gray-600 dark:text-emt-light mt-0.5 leading-relaxed">{resolvePrep(r.prep, w)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PediatricDosageCalculatorModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [ageInput, setAgeInput] = useState('');
  const [ageUnit, setAgeUnit] = useState<'months' | 'years'>('years');
  const [weightInput, setWeightInput] = useState('');
  const [calculated, setCalculated] = useState(false);
  const [activeScenario, setActiveScenario] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);

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
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מינון תרופות ילדים</h2>
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
        {/* Input card */}
        <div className="p-4 pb-0">
          <div className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray p-4 flex flex-col gap-3">

            {/* Age row */}
            <div className="flex gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-emt-muted">גיל</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="לדוגמה: 5"
                  value={ageInput}
                  onChange={e => { setAgeInput(e.target.value); setCalculated(false); }}
                  className="w-full rounded-xl border border-gray-200 dark:border-emt-border bg-gray-50 dark:bg-emt-dark
                             px-4 py-3 text-gray-900 dark:text-emt-light text-base placeholder-gray-400 dark:placeholder-emt-muted
                             focus:outline-none focus:ring-2 focus:ring-emt-green/50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-emt-muted">יחידה</label>
                <div className="flex rounded-xl border border-gray-200 dark:border-emt-border overflow-hidden h-[50px]">
                  {(['years', 'months'] as const).map(u => (
                    <button
                      key={u}
                      onClick={() => { setAgeUnit(u); setCalculated(false); }}
                      className={`px-3 text-sm font-semibold transition-colors ${
                        ageUnit === u
                          ? 'bg-emt-green text-white'
                          : 'bg-gray-50 dark:bg-emt-dark text-gray-500 dark:text-emt-muted'
                      }`}
                    >
                      {u === 'years' ? 'שנים' : 'חודשים'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Weight row */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-emt-muted">
                משקל (ק"ג)
                {isEstimated && estimatedWeight && (
                  <span className="mr-2 text-emt-yellow font-normal">— הערכה: ~{estimatedWeight} ק"ג</span>
                )}
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder={estimatedWeight ? `~${estimatedWeight} ק"ג (הערכה)` : 'לדוגמה: 18'}
                value={weightInput}
                onChange={e => { setWeightInput(e.target.value); setCalculated(false); }}
                className="w-full rounded-xl border border-gray-200 dark:border-emt-border bg-gray-50 dark:bg-emt-dark
                           px-4 py-3 text-gray-900 dark:text-emt-light text-base placeholder-gray-400 dark:placeholder-emt-muted
                           focus:outline-none focus:ring-2 focus:ring-emt-green/50"
              />
            </div>

            {isEstimated && (
              <div className="flex items-start gap-2 rounded-xl bg-emt-yellow/10 border border-emt-yellow/30 px-3 py-2">
                <AlertCircle size={13} className="text-emt-yellow shrink-0 mt-0.5" />
                <p className="text-emt-yellow text-xs">משקל מוערך לפי גיל. הזן משקל מדויק לתוצאות מיטביות.</p>
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
        </div>

        {/* Results */}
        {calculated && w > 0 && (
          <>
            {/* Weight badge */}
            <div className="px-4 mt-4 flex items-center justify-between">
              <p className="text-gray-900 dark:text-emt-light font-bold text-base">בחר תרחיש</p>
              <span className="text-sm font-bold text-emt-green bg-emt-green/10 px-3 py-1 rounded-full border border-emt-green/30">
                {w} ק"ג{isEstimated ? ' (הערכה)' : ''}
              </span>
            </div>

            {/* Scenario tabs — horizontal scroll */}
            <div ref={tabsRef} className="flex gap-2 px-4 mt-3 overflow-x-auto pb-1 scrollbar-hide">
              {PEDIATRIC_SCENARIOS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => handleScenarioChange(i)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                    i === activeScenario
                      ? `${s.bgColor} ${s.color} ${s.borderColor}`
                      : 'bg-gray-100 dark:bg-emt-gray text-gray-500 dark:text-emt-muted border-gray-200 dark:border-emt-border'
                  }`}
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
