import { useState } from 'react';
import { X, Wind, AlertCircle } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackEvent } from '../../../utils/analytics';
import { useTranslation } from '../../../i18n';

type T = ReturnType<typeof useTranslation>;

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

function calcTube(t: T, ageMo: number | null, weightKg: number | null): TubeResult | null {
  if (ageMo === null && weightKg === null) return null;

  // Preterm / very low weight
  if (weightKg !== null && weightKg < 1) {
    return {
      label: t('calcTubePreterm'),
      withCuff: '–',
      withoutCuff: t('calcMm', { v: '2.5' }),
      depth: t('calcDepthAtLip', { v: '8' }),
      note: t('calcTubePretermNote'),
    };
  }
  if (weightKg !== null && weightKg < 3) {
    return {
      label: t('calcTubeNewborn'),
      withCuff: '–',
      withoutCuff: t('calcMm', { v: '3.0' }),
      depth: t('calcDepthAtLip', { v: '9' }),
    };
  }
  if (weightKg !== null && weightKg < 5 && (ageMo === null || ageMo < 2)) {
    return {
      label: t('calcTubeNewborn3kg'),
      withCuff: t('calcMm', { v: '3.0' }),
      withoutCuff: t('calcMm', { v: '3.5' }),
      depth: t('calcDepthAtLip', { v: '9–10' }),
    };
  }

  // Age-based from here
  const ageYr = ageMo !== null ? ageMo / 12 : null;

  if (ageMo !== null && ageMo <= 12) {
    return {
      label: t('calcTubeInfant'),
      withCuff: t('calcMm', { v: '3.5' }),
      withoutCuff: t('calcMm', { v: '4.0' }),
      depth: t('calcDepthAtLip', { v: '10.5–12' }),
    };
  }

  if (ageYr !== null && ageYr > 1) {
    const withCuff = parseFloat(((ageYr / 4) + 3.5).toFixed(1));
    const withoutCuff = parseFloat(((ageYr / 4) + 4).toFixed(1));
    const depth = parseFloat(((ageYr / 2) + 12).toFixed(1));
    return {
      label: t('calcTubeChildYears', { n: ageYr.toFixed(0) }),
      withCuff: t('calcMm', { v: withCuff }),
      withoutCuff: t('calcMm', { v: withoutCuff }),
      depth: t('calcDepthFormula', { d: depth }),
      note: t('calcTubeFormulaNote'),
    };
  }

  return null;
}

// [max weight kg, LMA size, cuff volume mL]
const LMA_TABLE: [number, string, number, string][] = [
  [5, '1', 5, '0–5'],
  [10, '1.5', 7, '5–10'],
  [20, '2', 10, '10–20'],
  [30, '2.5', 15, '20–30'],
  [50, '3', 20, '30–50'],
  [70, '4', 30, '50–70'],
  [Infinity, '5', 40, '70–100'],
];

function calcLma(t: T, weightKg: number): LmaResult {
  const row = LMA_TABLE.find(([max]) => weightKg <= max)!;
  return { size: row[1], cuffVolume: t('calcMl', { v: row[2] }) };
}

function estimateWeightFromAge(ageMo: number): number {
  if (ageMo < 1) return 3;
  if (ageMo <= 12) return 3 + ageMo;
  return Math.round((ageMo / 12) * 2 + 8);
}

