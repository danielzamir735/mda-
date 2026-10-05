import { Volume2, VolumeX, X } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { useHaptics } from '../../../hooks/useHaptics';
import { trackInteraction } from '../../../utils/analytics';

const ANIMALS = ['🐶', '🐱', '🐰', '🐸', '🦊', '🐼', '🐥', '🐠', '🐢', '🦋', '🐞', '🦄'];
const SPARKS  = ['⭐', '✨', '💛', '🌟', '💜', '💙'];
const COLORS  = [
  'rgba(255,182,193,0.55)', 'rgba(186,156,255,0.55)', 'rgba(100,240,255,0.50)',
  'rgba(255,236,100,0.50)', 'rgba(160,230,180,0.50)', 'rgba(255,200,150,0.55)',
];
// C major pentatonic — any sequence of taps sounds pleasant
const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];

const BUBBLE_COUNT = 11;
const HOLD_TO_EXIT_MS = 800;

interface Bubble { id: number; left: number; size: number; dur: number; delay: number; emoji: string; color: string; }
interface Spark  { id: number; x: number; y: number; dx: number; dy: number; emoji: string; }

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function makeBubble(id: number, prefill = false): Bubble {
  const dur = 8 + Math.random() * 6;
  return {
    id,
    left: 4 + Math.random() * 74,
    size: 76 + Math.random() * 44,
    dur,
    // Negative delay starts the bubble mid-flight so the screen isn't empty on open
    delay: prefill ? -Math.random() * dur : Math.random() * 1.5,
    emoji: pick(ANIMALS),
    color: pick(COLORS),
  };
}

interface Props { onBack: () => void; }

