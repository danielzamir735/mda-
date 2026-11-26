import { useState } from 'react';
import { X, Baby, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackEvent } from '../../../utils/analytics';
import { useTranslation } from '../../../i18n';
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
  const t = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const hasPrep = drug.routes.some(r => r.prep);

  return (
    <div className="rounded-2xl border border-line bg-surface overflow-hidden">
      <div className="p-5">
        {/* Drug name + sub */}
        <div className="mb-4">
          <p className={`font-bold text-2xl ${drug.color}`}>{drug.name}</p>
          <p className="text-fg-muted text-base mt-0.5">{drug.sub}</p>
          {drug.note && (
            <p className="text-fg-muted text-sm mt-1 leading-relaxed">{drug.note}</p>
          )}
        </div>

        {/* Routes — each in its own stacked block */}
        <div className="flex flex-col gap-4">
          {drug.routes.map((r, i) => (
            <div key={i} className={i > 0 ? 'border-t border-line pt-4' : ''}>
              <span className="inline-block text-base font-bold text-fg-muted bg-surface-2 px-4 py-1.5 rounded-full mb-2">
                {r.route}
              </span>
              <p className="text-fg font-bold text-4xl leading-tight whitespace-pre-line" dir="ltr">
                {r.dose(w)}
              </p>
              {r.max && (
                <p className="text-fg-muted text-sm mt-1.5 leading-relaxed" dir="ltr">{r.max}</p>
              )}
            </div>
          ))}
        </div>

        {hasPrep && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-5 flex items-center justify-center gap-2 text-base font-bold text-fg-muted
                       bg-surface-2 rounded-xl px-4 py-3 w-full active:opacity-70 transition-opacity"
          >
            {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            {t('calcDrugPrep')}
          </button>
        )}
      </div>

      {expanded && hasPrep && (
        <div className="px-5 pb-5 border-t border-line">
          {drug.routes.filter(r => r.prep).map((r, i) => (
            <div key={i} className="mt-4">
              <p className="text-base font-bold text-fg-muted mb-1">{r.route}</p>
              <p className="text-lg text-fg leading-relaxed">{resolvePrep(r.prep, w)}</p>
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
  const t = useTranslation();
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
    <div className="fixed inset-0 z-[70] flex flex-col bg-page">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Baby size={22} className="text-emt-green" />
          <h2 className="text-fg font-bold text-xl">{t('calcPedsTitle')}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-surface-2 border border-line
                     flex items-center justify-center active:scale-90 transition-transform
                     text-fg-muted hover:text-fg"
          aria-label={t('close')}
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Hero */}
        <div className="flex flex-col items-center text-center px-6 pt-4 pb-3">
          <div className="w-12 h-12 rounded-full bg-emt-green/15 border-2 border-emt-green/30 flex items-center justify-center mb-2">
            <Baby size={22} className="text-emt-green" />
          </div>
          <h3 className="text-fg font-bold text-base mb-0.5">{t('calcPedsHero')}</h3>
          <p className="text-fg-muted text-xs">{t('calcEnterAgeWeightHint')}</p>
        </div>

        {/* Inputs */}
        <div className="px-4 flex flex-col gap-3 pb-5">

          {/* Age input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-fg">{t('calcChildAge')}</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder={t('calcEnterAge')}
              value={ageInput}
              onChange={e => { setAgeInput(e.target.value); setCalculated(false); }}
              className="w-full rounded-xl border-2 border-line bg-surface
                         px-3 py-2.5 text-fg text-base placeholder-fg-subtle
                         focus:outline-none focus:border-emt-green transition-colors"
            />
          </div>

          {/* Unit toggle */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-fg">{t('calcAgeUnit')}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['years', 'months'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => { setAgeUnit(u); setCalculated(false); }}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                    ageUnit === u
                      ? 'bg-emt-green text-white border-emt-green shadow-sm'
                      : 'bg-surface text-fg-muted border-line'
                  }`}
                >
                  {u === 'years' ? t('calcUnitYears') : t('calcUnitMonths')}
                </button>
              ))}
            </div>
          </div>

          {/* Weight input */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-fg">{t('calcWeightKgLabel')}</label>
              {isEstimated && estimatedWeight && (
                <span className="text-xs font-bold text-amber-600 dark:text-emt-yellow bg-emt-yellow/10 border border-emt-yellow/30 px-2 py-0.5 rounded-full">
                  {t('calcEstimateBadge', { w: estimatedWeight })}
                </span>
              )}
            </div>
            <input
              type="number"
              inputMode="decimal"
              placeholder={estimatedWeight ? t('calcEstimatePlaceholder', { w: estimatedWeight }) : t('calcEnterWeight')}
              value={weightInput}
              onChange={e => { setWeightInput(e.target.value); setCalculated(false); }}
              className="w-full rounded-xl border-2 border-line bg-surface
                         px-3 py-2.5 text-fg text-base placeholder-fg-subtle
                         focus:outline-none focus:border-emt-green transition-colors"
            />
          </div>

          {/* Estimated weight warning */}
          {isEstimated && (
            <div className="flex items-start gap-2 rounded-xl bg-emt-yellow/10 border border-emt-yellow/30 px-3 py-2">
              <AlertCircle size={13} className="text-amber-600 dark:text-emt-yellow shrink-0 mt-0.5" />
              <p className="text-amber-600 dark:text-emt-yellow text-xs font-medium">{t('calcEstimatedWarning')}</p>
            </div>
          )}

          {/* Calculate button */}
          <button
            onClick={handleCalculate}
            disabled={!displayWeight || displayWeight <= 0}
            className="w-full rounded-xl bg-emt-green text-white font-bold text-base py-3 mt-1
                       active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed
                       shadow-md shadow-emt-green/25"
          >
            {t('calcCalculateDoses')}
          </button>
        </div>

        {/* Results */}
        {calculated && w > 0 && (
          <>
            {/* Weight badge */}
            <div className="px-4 mt-4 flex items-center justify-between">
              <p className="text-fg font-bold text-xl">{t('calcChooseScenario')}</p>
              <span className="text-sm font-bold text-emt-green bg-emt-green/10 px-3 py-1 rounded-full border border-emt-green/30">
                {t('calcKgValue', { w })}{isEstimated ? t('calcEstimatedSuffix') : ''}
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
                      // theme-ok: white text on the scenario's solid colour
                      ? `${SCENARIO_SOLID[s.id]} text-white border-transparent shadow-lg scale-[1.02]`
                      : `bg-surface ${s.color} ${s.borderColor}`
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
