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
  onOpenModal: (multiplier: number, unit: string) => void;
}

export default function VitalsCard({
  label, sublabel, duration, multiplier, unit, isHeartRate, onOpenModal,
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
      onOpenModal(multiplier, unit);
    }
  }, [state, multiplier, unit, onOpenModal]);

  const handleStart = () => {
    start();
    if (isHeartRate) setAlertVisible(true);
  };

  return (
    <>
      {isHeartRate && <AlertOverlay visible={alertVisible} />}

      <div
        className="relative flex flex-col items-center justify-center gap-3
                   rounded-3xl border p-4 h-full w-full overflow-hidden
                   transition-all duration-300"
        style={{
          background:
            state === 'running'
              ? 'linear-gradient(135deg, #1a0a0a 0%, #1E1E1E 100%)'
              : state === 'finished'
              ? 'linear-gradient(135deg, #0a1a0a 0%, #1E1E1E 100%)'
              : 'linear-gradient(135deg, #141414 0%, #1E1E1E 100%)',
          borderColor:
            state === 'running'
              ? 'rgba(229,57,53,0.6)'
              : state === 'finished'
              ? 'rgba(67,160,71,0.5)'
              : '#2C2C2C',
        }}
      >
        {/* Subtle glow ring */}
        {state === 'running' && (
          <div className="absolute inset-0 rounded-3xl ring-1 ring-emt-red/20 pointer-events-none" />
        )}

        {state === 'idle' && (
          <>
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
              <p className="text-emt-light/40 text-xs mt-0.5">{sublabel}</p>
            </div>
          </>
        )}

        {state === 'running' && (
          <>
            <p className="text-emt-light/50 text-xs tracking-wide">{label}</p>
            <span
              className="text-emt-red font-mono font-black tabular-nums leading-none"
              style={{ fontSize: 'clamp(3.5rem, 14vw, 6rem)' }}
            >
              {timeLeft}
            </span>
            <p className="text-emt-light/30 text-xs">שניות</p>
            <button
              onClick={stop}
              className="mt-1 flex items-center gap-1.5 px-4 py-1.5 rounded-full
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
