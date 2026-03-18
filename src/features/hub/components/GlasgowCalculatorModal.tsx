import { useState } from 'react';
import { X, Brain } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

interface Props { isOpen: boolean; onClose: () => void; }

// ─── Data ───────────────────────────────────────────────────────────────────

const EYES_OPTIONS = [
  { score: 4, label: 'פוקח ספונטנית' },
  { score: 3, label: 'פוקח לקול' },
  { score: 2, label: 'פוקח לכאב' },
  { score: 1, label: 'אין תגובה' },
];

const VERBAL_OPTIONS = [
  { score: 5, label: 'מתמצא ומשוחח' },
  { score: 4, label: 'מבלבל — מילים' },
  { score: 3, label: 'מילים בודדות' },
  { score: 2, label: 'קולות לא מובנים' },
  { score: 1, label: 'אין תגובה' },
];

const MOTOR_OPTIONS = [
  { score: 6, label: 'מבצע פקודות' },
  { score: 5, label: 'ממקם כאב' },
  { score: 4, label: 'נרתע מכאב' },
  { score: 3, label: 'כפיפה אבנורמלית' },
  { score: 2, label: 'פשיטה אבנורמלית' },
  { score: 1, label: 'אין תגובה' },
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

const SEV: Record<SevKey, { label: string; badge: string; score: string; card: string }> = {
  mild:     { label: 'פגיעה קלה',    badge: 'bg-emt-green/20 text-emt-green',   score: 'text-emt-green',   card: 'border-emt-green/30 bg-emt-green/5' },
  moderate: { label: 'פגיעה בינונית', badge: 'bg-emt-yellow/20 text-emt-yellow', score: 'text-emt-yellow', card: 'border-emt-yellow/30 bg-emt-yellow/5' },
  severe:   { label: 'פגיעה קשה',    badge: 'bg-emt-red/20 text-emt-red',       score: 'text-emt-red',     card: 'border-emt-red/30 bg-emt-red/5' },
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
        'flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-right',
        'font-semibold text-sm transition-all active:scale-95',
        active
          ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-300'
          : 'border-gray-200 dark:border-emt-border bg-gray-100 dark:bg-emt-dark text-gray-500 dark:text-emt-muted',
      ].join(' ')}
    >
      <span className={[
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
        'text-sm font-black border',
        active
          ? 'bg-cyan-400/20 border-cyan-400/50 text-cyan-300'
          : 'bg-gray-200 dark:bg-emt-gray border-gray-300 dark:border-emt-border text-gray-400 dark:text-emt-muted',
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

  const [eyes,   setEyes]   = useState<number>(() => readLS('lastGcsEyes',   4));
  const [verbal, setVerbal] = useState<number>(() => readLS('lastGcsVerbal', 5));
  const [motor,  setMotor]  = useState<number>(() => readLS('lastGcsMotor',  6));

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
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark">

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-cyan-400" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מדד גלזגו (GCS)</h2>
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-36">

        {/* Eyes */}
        <section className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-gray-900 dark:text-emt-light font-bold text-base">עיניים (E)</p>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 rounded-full">
              E = {eyes}
            </span>
          </div>
          {EYES_OPTIONS.map(opt => (
            <OptionBtn
              key={opt.score}
              score={opt.score}
              label={opt.label}
              active={eyes === opt.score}
              onClick={() => handleEyes(opt.score)}
            />
          ))}
        </section>

        {/* Verbal */}
        <section className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-gray-900 dark:text-emt-light font-bold text-base">דיבור (V)</p>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 rounded-full">
              V = {verbal}
            </span>
          </div>
          {VERBAL_OPTIONS.map(opt => (
            <OptionBtn
              key={opt.score}
              score={opt.score}
              label={opt.label}
              active={verbal === opt.score}
              onClick={() => handleVerbal(opt.score)}
            />
          ))}
        </section>

        {/* Motor */}
        <section className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-gray-900 dark:text-emt-light font-bold text-base">תנועה (M)</p>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 rounded-full">
              M = {motor}
            </span>
          </div>
          {MOTOR_OPTIONS.map(opt => (
            <OptionBtn
              key={opt.score}
              score={opt.score}
              label={opt.label}
              active={motor === opt.score}
              onClick={() => handleMotor(opt.score)}
            />
          ))}
        </section>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="w-full py-3 rounded-2xl border border-gray-200 dark:border-emt-border
                     bg-gray-100 dark:bg-emt-gray text-gray-500 dark:text-emt-muted
                     font-bold text-sm active:scale-95 transition-transform"
        >
          אפס לברירת מחדל (15)
        </button>
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
          <p className="text-gray-500 dark:text-emt-muted text-xs">
            E{eyes} + V{verbal} + M{motor}
          </p>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${sev.badge}`}>
            {sev.label}
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
          <span className="text-gray-400 dark:text-emt-muted text-sm font-semibold mb-1">/ 15</span>
        </div>
      </div>
    </div>
  );
}
