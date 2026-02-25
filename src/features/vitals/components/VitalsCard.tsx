import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, Plus, Minus } from 'lucide-react';
import { useVitalsTimer } from '../hooks/useVitalsTimer';
import AlertOverlay from './AlertOverlay';
import { VALID_DURATIONS } from '../../../store/settingsStore';

interface Props {
  label: string;
  duration: number;
  unit: string;
  isHeartRate?: boolean;
  lastResult?: number | null;
  externalReset?: number;
  onOpenModal: (multiplier: number, unit: string, cardType: 'heart' | 'breath') => void;
  onResetLastResult: () => void;
  onDurationChange: (d: number) => void;
}

export default function VitalsCard({
  label, duration, unit, isHeartRate,
  lastResult, externalReset, onOpenModal, onDurationChange,
}: Props) {
  const { state, timeLeft, start, stop, reset } = useVitalsTimer(duration);
  const multiplier = Math.round(60 / duration);

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
  const isRunning = state === 'running';

  const idx = VALID_DURATIONS.indexOf(duration as typeof VALID_DURATIONS[number]);
  const canDecrease = idx > 0;
  const canIncrease = idx < VALID_DURATIONS.length - 1;

  return (
    <div
      className={[
        'relative flex flex-col items-center justify-center gap-2',
        'rounded-3xl p-3 h-full w-full overflow-hidden',
        'transition-all duration-300',
        !isRunning ? 'cursor-pointer select-none' : '',
        isRunning
          ? 'bg-[#180408] border-2 border-emt-red'
          : 'bg-emt-gray border border-emt-border',
      ].join(' ')}
      style={isRunning ? {
        boxShadow: '0 0 32px rgba(239,35,60,0.22), 0 2px 12px rgba(0,0,0,0.6)',
      } : {
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
      }}
      onClick={!isRunning ? start : undefined}
    >
      {/* AlertOverlay portalled — heart rate only */}
      {isHeartRate && createPortal(
        <AlertOverlay visible={isRunning} />,
        document.body,
      )}

      {/* ── IDLE / FINISHED — always show the play UI ── */}
      {!isRunning && (
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

          {/* Duration row with +/- buttons */}
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => canDecrease && onDurationChange(VALID_DURATIONS[idx - 1])}
              disabled={!canDecrease}
              className="w-7 h-7 rounded-full flex items-center justify-center
                         bg-emt-border/40 text-emt-muted active:scale-90
                         disabled:opacity-30 transition-all duration-150"
            >
              <Minus size={14} />
            </button>
            <p className="text-emt-light/75 text-lg font-semibold min-w-[5ch] text-center">
              {duration} שניות
            </p>
            <button
              onClick={() => canIncrease && onDurationChange(VALID_DURATIONS[idx + 1])}
              disabled={!canIncrease}
              className="w-7 h-7 rounded-full flex items-center justify-center
                         bg-emt-border/40 text-emt-muted active:scale-90
                         disabled:opacity-30 transition-all duration-150"
            >
              <Plus size={14} />
            </button>
          </div>
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
    </div>
  );
}
