import { X, Wind, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';

type Phase = 'idle' | 'inhale' | 'exhale';

const PETAL_ANGLES = [0, 60, 120, 180, 240, 300];

/* Bubble definitions — size(px), left(%), duration(s), delay(s) */
const BUBBLES = [
  { size: 18, left:  8, dur: 13, delay:  0 },
  { size: 32, left: 18, dur: 20, delay:  3 },
  { size: 14, left: 32, dur: 11, delay:  7 },
  { size: 48, left: 48, dur: 26, delay:  1 },
  { size: 22, left: 62, dur: 16, delay:  5 },
  { size: 12, left: 72, dur:  9, delay: 10 },
  { size: 38, left: 80, dur: 18, delay:  4 },
  { size: 16, left: 90, dur: 12, delay:  8 },
  { size: 55, left: 25, dur: 28, delay:  2 },
  { size: 20, left: 56, dur: 14, delay:  6 },
  { size: 28, left: 42, dur: 17, delay: 11 },
  { size: 10, left: 70, dur:  8, delay:  9 },
];

// ─── FlowerSVG (inhale, 4 s) ───────────────────────────────────────────────
function FlowerSVG({ active }: { active: boolean }) {
  const scale = active ? 1.5 : 0.5;
  return (
    <svg viewBox="0 0 200 200" width={260} height={260}
      style={{ overflow: 'visible', position: 'absolute',
        opacity: active ? 1 : 0, transition: 'opacity 1s ease-in-out' }}>
      <defs>
        <radialGradient id="fl-pg" cx="50%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#CFFAFE" />
          <stop offset="100%" stopColor="#22D3EE" />
        </radialGradient>
        <filter id="fl-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx={100} cy={100} r={82} fill="none" stroke="#22D3EE" strokeWidth={1}
        style={{ opacity: active ? 0.22 : 0.04, transition: 'opacity 4s ease-in-out' }} />
      <g filter="url(#fl-glow)"
        style={{ transformOrigin: '100px 100px',
          transform: `scale(${scale})`,
          transition: 'transform 4s cubic-bezier(0.4,0,0.2,1)' }}>
        {PETAL_ANGLES.map(a => (
          <ellipse key={a} cx={100} cy={64} rx={15} ry={34}
            fill="url(#fl-pg)" opacity={0.9} transform={`rotate(${a},100,100)`} />
        ))}
        {PETAL_ANGLES.map(a => (
          <ellipse key={`h${a}`} cx={97} cy={60} rx={5} ry={12}
            fill="white" opacity={0.18} transform={`rotate(${a},100,100)`} />
        ))}
        <circle cx={100} cy={100} r={19} fill="#E0F7FA" />
        <circle cx={100} cy={100} r={10} fill="#06B6D4" />
      </g>
      <circle cx={100} cy={100} r={active ? 96 : 40} fill="none"
        stroke={active ? 'rgba(34,211,238,0.55)' : 'rgba(34,211,238,0.1)'}
        strokeWidth={active ? 18 : 6}
        style={{ transition: 'all 4s ease-in-out', filter: 'blur(8px)',
          opacity: active ? 0.12 : 0.04 }} />
    </svg>
  );
}

// ─── CandleSVG (exhale, 6 s) ───────────────────────────────────────────────
function CandleSVG({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 200 200" width={220} height={220}
      style={{ overflow: 'visible', position: 'absolute',
        opacity: active ? 1 : 0, transition: 'opacity 1s ease-in-out' }}>
      <defs>
        <radialGradient id="cn-flame" cx="50%" cy="20%" r="65%">
          <stop offset="0%" stopColor="#FFFDE7" />
          <stop offset="35%" stopColor="#FFCA28" />
          <stop offset="100%" stopColor="#E65100" />
        </radialGradient>
        <radialGradient id="cn-body" cx="30%" cy="15%" r="85%">
          <stop offset="0%" stopColor="#F5EFE6" />
          <stop offset="100%" stopColor="#C9A87C" />
        </radialGradient>
        <filter id="cn-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="9" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect x={83} y={128} width={34} height={64} rx={6} fill="url(#cn-body)" />
      <ellipse cx={100} cy={128} rx={17} ry={5} fill="#EDE0CC" />
      <path d="M87 133 Q84 145 86 158" stroke="#DCC8A8" strokeWidth={2.5}
        fill="none" opacity={0.55} strokeLinecap="round" />
      <line x1={100} y1={128} x2={100} y2={114}
        stroke="#4A3728" strokeWidth={2.5} strokeLinecap="round" />
      <ellipse cx={100} cy={96} rx={active ? 6 : 20} ry={active ? 5 : 26}
        fill="rgba(255,190,40,0.15)"
        style={{ filter: 'blur(12px)', transition: 'rx 6s ease-in-out, ry 6s ease-in-out' }} />
      <g filter="url(#cn-glow)"
        style={{ transformOrigin: '100px 114px',
          transform: `scaleY(${active ? 0.15 : 1})`,
          opacity: active ? 0.15 : 1,
          transition: 'transform 6s cubic-bezier(0.4,0,0.2,1), opacity 6s ease-in-out' }}>
        <path d="M100 58 C91 74 84 92 86 107 C88 118 112 118 114 107 C116 92 109 74 100 58Z"
          fill="url(#cn-flame)" />
        <path d="M100 78 C96 88 93 100 95 108 C97 114 103 114 105 108 C107 100 104 88 100 78Z"
          fill="#FFFDE7" opacity={0.72} />
      </g>
    </svg>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
interface Props { isOpen: boolean; onClose: () => void; }

export default function BreathingSynchronizer({ isOpen, onClose }: Props) {
  const [running, setRunning]     = useState(false);
  const [phase, setPhase]         = useState<Phase>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useModalBackHandler(isOpen, onClose);

  // Phase timer — untouched logic
  useEffect(() => {
    if (!running) { setPhase('idle'); return; }
    if (phase === 'idle') { setPhase('inhale'); return; }
    const ms   = phase === 'inhale' ? 4000 : 6000;
    const next: Phase = phase === 'inhale' ? 'exhale' : 'inhale';
    const t = setTimeout(() => setPhase(next), ms);
    return () => clearTimeout(t);
  }, [running, phase]);

  useEffect(() => {
    if (!isOpen) {
      setRunning(false);
      setPhase('idle');
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    isPlaying ? audio.pause() : audio.play().catch(() => {});
    setIsPlaying(p => !p);
  };

  const label     = phase === 'inhale' ? 'שאיפה עמוקה' : phase === 'exhale' ? 'נשיפה ארוכה'  : 'לחץ התחל';
  const sublabel  = phase === 'inhale' ? '(הרחת פרח)'  : phase === 'exhale' ? '(כיבוי נר)'   : '';
  const cycleHint = phase === 'idle'   ? '4 שניות שאיפה · 6 שניות נשיפה' : '';
  const glowColor = phase === 'inhale' ? 'rgba(34,211,238,0.7)' : phase === 'exhale' ? 'rgba(253,186,116,0.7)' : 'none';

  return (
    <div className="fixed inset-0 z-[65] flex flex-col overflow-hidden">

      {/* ── CSS: background gradient + floating bubbles ─────────────────── */}
      <style>{`
        @keyframes bs-bg {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
        .bs-bg {
          background: linear-gradient(
            135deg,
            #0d0221, #1e0545, #0d2b5e,
            #0e4d6c, #1a0a3d, #3b0764,
            #0d1f4c, #0d0221
          );
          background-size: 400% 400%;
          animation: bs-bg 20s ease infinite;
        }
        @keyframes bs-float {
          0%   { transform: translateY(0)       scale(1);   opacity: 0;    }
          8%   { opacity: 0.55; }
          88%  { opacity: 0.18; }
          100% { transform: translateY(-108vh)  scale(0.4); opacity: 0;    }
        }
        .bs-bubble {
          position: absolute;
          bottom: -80px;
          border-radius: 50%;
          background: radial-gradient(circle at 32% 32%,
            rgba(200,230,255,0.38),
            rgba(100,160,255,0.06)
          );
          border: 1px solid rgba(200,220,255,0.22);
          animation: bs-float linear infinite;
          pointer-events: none;
        }
        @keyframes bs-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.18; }
          100% { transform: scale(1.7); opacity: 0;    }
        }
        .bs-pulse { animation: bs-pulse-ring 2.4s ease-out infinite; }
      `}</style>

      {/* ── Background: gradient + bubbles ──────────────────────────────── */}
      <div className="bs-bg absolute inset-0">
        {BUBBLES.map((b, i) => (
          <div key={i} className="bs-bubble"
            style={{ width: b.size, height: b.size,
              left: `${b.left}%`,
              animationDuration: `${b.dur}s`,
              animationDelay:    `${b.delay}s` }} />
        ))}
      </div>

      {/* ── UI layer ────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col h-full">

        {/* Header */}
        <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3
                        border-b border-white/10 backdrop-blur-sm bg-black/10">
          <div className="flex items-center gap-2">
            <Wind size={20} className="text-sky-300" />
            <h2 className="text-white font-bold text-xl">מסנכרן נשימות</h2>
          </div>
          <HapticButton
            onClick={() => { setRunning(false); onClose(); }}
            pressScale={0.88}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/20
                       flex items-center justify-center text-white/70 hover:text-white"
            aria-label="סגור"
          >
            <X size={20} />
          </HapticButton>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 select-none">

          {/* Phase text */}
          <div className="text-center min-h-[5.5rem] flex flex-col items-center justify-end gap-1">
            <p className="text-4xl font-black text-white leading-tight"
              style={{ opacity: phase === 'idle' ? 0.3 : 1,
                transition: 'opacity 0.6s ease-in-out',
                textShadow: phase !== 'idle' ? `0 0 32px ${glowColor}` : 'none' }}>
              {label}
            </p>
            {sublabel && (
              <p className="text-lg font-semibold"
                style={{ color: phase === 'inhale' ? '#67E8F9' : '#FCD34D',
                  transition: 'color 0.6s ease-in-out' }}>
                {sublabel}
              </p>
            )}
          </div>

          {/* Flower / Candle */}
          <div style={{ position: 'relative', width: 260, height: 260,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlowerSVG active={phase === 'inhale'} />
            <CandleSVG active={phase === 'exhale'} />
          </div>

          {/* Hint */}
          <p className="text-white/30 text-sm font-medium tracking-wide min-h-[1.25rem] text-center">
            {cycleHint}
            {phase === 'inhale' && <span style={{ color: '#67E8F9', opacity: 0.6 }}>4 שניות שאיפה</span>}
            {phase === 'exhale' && <span style={{ color: '#FCD34D', opacity: 0.6 }}>6 שניות נשיפה</span>}
          </p>
        </div>

        {/* ── Bottom controls ─────────────────────────────────────────── */}
        <div className="shrink-0 flex flex-col items-center gap-3 px-6 pb-8 pt-2">

          {/* Start / Stop */}
          {!running ? (
            <HapticButton
              onClick={() => setRunning(true)}
              pressScale={0.95}
              className="w-full py-4 rounded-2xl bg-sky-500 text-white font-bold text-xl
                         shadow-lg shadow-sky-500/30 active:bg-sky-600 transition-colors"
            >
              התחל
            </HapticButton>
          ) : (
            <HapticButton
              onClick={() => setRunning(false)}
              pressScale={0.95}
              className="w-full py-4 rounded-2xl bg-white/10 border border-white/20
                         text-white font-bold text-xl active:bg-white/20 transition-colors"
            >
              עצור
            </HapticButton>
          )}

          {/* Audio toggle — prominent pill */}
          <audio ref={audioRef} src="/calm-breathing.mp3" loop />
          <HapticButton
            onClick={toggleAudio}
            pressScale={0.93}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold text-sm
                        border transition-all duration-300
                        ${isPlaying
                          ? 'bg-violet-500/25 border-violet-400/50 text-violet-200 shadow-lg shadow-violet-500/20'
                          : 'bg-white/8  border-white/20  text-white/45'}`}
          >
            {isPlaying
              ? <Volume2 size={18} className="text-violet-300" />
              : <VolumeX size={18} />}
            {isPlaying ? 'מוזיקה פועלת' : 'הפעל מוזיקה'}
          </HapticButton>
        </div>

      </div>
    </div>
  );
}
