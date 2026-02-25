import { useEffect } from 'react';
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
  externalReset?: number;
  onOpenModal: (multiplier: number, unit: string, cardType: 'heart' | 'breath') => void;
}

export default function VitalsCard({
  label, sublabel, duration, multiplier, unit, isHeartRate,
  lastResult, externalReset, onOpenModal,
}: Props) {
  const { state, timeLeft, start, stop, reset } = useVitalsTimer(duration);

  // External reset signal from parent (after result is dismissed)
  useEffect(() => {
    if (externalReset) reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalReset]);

  // Open modal when timer finishes
  useEffect(() => {
    if (state === 'finished') {
      onOpenModal(multiplier, unit, isHeartRate ? 'heart' : 'breath');
    }
  }, [state, multiplier, unit, isHeartRate, onOpenModal]);

  const handleStart = () => {
    start();
  };

  const hasLastResult = lastResult !== null && lastResult !== undefined;

  return (
    <>
      {isHeartRate && <AlertOverlay visible={state === 'running'} />}

      <div
        className={[
          'relative flex flex-col items-center justify-center gap-2',
          'rounded-3xl border p-3 h-full w-full overflow-hidden',
          'transition-all duration-300',
          state === 'running'  ? 'bg-emt-red/15'
          : state === 'finished' ? 'bg-emt-green/10'
          : 'bg-emt-gray',
        ].join(' ')}
        style={{
          borderColor:
            state === 'running'
              ? 'rgba(229,57,53,0.7)'
              : state === 'finished'
              ? 'rgba(67,160,71,0.55)'
              : 'rgba(255,255,255,0.12)',
          borderWidth: state === 'running' ? '2px' : '1px',
        }}
      >
        {/* ── IDLE ── */}
        {state === 'idle' && (
          <>
            {hasLastResult && (
              <p className="text-[11px] text-emt-light/40 leading-none">
                אחרון:{' '}
                <span className="text-emt-green font-bold">{lastResult}</span>
              </p>
            )}

            {/* Play button */}
            <button
              onClick={handleStart}
              className="w-16 h-16 rounded-full bg-emt-red flex items-center justify-center
                         active:scale-90 transition-transform duration-150"
              style={{ boxShadow: '0 4px 16px rgba(229,57,53,0.5)' }}
              aria-label={`התחל ${label}`}
            >
              <Play size={30} className="text-white" fill="white" />
            </button>

            <div className="text-center leading-snug">
              <p className="text-emt-light font-black text-2xl">{label}</p>
              <p className="text-emt-light/55 text-base mt-0.5">
                {hasLastResult ? 'הפעל שוב' : sublabel}
              </p>
            </div>
          </>
        )}

        {/* ── RUNNING ── */}
        {state === 'running' && (
          <>
            <p className="text-emt-light/40 text-xs tracking-wide">{label}</p>

            {/* Dominant countdown */}
            <span
              className="text-emt-red font-mono font-black tabular-nums leading-none"
              style={{ fontSize: 'clamp(6rem, 26vw, 9.5rem)' }}
            >
              {timeLeft}
            </span>

            <p className="text-emt-light/30 text-sm">שניות</p>

            <button
              onClick={stop}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full
                         border border-white/20 text-emt-light/50 text-xs
                         hover:text-emt-light/80 active:scale-95 transition-all"
            >
              <Square size={10} fill="currentColor" />
              בטל
            </button>
          </>
        )}

        {/* ── FINISHED (modal is opening) ── */}
        {state === 'finished' && (
          <p className="text-emt-green text-sm font-semibold">מוכן לספירה…</p>
        )}
      </div>
    </>
  );
}
