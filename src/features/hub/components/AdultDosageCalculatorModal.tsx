import { useState, useRef } from 'react';
import { X, Stethoscope, Scale } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackEvent } from '../../../utils/analytics';
import { ADULT_SCENARIOS } from '../data/adultProtocolData';
import type { AdultDrug, AdultDrugRoute } from '../data/adultProtocolData';

interface Props { isOpen: boolean; onClose: () => void; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveDose(route: AdultDrugRoute, weight: number | null): { text: string; needsWeight: boolean } {
  if (typeof route.dose === 'string') return { text: route.dose, needsWeight: false };
  if (weight === null || weight <= 0) {
    return { text: route.doseSummary ?? '— הכנס משקל', needsWeight: true };
  }
  return { text: route.dose(weight), needsWeight: false };
}

// ─── Drug Card ────────────────────────────────────────────────────────────────

function DrugCard({ drug, weight }: { drug: AdultDrug; weight: number | null }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray overflow-hidden">
      <div className="p-5">
        <div className="mb-4">
          <p className={`font-bold text-2xl ${drug.color}`}>{drug.name}</p>
          <p className="text-gray-400 dark:text-emt-muted text-base mt-0.5">{drug.sub}</p>
          {drug.note && (
            <p className="text-gray-500 dark:text-emt-muted text-sm mt-1 leading-relaxed">{drug.note}</p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {drug.routes.map((r, i) => {
            const { text, needsWeight } = resolveDose(r, weight);
            return (
              <div key={i} className={i > 0 ? 'border-t border-gray-100 dark:border-emt-border pt-4' : ''}>
                <span className="inline-block text-base font-bold text-gray-500 dark:text-emt-muted bg-gray-100 dark:bg-emt-dark px-4 py-1.5 rounded-full mb-2">
                  {r.route}
                </span>

                {needsWeight ? (
                  <div className="flex items-center gap-2">
                    <Scale size={16} className="text-orange-400 shrink-0" />
                    <p className="text-orange-400 font-bold text-2xl leading-tight" dir="ltr">{text}</p>
                  </div>
                ) : (
                  <p className="text-gray-900 dark:text-emt-light font-bold text-4xl leading-tight" dir="ltr">
                    {text}
                  </p>
                )}

                {r.max && (
                  <p className="text-gray-400 dark:text-emt-muted text-sm mt-1.5 leading-relaxed" dir="ltr">{r.max}</p>
                )}
                {r.note && (
                  <p className="text-gray-500 dark:text-emt-muted text-sm mt-1 leading-relaxed">{r.note}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Solid BG map for active scenario ────────────────────────────────────────

const solidBg: Record<string, string> = Object.fromEntries(
  ADULT_SCENARIOS.map(s => [s.id, s.solidBg])
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdultDosageCalculatorModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [weightInput, setWeightInput] = useState('');
  const [activeScenario, setActiveScenario] = useState(0);
  const weightRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const weight = weightInput !== '' && Number(weightInput) > 0 ? Number(weightInput) : null;
  const scenario = ADULT_SCENARIOS[activeScenario];
  const hasWeightBased = scenario.drugs.some(d =>
    d.routes.some(r => typeof r.dose === 'function')
  );

  function handleScenarioChange(i: number) {
    setActiveScenario(i);
    trackEvent('adult_scenario_switch', { scenario: ADULT_SCENARIOS[i].id });
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <Stethoscope size={22} className="text-orange-400" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">תרופות מבוגרים ALS</h2>
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

        {/* Weight input — optional */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray px-4 py-3">
            <Scale size={18} className="text-orange-400 shrink-0" />
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 dark:text-emt-muted block mb-1">
                משקל מטופל — אופציונלי (לתרופות לפי משקל)
              </label>
              <input
                ref={weightRef}
                type="number"
                inputMode="decimal"
                placeholder="הזן משקל בק&quot;ג"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                className="w-full bg-transparent text-gray-900 dark:text-emt-light text-base font-bold
                           placeholder-gray-300 dark:placeholder-emt-muted focus:outline-none"
              />
            </div>
            {weight && (
              <span className="text-sm font-bold text-orange-400 bg-orange-400/10 border border-orange-400/30 px-2 py-0.5 rounded-full shrink-0">
                {weight} ק"ג
              </span>
            )}
          </div>

          {hasWeightBased && !weight && (
            <p className="text-xs text-orange-400 mt-1.5 text-center">
              תרחיש זה מכיל תרופות לפי משקל — הזן משקל לחישוב מדויק
            </p>
          )}
        </div>

        {/* Scenario grid */}
        <div className="px-4 mb-2">
          <p className="text-gray-900 dark:text-emt-light font-bold text-base mb-3">בחר תרחיש</p>
          <div className="grid grid-cols-2 gap-3">
            {ADULT_SCENARIOS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => handleScenarioChange(i)}
                className={`rounded-2xl py-4 text-lg font-bold border-2 transition-all w-full
                  ${i === ADULT_SCENARIOS.length - 1 && ADULT_SCENARIOS.length % 2 !== 0 ? 'col-span-2' : ''}
                  ${i === activeScenario
                    ? `${solidBg[s.id]} text-white border-transparent shadow-lg scale-[1.02]`
                    : `bg-white dark:bg-emt-gray ${s.color} ${s.borderColor}`
                  }
                `}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drug cards */}
        <div className="flex flex-col gap-2 p-4 pt-3">
          {scenario.drugs.map(drug => (
            <DrugCard key={`${drug.name}-${drug.sub}`} drug={drug} weight={weight} />
          ))}
        </div>

      </div>
    </div>
  );
}
