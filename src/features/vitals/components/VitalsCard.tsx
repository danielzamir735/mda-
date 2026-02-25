import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, RotateCcw } from 'lucide-react';
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
  lastResult, externalReset, onOpenModal, onResetLastResult,
}: Props) {
  const { state, timeLeft, start, stop, reset } = useVitalsTimer(duration);

  // External reset signal from parent (after result popup closes)
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

  const hasLastResult = lastResult !== null && lastResult !== undefined;

  return (
    <div
      className={[
        'relative flex flex-col items-center justify-center gap-2',
        'rounded-3xl border p-3 h-full w-full overflow-hidden',
        'transition-all duration-300',
        state === 'running'  ? 'bg-red-50'
        : state === 'finished' ? 'bg-green-50'
        : 'bg-emt-gray',
      ].join(' ')}
      style={{
        borderColor:
          state === 'running'  ? '#FCA5A5'
          : state === 'finished' ? '#86EFAC'
          : '#E2E8F0',
        borderWidth: state === 'running' ? '2px' : '1px',
        boxShadow: '0 2px 12px rgba(15,23,42,0.08)',
      }}
    >
      {/* Portal AlertOverlay to body — keeps grid to exactly 4 items */}
      {isHeartRate && createPortal(
        <AlertOverlay visible={state === 'running'} />,
        document.body,
      )}

      {/* ── IDLE ── */}
      {state === 'idle' && (
        <>
          {hasLastResult && (
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-emt-muted leading-none">
                תוצאה אחרונה:{' '}
                <span className="text-emt-green font-bold">{lastResult}</span>
              </p>
              <button
                onClick={onResetLastResult}
                className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200
                           flex items-center justify-center
                           text-slate-400 hover:text-emt-red
                           active:scale-90 transition-all"
                aria-label="נקה תוצאה אחרונה"
              >
                <RotateCcw size={10} />
              </button>
            </div>
          )}

          {/* Play button */}
          <button
            onClick={start}
            className="w-16 h-16 rounded-full bg-emt-red flex items-center justify-center
                       active:scale-90 transition-transform duration-150"
            style={{ boxShadow: '0 4px 16px rgba(220,38,38,0.35)' }}
            aria-label={`התחל ${label}`}
          >
            <Play size={30} className="text-white" fill="white" />
          </button>

          <div className="text-center leading-snug">
            <p className="text-emt-light font-black text-2xl">{label}</p>
            <p className="text-emt-muted text-base mt-0.5">
              {hasLastResult ? 'הפעל שוב' : sublabel}
            </p>
          </div>
        </>
      )}

      {/* ── RUNNING ── */}
      {state === 'running' && (
        <>
          <p className="text-emt-muted text-xs tracking-wide font-semibold uppercase">{label}</p>

          {/* Dominant countdown */}
          <span
            className="text-emt-red font-mono font-black tabular-nums leading-none"
            style={{ fontSize: 'clamp(5rem, 22vw, 8rem)' }}
          >
            {timeLeft}
          </span>

          <p className="text-emt-muted text-sm font-medium">שניות</p>

          {/* MASSIVE cancel button */}
          <button
            onClick={stop}
            className="w-full mt-1 py-4 rounded-2xl
                       bg-red-600 text-white font-black text-xl tracking-wide
                       active:scale-[0.97] transition-transform duration-150
                       shadow-md"
            style={{ boxShadow: '0 4px 16px rgba(220,38,38,0.4)' }}
          >
            בטל
          </button>
        </>
      )}

      {/* ── FINISHED (modal is opening) ── */}
      {state === 'finished' && (
        <p className="text-emt-green text-sm font-semibold">מוכן לספירה…</p>
      )}
    </div>
  );
}
