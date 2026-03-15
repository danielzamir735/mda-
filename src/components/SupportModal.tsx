import { X, Heart } from 'lucide-react';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FLOATING_HEARTS = [
  { size: 18, top: '8%',  left: '7%',  delay: '0s',    duration: '4s',   opacity: 0.18 },
  { size: 12, top: '15%', left: '85%', delay: '0.8s',  duration: '5s',   opacity: 0.14 },
  { size: 22, top: '30%', left: '92%', delay: '1.4s',  duration: '6s',   opacity: 0.12 },
  { size: 10, top: '50%', left: '5%',  delay: '2s',    duration: '4.5s', opacity: 0.16 },
  { size: 16, top: '65%', left: '80%', delay: '0.4s',  duration: '5.5s', opacity: 0.13 },
  { size: 14, top: '75%', left: '18%', delay: '1.8s',  duration: '4s',   opacity: 0.15 },
  { size: 20, top: '88%', left: '60%', delay: '1s',    duration: '6.5s', opacity: 0.10 },
  { size: 11, top: '20%', left: '45%', delay: '2.5s',  duration: '5s',   opacity: 0.12 },
];

export default function SupportModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" dir="rtl">
      {/* Full-screen premium background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(160deg, #0d0d14 0%, #130a1a 40%, #0f0010 70%, #0a0a12 100%)',
        }}
      />
      {/* Radial accent glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(225,30,80,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Floating hearts */}
      {FLOATING_HEARTS.map((h, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            top: h.top,
            left: h.left,
            opacity: h.opacity,
            animation: `floatHeart ${h.duration} ease-in-out ${h.delay} infinite alternate`,
          }}
        >
          <Heart size={h.size} className="text-rose-400" fill="currentColor" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 px-6 pt-safe-top pb-safe-bottom"
           style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>

        {/* Close button */}
        <div className="flex justify-start mb-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/15
                       flex items-center justify-center active:scale-90 transition-transform
                       text-white/50 hover:text-white"
            aria-label="סגור"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hero section */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-8">

          {/* Heart icon cluster */}
          <div className="relative flex items-center justify-center">
            <div
              className="absolute rounded-full bg-rose-500/10 animate-ping"
              style={{ width: 110, height: 110, animationDuration: '2.8s' }}
            />
            <div
              className="absolute rounded-full bg-rose-500/20 animate-ping"
              style={{ width: 80, height: 80, animationDuration: '2.8s', animationDelay: '0.6s' }}
            />
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'radial-gradient(circle, rgba(225,30,80,0.3) 0%, rgba(225,30,80,0.08) 100%)' }}
            >
              <Heart size={34} className="text-rose-400" fill="currentColor" style={{ filter: 'drop-shadow(0 0 10px rgba(225,30,80,0.8))' }} />
            </div>
          </div>

          {/* Headline */}
          <div className="flex flex-col gap-3">
            <h1 className="text-white font-black text-3xl leading-tight tracking-tight">
              תמכו במשימה
            </h1>
            <div
              className="h-0.5 w-16 mx-auto rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(225,30,80,0.7), transparent)' }}
            />
          </div>

          {/* Copy block */}
          <div className="flex flex-col gap-4 max-w-xs">
            <p className="text-white/85 text-lg leading-relaxed font-medium">
              האפליקציה הזו נולדה מתוך רצון אחד פשוט —
            </p>
            <p className="text-rose-300 font-bold text-xl leading-snug">
              לעזור לחובשים להציל חיים.
            </p>
            <p className="text-white/60 text-base leading-relaxed">
              פותחה בהתנדבות מלאה, בחינם לכל הצוות הרפואי, ללא מטרות רווח.
            </p>
            <p className="text-white/45 text-sm leading-relaxed">
              כל תמיכה — גדולה כקטנה — שומרת את האפליקציה חיה ומתפתחת עבורכם.
            </p>
          </div>

          {/* Donation buttons */}
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <a
              href="https://bit.co.il"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 font-black text-lg rounded-2xl px-6 py-5
                         text-white active:scale-[0.96] transition-transform shadow-xl
                         hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
                boxShadow: '0 8px 32px rgba(26,115,232,0.4)',
                animation: 'subtleBounce 3s ease-in-out 0.5s infinite',
              }}
            >
              <Heart size={22} fill="currentColor" className="text-blue-200" />
              תרומה בביט
            </a>

            <a
              href="https://www.paybox.co.il"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 font-black text-lg rounded-2xl px-6 py-5
                         text-white active:scale-[0.96] transition-transform shadow-xl
                         hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
                boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
                animation: 'subtleBounce 3s ease-in-out 1.2s infinite',
              }}
            >
              <Heart size={22} fill="currentColor" className="text-purple-200" />
              תרומה ב-PayBox
            </a>
          </div>

          {/* Footer note */}
          <p className="text-white/25 text-xs leading-relaxed pb-2">
            תודה מעומק הלב על כל תמיכה 🙏
          </p>

        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes floatHeart {
          0%   { transform: translateY(0px) rotate(-8deg) scale(1); }
          100% { transform: translateY(-18px) rotate(8deg) scale(1.1); }
        }
        @keyframes subtleBounce {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
