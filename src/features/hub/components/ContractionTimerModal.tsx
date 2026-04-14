import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Timer, History, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContractionStore } from '../../../store/contractionStore';

// ── Audio feedback via Web Audio API (no file needed, silent on error) ─────
function playBeep(frequency = 660, duration = 0.12, volume = 0.07) {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
    // auto-close context after sound completes
    setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
  } catch { /* blocked or unsupported — stay silent */ }
}

// ── Time formatter ─────────────────────────────────────────────────────────
function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}ש'`;
}

interface Props { isOpen: boolean; onClose: () => void; }

export default function ContractionTimerModal({ isOpen, onClose }: Props) {
  const {
    contractions, active, startMs,
    startContraction, endContraction, reset,
  } = useContractionStore();

  const [elapsed, setElapsed] = useState(() =>
    active && startMs ? Math.floor((Date.now() - startMs) / 1000) : 0,
  );
  const [showHistory, setShowHistory] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // ── Elapsed timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!active || startMs === null) { setElapsed(0); return; }
    setElapsed(Math.floor((Date.now() - startMs) / 1000));
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startMs!) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [active, startMs]);

  // ── Screen Wake Lock ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const acquire = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as Navigator & {
            wakeLock: { request(type: 'screen'): Promise<WakeLockSentinel> };
          }).wakeLock.request('screen');
        }
      } catch { /* permission denied or unsupported */ }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Handlers ───────────────────────────────────────────────────────────
  const handlePress = () => {
    if ('vibrate' in navigator) navigator.vibrate([50]);
    if (!active) {
      playBeep(660, 0.12, 0.07);   // higher tone = start
      startContraction();
    } else {
      playBeep(440, 0.18, 0.07);   // lower tone = stop
      endContraction();
    }
  };

  const handleReset = () => {
    if ('vibrate' in navigator) navigator.vibrate([30, 60, 30]);
    reset();
    setShowHistory(false);
  };

  // ── Derived stats ──────────────────────────────────────────────────────
  const avgDuration = contractions.length
    ? Math.round(contractions.reduce((s, c) => s + c.duration, 0) / contractions.length)
    : null;

  const withInterval = contractions.filter(c => c.interval !== null);
  const avgInterval = withInterval.length
    ? Math.round(withInterval.reduce((s, c) => s + (c.interval ?? 0), 0) / withInterval.length)
    : null;

  const lastInterval = contractions[0]?.interval ?? null;
  const isUrgent = lastInterval !== null && lastInterval < 300; // < 5 min apart

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0d0b1e 0%, #1a1040 45%, #0f1a2e 100%)' }}
    >
      {/* ── Glassmorphism Header ────────────────────────────────────────── */}
      <div
        className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          aria-label="חזור"
        >
          <ChevronRight size={22} className="text-white/80" />
        </button>

        <div className="flex items-center gap-2.5">
          <motion.div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: active ? '#ef233c' : '#a78bfa' }}
            animate={active
              ? { boxShadow: ['0 0 6px #ef233c', '0 0 16px #ef233c', '0 0 6px #ef233c'] }
              : { boxShadow: '0 0 8px #a78bfa' }
            }
            transition={active ? { duration: 1.5, repeat: Infinity } : {}}
          />
          <h2 className="text-white font-bold text-xl">מחשבון צירים</h2>
        </div>

        <div className="flex items-center gap-2">
          {contractions.length > 0 && (
            <>
              <button
                onClick={() => setShowHistory(true)}
                className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)' }}
                aria-label="היסטוריה"
              >
                <History size={18} className="text-purple-300" />
              </button>
              <button
                onClick={handleReset}
                className="px-3.5 py-1.5 rounded-full text-sm font-bold active:scale-95 transition-transform"
                style={{ background: 'rgba(239,35,60,0.12)', border: '1px solid rgba(239,35,60,0.35)', color: '#f87171' }}
              >
                איפוס
              </button>
            </>
          )}
          {contractions.length === 0 && <div className="w-11" />}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-between px-5 py-6 gap-5">

        {/* Instruction text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={active ? 'active-lbl' : 'idle-lbl'}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            className="text-center font-bold text-lg tracking-wide"
            style={{ color: active ? '#fca5a5' : 'rgba(255,255,255,0.55)' }}
          >
            {active
              ? 'ציר פעיל — לחץ לסיום'
              : contractions.length === 0
                ? 'לחץ כשמתחיל ציר'
                : 'מחכה לציר הבא...'}
          </motion.p>
        </AnimatePresence>

        {/* ── Stats cards ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {contractions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full flex gap-3"
            >
              {avgDuration !== null && (
                <div
                  className="flex-1 rounded-2xl p-3 text-center"
                  style={{
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.22)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>משך ממוצע</p>
                  <p className="font-black text-xl text-green-400">{fmt(avgDuration)}</p>
                </div>
              )}

              {avgInterval !== null && (
                <div
                  className="flex-1 rounded-2xl p-3 text-center"
                  style={{
                    background: isUrgent ? 'rgba(239,35,60,0.1)' : 'rgba(96,165,250,0.08)',
                    border: `1px solid ${isUrgent ? 'rgba(239,35,60,0.3)' : 'rgba(96,165,250,0.22)'}`,
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>מרווח ממוצע</p>
                  <p className={`font-black text-xl ${isUrgent ? 'text-red-400' : 'text-blue-400'}`}>
                    {fmt(avgInterval)}
                  </p>
                </div>
              )}

              <div
                className="flex-1 rounded-2xl p-3 text-center"
                style={{
                  background: 'rgba(167,139,250,0.08)',
                  border: '1px solid rgba(167,139,250,0.22)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>צירים</p>
                <p className="font-black text-xl text-purple-300">{contractions.length}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main circular button ─────────────────────────────────────── */}
        <div className="relative flex items-center justify-center my-2">
          {/* Breathing glow rings — only when active */}
          <AnimatePresence>
            {active && (
              <>
                <motion.div
                  key="ring1"
                  className="absolute rounded-full pointer-events-none"
                  style={{ width: 230, height: 230, border: '2px solid rgba(239,35,60,0.35)' }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: [1, 1.13, 1], opacity: [0.5, 1, 0.5] }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  key="ring2"
                  className="absolute rounded-full pointer-events-none"
                  style={{ width: 270, height: 270, border: '1px solid rgba(239,35,60,0.15)' }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.35 }}
                />
              </>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handlePress}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: active
                ? 'linear-gradient(140deg, #ef233c 0%, #9b1c1c 100%)'
                : 'linear-gradient(140deg, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.05) 100%)',
              border: `3px solid ${active ? 'rgba(239,35,60,0.8)' : 'rgba(34,197,94,0.55)'}`,
              backdropFilter: 'blur(20px)',
              boxShadow: active
                ? '0 0 48px rgba(239,35,60,0.45), 0 0 80px rgba(239,35,60,0.15), inset 0 1px 0 rgba(255,255,255,0.15)'
                : '0 0 32px rgba(34,197,94,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            className="flex flex-col items-center justify-center select-none relative z-10"
            aria-label={active ? 'סיים ציר' : 'התחל ציר'}
          >
            {active ? (
              <>
                <motion.span
                  className="text-5xl font-black tabular-nums text-white leading-none"
                  animate={{ opacity: [1, 0.8, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {fmt(elapsed)}
                </motion.span>
                <span className="text-sm font-bold text-red-200 mt-2 tracking-wide">סיים ציר</span>
              </>
            ) : (
              <>
                <Timer size={54} className="text-green-400" strokeWidth={1.5} />
                <span className="text-base font-bold text-green-300 mt-2 tracking-wide">התחל ציר</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Last contraction quick summary */}
        <AnimatePresence>
          {contractions.length > 0 && !active && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              הציר האחרון:{' '}
              <span className="text-green-400 font-bold">{fmt(contractions[0].duration)}</span>
              {contractions[0].interval !== null && (
                <>
                  {' · '}מרווח:{' '}
                  <span className={`font-bold ${isUrgent ? 'text-red-400' : 'text-blue-400'}`}>
                    {fmt(contractions[0].interval!)}
                  </span>
                </>
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── History Bottom Sheet ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showHistory && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-[80]"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              className="fixed bottom-0 left-0 right-0 z-[90] rounded-t-3xl flex flex-col overflow-hidden"
              style={{
                background: 'rgba(14,11,30,0.97)',
                border: '1px solid rgba(255,255,255,0.1)',
                maxHeight: '78vh',
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
              </div>

              {/* Sheet header */}
              <div
                className="flex items-center justify-between px-5 py-3 shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-2">
                  <History size={18} className="text-purple-300" />
                  <h3 className="text-white font-bold text-lg">היסטוריית צירים</h3>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                >
                  <X size={16} className="text-white/50" />
                </button>
              </div>

              {/* Column headers */}
              <div
                className="grid grid-cols-3 px-5 py-2.5 shrink-0 text-xs font-bold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.02)' }}
              >
                <span>#</span>
                <span className="text-center">משך</span>
                <span className="text-center">מרווח</span>
              </div>

              {/* Rows */}
              <div className="overflow-y-auto flex-1">
                {contractions.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.035 }}
                    className="grid grid-cols-3 px-5 py-3.5"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <span className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {contractions.length - i}
                    </span>
                    <span className="text-center font-black text-green-400 text-base">
                      {fmt(c.duration)}
                    </span>
                    <span
                      className={`text-center font-black text-base ${
                        c.interval !== null && c.interval < 300 ? 'text-red-400' : 'text-blue-400'
                      }`}
                    >
                      {c.interval !== null ? fmt(c.interval) : '—'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
