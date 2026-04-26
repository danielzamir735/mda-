import { useState, useEffect } from 'react';
import { X, Activity } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackInteraction, trackEvent } from '../../../utils/analytics';

interface Props { isOpen: boolean; onClose: () => void; }

const CATEGORIES = [
  {
    id: 'appearance',
    label: 'צבע עור',
    options: ['כחלחל / חיוור', 'כחלחל בגפיים', 'ורדרד בכל הגוף'],
  },
  {
    id: 'pulse',
    label: 'דופק',
    options: ['אין', 'מתחת ל-100', 'מעל 100'],
  },
  {
    id: 'grimace',
    label: 'תגובה לגירוי',
    options: ['אין תגובה', 'עיוות פנים', 'בכי / עיטוש'],
  },
  {
    id: 'activity',
    label: 'טונוס שרירים',
    options: ['רפוי לחלוטין', 'כיפוף מסוים', 'פעיל'],
  },
  {
    id: 'respiration',
    label: 'נשימה',
    options: ['אין', 'חלשה / לא סדירה', 'טובה / בכי'],
  },
];

type SevKey = 'red' | 'yellow' | 'green';

const SEV_STYLES: Record<SevKey, { badge: string; score: string; card: string; label: string }> = {
  red:    { badge: 'bg-emt-red/20 text-emt-red',       score: 'text-emt-red',    card: 'border-emt-red/30 bg-emt-red/5',    label: 'סכנת חיים' },
  yellow: { badge: 'bg-emt-yellow/20 text-emt-yellow', score: 'text-emt-yellow', card: 'border-emt-yellow/30 bg-emt-yellow/5', label: 'מצוקה בינונית' },
  green:  { badge: 'bg-emt-green/20 text-emt-green',   score: 'text-emt-green',  card: 'border-emt-green/30 bg-emt-green/5',  label: 'תקין' },
};

export default function ApgarCalculatorModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) trackInteraction('מחשבון APGAR', 'calculators');
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (id: string, val: number) => {
    const next = { ...scores, [id]: val };
    setScores(next);
    if (Object.keys(next).length === 5) {
      const t = Object.values(next).reduce((a, b) => a + b, 0);
      const sev = t <= 3 ? 'red' : t <= 6 ? 'yellow' : 'green';
      trackEvent('calculate_apgar', { score: t, severity: sev });
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
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark">

      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-pink-400" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מחשבון APGAR</h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-gray-500 dark:text-emt-muted"
          aria-label="סגור"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

        {/* Category rows */}
        {CATEGORIES.map(cat => (
          <div
            key={cat.id}
            className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray p-4"
          >
            <p className="text-gray-900 dark:text-emt-light font-bold text-base mb-3">{cat.label}</p>
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
                        ? 'border-pink-400/50 bg-pink-400/10 text-pink-400'
                        : 'border-gray-200 dark:border-emt-border bg-gray-100 dark:bg-emt-dark text-gray-500 dark:text-emt-muted',
                    ].join(' ')}
                  >
                    <span className="text-base font-black">{i}</span>
                    <span className="leading-tight text-center">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Score display */}
        <div className={[
          'w-full rounded-2xl border p-4 flex flex-col items-center gap-1 transition-all duration-300',
          sev ? sev.card : 'border-gray-200 dark:border-emt-border bg-gray-100 dark:bg-emt-gray',
        ].join(' ')}>
          <p className="text-gray-500 dark:text-emt-muted text-sm font-semibold uppercase tracking-wide">
            ציון APGAR
          </p>
          <span
            className={[
              'font-black tabular-nums transition-colors duration-300',
              sev ? sev.score : 'text-gray-300 dark:text-emt-border',
            ].join(' ')}
            style={{ fontSize: 'clamp(2.5rem, 14vw, 4rem)' }}
          >
            {answered > 0 ? total : '—'}
          </span>
          {sev && (
            <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${sev.badge}`}>
              {sev.label}
            </span>
          )}
          {answered < 5 && (
            <p className="text-gray-600 dark:text-gray-300 text-base">
              {answered === 0 ? 'בחר ציון לכל 5 הקטגוריות' : `נותרו ${5 - answered} קטגוריות`}
            </p>
          )}
        </div>

        {/* Reset */}
        <button
          onClick={() => { setScores({}); trackEvent('apgar_reset'); }}
          className="w-full py-3 rounded-2xl border border-gray-200 dark:border-emt-border
                     bg-gray-100 dark:bg-emt-gray text-gray-500 dark:text-emt-muted
                     font-bold text-sm active:scale-95 transition-transform"
        >
          אפס
        </button>
      </div>
    </div>
  );
}
