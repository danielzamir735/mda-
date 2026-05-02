import { useState, useEffect } from 'react';
import { X, Activity, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { trackInteraction, trackEvent } from '../../utils/analytics';

interface Props { isOpen: boolean; onClose: () => void; }

// ─── Rolling Number Counter ───────────────────────────────────────────────────

function RollingNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 110, damping: 22, mass: 0.9 });
  const display = useTransform(spring, (v) => v.toFixed(decimals));

  useEffect(() => {
    mv.set(value);
  }, [value, mv]);

  return <motion.span>{display}</motion.span>;
}

// ─── Neon Glow Animation ──────────────────────────────────────────────────────

const redNeonVariants = {
  idle: { boxShadow: '0 0 0px rgba(239,68,68,0)' },
  pulse: {
    boxShadow: [
      '0 0 0px rgba(239,68,68,0)',
      '0 0 28px rgba(239,68,68,0.65)',
      '0 0 14px rgba(239,68,68,0.4)',
      '0 0 28px rgba(239,68,68,0.65)',
    ],
    transition: { duration: 1.6, repeat: Infinity, repeatType: 'loop' as const },
  },
};

const orangeNeonVariants = {
  idle: { boxShadow: '0 0 0px rgba(249,115,22,0)' },
  pulse: {
    boxShadow: [
      '0 0 0px rgba(249,115,22,0)',
      '0 0 28px rgba(249,115,22,0.65)',
      '0 0 14px rgba(249,115,22,0.4)',
      '0 0 28px rgba(249,115,22,0.65)',
    ],
    transition: { duration: 1.6, repeat: Infinity, repeatType: 'loop' as const },
  },
};

// ─── Number Input Row ─────────────────────────────────────────────────────────

interface InputRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  max?: number;
}

