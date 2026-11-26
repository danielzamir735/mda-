import { useState, useEffect } from 'react';
import { X, AlertTriangle, RotateCcw } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackInteraction, trackEvent } from '../../../utils/analytics';
import { useTranslation, type TranslationKey } from '../../../i18n';

interface Props { isOpen: boolean; onClose: () => void; }

// ─── Data ────────────────────────────────────────────────────────────────────

const CRITERIA = [
  {
    key: 'rr' as const,
    title: 'calcQsofaRr' as TranslationKey,
    subtitle: 'calcQsofaRrSub' as TranslationKey,
  },
  {
    key: 'sbp' as const,
    title: 'calcQsofaSbp' as TranslationKey,
    subtitle: 'calcQsofaSbpSub' as TranslationKey,
  },
  {
    key: 'mental' as const,
    title: 'calcQsofaMental' as TranslationKey,
    subtitle: 'calcQsofaMentalSub' as TranslationKey,
  },
];

type CriterionKey = 'rr' | 'sbp' | 'mental';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readLS(key: string): boolean {
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
}

function writeLS(key: string, value: boolean) {
  try { localStorage.setItem(key, value ? '1' : '0'); } catch { /* ignore */ }
}

type SevKey = 'low' | 'moderate' | 'high';

const SEV: Record<SevKey, { label: TranslationKey; badge: string; score: string; bar: string; barBorder: string; description: TranslationKey }> = {
  low:      {
    label: 'calcQsofaSevLow',
    badge: 'bg-emt-green/20 text-emt-green',
    score: 'text-emt-green',
    bar: 'bg-emt-green/8',
    barBorder: 'border-emt-green/30',
    description: 'calcQsofaDescLow',
  },
  moderate: {
    label: 'calcQsofaSevModerate',
    badge: 'bg-emt-yellow/20 text-amber-800 dark:text-emt-yellow',
    score: 'text-amber-800 dark:text-emt-yellow',
    bar: 'bg-emt-yellow/8',
    barBorder: 'border-emt-yellow/30',
    description: 'calcQsofaDescModerate',
  },
  high:     {
    label: 'calcQsofaSevHigh',
    badge: 'bg-emt-red/20 text-emt-red',
    score: 'text-emt-red',
    bar: 'bg-emt-red/8',
    barBorder: 'border-emt-red/30',
    description: 'calcQsofaDescHigh',
  },
};

function getSeverity(total: number): SevKey {
  if (total === 0) return 'low';
  if (total === 1) return 'moderate';
  return 'high';
}

// ─── Criterion Row ────────────────────────────────────────────────────────────

interface CriterionRowProps {
  title: string;
  subtitle: string;
  active: boolean;
  onToggle: () => void;
}

