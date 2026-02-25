import { useEffect, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { useVitalsTimer } from '../hooks/useVitalsTimer';
import AlertOverlay from './AlertOverlay';

interface Props {
  label: string;
  sublabel: string;
  duration: number;
  multiplier: number;
  unit: string;
  isHeartRate?: boolean;
  lastResult?: number | null;
  onOpenModal: (multiplier: number, unit: string, cardType: 'heart' | 'breath') => void;
}

export default function VitalsCard({
  label, sublabel, duration, multiplier, unit, isHeartRate, lastResult, onOpenModal,
}: Props) {
  const { state, timeLeft, start, stop } = useVitalsTimer(duration);
  const [alertVisible, setAlertVisible] = useState(false);

  // Auto-dismiss alert after 7 seconds
  useEffect(() => {
    if (!alertVisible) return;
    const t = setTimeout(() => setAlertVisible(false), 7000);
    return () => clearTimeout(t);
  }, [alertVisible]);

  // Open modal when timer finishes
  useEffect(() => {
    if (state === 'finished') {
      onOpenModal(multiplier, unit, isHeartRate ? 'heart' : 'breath');
    }
  }, [state, multiplier, unit, isHeartRate, onOpenModal]);

  const handleStart = () => {
    start();
    if (isHeartRate) setAlertVisible(true);
  };

  const hasLastResult = lastResult !== null && lastResult !== undefined;

  return (
    <>
      {isHeartRate && <AlertOverlay visible={alertVisible} />}

      <div
        className={[
          'relative flex flex-col items-center justify-center gap-2',
          'rounded-3xl border p-3 h-full w-full overflow-hidden',
          'backdrop-blur-lg transition-all duration-300',
          'shadow-[0_8px_32px_rgba(0,0,0,0.45)]',
          state === 'running'  ? 'bg-emt-red/10'
          : state === 'finished' ? 'bg-emt-green/10'
          : 'bg-white/[0.06]',
        ].join(' ')}
        style={{
          borderColor:
            state === 'running'
              ? 'rgba(229,57,53,0.55)'
              : state === 'finished'
              ? 'rgba(67,160,71,0.45)'
              : 'rgba(255,255,255,0.10)',
        }}
      >
        {/* Subtle glow ring */}
        {state === 'running' && (
          <div className="absolute inset-0 rounded-3xl ring-1 ring-emt-red/20 pointer-events-none" />
        )}

        {state === 'idle' && (
          <>
            {hasLastResult && (
              <p className="text-[11px] text-emt-light/40 leading-none">
                תוצאה אחרונה:{' '}
                <span className="text-emt-green font-bold">{lastResult}</span>
              </p>
            )}
            <button
              onClick={handleStart}
              className="w-16 h-16 rounded-full bg-emt-red flex items-center justify-center
                         shadow-lg shadow-emt-red/40 active:scale-90 transition-transform duration-150"
              aria-label={`התחל ${label}`}
            >
              <Play size={30} className="text-white" fill="white" />
            </button>
            <div className="text-center">
              <p className="text-emt-light font-bold text-base leading-snug">{label}</p>
              <p className="text-emt-light/40 text-xs mt-0.5">
                {hasLastResult ? 'הפעל שוב' : sublabel}
              </p>
            </div>
          </>
        )}

        {state === 'running' && (
          <>
            <p className="text-emt-light/50 text-xs tracking-wide">{label}</p>
            <span
              className="text-emt-red font-mono font-black tabular-nums leading-none"
              style={{ fontSize: 'clamp(5rem, 20vw, 7.5rem)' }}
            >
              {timeLeft}
            </span>
            <p className="text-emt-light/30 text-xs">שניות</p>
            <button
              onClick={stop}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full
                         border border-emt-border text-emt-light/50 text-xs
                         hover:text-emt-light/80 hover:border-emt-light/30
                         active:scale-95 transition-all duration-150"
            >
              <Square size={10} fill="currentColor" />
              בטל
            </button>
          </>
        )}

        {state === 'finished' && (
          <>
            <div className="w-12 h-12 rounded-full bg-emt-green/20 border border-emt-green/50
                            flex items-center justify-center">
              <Play size={20} className="text-emt-green" fill="currentColor" />
            </div>
            <p className="text-emt-light/60 text-xs text-center">{label}</p>
            <p className="text-emt-green text-xs">מוכן לספירה</p>
          </>
        )}
      </div>
    </>
  );
}