// ─── Result Row ───────────────────────────────────────────────────────────────

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
      <p className="text-sm text-fg-muted">{label}</p>
      <p className={`font-bold text-base ${highlight ? 'text-sky-600 dark:text-sky-400' : 'text-fg'}`}>{value}</p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TubeSizingCalculatorModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const t = useTranslation();
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

  const tubeResult = calculated ? calcTube(t, ageMo, w) : null;
  const lmaResult = calculated && w > 0 ? calcLma(t, w) : null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-page">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Wind size={22} className="text-sky-400" />
          <h2 className="text-fg font-bold text-xl">{t('calcTubeTitle')}</h2>
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

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Input card */}
        <div className="rounded-2xl border border-line bg-surface p-4 flex flex-col gap-4">

          {/* Age input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-fg">{t('calcChildAge')}</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder={t('calcEnterAge')}
              value={ageInput}
              onChange={e => { setAgeInput(e.target.value); setCalculated(false); }}
              className="w-full rounded-xl border-2 border-line bg-surface
                         px-3 py-2.5 text-fg text-base placeholder-fg-subtle
                         focus:outline-none focus:border-sky-400 transition-colors"
            />
          </div>

          {/* Age unit toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-fg">{t('calcAgeUnit')}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['years', 'months'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => { setAgeUnit(u); setCalculated(false); }}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                    ageUnit === u
                      ? 'bg-sky-400 text-white border-sky-400 shadow-sm'
                      : 'bg-surface text-fg-muted border-line'
                  }`}
                >
                  {u === 'years' ? t('calcUnitYears') : t('calcUnitMonths')}
                </button>
              ))}
            </div>
          </div>

          {/* Weight input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-fg">{t('calcWeightKgLabel')}</label>
              {isEstimated && estimatedWeight && (
                <span className="text-xs font-bold text-emt-yellow bg-emt-yellow/10 border border-emt-yellow/30 px-2 py-0.5 rounded-full">
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
                         focus:outline-none focus:border-sky-400 transition-colors"
            />
          </div>

          {isEstimated && (
            <div className="flex items-start gap-2 rounded-xl bg-emt-yellow/10 border border-emt-yellow/30 px-3 py-2">
              <AlertCircle size={13} className="text-emt-yellow shrink-0 mt-0.5" />
              <p className="text-emt-yellow text-xs font-medium">{t('calcEstimatedWarning')}</p>
            </div>
          )}

          <button
            onClick={handleCalculate}
            disabled={!displayWeight || displayWeight <= 0}
            className="w-full rounded-xl bg-sky-400 text-white font-bold text-base py-3 mt-1
                       active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed
                       shadow-md shadow-sky-400/25"
          >
            {t('calcCalculateSizes')}
          </button>
        </div>

        {/* ETT Results */}
        {tubeResult && (
          <div className="rounded-2xl border border-sky-400/30 bg-sky-400/5 p-4 flex flex-col gap-0">
            <div className="flex items-center gap-2 mb-3">
              <Wind size={16} className="text-sky-400" />
              <p className="text-sky-600 dark:text-sky-400 font-bold text-base">{t('calcEttHeader', { label: tubeResult.label })}</p>
            </div>
            <Row label={t('calcCuffed')} value={tubeResult.withCuff} highlight />
            <Row label={t('calcUncuffed')} value={tubeResult.withoutCuff} highlight />
            <Row label={t('calcInsertionDepth')} value={tubeResult.depth} />
            {tubeResult.note && (
              <p className="text-xs text-fg-muted mt-2 leading-relaxed">{tubeResult.note}</p>
            )}
          </div>
        )}

        {/* LMA Results */}
        {lmaResult && (
          <div className="rounded-2xl border border-violet-400/30 bg-violet-400/5 p-4 flex flex-col gap-0">
            <div className="flex items-center gap-2 mb-3">
              <Wind size={16} className="text-violet-400" />
              <p className="text-violet-600 dark:text-violet-400 font-bold text-base">{t('calcLmaHeader', { w })}</p>
            </div>
            <Row label={t('calcLmaSize')} value={lmaResult.size} highlight />
            <Row label={t('calcCuffVolume')} value={lmaResult.cuffVolume} />
          </div>
        )}

        {/* Reference table */}
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-fg font-bold text-sm mb-3">{t('calcLmaTableTitle')}</p>
          {LMA_TABLE.map(([, size, vol, wRange]) => (
            <div
              key={wRange}
              className={`flex items-center justify-between py-1.5 border-b border-line last:border-0 ${
                lmaResult?.size === size ? 'text-violet-600 dark:text-violet-400' : 'text-fg'
              }`}
            >
              <p className="text-xs">{t('calcKgValue', { w: wRange })}</p>
              <p className="text-xs font-bold">{t('calcSizeN', { size })}</p>
              <p className="text-xs">{t('calcMl', { v: vol })}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