function CriterionRow({ title, subtitle, active, onToggle }: CriterionRowProps) {
  return (
    <button
      onClick={onToggle}
      className={[
        'flex items-center gap-4 w-full px-4 py-4 rounded-2xl border text-start',
        'transition-all active:scale-95',
        active
          ? 'border-amber-400/60 bg-amber-400/10'
          : 'border-line bg-surface',
      ].join(' ')}
    >
      {/* Checkbox */}
      <div className={[
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all',
        active
          ? 'bg-amber-400 border-amber-400'
          : 'bg-transparent border-line-strong',
      ].join(' ')}>
        {active && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            {/* theme-ok: white tick on the solid amber circle */}
            <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 text-start">
        <p className={`font-bold text-base leading-tight ${active ? 'text-amber-800 dark:text-amber-400' : 'text-fg'}`}>
          {title}
        </p>
        <p className="text-fg-muted text-xs mt-0.5">{subtitle}</p>
      </div>

      {/* Point badge */}
      <span className={[
        'text-sm font-black px-2.5 py-1 rounded-full border transition-all',
        active
          ? 'bg-amber-400/20 border-amber-400/50 text-amber-800 dark:text-amber-400'
          : 'bg-surface-2 border-line text-fg-muted',
      ].join(' ')}>
        +1
      </span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QSofaCalculatorModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);

  const t = useTranslation();
  const [rr, setRr] = useState<boolean>(() => readLS('qsofa_rr'));
  const [sbp, setSbp] = useState<boolean>(() => readLS('qsofa_sbp'));
  const [mental, setMental] = useState<boolean>(() => readLS('qsofa_mental'));

  useEffect(() => {
    if (isOpen) trackInteraction('מחשבון qSOFA', 'calculators'); // i18n-ok: analytics label, kept stable
  }, [isOpen]);

  if (!isOpen) return null;

  const values: Record<CriterionKey, boolean> = { rr, sbp, mental };
  const setters: Record<CriterionKey, (v: boolean) => void> = {
    rr:     (v) => { setRr(v);     writeLS('qsofa_rr',     v); },
    sbp:    (v) => { setSbp(v);    writeLS('qsofa_sbp',    v); },
    mental: (v) => { setMental(v); writeLS('qsofa_mental', v); },
  };

  const total = [rr, sbp, mental].filter(Boolean).length;
  const sevKey = getSeverity(total);
  const sev = SEV[sevKey];

  const handleReset = () => {
    setters.rr(false);
    setters.sbp(false);
    setters.mental(false);
    trackEvent('qsofa_reset');
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-page">

      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-amber-800 dark:text-amber-400" />
          <h2 className="text-fg font-bold text-xl">{t('calcQsofaTitle')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30
                       bg-red-500/10 text-red-700 dark:text-red-500 text-sm font-semibold
                       hover:bg-red-500/20 active:scale-95 transition-all"
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-36">

        <p className="text-fg-muted text-sm text-start px-1">
          {t('calcQsofaIntro')}
        </p>

        {CRITERIA.map(c => (
          <CriterionRow
            key={c.key}
            title={t(c.title)}
            subtitle={t(c.subtitle)}
            active={values[c.key]}
            onToggle={() => setters[c.key](!values[c.key])}
          />
        ))}

        {/* Interpretation table */}
        <div className="rounded-2xl border border-line bg-surface p-4 mt-1">
          <p className="text-fg-muted text-xs font-semibold mb-2 text-start">{t('calcQsofaInterpretation')}</p>
          <div className="flex flex-col gap-1.5">
            {[
              { range: '0', label: t('calcQsofaSevLow'), color: 'text-emt-green' },
              { range: '1', label: t('calcQsofaRowModerate'), color: 'text-amber-800 dark:text-emt-yellow' },
              { range: '2–3', label: t('calcQsofaRowHigh'), color: 'text-emt-red' },
            ].map(r => (
              <div key={r.range} className="flex items-center justify-between">
                <span className={`font-bold text-sm ${r.color}`}>{r.label}</span>
                <span dir="ltr" className={`text-xs font-black px-2 py-0.5 rounded-full bg-surface-2 ${r.color}`}>{r.range}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Sticky bottom bar */}
      <div className={[
        'shrink-0 border-t px-4 py-3 flex items-center justify-between transition-all duration-300',
        sev.bar, sev.barBorder,
      ].join(' ')}>

        <div className="flex flex-col gap-0.5 flex-1 min-w-0 pe-3">
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full self-start ${sev.badge}`}>
            {t(sev.label)}
          </span>
          <p className="text-fg-muted text-xs mt-1 leading-snug">
            {t(sev.description)}
          </p>
        </div>

        <div className="flex items-end gap-1 shrink-0">
          <span
            className={`font-black tabular-nums leading-none transition-colors duration-300 ${sev.score}`}
            style={{ fontSize: 'clamp(2.5rem, 12vw, 3.5rem)' }}
          >
            {total}
          </span>
          <span className="text-fg-muted text-sm font-semibold mb-1">/ 3</span>
        </div>
      </div>
    </div>
  );
}
