import { useNavigate } from 'react-router-dom';
import { Heart, Users, ArrowRight, Fuel } from 'lucide-react';

const FLOATING_HEARTS = [
  { size: 18, top: '4%',  left: '6%',  delay: '0s',   duration: '4.2s', opacity: 0.14 },
  { size: 11, top: '10%', left: '84%', delay: '1.1s', duration: '5.5s', opacity: 0.11 },
  { size: 22, top: '25%', left: '91%', delay: '0.6s', duration: '6s',   opacity: 0.09 },
  { size:  9, top: '45%', left: '3%',  delay: '2.2s', duration: '4.8s', opacity: 0.12 },
  { size: 15, top: '60%', left: '79%', delay: '0.3s', duration: '5.2s', opacity: 0.10 },
  { size: 13, top: '72%', left: '18%', delay: '1.7s', duration: '4.3s', opacity: 0.13 },
  { size: 20, top: '84%', left: '55%', delay: '0.9s', duration: '6.8s', opacity: 0.08 },
  { size: 10, top: '16%', left: '46%', delay: '2.8s', duration: '5.1s', opacity: 0.09 },
  { size:  8, top: '38%', left: '63%', delay: '1.5s', duration: '4.6s', opacity: 0.11 },
  { size: 16, top: '90%', left: '30%', delay: '3.1s', duration: '5.8s', opacity: 0.10 },
];