export default function ChildCalmScreen({ onBack }: Props) {
  const nextId = useRef(BUBBLE_COUNT);
  const [bubbles, setBubbles] = useState<Bubble[]>(() =>
    Array.from({ length: BUBBLE_COUNT }, (_, i) => makeBubble(i, true)));
  const [sparks, setSparks]   = useState<Spark[]>([]);
  const [popped, setPopped]   = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [holding, setHolding] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const holdTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vibrate = useHaptics();

  // Keep the screen awake while the child is holding the phone
  useEffect(() => {
    trackInteraction('מסך הרגעה לילד', 'wellness');
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock?.request('screen').then(l => { lock = l; }).catch(() => {});
    return () => {
      lock?.release().catch(() => {});
      if (holdTimer.current) clearTimeout(holdTimer.current);
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  // While the app is in the background every bubble finishes its flight, so on return
  // they would all respawn from the bottom in one clump — spread them out again instead
  useEffect(() => {
    const reseed = () => {
      if (document.visibilityState !== 'visible') return;
      setBubbles(Array.from({ length: BUBBLE_COUNT }, () => makeBubble(nextId.current++, true)));
    };
    document.addEventListener('visibilitychange', reseed);
    return () => document.removeEventListener('visibilitychange', reseed);
  }, []);

  const playNote = useCallback((volume: number) => {
    if (!soundOn) return;
    try {
      const ctx = audioCtxRef.current ?? (audioCtxRef.current = new AudioContext());
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = pick(NOTES);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch { /* audio not available — silently ignore */ }
  }, [soundOn]);

  const burst = useCallback((x: number, y: number, count: number, spread: number) => {
    const created: Spark[] = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      const dist  = spread * (0.6 + Math.random() * 0.6);
      return {
        id: nextId.current++,
        x, y,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        emoji: pick(SPARKS),
      };
    });
    setSparks(prev => [...prev, ...created]);
  }, []);

  const replaceBubble = useCallback((id: number) => {
    setBubbles(prev => prev.map(b => (b.id === id ? makeBubble(nextId.current++) : b)));
  }, []);

  const popBubble = (e: ReactPointerEvent, id: number) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 8, 90);
    playNote(0.18);
    vibrate(15);
    setPopped(n => n + 1);
    replaceBubble(id);
  };

  // Every touch gets a response, even when the child misses a bubble
  const touchBackground = (e: ReactPointerEvent) => {
    burst(e.clientX, e.clientY, 4, 45);
    playNote(0.07);
  };

  const startHold = () => {
    setHolding(true);
    holdTimer.current = setTimeout(onBack, HOLD_TO_EXIT_MS);
  };
  const cancelHold = () => {
    setHolding(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[65] overflow-hidden select-none"
      style={{ touchAction: 'none', WebkitTouchCallout: 'none' }}
      onPointerDown={touchBackground}
      onContextMenu={e => e.preventDefault()}
    >
      <style>{`
        @keyframes cc-bg {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
        .cc-bg {
          background: linear-gradient(135deg, #1e1b4b, #1e3a8a, #0e7490, #4c1d95, #1e1b4b);
          background-size: 400% 400%;
          animation: cc-bg 24s ease infinite;
        }
        @keyframes cc-rise {
          0%   { transform: translateY(0); }
          100% { transform: translateY(calc(-100vh - 320px)); }
        }
        @keyframes cc-sway {
          0%, 100% { transform: translateX(-14px) rotate(-5deg); }
          50%      { transform: translateX(14px)  rotate(5deg);  }
        }
        .cc-bubble {
          position: absolute;
          bottom: -160px;
          animation: cc-rise linear forwards;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .cc-bubble-inner {
          width: 100%; height: 100%;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid rgba(255,255,255,0.45);
          box-shadow: inset -6px -8px 18px rgba(255,255,255,0.18), 0 0 22px rgba(255,255,255,0.12);
          animation: cc-sway 4s ease-in-out infinite;
        }
        @keyframes cc-spark {
          0%   { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.3); opacity: 0; }
        }
        .cc-spark {
          position: absolute;
          font-size: 26px;
          pointer-events: none;
          animation: cc-spark 0.7s ease-out forwards;
        }
        .cc-hold-ring {
          transform: scaleX(0);
          transform-origin: right;
        }
        .cc-hold-ring.cc-holding {
          transform: scaleX(1);
          transition: transform ${HOLD_TO_EXIT_MS}ms linear;
        }
      `}</style>

      <div className="cc-bg absolute inset-0" />

      {bubbles.map(b => (
        <div
          key={b.id}
          className="cc-bubble"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
          onPointerDown={e => popBubble(e, b.id)}
          onAnimationEnd={e => { if (e.animationName === 'cc-rise') replaceBubble(b.id); }}
        >
          <div
            className="cc-bubble-inner"
            style={{
              background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.75), ${b.color} 45%, rgba(255,255,255,0.08))`,
              fontSize: b.size * 0.5,
            }}
          >
            {b.emoji}
          </div>
        </div>
      ))}

      {sparks.map(s => (
        <span
          key={s.id}
          className="cc-spark"
          style={{ left: s.x, top: s.y, '--dx': `${s.dx}px`, '--dy': `${s.dy}px` } as CSSProperties}
          onAnimationEnd={() => setSparks(prev => prev.filter(p => p.id !== s.id))}
        >
          {s.emoji}
        </span>
      ))}

      {/* Top bar — small and out of the way; exit needs a long press so the child can't leave by accident */}
      <div
        className="ios-safe-header absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 py-3"
        onPointerDown={e => e.stopPropagation()}
      >
        <button
          onClick={() => setSoundOn(s => !s)}
          className="w-11 h-11 rounded-full bg-white/10 border border-white/20
                     flex items-center justify-center text-white/70"
          aria-label={soundOn ? 'השתק צלילים' : 'הפעל צלילים'}
        >
          {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white font-black text-xl"
          aria-live="polite">
          ⭐ {popped}
        </div>

        <button
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          // Keyboard / assistive tech activation has no pointer events
          onClick={e => { if (e.detail === 0) onBack(); }}
          className="relative overflow-hidden h-11 px-3 rounded-full bg-white/10 border border-white/20
                     flex items-center gap-1.5 text-white/70 text-xs font-semibold"
          aria-label="יציאה — לחיצה ארוכה"
        >
          <span className={`cc-hold-ring absolute inset-0 bg-white/25${holding ? ' cc-holding' : ''}`} />
          <X size={18} className="relative" />
          <span className="relative">לחיצה ארוכה</span>
        </button>
      </div>
    </div>
  );
}