function InputRow({ label, value, onChange, placeholder = '0', max = 300 }: InputRowProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-gray-500 dark:text-emt-muted text-sm font-semibold">{label}</label>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-emt-border
                   bg-gray-50 dark:bg-emt-dark text-gray-900 dark:text-emt-light font-bold text-lg
                   focus:outline-none focus:border-red-400/60 transition-colors text-right"
        placeholder={placeholder}
        min="0"
        max={max}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ShockCalculator({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);

  const [hr,  setHr]  = useState('');
  const [sbp, setSbp] = useState('');
  const [dbp, setDbp] = useState('');

  useEffect(() => {
    if (isOpen) trackInteraction('מחשבון הלם ופרפוזיה', 'calculators');
  }, [isOpen]);

  if (!isOpen) return null;

  const hrNum  = parseFloat(hr)  || 0;
  const sbpNum = parseFloat(sbp) || 0;
  const dbpNum = parseFloat(dbp) || 0;

  const hasInput = sbpNum > 0;
  const si  = hasInput ? hrNum / sbpNum : 0;
  const map = dbpNum + (sbpNum - dbpNum) / 3;

  const siCritical  = hasInput && si > 0.9;
  const mapCritical = hasInput && map < 65;

  const handleReset = () => {
    setHr('');
    setSbp('');
    setDbp('');
    trackEvent('shock_reset');
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark">

      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2 min-w-0">
          <Activity size={20} className="text-red-400 shrink-0" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl truncate">
            מחשבון הלם ופרפוזיה
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30
                       bg-red-500/10 text-red-500 text-sm font-semibold
                       hover:bg-red-500/20 active:scale-95 transition-all"
            aria-label="אפס נתונים"
          >
            <RotateCcw size={14} />
            <span>אפס</span>
          </button>
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
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-8">

        {/* Inputs */}
        <section className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray p-4 flex flex-col gap-4">
          <p className="text-gray-900 dark:text-emt-light font-bold text-base">נתוני מטופל</p>
          <InputRow label="דופק (פעימות/דקה)"          value={hr}  onChange={setHr}  max={300} />
          <InputRow label="לחץ דם סיסטולי (mmHg)"       value={sbp} onChange={setSbp} max={300} />
          <InputRow label="לחץ דם דיאסטולי (mmHg)"      value={dbp} onChange={setDbp} max={200} />
        </section>

        {/* Shock Index card */}
        <motion.section
          variants={redNeonVariants}
          animate={siCritical ? 'pulse' : 'idle'}
          className={[
            'rounded-2xl border p-4 transition-colors duration-300',
            siCritical
              ? 'border-red-500/50 bg-slate-950/50 backdrop-blur-xl'
              : 'border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray',
          ].join(' ')}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <p className={`font-bold text-base transition-colors duration-300 ${siCritical ? 'text-red-400' : 'text-gray-900 dark:text-emt-light'}`}>
                מדד הלם (Shock Index)
              </p>
              <p className="text-gray-400 dark:text-emt-muted text-xs">דופק ÷ לחץ דם סיסטולי</p>
              <AnimatePresence>
                {siCritical && (
                  <motion.div
                    key="si-alert"
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-2 overflow-hidden"
                  >
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1
                                     rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      ⚠ חשד גבוה להלם
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="shrink-0 flex flex-col items-end">
              <span
                className={`font-black tabular-nums leading-none transition-colors duration-300 ${siCritical ? 'text-red-400' : 'text-gray-900 dark:text-emt-light'}`}
                style={{ fontSize: 'clamp(2.2rem, 10vw, 3rem)' }}
              >
                <RollingNumber value={si} decimals={2} />
              </span>
              <span className="text-gray-400 dark:text-emt-muted text-xs font-semibold mt-0.5">
                תקין &lt; 0.9
              </span>
            </div>
          </div>
        </motion.section>

        {/* MAP card */}
        <motion.section
          variants={orangeNeonVariants}
          animate={mapCritical ? 'pulse' : 'idle'}
          className={[
            'rounded-2xl border p-4 transition-colors duration-300',
            mapCritical
              ? 'border-orange-500/50 bg-slate-950/50 backdrop-blur-xl'
              : 'border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray',
          ].join(' ')}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <p className={`font-bold text-base transition-colors duration-300 ${mapCritical ? 'text-orange-400' : 'text-gray-900 dark:text-emt-light'}`}>
                לחץ עורקי ממוצע (MAP)
              </p>
              <p className="text-gray-400 dark:text-emt-muted text-xs">DBP + (SBP − DBP) ÷ 3</p>
              <AnimatePresence>
                {mapCritical && (
                  <motion.div
                    key="map-alert"
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-2 overflow-hidden"
                  >
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1
                                     rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      ⚠ סיכון פרפוזיה
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="shrink-0 flex flex-col items-end">
              <div className="flex items-end gap-1">
                <span
                  className={`font-black tabular-nums leading-none transition-colors duration-300 ${mapCritical ? 'text-orange-400' : 'text-gray-900 dark:text-emt-light'}`}
                  style={{ fontSize: 'clamp(2.2rem, 10vw, 3rem)' }}
                >
                  <RollingNumber value={hasInput ? map : 0} decimals={0} />
                </span>
                <span className="text-gray-400 dark:text-emt-muted text-sm font-semibold mb-1">mmHg</span>
              </div>
              <span className="text-gray-400 dark:text-emt-muted text-xs font-semibold mt-0.5">
                תקין ≥ 65
              </span>
            </div>
          </div>
        </motion.section>

        {/* Clinical reference */}
        <section className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray p-4">
          <p className="text-gray-500 dark:text-emt-muted text-xs font-bold mb-3 uppercase tracking-wide">
            עזר קליני
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 dark:text-emt-muted text-xs">SI נורמלי</span>
              <span className="text-gray-700 dark:text-emt-light text-xs font-bold">0.5 – 0.7</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 dark:text-emt-muted text-xs">SI ≥ 0.9</span>
              <span className="text-red-400 text-xs font-bold">חשד להלם</span>
            </div>
            <div className="w-full h-px bg-gray-100 dark:bg-emt-border" />
            <div className="flex justify-between items-center">
              <span className="text-gray-400 dark:text-emt-muted text-xs">MAP נורמלי</span>
              <span className="text-gray-700 dark:text-emt-light text-xs font-bold">70 – 100 mmHg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 dark:text-emt-muted text-xs">MAP &lt; 65 mmHg</span>
              <span className="text-orange-400 text-xs font-bold">סיכון לאיסכמיה</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
