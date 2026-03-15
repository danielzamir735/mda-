import { X, Heart, Users } from 'lucide-react';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FLOATING_HEARTS = [
  { size: 16, top: '6%',  left: '8%',  delay: '0s',   duration: '4.2s', opacity: 0.15 },
  { size: 10, top: '12%', left: '82%', delay: '1.1s', duration: '5.5s', opacity: 0.12 },
  { size: 20, top: '28%', left: '90%', delay: '0.6s', duration: '6s',   opacity: 0.10 },
  { size:  9, top: '48%', left: '4%',  delay: '2.2s', duration: '4.8s', opacity: 0.13 },
  { size: 14, top: '62%', left: '78%', delay: '0.3s', duration: '5.2s', opacity: 0.11 },
  { size: 12, top: '74%', left: '20%', delay: '1.7s', duration: '4.3s', opacity: 0.14 },
  { size: 18, top: '86%', left: '58%', delay: '0.9s', duration: '6.8s', opacity: 0.09 },
  { size: 11, top: '18%', left: '48%', delay: '2.8s', duration: '5.1s', opacity: 0.10 },
  { size:  8, top: '40%', left: '65%', delay: '1.5s', duration: '4.6s', opacity: 0.12 },
];

export default function SupportModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto" dir="rtl">

      {/* ── Background ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(170deg, #0c0b14 0%, #11071c 35%, #160823 65%, #0a0b14 100%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 75% 55% at 50% 22%, rgba(220,38,90,0.16) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 92%, rgba(159,18,57,0.09) 0%, transparent 65%)',
        }}
      />

      {/* ── Floating hearts ── */}
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

      {/* ── Content ── */}
      <div
        className="relative z-10 flex flex-col flex-1 px-6"
        style={{
          paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Close */}
        <div className="flex justify-start mb-5">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/8 border border-white/12
                       flex items-center justify-center active:scale-90
                       transition-all duration-200 text-white/40 hover:text-white/70
                       hover:bg-white/12"
            aria-label="סגור"
          >
            <X size={17} />
          </button>
        </div>

        {/* ── Hero ── */}
        <div className="flex flex-col items-center text-center gap-7">

          {/* Pulsing heart cluster */}
          <div className="relative flex items-center justify-center" style={{ height: 144 }}>
            <div
              className="absolute rounded-full border border-rose-500/15"
              style={{ width: 130, height: 130, animation: 'ringExpand 3s ease-out infinite' }}
            />
            <div
              className="absolute rounded-full bg-rose-500/8"
              style={{ width: 108, height: 108, animation: 'heartPing 2.6s ease-in-out infinite' }}
            />
            <div
              className="absolute rounded-full bg-rose-400/12"
              style={{ width: 82, height: 82, animation: 'heartPing 2.6s ease-in-out 0.55s infinite' }}
            />
            <div
              className="absolute rounded-full"
              style={{
                width: 78,
                height: 78,
                background:
                  'radial-gradient(circle at 40% 35%, rgba(255,80,110,0.32) 0%, rgba(200,30,80,0.15) 60%, transparent 100%)',
                border: '1px solid rgba(255,100,130,0.22)',
                backdropFilter: 'blur(6px)',
              }}
            />
            <Heart
              size={40}
              className="text-rose-400 relative z-10"
              fill="currentColor"
              style={{
                filter:
                  'drop-shadow(0 0 18px rgba(220,38,90,0.95)) drop-shadow(0 0 6px rgba(255,120,150,0.6))',
                animation: 'heartbeat 2.6s ease-in-out infinite',
              }}
            />
          </div>

          {/* Partnership badge */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-500/28 bg-rose-500/10">
            <Users size={13} className="text-rose-300" />
            <span className="text-rose-300 text-xs font-bold tracking-wide">שותפות לחיים</span>
          </div>

          {/* ── Headline ── */}
          <div className="flex flex-col gap-0.5 max-w-[19rem]">
            <h1
              className="font-black text-[1.65rem] leading-tight tracking-tight"
              style={{
                background:
                  'linear-gradient(135deg, #fecdd3 0%, #fb7185 35%, #f43f5e 65%, #e11d48 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              שותפים לדרך,
            </h1>
            <h1
              className="font-black text-[1.65rem] leading-tight tracking-tight"
              style={{
                background:
                  'linear-gradient(135deg, #fecdd3 0%, #fb7185 35%, #f43f5e 65%, #e11d48 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              שותפים להצלת חיים
            </h1>
          </div>

          {/* Divider */}
          <div
            className="h-px w-24 rounded-full"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(244,63,94,0.55), transparent)',
            }}
          />

          {/* ── Body text ── */}
          <div className="flex flex-col gap-4 max-w-[19rem] text-right">
            <p className="text-white/78 text-[0.9rem] leading-[1.75] font-medium">
              האפליקציה הזו נבנתה נטו מתוך אהבה והערכה לעבודת הקודש שאתם עושים,
              במטרה אחת: לתת לכם שקט נפשי בשטח.
            </p>
            <p className="text-white/55 text-[0.85rem] leading-[1.75]">
              היום, כשהיא כבר משרתת מאות אנשי רפואת חירום ברחבי הארץ — כל שותפות,
              גדולה כקטנה, מכסה את העלויות, נותן לנו כוח להמשיך לפתח, ומאפשר לנו
              להציל חיים – יחד איתכם.
            </p>
          </div>

          {/* ── Buttons ── */}
          <div className="flex flex-col gap-4 w-full max-w-[19rem] pt-2">

            {/* Bit */}
            <a
              href="https://bit.co.il"
              target="_blank"
              rel="noopener noreferrer"
              className="relative overflow-hidden flex items-center justify-center gap-3
                         rounded-2xl px-6 py-[1.1rem] text-white font-black text-lg
                         active:scale-[0.96] transition-transform duration-150 select-none"
              style={{
                background:
                  'linear-gradient(135deg, #2563eb 0%, #1d4ed8 55%, #1e40af 100%)',
                boxShadow:
                  '0 12px 44px rgba(37,99,235,0.50), 0 2px 10px rgba(0,0,0,0.35)',
                animation: 'floatBtn 3.4s ease-in-out 0.4s infinite',
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.11) 50%, transparent 65%)',
                  animation: 'shimmer 3.4s linear 0.4s infinite',
                }}
              />
              <Heart size={22} fill="currentColor" className="text-blue-200 relative z-10 shrink-0" />
              <span className="relative z-10">תרומה מהירה ב-Bit</span>
            </a>

            {/* PayBox */}
            <a
              href="https://www.paybox.co.il"
              target="_blank"
              rel="noopener noreferrer"
              className="relative overflow-hidden flex items-center justify-center gap-3
                         rounded-2xl px-6 py-[1.1rem] text-white font-black text-lg
                         active:scale-[0.96] transition-transform duration-150 select-none"
              style={{
                background:
                  'linear-gradient(135deg, #7c3aed 0%, #6d28d9 55%, #5b21b6 100%)',
                boxShadow:
                  '0 12px 44px rgba(124,58,237,0.50), 0 2px 10px rgba(0,0,0,0.35)',
                animation: 'floatBtn 3.4s ease-in-out 1.3s infinite',
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.11) 50%, transparent 65%)',
                  animation: 'shimmer 3.4s linear 1.3s infinite',
                }}
              />
              <Heart size={22} fill="currentColor" className="text-purple-200 relative z-10 shrink-0" />
              <span className="relative z-10">תרומה מהירה ב-PayBox</span>
            </a>

          </div>

          {/* ── Footer ── */}
          <p className="text-white/32 text-xs leading-relaxed text-center max-w-[17rem] pt-1 pb-2">
            תודה שאתם הלב הפועם של הפרויקט הזה. בזכותכם אנחנו כאן. ❤️
          </p>

        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes floatHeart {
          0%   { transform: translateY(0px)   rotate(-7deg) scale(1);   }
          100% { transform: translateY(-16px) rotate(7deg)  scale(1.12); }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1);    }
          14%       { transform: scale(1.18); }
          28%       { transform: scale(1);    }
          42%       { transform: scale(1.10); }
          56%       { transform: scale(1);    }
        }
        @keyframes heartPing {
          0%        { transform: scale(0.85); opacity: 0.7; }
          60%, 100% { transform: scale(1.35); opacity: 0;   }
        }
        @keyframes ringExpand {
          0%        { transform: scale(0.9);  opacity: 0.6; }
          70%, 100% { transform: scale(1.45); opacity: 0;   }
        }
        @keyframes floatBtn {
          0%, 100% { transform: translateY(0px);  }
          50%      { transform: translateY(-5px); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%);  }
        }
      `}</style>
    </div>
  );
}
