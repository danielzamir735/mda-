import { useState, useEffect } from 'react';
import { X, Activity } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackInteraction, trackEvent } from '../../../utils/analytics';
import { useTranslation, type TranslationKey } from '../../../i18n';

interface Props { isOpen: boolean; onClose: () => void; }

const CATEGORIES = [
  {
    id: 'appearance',
    label: 'calcApgarAppearance',
    options: ['calcApgarAppearance0', 'calcApgarAppearance1', 'calcApgarAppearance2'],
  },
  {
    id: 'pulse',
    label: 'calcApgarPulse',
    options: ['calcApgarPulse0', 'calcApgarPulse1', 'calcApgarPulse2'],
  },
  {
    id: 'grimace',
    label: 'calcApgarGrimace',
    options: ['calcApgarGrimace0', 'calcApgarGrimace1', 'calcApgarGrimace2'],
  },
  {
    id: 'activity',
    label: 'calcApgarActivity',
    options: ['calcApgarActivity0', 'calcApgarActivity1', 'calcApgarActivity2'],
  },
  {
    id: 'respiration',
    label: 'calcApgarRespiration',
    options: ['calcApgarRespiration0', 'calcApgarRespiration1', 'calcApgarRespiration2'],
  },
] satisfies { id: string; label: TranslationKey; options: TranslationKey[] }[];

type SevKey = 'red' | 'yellow' | 'green';

const SEV_STYLES: Record<SevKey, { badge: string; score: string; card: string; label: TranslationKey }> = {
  red:    { badge: 'bg-emt-red/20 text-emt-red',       score: 'text-emt-red',    card: 'border-emt-red/30 bg-emt-red/5',    label: 'calcApgarSevRed' },
  yellow: { badge: 'bg-emt-yellow/20 text-amber-600 dark:text-emt-yellow', score: 'text-amber-600 dark:text-emt-yellow', card: 'border-emt-yellow/30 bg-emt-yellow/5', label: 'calcApgarSevYellow' },
  green:  { badge: 'bg-emt-green/20 text-emt-green',   score: 'text-emt-green',  card: 'border-emt-green/30 bg-emt-green/5',  label: 'calcApgarSevGreen' },
};

export default function ApgarCalculatorModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const t = useTranslation();
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) trackInteraction('מחשבון APGAR', 'calculators'); // i18n-ok: analytics label, kept stable
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (id: string, val: number) => {
    const next = { ...scores, [id]: val };
    setScores(next);
    if (Object.keys(next).length === 5) {
      const sum = Object.values(next).reduce((a, b) => a + b, 0);
      const sev = sum <= 3 ? 'red' : sum <= 6 ? 'yellow' : 'green';
      trackEvent('calculate_apgar', { score: sum, severity: sev });
    }
  };

  const answered = Object.keys(scores).length;
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  const sevKey: SevKey | null =
    answered < 5 ? null :
    total <= 3 ? 'red' :
    total <= 6 ? 'yellow' : 'green';

  const sev = sevKey ? SEV_STYLES[sevKey] : null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-page">

      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-pink-400" />
          <h2 className="text-fg font-bold text-xl">{t('calcApgarTitle')}</h2>
        </div>
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

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

        {/* Category rows */}
        {CATEGORIES.map(cat => (
          <div
            key={cat.id}
            className="rounded-2xl border border-line bg-surface p-4"
          >
            <p className="text-fg font-bold text-base mb-3">{t(cat.label)}</p>
            <div className="flex gap-2">
              {cat.options.map((opt, i) => {
                const active = scores[cat.id] === i;
                return (
                  <button
                    key={i}
                    onClick={() => set(cat.id, i)}
                    className={[
                      'flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs',
                      'font-bold transition-all active:scale-95',
                      active
                        ? 'border-pink-400/50 bg-pink-400/10 text-pink-600 dark:text-pink-400'
                        : 'border-line bg-surface-2 text-fg-muted',
                    ].join(' ')}
                  >
                    <span className="text-base font-black">{i}</span>
                    <span className="leading-tight text-center">{t(opt)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Score display */}
        <div className={[
          'w-full rounded-2xl border p-4 flex flex-col items-center gap-1 transition-all duration-300',
          sev ? sev.card : 'border-line bg-surface-2',
        ].join(' ')}>
          <p className="text-fg-muted text-sm font-semibold uppercase tracking-wide">
            {t('calcApgarScore')}
          </p>
          <span
            className={[
              'font-black tabular-nums transition-colors duration-300',
              sev ? sev.score : 'text-fg/20',
            ].join(' ')}
            style={{ fontSize: 'clamp(2.5rem, 14vw, 4rem)' }}
          >
            {answered > 0 ? total : '—'}
          </span>
          {sev && (
            <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${sev.badge}`}>
              {t(sev.label)}
            </span>
          )}
          {answered < 5 && (
            <p className="text-fg-muted text-base">
              {answered === 0 ? t('calcApgarPickAll') : t('calcApgarRemaining', { n: 5 - answered })}
            </p>
          )}
        </div>

        {/* Reset */}
        <button
          onClick={() => { setScores({}); trackEvent('apgar_reset'); }}
          className="w-full py-3 rounded-2xl border border-line
                     bg-surface-2 text-fg-muted
                     font-bold text-sm active:scale-95 transition-transform"
        >
          {t('reset')}
        </button>
      </div>
    </div>
  );
}
