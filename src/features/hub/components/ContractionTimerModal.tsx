import { useState, useEffect } from 'react';
import { ChevronRight, Timer } from 'lucide-react';
import { useContractionStore } from '../../../store/contractionStore';

interface Props { isOpen: boolean; onClose: () => void; }

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s} ש'`;
}

export default function ContractionTimerModal({ isOpen, onClose }: Props) {
  const { contractions, active, startMs, startContraction, endContraction, reset } = useContractionStore();

  // elapsed is local — computed from startMs so it survives remounts correctly
  const [elapsed, setElapsed] = useState(() =>
    active && startMs ? Math.floor((Date.now() - startMs) / 1000) : 0,
  );

  useEffect(() => {
    if (!active || startMs === null) {
      setElapsed(0);
      return;
    }
    // Sync immediately on mount/activation then tick every second
    setElapsed(Math.floor((Date.now() - startMs) / 1000));
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startMs) / 1000)), 1000);
    return () => clearInterval(id);
  }, [active, startMs]);

  if (!isOpen) return null;

  const handlePress = () => {
    if (!active) {
      startContraction();
    } else {
      endContraction();
    }
  };

  const avgDuration = contractions.length
    ? Math.round(contractions.reduce((s, c) => s + c.duration, 0) / contractions.length)
    : null;

  const withInterval = contractions.filter(c => c.interval !== null);
  const avgInterval = withInterval.length
    ? Math.round(withInterval.reduce((s, c) => s + (c.interval ?? 0), 0) / withInterval.length)
    : null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark">

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-gray-500 dark:text-emt-muted"
          aria-label="חזור"
        >
          <ChevronRight size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Timer size={20} className="text-purple-400" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מחשבון צירים</h2>
        </div>
        <div className="w-10" />
      </div>

      {/* Scrollable content — instruction, stats, history */}
      <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-5">

        {/* ── Instruction text ── */}
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center pt-2">
          {active ? 'ציר פעיל — לחץ לסיום' : 'לחץ כשמתחיל ציר'}
        </p>

        {/* ── Stats row ── */}
        {contractions.length > 0 && (
          <div className="flex gap-3 w-full">
            {avgDuration !== null && (
              <div className="flex-1 rounded-2xl border border-emt-green/30 bg-emt-green/5 p-3 text-center">
                <p className="text-gray-700 dark:text-gray-200 text-sm font-bold mb-0.5">משך ממוצע</p>
                <p className="text-emt-green font-black text-xl">{fmt(avgDuration)}</p>
              </div>
            )}
            {avgInterval !== null && (
              <div className="flex-1 rounded-2xl border border-emt-blue/30 bg-emt-blue/5 p-3 text-center">
                <p className="text-gray-700 dark:text-gray-200 text-sm font-bold mb-0.5">מרווח ממוצע</p>
                <p className="text-emt-blue font-black text-xl">{fmt(avgInterval)}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Contraction log ── */}
        {contractions.length > 0 && (
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-gray-900 dark:text-emt-light font-bold text-base">צירים אחרונים</p>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-emt-border overflow-hidden">
              {/* Column headers */}
              <div className="grid grid-cols-3 bg-gray-100 dark:bg-emt-gray px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200">
                <span>#</span>
                <span className="text-center">משך</span>
                <span className="text-center">מרווח</span>
              </div>

              {contractions.map((c, i) => (
                <div
                  key={c.id}
                  className="grid grid-cols-3 px-4 py-2.5 border-t border-gray-200 dark:border-emt-border text-base"
                >
                  <span className="text-gray-600 dark:text-gray-300">{contractions.length - i}</span>
                  <span className="text-center font-bold text-emt-green">{fmt(c.duration)}</span>
                  <span className="text-center font-bold text-emt-blue">
                    {c.interval !== null ? fmt(c.interval) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Pinned bottom — big circular button ── */}
      <div className="shrink-0 flex flex-col items-center pb-8 pt-4 gap-4 border-t border-gray-200 dark:border-emt-border">
        <button
          onClick={handlePress}
          className={[
            'w-48 h-48 rounded-full flex flex-col items-center justify-center select-none',
            'border-4 font-black transition-all duration-300 active:scale-95',
            active
              ? 'border-emt-red bg-emt-red text-white'
              : 'border-emt-green bg-emt-green/10 text-emt-green',
          ].join(' ')}
          aria-label={active ? 'סיים ציר' : 'התחל ציר'}
        >
          {active ? (
            <>
              <span className="text-4xl tabular-nums">{fmt(elapsed)}</span>
              <span className="text-base font-bold mt-1">סיים ציר</span>
            </>
          ) : (
            <>
              <Timer size={48} strokeWidth={1.5} />
              <span className="text-base font-bold mt-2">התחל ציר</span>
            </>
          )}
        </button>

        {contractions.length > 0 && (
          <button
            onClick={reset}
            className="w-full max-w-xs bg-red-500 text-white font-bold p-4 text-xl rounded-lg active:opacity-80 transition-opacity"
          >
            איפוס
          </button>
        )}
      </div>
    </div>
  );
}
