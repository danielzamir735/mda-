import { X, Wind, Flame } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';

type Phase = 'idle' | 'inhale' | 'exhale';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Inline flower SVG — lucide doesn't guarantee Flower2 in all versions
function FlowerIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2a4 4 0 0 1 4 4c0 2.2-1.8 4-4 4a4 4 0 0 1-4-4 4 4 0 0 1 4-4z" />
      <path d="M12 14a4 4 0 0 1 4 4c0 2.2-1.8 4-4 4a4 4 0 0 1-4-4 4 4 0 0 1 4-4z" />
      <path d="M2 12a4 4 0 0 1 4-4c2.2 0 4 1.8 4 4a4 4 0 0 1-4 4 4 4 0 0 1-4-4z" />
      <path d="M14 12a4 4 0 0 1 4-4c2.2 0 4 1.8 4 4a4 4 0 0 1-4 4 4 4 0 0 1-4-4z" />
    </svg>
  );
}

export default function BreathingSynchronizer({ isOpen, onClose }: Props) {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');

  useModalBackHandler(isOpen, onClose);

  // Breathing state machine: inhale 4s → exhale 6s → loop
  useEffect(() => {
    if (!isRunning) {
      setPhase('idle');
      return;
    }
    if (phase === 'idle') {
      setPhase('inhale');
      return;
    }
    const duration = phase === 'inhale' ? 4000 : 6000;
    const next: Phase = phase === 'inhale' ? 'exhale' : 'inhale';
    const t = setTimeout(() => setPhase(next), duration);
    return () => clearTimeout(t);
  }, [isRunning, phase]);

  // Stop + reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false);
      setPhase('idle');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Sphere scale values
  const scale = phase === 'inhale' ? 1 : phase === 'exhale' ? 0.44 : 0.65;
  const transitionDuration = phase === 'inhale' ? '4s' : phase === 'exhale' ? '6s' : '0.6s';

  const phaseLabel =
    phase === 'inhale' ? 'שאיפה עמוקה' :
    phase === 'exhale' ? 'נשיפה ארוכה' :
    'לחץ התחל';

  const phaseSubLabel =
    phase === 'inhale' ? '(הרחת פרח)' :
    phase === 'exhale' ? '(כיבוי נר)' :
    '';

  return (
    <div className="fixed inset-0 z-[65] flex flex-col bg-[#05050A]">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Wind size={20} className="text-sky-400" />
          <h2 className="text-white font-bold text-xl">מסנכרן נשימות</h2>
        </div>
        <HapticButton
          onClick={() => { setIsRunning(false); onClose(); }}
          pressScale={0.88}
          className="w-10 h-10 rounded-full bg-white/10 border border-white/20
                     flex items-center justify-center text-white/70 hover:text-white"
          aria-label="סגור"
        >
          <X size={20} />
        </HapticButton>
      </div>

      {/* Main breathing area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 select-none">

        {/* Phase text — above sphere */}
        <div className="text-center min-h-[6rem] flex flex-col items-center justify-end gap-1">
          <p
            className="text-4xl font-black text-white leading-tight transition-all duration-500"
            style={{ opacity: phase === 'idle' ? 0.35 : 1 }}
          >
            {phaseLabel}
          </p>
          {phaseSubLabel && (
            <p className="text-xl font-semibold text-sky-300/80 transition-all duration-500">
              {phaseSubLabel}
            </p>
          )}
        </div>

        {/* Icon row */}
        <div className="h-12 flex items-center justify-center">
          {phase === 'inhale' && (
            <span
              className="text-sky-300 transition-all duration-700"
              style={{ opacity: 1, transform: 'scale(1)' }}
            >
              <FlowerIcon size={44} />
            </span>
          )}
          {phase === 'exhale' && (
            <span
              className="text-amber-400 transition-all duration-700"
              style={{ opacity: 1, transform: 'scale(1)' }}
            >
              <Flame size={44} />
            </span>
          )}
        </div>

        {/* Sphere */}
        <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
          {/* Outer glow ring — fades with scale */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'transparent',
              boxShadow: phase === 'inhale'
                ? '0 0 60px 20px rgba(56,189,248,0.25), 0 0 120px 40px rgba(14,165,233,0.15)'
                : '0 0 30px 8px rgba(56,189,248,0.12)',
              transform: `scale(${scale})`,
              transition: `transform ${transitionDuration} ease-in-out, box-shadow 1s ease-in-out`,
              borderRadius: '50%',
            }}
          />
          {/* Main sphere */}
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 38% 34%, #7DD3FC, #0EA5E9 55%, #0369A1)',
              boxShadow:
                '0 0 0 4px rgba(56,189,248,0.2), 0 0 40px rgba(14,165,233,0.4), inset 0 -10px 30px rgba(3,105,161,0.5)',
              transform: `scale(${scale})`,
              transition: `transform ${transitionDuration} ease-in-out`,
              willChange: 'transform',
            }}
          />
        </div>

        {/* Cycle info */}
        <p className="text-white/30 text-sm font-medium tracking-wide">
          {phase === 'inhale' ? '4 שניות שאיפה' : phase === 'exhale' ? '6 שניות נשיפה' : 'מחזור: 4 שניות שאיפה · 6 שניות נשיפה'}
        </p>
      </div>

      {/* Controls */}
      <div className="shrink-0 flex gap-4 px-6 pb-8 pt-4">
        {!isRunning ? (
          <HapticButton
            onClick={() => setIsRunning(true)}
            pressScale={0.95}
            className="flex-1 py-4 rounded-2xl bg-sky-500 text-white font-bold text-xl
                       shadow-lg shadow-sky-500/30 active:bg-sky-600 transition-colors"
          >
            התחל
          </HapticButton>
        ) : (
          <HapticButton
            onClick={() => setIsRunning(false)}
            pressScale={0.95}
            className="flex-1 py-4 rounded-2xl bg-white/10 border border-white/20
                       text-white font-bold text-xl active:bg-white/20 transition-colors"
          >
            עצור
          </HapticButton>
        )}
      </div>
    </div>
  );
}
