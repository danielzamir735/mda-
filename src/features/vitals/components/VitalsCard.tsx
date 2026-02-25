import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play } from 'lucide-react';
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
  onResetLastResult: () => void;
}

export default function VitalsCard({
  label, sublabel, duration, multiplier, unit, isHeartRate,
  lastResult, externalReset, onOpenModal,
}: Props) {
  const { state, timeLeft, start, stop, reset } = useVitalsTimer(duration);

  useEffect(() => {
    if (externalReset) reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalReset]);

  useEffect(() => {
    if (state === 'finished') {
      onOpenModal(multiplier, unit, isHeartRate ? 'heart' : 'breath');
    }
  }, [state, multiplier, unit, isHeartRate, onOpenModal]);

  const hasLastResult = lastResult !== null && lastResult !== undefined;
  const isRunning  = state === 'running';
  const isFinished = state === 'finished';

  return (
    <div
      className={[
        'relative flex flex-col items-center justify-center gap-2',
        'rounded-3xl p-3 h-full w-full overflow-hidden',
        'transition-all duration-300',
        state === 'idle' ? 'cursor-pointer select-none' : '',
        isRunning
          ? 'bg-[#180408] border-2 border-emt-red'
          : 'bg-emt-gray border border-emt-border',
      ].join(' ')}
      style={isRunning ? {
        boxShadow: '0 0 32px rgba(239,35,60,0.22), 0 2px 12px rgba(0,0,0,0.6)',
      } : {
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
      }}
      onClick={state === 'idle' ? start : undefined}
    >
      {/* AlertOverlay portalled — heart rate only */}
      {isHeartRate && createPortal(
        <AlertOverlay visible={isRunning} />,
        document.body,
      )}

      {/* ── IDLE ── */}
      {state === 'idle' && (
        <>
          {hasLastResult && (
            <p className="absolute top-3 inset-x-0 text-center text-emt-muted text-xs font-bold tracking-wide">
              מדידה אחרונה: {lastResult}
            </p>
          )}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center
                       border-2 border-emt-red/50 bg-emt-red/10"
          >
            <Play
              size={28}
              className="text-emt-red translate-x-0.5"
              fill="currentColor"
            />
          </div>
          <p className="text-emt-light font-black text-xl">{label}</p>
          <p className="text-emt-light/75 text-xl font-semibold">{sublabel}</p>
        </>
      )}

      {/* ── RUNNING ── */}
      {isRunning && (
        <>
          <p className="text-emt-red/60 text-[0.6rem] tracking-widest font-bold uppercase">
            {label}
          </p>

          <span
            className="font-mono font-black tabular-nums leading-none text-emt-red"
            style={{ fontSize: 'clamp(5rem, 22vw, 8rem)' }}
          >
            {timeLeft}
          </span>

          <p className="text-emt-muted text-sm font-medium -mt-1">שניות</p>

          <button
            onClick={(e) => { e.stopPropagation(); stop(); }}
            className="w-full mt-1 py-4 rounded-2xl
                       bg-emt-red text-white font-black text-xl tracking-wide
                       active:scale-[0.97] transition-transform duration-150"
            style={{ boxShadow: '0 4px 20px rgba(239,35,60,0.45)' }}
          >
            בטל
          </button>
        </>
      )}

      {/* ── FINISHED — brief flash, modal opens immediately ── */}
      {isFinished && null}
    </div>
  );
}