export default function SupportPage() {
  const navigate = useNavigate();

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
            'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(220,38,90,0.18) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 95%, rgba(159,18,57,0.10) 0%, transparent 65%)',
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
          paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Back button */}
        <div className="flex justify-start mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 border border-white/12
                       text-white/60 hover:text-white/90 hover:bg-white/12
                       active:scale-90 transition-all duration-200 text-sm font-medium"
            aria-label="חזור"
          >
            <ArrowRight size={16} />
            <span>חזור</span>
          </button>
        </div>

        {/* ── Hero ── */}
        <div className="flex flex-col items-center text-center gap-6">

          {/* Pulsing heart cluster */}
          <div className="relative flex items-center justify-center" style={{ height: 160 }}>
            <div
              className="absolute rounded-full border border-rose-500/15"
              style={{ width: 148, height: 148, animation: 'ringExpand 3s ease-out infinite' }}
            />
            <div
              className="absolute rounded-full bg-rose-500/8"
              style={{ width: 122, height: 122, animation: 'heartPing 2.6s ease-in-out infinite' }}
            />
            <div
              className="absolute rounded-full bg-rose-400/12"
              style={{ width: 94, height: 94, animation: 'heartPing 2.6s ease-in-out 0.55s infinite' }}
            />
            <div
              className="absolute rounded-full"
              style={{
                width: 88,
                height: 88,
                background:
                  'radial-gradient(circle at 40% 35%, rgba(255,80,110,0.34) 0%, rgba(200,30,80,0.16) 60%, transparent 100%)',
                border: '1px solid rgba(255,100,130,0.24)',
                backdropFilter: 'blur(8px)',
              }}
            />
            <Heart
              size={46}
              className="text-rose-400 relative z-10"
              fill="currentColor"
              style={{
                filter:
                  'drop-shadow(0 0 22px rgba(220,38,90,0.99)) drop-shadow(0 0 8px rgba(255,120,150,0.65))',
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
          <div className="flex flex-col gap-1 max-w-xs">
            <h1
              className="font-black text-[2rem] leading-tight tracking-tight"
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
              className="font-black text-[2rem] leading-tight tracking-tight"
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
            className="h-px w-28 rounded-full"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(244,63,94,0.6), transparent)',
            }}
          />

          {/* ── Body text ── */}
          <div className="flex flex-col gap-5 max-w-sm text-right">
            <p className="text-white/85 text-[1rem] leading-[1.85] font-medium">
              האפליקציה הזו נבנתה נטו מתוך אהבה והערכה לעבודת הקודש שאתם עושים,
              במטרה אחת: לתת לכם שקט נפשי בשטח. היום, כשהיא כבר משרתת מאות אנשי
              רפואת חירום בכל משמרת, עלויות הפיתוח ותחזוקת השרתים שלנו הולכות וגדלות.
            </p>
            <p className="text-white/70 text-[0.95rem] leading-[1.85]">
              הפרויקט הזה הוא שלכם ובשבילכם. אנחנו מזמינים אתכם להיות הכוח שמניע
              אותנו קדימה, כדי שנוכל להמשיך להשקיע בכם, להוסיף יכולות חדשות ולשמור
              על 'חובש +' נקייה, מקצועית ובשירות מלא עבורכם.
            </p>
          </div>

          {/* ── CTA card ── */}
          <div
            className="w-full max-w-sm rounded-2xl p-5 text-right"
            style={{
              background: 'linear-gradient(135deg, rgba(244,63,94,0.13) 0%, rgba(159,18,57,0.08) 100%)',
              border: '1px solid rgba(244,63,94,0.22)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Fuel size={18} className="text-rose-300 shrink-0" />
              <span
                className="font-black text-[1.1rem]"
                style={{
                  background: 'linear-gradient(135deg, #fda4af 0%, #fb7185 60%, #f43f5e 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                תנו לנו קצת דלק למנוע!
              </span>
            </div>
            <p className="text-white/72 text-[0.92rem] leading-[1.8]">
              כל פרגון שלכם מכסה ישירות את העלויות, נותן לנו כוח להמשיך לפתח,
              ומאפשר לנו להציל חיים – יחד איתכם.
            </p>
          </div>

          {/* ── Donation buttons ── */}
          <div className="flex flex-col gap-4 w-full max-w-sm pt-1">

            {/* Bit */}
            <a
              href="https://bit.co.il"
              target="_blank"
              rel="noopener noreferrer"
              className="relative overflow-hidden flex items-center justify-center gap-3
                         rounded-2xl px-6 py-[1.2rem] text-white font-black text-xl
                         active:scale-[0.96] transition-transform duration-150 select-none"
              style={{
                background:
                  'linear-gradient(135deg, #2563eb 0%, #1d4ed8 55%, #1e40af 100%)',
                boxShadow:
                  '0 14px 48px rgba(37,99,235,0.52), 0 2px 10px rgba(0,0,0,0.35)',
                animation: 'floatBtn 3.4s ease-in-out 0.4s infinite',
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%)',
                  animation: 'shimmer 3.4s linear 0.4s infinite',
                }}
              />
              <Heart size={24} fill="currentColor" className="text-blue-200 relative z-10 shrink-0" />
              <span className="relative z-10">תרומה מהירה ב-Bit</span>
            </a>

            {/* PayBox */}
            <a
              href="https://www.paybox.co.il"
              target="_blank"
              rel="noopener noreferrer"
              className="relative overflow-hidden flex items-center justify-center gap-3
                         rounded-2xl px-6 py-[1.2rem] text-white font-black text-xl
                         active:scale-[0.96] transition-transform duration-150 select-none"
              style={{
                background:
                  'linear-gradient(135deg, #7c3aed 0%, #6d28d9 55%, #5b21b6 100%)',
                boxShadow:
                  '0 14px 48px rgba(124,58,237,0.52), 0 2px 10px rgba(0,0,0,0.35)',
                animation: 'floatBtn 3.4s ease-in-out 1.3s infinite',
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%)',
                  animation: 'shimmer 3.4s linear 1.3s infinite',
                }}
              />
              <Heart size={24} fill="currentColor" className="text-purple-200 relative z-10 shrink-0" />
              <span className="relative z-10">תרומה מהירה ב-PayBox</span>
            </a>

          </div>

          {/* ── Footer ── */}
          <p className="text-white/30 text-sm leading-relaxed text-center max-w-xs pt-2 pb-3">
            תודה שאתם הלב הפועם של הפרויקט הזה. בזכותכם אנחנו כאן. ❤️
          </p>

        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes floatHeart {
          0%   { transform: translateY(0px)   rotate(-8deg) scale(1);    }
          100% { transform: translateY(-18px) rotate(8deg)  scale(1.14); }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1);    }
          14%       { transform: scale(1.2);  }
          28%       { transform: scale(1);    }
          42%       { transform: scale(1.12); }
          56%       { transform: scale(1);    }
        }
        @keyframes heartPing {
          0%        { transform: scale(0.85); opacity: 0.7; }
          60%, 100% { transform: scale(1.38); opacity: 0;   }
        }
        @keyframes ringExpand {
          0%        { transform: scale(0.9);  opacity: 0.6; }
          70%, 100% { transform: scale(1.5);  opacity: 0;   }
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
