import { X, Wind, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';

type Phase = 'idle' | 'inhale' | 'exhale';

const PETAL_ANGLES = [0, 60, 120, 180, 240, 300];

function FlowerSVG({ phase }: { phase: Phase }) {
  const inhale = phase === 'inhale';
  const dur = phase === 'inhale' ? '4s' : phase === 'exhale' ? '6s' : '0.5s';
  const petalScale = inhale ? 1 : phase === 'exhale' ? 0.34 : 0.55;
  const petalStop0 = inhale ? '#CFFAFE' : '#EDE9FE';
  const petalStop1 = inhale ? '#22D3EE' : '#818CF8';
  const centerOuter = inhale ? '#E0F7FA' : '#EDE9FE';
  const centerInner = inhale ? '#06B6D4' : '#6366F1';
  const glowColor = inhale ? 'rgba(34,211,238,0.55)' : 'rgba(99,102,241,0.45)';

  return (
    <svg viewBox="0 0 200 200" width={250} height={250} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="bs-pg" cx="50%" cy="25%" r="75%">
          <stop offset="0%" stopColor={petalStop0} />
          <stop offset="100%" stopColor={petalStop1} />
        </radialGradient>
        <filter id="bs-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer ambient ring */}
      <circle
        cx={100} cy={100}
        r={82}
        fill="none"
        stroke={petalStop1}
        strokeWidth={1}
        opacity={inhale ? 0.22 : 0.08}
        style={{ transition: `opacity ${dur} ease-in-out, stroke ${dur} ease-in-out` }}
      />

      {/* Petals + center, scaled from origin */}
      <g
        filter="url(#bs-glow)"
        style={{
          transformOrigin: '100px 100px',
          transform: `scale(${petalScale})`,
          transition: `transform ${dur} cubic-bezier(0.4,0,0.2,1)`,
        }}
      >
        {PETAL_ANGLES.map((a) => (
          <ellipse
            key={a}
            cx={100}
            cy={64}
            rx={15}
            ry={34}
            fill="url(#bs-pg)"
            opacity={0.9}
            transform={`rotate(${a}, 100, 100)`}
            style={{ transition: `opacity ${dur} ease-in-out` }}
          />
        ))}
        {/* Petal shimmer overlay (translucent white highlight) */}
        {PETAL_ANGLES.map((a) => (
          <ellipse
            key={`h-${a}`}
            cx={97}
            cy={60}
            rx={5}
            ry={12}
            fill="white"
            opacity={0.18}
            transform={`rotate(${a}, 100, 100)`}
          />
        ))}
        <circle cx={100} cy={100} r={19}
          fill={centerOuter}
          style={{ transition: `fill ${dur} ease-in-out` }}
        />
        <circle cx={100} cy={100} r={10}
          fill={centerInner}
          style={{ transition: `fill ${dur} ease-in-out` }}
        />
      </g>

      {/* Outer glow pulse ring (separate layer so it doesn't scale with petals) */}
      <circle
        cx={100} cy={100}
        r={inhale ? 96 : 40}
        fill="none"
        stroke={glowColor}
        strokeWidth={inhale ? 18 : 6}
        opacity={inhale ? 0.12 : 0.05}
        style={{
          transition: `r ${dur} ease-in-out, stroke-width ${dur} ease-in-out, opacity ${dur} ease-in-out`,
          filter: 'blur(8px)',
        }}
      />
    </svg>
  );
}

interface Props { isOpen: boolean; onClose: () => void; }

export default function BreathingSynchronizer({ isOpen, onClose }: Props) {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [muted, setMuted] = useState(true);

  useModalBackHandler(isOpen, onClose);

  useEffect(() => {
    if (!running) { setPhase('idle'); return; }
    if (phase === 'idle') { setPhase('inhale'); return; }
    const ms = phase === 'inhale' ? 4000 : 6000;
    const next: Phase = phase === 'inhale' ? 'exhale' : 'inhale';
    const t = setTimeout(() => setPhase(next), ms);
    return () => clearTimeout(t);
  }, [running, phase]);

  useEffect(() => {
    if (!isOpen) { setRunning(false); setPhase('idle'); }
  }, [isOpen]);

  if (!isOpen) return null;

  const label    = phase === 'inhale' ? 'שאיפה עמוקה'  : phase === 'exhale' ? 'נשיפה ארוכה'   : 'לחץ התחל';
  const sublabel = phase === 'inhale' ? '(הרחת פרח)'   : phase === 'exhale' ? '(כיבוי נר)'    : '';
  const cycleHint = phase === 'inhale' ? '4 שניות שאיפה' : phase === 'exhale' ? '6 שניות נשיפה' : '4 שניות שאיפה · 6 שניות נשיפה';

  return (
    <div className="fixed inset-0 z-[65] flex flex-col overflow-hidden">
      {/* Animated gradient background */}
      <style>{`
        @keyframes bs-bg {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .bs-bg {
          background: linear-gradient(135deg,#020617,#0d0a2e,#042f2e,#150828,#020617);
          background-size: 500% 500%;
          animation: bs-bg 14s ease infinite;
        }
      `}</style>
      <div className="bs-bg absolute inset-0" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10">
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

        {/* Main area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 select-none">

          {/* Phase text */}
          <div className="text-center min-h-[5.5rem] flex flex-col items-center justify-end gap-1">
            <p
              className="text-4xl font-black text-white leading-tight"
              style={{
                opacity: phase === 'idle' ? 0.3 : 1,
                transition: 'opacity 0.6s ease-in-out',
                textShadow: phase === 'inhale' ? '0 0 24px rgba(34,211,238,0.7)' : phase === 'exhale' ? '0 0 24px rgba(99,102,241,0.7)' : 'none',
              }}
            >
              {label}
            </p>
            {sublabel && (
              <p
                className="text-lg font-semibold"
                style={{
                  color: phase === 'inhale' ? '#67E8F9' : '#A5B4FC',
                  transition: 'color 0.6s ease-in-out',
                }}
              >
                {sublabel}
              </p>
            )}
          </div>

          {/* Flower */}
          <FlowerSVG phase={phase} />

          {/* Cycle hint */}
          <p className="text-white/30 text-sm font-medium tracking-wide">{cycleHint}</p>

          {/* Audio element + mute toggle */}
          <audio id="bs-audio" src="" loop autoPlay muted={muted} />
          <HapticButton
            onClick={() => setMuted(m => !m)}
            pressScale={0.92}
            className="flex items-center gap-1.5 text-white/35 text-xs active:opacity-60 transition-opacity"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {muted ? 'צליל: כבוי' : 'צליל: פועל'}
          </HapticButton>
        </div>

        {/* Controls */}
        <div className="shrink-0 flex gap-4 px-6 pb-8 pt-4">
          {!running ? (
            <HapticButton
              onClick={() => setRunning(true)}
              pressScale={0.95}
              className="flex-1 py-4 rounded-2xl bg-sky-500 text-white font-bold text-xl
                         shadow-lg shadow-sky-500/30 active:bg-sky-600 transition-colors"
            >
              התחל
            </HapticButton>
          ) : (
            <HapticButton
              onClick={() => setRunning(false)}
              pressScale={0.95}
              className="flex-1 py-4 rounded-2xl bg-white/10 border border-white/20
                         text-white font-bold text-xl active:bg-white/20 transition-colors"
            >
              עצור
            </HapticButton>
          )}
        </div>
      </div>
    </div>
  );
}
