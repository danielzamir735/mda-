import { useState, useEffect } from 'react';
import { X, Stethoscope, Scale } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackEvent } from '../../../utils/analytics';
import { ADULT_SCENARIOS } from '../data/adultProtocolData';
import type { AdultDrug, AdultDrugRoute } from '../data/adultProtocolData';

interface Props { isOpen: boolean; onClose: () => void; }

const STORAGE_WEIGHT = 'adult-dosage-weight';
const STORAGE_AGE = 'adult-dosage-age';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveDose(route: AdultDrugRoute, weight: number): { text: string; needsWeight: boolean } {
  if (typeof route.dose === 'string') return { text: route.dose, needsWeight: false };
  return { text: route.dose(weight), needsWeight: false };
}

// ─── Drug Card ────────────────────────────────────────────────────────────────

function DrugCard({ drug, weight }: { drug: AdultDrug; weight: number }) {
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
            const { text } = resolveDose(r, weight);
            return (
              <div key={i} className={i > 0 ? 'border-t border-gray-100 dark:border-emt-border pt-4' : ''}>
                <span className="inline-block text-base font-bold text-gray-500 dark:text-emt-muted bg-gray-100 dark:bg-emt-dark px-4 py-1.5 rounded-full mb-2">
                  {r.route}
                </span>
                <p className="text-gray-900 dark:text-emt-light font-bold text-4xl leading-tight" dir="ltr">
                  {text}
                </p>
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
  const [weightInput, setWeightInput] = useState(() => {
    try { return localStorage.getItem(STORAGE_WEIGHT) ?? ''; } catch { return ''; }
  });
  const [ageInput, setAgeInput] = useState(() => {
    try { return localStorage.getItem(STORAGE_AGE) ?? ''; } catch { return ''; }
  });
  const [confirmed, setConfirmed] = useState(false);
  const [activeScenario, setActiveScenario] = useState(0);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_WEIGHT, weightInput); } catch {}
  }, [weightInput]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_AGE, ageInput); } catch {}
  }, [ageInput]);

  if (!isOpen) return null;

  const weightNum = weightInput !== '' && Number(weightInput) > 0 ? Number(weightInput) : null;
  const ageNum = ageInput !== '' && Number(ageInput) > 0 ? Number(ageInput) : null;
  const weight = weightNum ?? 0;
  const scenario = ADULT_SCENARIOS[activeScenario];

  function handleConfirm() {
    if (!weightNum) return;
    setConfirmed(true);
    trackEvent('adult_weight_confirmed', { weight: weightNum, age: ageNum });
  }

  function handleScenarioChange(i: number) {
    setActiveScenario(i);
    trackEvent('adult_scenario_switch', { scenario: ADULT_SCENARIOS[i].id });
  }

  function handleBack() {
    setConfirmed(false);
    setActiveScenario(0);
  }

  function handleReset() {
    setWeightInput('');
    setAgeInput('');
    setConfirmed(false);
    setActiveScenario(0);
    try {
      localStorage.removeItem(STORAGE_WEIGHT);
      localStorage.removeItem(STORAGE_AGE);
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark overflow-x-hidden">
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

        {!confirmed ? (
          /* ── Weight + Age entry screen ── */
          <div className="flex flex-col items-center px-6 pt-8 pb-6 w-full">
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-orange-400/15 border-2 border-orange-400/30 flex items-center justify-center mb-5">
              <Scale size={36} className="text-orange-400" />
            </div>

            <h3 className="text-gray-900 dark:text-emt-light font-bold text-2xl mb-1 text-center">פרטי המטופל</h3>
            <p className="text-gray-400 dark:text-emt-muted text-sm text-center mb-8">הזן פרטים לחישוב מינונים מדויק</p>

            <div className="w-full max-w-sm flex flex-col gap-4">
              {/* Weight input */}
              <div>
                <p className="text-gray-500 dark:text-emt-muted text-sm font-bold mb-2 text-right">משקל</p>
                <div className="rounded-2xl border-2 border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray px-5 py-4 flex items-center gap-3 focus-within:border-orange-400 transition-colors">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder='הזן משקל בק"ג'
                    value={weightInput}
                    onChange={e => setWeightInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && weightNum && handleConfirm()}
                    autoFocus
                    className="flex-1 min-w-0 bg-transparent text-gray-900 dark:text-emt-light text-3xl font-bold
                               placeholder-gray-300 dark:placeholder-emt-muted focus:outline-none text-center"
                  />
                  {weightNum && (
                    <span className="text-base font-bold text-orange-400 shrink-0">ק"ג</span>
                  )}
                </div>
              </div>

              {/* Age input */}
              <div>
                <p className="text-gray-500 dark:text-emt-muted text-sm font-bold mb-2 text-right">גיל</p>
                <div className="rounded-2xl border-2 border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray px-5 py-4 flex items-center gap-3 focus-within:border-orange-400 transition-colors">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="הזן גיל"
                    value={ageInput}
                    onChange={e => setAgeInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && weightNum && handleConfirm()}
                    className="flex-1 min-w-0 bg-transparent text-gray-900 dark:text-emt-light text-3xl font-bold
                               placeholder-gray-300 dark:placeholder-emt-muted focus:outline-none text-center"
                  />
                  {ageNum && (
                    <span className="text-base font-bold text-orange-400 shrink-0">שנים</span>
                  )}
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={!weightNum}
                className="w-full rounded-2xl bg-orange-400 text-white font-bold text-xl py-4
                           active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed
                           shadow-lg shadow-orange-400/30 mt-2"
              >
                חשב מינונים
              </button>
            </div>
          </div>
        ) : (
          /* ── Results screen ── */
          <>
            {/* Patient info badge + back */}
            <div className="px-4 mt-4 flex items-center justify-between">
              <button
                onClick={handleBack}
                className="text-sm font-bold text-orange-400 active:opacity-60 transition-opacity"
              >
                ← שנה פרטים
              </button>
              <div className="flex items-center gap-2">
                {ageNum && (
                  <span className="text-sm font-bold text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full border border-orange-400/30">
                    גיל {ageNum}
                  </span>
                )}
                <span className="text-sm font-bold text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full border border-orange-400/30">
                  {weight} ק"ג
                </span>
              </div>
            </div>

            {/* Scenario grid */}
            <div className="px-4 mt-4 mb-2">
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

            {/* Reset button */}
            <div className="px-4 pb-8 pt-2">
              <button
                onClick={handleReset}
                className="w-full rounded-2xl border-2 border-red-400 text-red-400 font-bold text-xl py-4
                           active:scale-95 transition-transform bg-red-400/10"
              >
                אפס גיל ומשקל
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
