import { useState, useEffect, useRef } from 'react';
import { X, Timer } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

interface Props { isOpen: boolean; onClose: () => void; }

interface Contraction {
  id: number;
  duration: number;       // seconds — how long the contraction lasted
  interval: number | null; // seconds from previous contraction's START to this one's START
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}ש'`;
}

export default function ContractionTimerModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);

  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [contractions, setContractions] = useState<Contraction[]>([]);

  const startRef = useRef<number | null>(null);      // ms — start of current contraction
  const lastStartRef = useRef<number | null>(null);  // ms — start of previous contraction

  // tick every second while a contraction is active
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!isOpen) return null;

  const handlePress = () => {
    const now = Date.now();

    if (!active) {
      // ── Start contraction ──
      startRef.current = now;
      setElapsed(0);
      setActive(true);
    } else {
      // ── End contraction ──
      const duration = Math.round((now - (startRef.current ?? now)) / 1000);
      const interval = lastStartRef.current
        ? Math.round((now - lastStartRef.current) / 1000)
        : null;

      lastStartRef.current = startRef.current;
      startRef.current = null;

      setContractions(prev => [{ id: now, duration, interval }, ...prev].slice(0, 10));
      setActive(false);
      setElapsed(0);
    }
  };

  const reset = () => {
    setActive(false);
    setElapsed(0);
    setContractions([]);
    startRef.current = null;
    lastStartRef.current = null;
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
        <div className="flex items-center gap-2">
          <Timer size={20} className="text-purple-400" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מחשבון צירים</h2>
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

      <div className="flex-1 overflow-y-auto flex flex-col items-center p-4 gap-5">

        {/* ── Big circular button ── */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <button
            onClick={handlePress}
            className={[
              'w-48 h-48 rounded-full flex flex-col items-center justify-center select-none',
              'border-4 font-black transition-all duration-300 active:scale-95',
              active
                ? 'border-emt-red bg-emt-red/20 text-emt-red animate-pulse'
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

          <p className="text-gray-400 dark:text-emt-muted text-sm">
            {active ? 'ציר פעיל — לחץ לסיום' : 'לחץ כשמתחיל ציר'}
          </p>
        </div>

        {/* ── Stats row ── */}
        {contractions.length > 0 && (
          <div className="flex gap-3 w-full">
            {avgDuration !== null && (
              <div className="flex-1 rounded-2xl border border-emt-green/30 bg-emt-green/5 p-3 text-center">
                <p className="text-emt-muted text-xs mb-0.5">משך ממוצע</p>
                <p className="text-emt-green font-black text-xl">{fmt(avgDuration)}</p>
              </div>
            )}
            {avgInterval !== null && (
              <div className="flex-1 rounded-2xl border border-emt-blue/30 bg-emt-blue/5 p-3 text-center">
                <p className="text-emt-muted text-xs mb-0.5">מרווח ממוצע</p>
                <p className="text-emt-blue font-black text-xl">{fmt(avgInterval)}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Contraction log ── */}
        {contractions.length > 0 && (
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-gray-900 dark:text-emt-light font-bold text-sm">צירים אחרונים</p>
              <button
                onClick={reset}
                className="text-emt-muted text-xs underline active:opacity-70"
              >
                אפס
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-emt-border overflow-hidden">
              {/* Column headers */}
              <div className="grid grid-cols-3 bg-gray-100 dark:bg-emt-gray px-4 py-2 text-xs font-bold text-gray-500 dark:text-emt-muted">
                <span>#</span>
                <span className="text-center">משך</span>
                <span className="text-center">מרווח</span>
              </div>

              {contractions.map((c, i) => (
                <div
                  key={c.id}
                  className="grid grid-cols-3 px-4 py-2.5 border-t border-gray-200 dark:border-emt-border text-sm"
                >
                  <span className="text-gray-400 dark:text-emt-muted">{contractions.length - i}</span>
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
    </div>
  );
}
