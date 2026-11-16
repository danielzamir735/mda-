import { useState, useEffect } from 'react';
import { X, Brain, RotateCcw } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackInteraction, trackEvent } from '../../../utils/analytics';
import { useTranslation, type TranslationKey } from '../../../i18n';

interface Props { isOpen: boolean; onClose: () => void; }

// ─── Data ───────────────────────────────────────────────────────────────────

const EYES_OPTIONS: { score: number; label: TranslationKey }[] = [
  { score: 4, label: 'calcGcsEyes4' },
  { score: 3, label: 'calcGcsEyes3' },
  { score: 2, label: 'calcGcsEyes2' },
  { score: 1, label: 'calcGcsNone' },
];

const VERBAL_OPTIONS: { score: number; label: TranslationKey }[] = [
  { score: 5, label: 'calcGcsVerbal5' },
  { score: 4, label: 'calcGcsVerbal4' },
  { score: 3, label: 'calcGcsVerbal3' },
  { score: 2, label: 'calcGcsVerbal2' },
  { score: 1, label: 'calcGcsNone' },
];

const MOTOR_OPTIONS: { score: number; label: TranslationKey }[] = [
  { score: 6, label: 'calcGcsMotor6' },
  { score: 5, label: 'calcGcsMotor5' },
  { score: 4, label: 'calcGcsMotor4' },
  { score: 3, label: 'calcGcsMotor3' },
  { score: 2, label: 'calcGcsMotor2' },
  { score: 1, label: 'calcGcsNone' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readLS(key: string, fallback: number): number {
  try {
    const v = localStorage.getItem(key);
    const n = v !== null ? parseInt(v, 10) : NaN;
    return isNaN(n) ? fallback : n;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: number) {
  try { localStorage.setItem(key, String(value)); } catch { /* ignore */ }
}

type SevKey = 'mild' | 'moderate' | 'severe';

const SEV: Record<SevKey, { label: TranslationKey; badge: string; score: string; card: string }> = {
  mild:     { label: 'calcGcsSevMild', badge: 'bg-emt-green/20 text-emt-green',   score: 'text-emt-green',   card: 'border-emt-green/30 bg-emt-green/5' },
  moderate: { label: 'calcGcsSevModerate', badge: 'bg-emt-yellow/20 text-emt-yellow', score: 'text-emt-yellow', card: 'border-emt-yellow/30 bg-emt-yellow/5' },
  severe:   { label: 'calcGcsSevSevere', badge: 'bg-emt-red/20 text-emt-red',       score: 'text-emt-red',     card: 'border-emt-red/30 bg-emt-red/5' },
};

function getSeverity(total: number): SevKey {
  if (total >= 13) return 'mild';
  if (total >= 9)  return 'moderate';
  return 'severe';
}

// ─── Option Button ────────────────────────────────────────────────────────────

interface OptionBtnProps {
  score: number;
  label: string;
  active: boolean;
  onClick: () => void;
}

function OptionBtn({ score, label, active, onClick }: OptionBtnProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-start',
        'font-semibold text-sm transition-all active:scale-95',
        active
          ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-700 dark:text-cyan-300'
          : 'border-line bg-surface-2 text-fg-muted',
      ].join(' ')}
    >
      <span className={[
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
        'text-sm font-black border',
        active
          ? 'bg-cyan-400/20 border-cyan-400/50 text-cyan-700 dark:text-cyan-300'
          : 'bg-surface-3 border-line-strong text-fg-muted',
      ].join(' ')}>
        {score}
      </span>
      <span className="flex-1 leading-tight">{label}</span>
      {active && (
        <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GlasgowCalculatorModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);

  const t = useTranslation();
  const [eyes,   setEyes]   = useState<number>(() => readLS('lastGcsEyes',   4));
  const [verbal, setVerbal] = useState<number>(() => readLS('lastGcsVerbal', 5));
  const [motor,  setMotor]  = useState<number>(() => readLS('lastGcsMotor',  6));

  useEffect(() => {
    if (isOpen) trackInteraction('מחשבון גלזגו (GCS)', 'calculators'); // i18n-ok: analytics label, kept stable
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEyes   = (v: number) => { setEyes(v);   writeLS('lastGcsEyes',   v); };
  const handleVerbal = (v: number) => { setVerbal(v); writeLS('lastGcsVerbal', v); };
  const handleMotor  = (v: number) => { setMotor(v);  writeLS('lastGcsMotor',  v); };

  const total = eyes + verbal + motor;
  const sevKey = getSeverity(total);
  const sev = SEV[sevKey];

  const handleReset = () => {
    handleEyes(4);
    handleVerbal(5);
    handleMotor(6);
    trackEvent('gcs_reset');
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-page">

      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-cyan-400" />
          <h2 className="text-fg font-bold text-xl">{t('calcGcsTitle')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30
                       bg-red-500/10 text-red-500 text-sm font-semibold
                       hover:bg-red-500/20 active:scale-95 transition-all"
            aria-label={t('calcResetValues')}
          >
            <RotateCcw size={14} />
            <span>{t('reset')}</span>
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-surface-2 border border-line
                       flex items-center justify-center active:scale-90 transition-transform
                       text-fg-muted"
            aria-label={t('close')}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-36">

        {/* Eyes */}
        <section className="rounded-2xl border border-line bg-surface p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-fg font-bold text-base">{t('calcGcsEyes')}</p>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 rounded-full">
              E = {eyes}
            </span>
          </div>
          {EYES_OPTIONS.map(opt => (
            <OptionBtn
              key={opt.score}
              score={opt.score}
              label={t(opt.label)}
              active={eyes === opt.score}
              onClick={() => handleEyes(opt.score)}
            />
          ))}
        </section>

        {/* Verbal */}
        <section className="rounded-2xl border border-line bg-surface p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-fg font-bold text-base">{t('calcGcsVerbal')}</p>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 rounded-full">
              V = {verbal}
            </span>
          </div>
          {VERBAL_OPTIONS.map(opt => (
            <OptionBtn
              key={opt.score}
              score={opt.score}
              label={t(opt.label)}
              active={verbal === opt.score}
              onClick={() => handleVerbal(opt.score)}
            />
          ))}
        </section>

        {/* Motor */}
        <section className="rounded-2xl border border-line bg-surface p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-fg font-bold text-base">{t('calcGcsMotor')}</p>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 rounded-full">
              M = {motor}
            </span>
          </div>
          {MOTOR_OPTIONS.map(opt => (
            <OptionBtn
              key={opt.score}
              score={opt.score}
              label={t(opt.label)}
              active={motor === opt.score}
              onClick={() => handleMotor(opt.score)}
            />
          ))}
        </section>

      </div>

      {/* Sticky bottom score bar */}
      <div className={[
        'shrink-0 border-t px-4 py-3 flex items-center justify-between transition-all duration-300',
        sev.card.replace('bg-', 'bg-').replace('/5', '/8'),
        'border-t',
        sevKey === 'mild'     ? 'border-emt-green/30' :
        sevKey === 'moderate' ? 'border-emt-yellow/30' :
                                'border-emt-red/30',
      ].join(' ')}>

        {/* Formula breakdown */}
        <div className="flex flex-col gap-0.5">
          <p className="text-fg-muted text-xs">
            E{eyes} + V{verbal} + M{motor}
          </p>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${sev.badge}`}>
            {t(sev.label)}
          </span>
        </div>

        {/* Total score */}
        <div className="flex items-end gap-1">
          <span
            className={`font-black tabular-nums leading-none transition-colors duration-300 ${sev.score}`}
            style={{ fontSize: 'clamp(2.5rem, 12vw, 3.5rem)' }}
          >
            {total}
          </span>
          <span className="text-fg-muted text-sm font-semibold mb-1">/ 15</span>
        </div>
      </div>
    </div>
  );
}
