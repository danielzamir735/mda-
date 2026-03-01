import { useState } from 'react';
import { X, Flame } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type AgeGroup = 'adult' | 'child';

interface BodyPart {
  id: string;
  label: string;
  adult: number;
  child: number;
}

const BODY_PARTS: BodyPart[] = [
  { id: 'head',       label: 'ראש וצוואר',  adult: 9,  child: 18 },
  { id: 'chest',      label: 'חזה',          adult: 9,  child: 9  },
  { id: 'abdomen',    label: 'בטן',          adult: 9,  child: 9  },
  { id: 'upper_back', label: 'גב עליון',     adult: 9,  child: 9  },
  { id: 'lower_back', label: 'גב תחתון',     adult: 9,  child: 9  },
  { id: 'right_arm',  label: 'יד ימין',      adult: 9,  child: 9  },
  { id: 'left_arm',   label: 'יד שמאל',      adult: 9,  child: 9  },
  { id: 'right_leg',  label: 'רגל ימין',     adult: 18, child: 14 },
  { id: 'left_leg',   label: 'רגל שמאל',     adult: 18, child: 14 },
  { id: 'genitals',   label: 'איברי מין',    adult: 1,  child: 1  },
];

export default function BurnsCalculatorModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const togglePart = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAgeChange = (ag: AgeGroup) => {
    setAgeGroup(ag);
    setSelected(new Set());
  };

  const total = BODY_PARTS.reduce(
    (sum, part) => (selected.has(part.id) ? sum + part[ageGroup] : sum),
    0,
  );

  const severity = total === 0 ? null : total < 10 ? 'minor' : total < 25 ? 'moderate' : 'severe';
  const severityLabel = severity === 'minor' ? 'קל' : severity === 'moderate' ? 'בינוני' : 'חמור';
  const severityColor =
    severity === 'minor'
      ? 'text-emt-yellow'
      : severity === 'moderate'
      ? 'text-orange-400'
      : 'text-emt-red';
  const severityBadge =
    severity === 'minor'
      ? 'bg-emt-yellow/20 text-emt-yellow'
      : severity === 'moderate'
      ? 'bg-orange-400/20 text-orange-400'
      : 'bg-emt-red/20 text-emt-red';

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <Flame size={20} className="text-emt-red" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מחשבון כוויות</h2>
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

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Age group toggle */}
        <div className="flex gap-2">
          {(['adult', 'child'] as AgeGroup[]).map((ag) => (
            <button
              key={ag}
              onClick={() => handleAgeChange(ag)}
              className={[
                'flex-1 py-2.5 rounded-xl border font-bold text-sm transition-all duration-200 active:scale-95',
                ageGroup === ag
                  ? 'border-emt-red/50 bg-emt-red/10 text-emt-red'
                  : 'border-gray-200 dark:border-emt-border bg-gray-100 dark:bg-emt-gray text-gray-500 dark:text-emt-muted',
              ].join(' ')}
            >
              {ag === 'adult' ? 'מבוגר' : 'ילד'}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 dark:text-emt-muted text-center">
          {ageGroup === 'adult'
            ? 'כלל תשעיות — מבוגר'
            : 'כלל תשעיות — ילד (ראש גדול יותר, רגליים קטנות יותר)'}
        </p>

        {/* Body parts grid */}
        <div className="grid grid-cols-2 gap-2">
          {BODY_PARTS.map((part) => {
            const isSelected = selected.has(part.id);
            const pct = part[ageGroup];
            return (
              <button
                key={part.id}
                onClick={() => togglePart(part.id)}
                className={[
                  'flex flex-col items-center justify-center gap-0.5 py-3 rounded-2xl border',
                  'font-semibold text-sm transition-all duration-200 active:scale-95',
                  isSelected
                    ? 'border-emt-red/50 bg-emt-red/15 text-emt-red'
                    : 'border-gray-200 dark:border-emt-border bg-gray-100 dark:bg-emt-gray text-gray-700 dark:text-emt-muted',
                ].join(' ')}
              >
                <span>{part.label}</span>
                <span
                  className={`text-xs font-bold ${
                    isSelected ? 'text-emt-red/80' : 'text-gray-400 dark:text-emt-border'
                  }`}
                >
                  {pct}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Total display */}
        <div
          className={[
            'rounded-2xl border p-4 flex flex-col items-center gap-1 transition-all duration-300',
            total > 0
              ? 'border-emt-red/30 bg-emt-red/5'
              : 'border-gray-200 dark:border-emt-border bg-gray-100 dark:bg-emt-gray',
          ].join(' ')}
        >
          <p className="text-gray-500 dark:text-emt-muted text-xs font-semibold uppercase tracking-wide">
            סה"כ כוויות
          </p>
          <div className="flex items-baseline gap-1">
            <span
              className={`font-black tabular-nums transition-colors duration-300 ${
                total > 0 ? severityColor : 'text-gray-300 dark:text-emt-border'
              }`}
              style={{ fontSize: 'clamp(2.5rem, 14vw, 4rem)' }}
            >
              {total}
            </span>
            <span
              className={`text-xl font-bold ${
                total > 0 ? severityColor : 'text-gray-300 dark:text-emt-border'
              }`}
            >
              %
            </span>
          </div>
          {severity && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${severityBadge}`}>
              {severityLabel}
            </span>
          )}
          {total === 0 && (
            <p className="text-gray-400 dark:text-emt-border text-sm">בחר אזורי גוף</p>
          )}
        </div>
      </div>
    </div>
  );
}
