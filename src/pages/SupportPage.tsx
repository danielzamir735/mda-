import { useNavigate } from 'react-router-dom';
import { Heart, ArrowRight, Users, Zap } from 'lucide-react';

/* tiny floating spark dots — subtle, not distracting */
const SPARKS = [
  { size: 3, top: '8%',  left: '12%', delay: '0s',   dur: '5s'  },
  { size: 2, top: '15%', left: '78%', delay: '1.2s', dur: '6.5s' },
  { size: 4, top: '30%', left: '90%', delay: '0.5s', dur: '4.8s' },
  { size: 2, top: '55%', left: '5%',  delay: '2s',   dur: '5.5s' },
  { size: 3, top: '70%', left: '85%', delay: '1.7s', dur: '4.2s' },
  { size: 2, top: '82%', left: '22%', delay: '0.9s', dur: '6s'   },
  { size: 3, top: '92%', left: '60%', delay: '3s',   dur: '5.2s' },
];

export default function SupportPage() {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col overflow-hidden"
      dir="rtl"
      style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}
    >

      {/* ── Background layers ── */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(160deg, #0a0608 0%, #12030c 40%, #0e0507 70%, #090408 100%)',
      }} />
      {/* warm amber glow — top center */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 90% 45% at 50% 0%, rgba(234,88,12,0.18) 0%, transparent 70%)',
      }} />
      {/* rose glow — mid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 55% at 50% 48%, rgba(190,24,54,0.14) 0%, transparent 70%)',
      }} />
      {/* deep crimson bottom */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 35% at 50% 100%, rgba(159,18,57,0.12) 0%, transparent 65%)',
      }} />

      {/* subtle mesh grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{
        backgroundImage: 'linear-gradient(rgba(255,200,180,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,200,180,1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* floating sparks */}
      {SPARKS.map((s, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none bg-amber-300/40"
          style={{
            width: s.size, height: s.size,
            top: s.top, left: s.left,
            animation: `sparkFloat ${s.dur} ease-in-out ${s.delay} infinite alternate`,
          }}
        />
      ))}

      {/* ── Main content: full-height flex, no scroll ── */}
      <div
        className="relative z-10 flex flex-col h-full px-5"
        style={{
          paddingTop: 'max(0.9rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full
                     bg-white/6 border border-white/10 text-white/45 hover:text-white/75
                     active:scale-90 transition-all duration-200 mb-3"
          style={{ fontSize: '0.78rem', fontWeight: 600 }}
          aria-label="חזור"
        >
          <ArrowRight size={13} />
          <span>חזור</span>
        </button>

        {/* ── HERO: impact counter replacing pulsing heart ── */}
        <div className="flex flex-col items-center gap-2 mb-3">

          {/* Glowing people cluster */}
          <div className="relative flex items-center justify-center" style={{ height: 72 }}>
            {/* outer warm glow */}
            <div className="absolute rounded-full pointer-events-none" style={{
              width: 72, height: 72,
              background: 'radial-gradient(circle, rgba(234,88,12,0.22) 0%, transparent 70%)',
              animation: 'glowPulse 3s ease-in-out infinite',
            }} />
            {/* inner ring */}
            <div className="absolute rounded-full border pointer-events-none" style={{
              width: 58, height: 58,
              borderColor: 'rgba(251,146,60,0.25)',
              animation: 'glowPulse 3s ease-in-out 0.8s infinite',
            }} />
            {/* icon */}
            <Users
              size={30}
              className="relative z-10"
              style={{
                color: '#fb923c',
                filter: 'drop-shadow(0 0 10px rgba(234,88,12,0.9)) drop-shadow(0 0 3px rgba(251,146,60,0.7))',
              }}
            />
          </div>

          {/* Impact stats row */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="font-black text-2xl leading-none" style={{
                background: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 50%, #ea580c 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>500+</span>
              <span className="text-white/45 text-[0.62rem] font-semibold mt-0.5 tracking-wide">חובשים ומד"צים</span>
            </div>
            <div className="w-px h-8 bg-white/10 rounded-full" />
            <div className="flex flex-col items-center">
              <span className="font-black text-2xl leading-none" style={{
                background: 'linear-gradient(135deg, #fda4af 0%, #fb7185 50%, #f43f5e 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>24/7</span>
              <span className="text-white/45 text-[0.62rem] font-semibold mt-0.5 tracking-wide">בכל משמרת</span>
            </div>
            <div className="w-px h-8 bg-white/10 rounded-full" />
            <div className="flex flex-col items-center">
              <span className="font-black text-2xl leading-none" style={{
                background: 'linear-gradient(135deg, #d9f99d 0%, #86efac 50%, #4ade80 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>#1</span>
              <span className="text-white/45 text-[0.62rem] font-semibold mt-0.5 tracking-wide">אפליקציה לחובשים</span>
            </div>
          </div>
        </div>

        {/* ── Title ── */}
        <div className="text-center mb-2">
          <h1 className="font-black leading-tight" style={{
            fontSize: 'clamp(1.45rem, 5.5vw, 1.75rem)',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #ffe4e6 0%, #fda4af 25%, #fb7185 55%, #e11d48 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            שותפים לדרך, שותפים להצלת חיים
          </h1>
        </div>

        {/* thin divider */}
        <div className="flex justify-center mb-3">
          <div className="h-px w-20 rounded-full" style={{
            background: 'linear-gradient(90deg, transparent, rgba(251,113,133,0.55), transparent)',
          }} />
        </div>

        {/* ── Body text ── */}
        <div className="flex flex-col gap-2.5 text-right mb-3">
          <p className="text-white/78 leading-relaxed font-medium" style={{ fontSize: 'clamp(0.8rem, 3.2vw, 0.88rem)' }}>
            האפליקציה הזו נבנתה נטו מתוך אהבה והערכה לעבודת הקודש שאתם עושים, במטרה אחת:
            לתת לכם שקט נפשי בשטח. היום, כשהיא כבר משרתת מאות אנשי רפואת חירום בכל משמרת,
            עלויות הפיתוח ותחזוקת השרתים שלנו הולכות וגדלות.
          </p>
          <p className="text-white/55 leading-relaxed" style={{ fontSize: 'clamp(0.78rem, 3vw, 0.84rem)' }}>
            הפרויקט הזה הוא שלכם ובשבילכם. אנחנו מזמינים אתכם להיות הכוח שמניע אותנו קדימה,
            כדי שנוכל להמשיך להשקיע בכם, להוסיף יכולות חדשות ולשמור על 'חובש +' נקייה,
            מקצועית ובשירות מלא עבורכם.
          </p>
        </div>

        {/* ── CTA card ── */}
        <div className="rounded-2xl px-4 py-3 mb-3 text-right" style={{
          background: 'linear-gradient(135deg, rgba(234,88,12,0.16) 0%, rgba(190,24,54,0.10) 100%)',
          border: '1px solid rgba(251,146,60,0.22)',
        }}>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={15} className="text-amber-400 shrink-0" style={{
              filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.8))',
              animation: 'zapPulse 2s ease-in-out infinite',
            }} />
            <span className="font-black" style={{
              fontSize: 'clamp(0.88rem, 3.4vw, 0.95rem)',
              background: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 55%, #ea580c 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              תנו לנו קצת דלק למנוע!
            </span>
          </div>
          <p className="text-white/60" style={{ fontSize: 'clamp(0.75rem, 2.9vw, 0.82rem)', lineHeight: 1.65 }}>
            כל פרגון שלכם מכסה ישירות את העלויות, נותן לנו כוח להמשיך לפתח,
            ומאפשר לנו להציל חיים – יחד איתכם.
          </p>
        </div>

        {/* ── Donation buttons ── */}
        <div className="flex flex-col gap-2.5 mb-2">

          {/* Bit */}
          <a
            href="https://bit.co.il"
            target="_blank"
            rel="noopener noreferrer"
            className="relative overflow-hidden flex items-center justify-center gap-2.5
                       rounded-2xl px-5 text-white font-black
                       active:scale-[0.97] transition-transform duration-150 select-none"
            style={{
              paddingTop: '0.85rem', paddingBottom: '0.85rem',
              fontSize: 'clamp(0.95rem, 3.8vw, 1.05rem)',
              background: 'linear-gradient(135deg, #1d6dea 0%, #1a56d4 55%, #1740b0 100%)',
              boxShadow: '0 8px 32px rgba(29,109,234,0.48), 0 2px 8px rgba(0,0,0,0.3)',
              animation: 'floatBtn 3.4s ease-in-out 0.4s infinite',
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.13) 50%, transparent 70%)',
              animation: 'shimmer 3.2s linear 0.4s infinite',
            }} />
            <Heart size={19} fill="currentColor" className="text-blue-200 relative z-10 shrink-0" />
            <span className="relative z-10">תרומה מהירה ב-Bit</span>
          </a>

          {/* PayBox */}
          <a
            href="https://www.paybox.co.il"
            target="_blank"
            rel="noopener noreferrer"
            className="relative overflow-hidden flex items-center justify-center gap-2.5
                       rounded-2xl px-5 text-white font-black
                       active:scale-[0.97] transition-transform duration-150 select-none"
            style={{
              paddingTop: '0.85rem', paddingBottom: '0.85rem',
              fontSize: 'clamp(0.95rem, 3.8vw, 1.05rem)',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6527d4 55%, #5318b0 100%)',
              boxShadow: '0 8px 32px rgba(124,58,237,0.48), 0 2px 8px rgba(0,0,0,0.3)',
              animation: 'floatBtn 3.4s ease-in-out 1.4s infinite',
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.13) 50%, transparent 70%)',
              animation: 'shimmer 3.2s linear 1.4s infinite',
            }} />
            <Heart size={19} fill="currentColor" className="text-purple-200 relative z-10 shrink-0" />
            <span className="relative z-10">תרומה מהירה ב-PayBox</span>
          </a>

        </div>

        {/* Footer */}
        <p className="text-center text-white/28 shrink-0" style={{ fontSize: '0.72rem' }}>
          תודה שאתם הלב הפועם של הפרויקט הזה. בזכותכם אנחנו כאן ❤️
        </p>

      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes sparkFloat {
          0%   { transform: translateY(0)   scale(1);    opacity: 0.4; }
          100% { transform: translateY(-14px) scale(1.3); opacity: 0.15; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.7; transform: scale(1);    }
          50%       { opacity: 1;   transform: scale(1.12); }
        }
        @keyframes zapPulse {
          0%, 100% { transform: scale(1);    }
          50%       { transform: scale(1.2); }
        }
        @keyframes floatBtn {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(220%);  }
        }
      `}</style>
    </div>
  );
}
