import { useState } from 'react';
import { X, Flame } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

interface Props { isOpen: boolean; onClose: () => void; }
type AgeGroup = 'adult' | 'child';
interface Part { id: string; label: string; adult: number; child: number; }

const PARTS: Part[] = [
  { id: 'head',       label: 'ראש',       adult: 9,  child: 18 },
  { id: 'chest',      label: 'חזה',       adult: 9,  child: 9  },
  { id: 'abdomen',    label: 'בטן',       adult: 9,  child: 9  },
  { id: 'upper_back', label: 'גב עליון',  adult: 9,  child: 9  },
  { id: 'lower_back', label: 'גב תחתון',  adult: 9,  child: 9  },
  { id: 'right_arm',  label: "יד י'",     adult: 9,  child: 9  },
  { id: 'left_arm',   label: "יד ש'",     adult: 9,  child: 9  },
  { id: 'right_leg',  label: "רגל י'",    adult: 18, child: 14 },
  { id: 'left_leg',   label: "רגל ש'",    adult: 18, child: 14 },
  { id: 'genitals',   label: 'איברי מין', adult: 1,  child: 1  },
];

const EXTRAS = ['upper_back', 'lower_back', 'genitals'];
const byId = (id: string) => PARTS.find(p => p.id === id)!;

export default function BurnsCalculatorModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const toggle = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleAge = (ag: AgeGroup) => { setAgeGroup(ag); setSelected(new Set()); };

  const total = PARTS.reduce((sum, p) => selected.has(p.id) ? sum + p[ageGroup] : sum, 0);
  const severity = total === 0 ? null : total < 10 ? 'קל' : total < 25 ? 'בינוני' : 'חמור';
  const sevColor  = total < 10 ? 'text-emt-yellow' : total < 25 ? 'text-orange-400' : 'text-emt-red';
  const sevBadge  = total < 10 ? 'bg-emt-yellow/20 text-emt-yellow' : total < 25 ? 'bg-orange-400/20 text-orange-400' : 'bg-emt-red/20 text-emt-red';

  // Part cell class builder
  const cell = (id: string, extra = '') => [
    'flex flex-col items-center justify-center cursor-pointer select-none',
    'transition-all duration-150 active:scale-95 border-2 rounded-xl',
    selected.has(id)
      ? 'border-emt-red bg-emt-red/20 text-emt-red'
      : 'border-gray-200 dark:border-emt-border bg-gray-100 dark:bg-emt-gray text-gray-500 dark:text-emt-muted',
    extra,
  ].join(' ');

  // Label content for a body part
  const lbl = (id: string) => {
    const p = byId(id);
    return (
      <>
        <span className="text-[9px] font-bold leading-tight">{p.label}</span>
        <span className="text-[8px] opacity-60">{p[ageGroup]}%</span>
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark">

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <Flame size={20} className="text-emt-red" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מחשבון כוויות</h2>
        </div>
        <button onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border flex items-center justify-center active:scale-90 transition-transform text-gray-500 dark:text-emt-muted"
          aria-label="סגור">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 items-center">

        {/* Age toggle */}
        <div className="flex gap-2 w-full">
          {(['adult', 'child'] as AgeGroup[]).map(ag => (
            <button key={ag} onClick={() => handleAge(ag)}
              className={['flex-1 py-2.5 rounded-xl border font-bold text-sm transition-all active:scale-95',
                ageGroup === ag
                  ? 'border-emt-red/50 bg-emt-red/10 text-emt-red'
                  : 'border-gray-200 dark:border-emt-border bg-gray-100 dark:bg-emt-gray text-gray-500 dark:text-emt-muted',
              ].join(' ')}>
              {ag === 'adult' ? 'מבוגר' : 'ילד'}
            </button>
          ))}
        </div>

        {/* ── Schematic Body Diagram (LTR so layout is anatomically consistent) ── */}
        <div className="flex flex-col items-center gap-1 py-2" dir="ltr">

          {/* Head */}
          <div onClick={() => toggle('head')} className={cell('head', 'w-16 h-16 rounded-full mb-0.5')}>
            {lbl('head')}
          </div>

          {/* Arms + Torso */}
          <div className="flex items-start gap-1">
            {/* Right arm (patient's right = left side of diagram) */}
            <div onClick={() => toggle('right_arm')} className={cell('right_arm', 'w-10 h-24 mt-1')}>
              {lbl('right_arm')}
            </div>

            {/* Torso: chest + abdomen stacked */}
            <div className="flex flex-col gap-1">
              <div onClick={() => toggle('chest')} className={cell('chest', 'w-24 h-14')}>
                {lbl('chest')}
              </div>
              <div onClick={() => toggle('abdomen')} className={cell('abdomen', 'w-24 h-10')}>
                {lbl('abdomen')}
              </div>
            </div>

            {/* Left arm */}
            <div onClick={() => toggle('left_arm')} className={cell('left_arm', 'w-10 h-24 mt-1')}>
              {lbl('left_arm')}
            </div>
          </div>

          {/* Legs */}
          <div className="flex gap-2 mt-0.5">
            <div onClick={() => toggle('right_leg')} className={cell('right_leg', 'w-16 h-28')}>
              {lbl('right_leg')}
            </div>
            <div onClick={() => toggle('left_leg')} className={cell('left_leg', 'w-16 h-28')}>
              {lbl('left_leg')}
            </div>
          </div>
        </div>

        {/* Back + Genitals chips */}
        <div className="flex gap-2 flex-wrap justify-center" dir="rtl">
          {EXTRAS.map(id => {
            const p = byId(id);
            return (
              <button key={id} onClick={() => toggle(id)}
                className={['px-3 py-2 rounded-xl border font-bold text-sm transition-all active:scale-95',
                  selected.has(id)
                    ? 'border-emt-red/50 bg-emt-red/10 text-emt-red'
                    : 'border-gray-200 dark:border-emt-border bg-gray-100 dark:bg-emt-gray text-gray-500 dark:text-emt-muted',
                ].join(' ')}>
                {p.label} <span className="text-xs opacity-60">({p[ageGroup]}%)</span>
              </button>
            );
          })}
        </div>

        {/* Total */}
        <div className={['w-full rounded-2xl border p-4 flex flex-col items-center gap-1 transition-all duration-300',
          total > 0 ? 'border-emt-red/30 bg-emt-red/5' : 'border-gray-200 dark:border-emt-border bg-gray-100 dark:bg-emt-gray',
        ].join(' ')}>
          <p className="text-gray-500 dark:text-emt-muted text-xs font-semibold uppercase tracking-wide">סה"כ כוויות</p>
          <div className="flex items-baseline gap-1">
            <span
              className={`font-black tabular-nums transition-colors duration-300 ${total > 0 ? sevColor : 'text-gray-300 dark:text-emt-border'}`}
              style={{ fontSize: 'clamp(2.5rem, 14vw, 4rem)' }}>
              {total}
            </span>
            <span className={`text-xl font-bold ${total > 0 ? sevColor : 'text-gray-300 dark:text-emt-border'}`}>%</span>
          </div>
          {severity && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sevBadge}`}>{severity}</span>}
          {total === 0 && <p className="text-gray-400 dark:text-emt-border text-sm">גע באזורי הגוף הפגועים</p>}
        </div>

      </div>
    </div>
  );
}
