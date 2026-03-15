import { useState, useEffect } from 'react';
import { X, Heart, Users, Check } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PARTICLES = [
  { w: 4, h: 4, top: '5%',  left: '8%',  delay: 0,   dur: 6.2, color: 'rgba(147,197,253,0.85)' },
  { w: 2, h: 2, top: '13%', left: '78%', delay: 1.2, dur: 7.8, color: 'rgba(255,255,255,0.70)'  },
  { w: 5, h: 5, top: '26%', left: '91%', delay: 0.5, dur: 5.9, color: 'rgba(186,230,253,0.65)'  },
  { w: 3, h: 3, top: '42%', left: '5%',  delay: 2.1, dur: 6.6, color: 'rgba(167,243,208,0.60)'  },
  { w: 2, h: 2, top: '59%', left: '84%', delay: 1.5, dur: 8.1, color: 'rgba(255,255,255,0.55)'  },
  { w: 4, h: 4, top: '72%', left: '17%', delay: 0.8, dur: 6.3, color: 'rgba(147,197,253,0.70)'  },
  { w: 5, h: 5, top: '86%', left: '55%', delay: 2.9, dur: 7.1, color: 'rgba(186,230,253,0.50)'  },
  { w: 2, h: 2, top: '20%', left: '43%', delay: 1.8, dur: 5.6, color: 'rgba(255,255,255,0.45)'  },
  { w: 3, h: 3, top: '64%', left: '66%', delay: 3.3, dur: 6.9, color: 'rgba(167,243,208,0.65)'  },
  { w: 2, h: 2, top: '34%', left: '29%', delay: 2.5, dur: 7.4, color: 'rgba(147,197,253,0.55)'  },
  { w: 3, h: 3, top: '78%', left: '37%', delay: 0.3, dur: 5.8, color: 'rgba(255,255,255,0.50)'  },
];

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.06 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};
const fadeIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function SupportModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [donated, setDonated] = useState<'bit' | 'paybox' | null>(null);

  // ── Counting animation: 0 → 2000 ──
  const [count, setCount] = useState(0);
  const [countDone, setCountDone] = useState(false);
  useEffect(() => {
    if (!isOpen) { setCount(0); setCountDone(false); return; }
    setCount(0);
    setCountDone(false);
    const TARGET = 2000;
    const DURATION = 1800;
    const STEP = 16;
    const increment = TARGET / (DURATION / STEP);
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= TARGET) {
        setCount(TARGET);
        setCountDone(true);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, STEP);
    return () => clearInterval(timer);
  }, [isOpen]);

  const handleDonate = (type: 'bit' | 'paybox', url: string) => {
    setDonated(type);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => setDonated(null), 2600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden" dir="rtl">

      {/* ══ BACKGROUND — deep dark blue-black ══ */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(155deg, #020817 0%, #050d1f 25%, #030a18 55%, #040b1a 80%, #020712 100%)',
      }} />
      {/* Top atmospheric glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 120% 55% at 50% -8%, rgba(59,130,246,0.16) 0%, rgba(37,99,235,0.08) 45%, transparent 70%)',
      }} />
      {/* Mid depth glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% 55%, rgba(30,58,138,0.10) 0%, transparent 65%)',
      }} />
      {/* Bottom warm accent */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 30% at 50% 105%, rgba(244,63,94,0.09) 0%, transparent 55%)',
      }} />

      {/* ══ LIFE PARTICLES — subtle drifting points of light ══ */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.w, height: p.h,
            top: p.top, left: p.left,
            background: p.color,
            boxShadow: `0 0 ${p.w * 5}px ${p.color}`,
          }}
          animate={{ y: [-6, 6], x: [-3, 3], opacity: [0.25, 0.9, 0.25], scale: [0.7, 1.3, 0.7] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* ══ CONTENT — single-screen flex column ══ */}
      <motion.div
        className="relative z-10 h-full flex flex-col overflow-hidden px-6"
        style={{
          paddingTop: 'max(0.9rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >

        {/* Close */}
        <motion.div variants={fadeIn} className="flex justify-start mb-1 shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/8 border border-white/10
                       flex items-center justify-center active:scale-90
                       transition-all duration-200 text-white/35 hover:text-white/65
                       hover:bg-white/12"
            aria-label="סגור"
          >
            <X size={16} />
          </button>
        </motion.div>

        {/* ── Hero + Counter ── */}
        <motion.div variants={fadeUp} className="flex flex-col items-center shrink-0">

          {/* Pulsing heart cluster */}
          <div className="relative flex items-center justify-center" style={{ height: 104 }}>
            <motion.div
              className="absolute rounded-full border border-rose-500/12"
              style={{ width: 96, height: 96 }}
              animate={{ scale: [0.9, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute rounded-full bg-rose-500/7"
              style={{ width: 76, height: 76 }}
              animate={{ scale: [0.85, 1.38], opacity: [0.6, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute rounded-full bg-rose-400/10"
              style={{ width: 58, height: 58 }}
              animate={{ scale: [0.85, 1.38], opacity: [0.6, 0] }}
              transition={{ duration: 2.8, delay: 0.55, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute rounded-full" style={{
              width: 58, height: 58,
              background: 'radial-gradient(circle at 40% 35%, rgba(255,80,110,0.28) 0%, rgba(200,30,80,0.12) 60%, transparent 100%)',
              border: '1px solid rgba(255,100,130,0.18)',
              backdropFilter: 'blur(6px)',
            }} />
            <motion.div
              animate={{ scale: [1, 1.18, 1, 1.1, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Heart size={32} fill="currentColor" style={{
                color: '#fb7185',
                filter: 'drop-shadow(0 0 14px rgba(220,38,90,0.90)) drop-shadow(0 0 5px rgba(255,120,150,0.55))',
              }} />
            </motion.div>
          </div>

          {/* Counter: 0 → 2000+ */}
          <div className="flex flex-col items-center gap-0.5 mt-0.5">
            <div className="flex items-end gap-0.5 leading-none">
              <span className="font-black tabular-nums" style={{
                fontSize: 'clamp(2.8rem, 11vw, 3.4rem)',
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #fecdd3 0%, #fb7185 35%, #f43f5e 65%, #e11d48 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 16px rgba(244,63,94,0.60))',
              }}>
                {count.toLocaleString('he-IL')}
              </span>
              {countDone && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="font-black"
                  style={{
                    fontSize: 'clamp(2.2rem, 8.5vw, 2.8rem)',
                    background: 'linear-gradient(135deg, #fecdd3 0%, #fb7185 35%, #f43f5e 65%, #e11d48 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                  }}>+</motion.span>
              )}
            </div>
            <p className="text-white/65 font-bold" style={{
              fontSize: 'clamp(0.68rem, 2.8vw, 0.82rem)',
              letterSpacing: '0.20em',
              textTransform: 'uppercase',
            }}>אנשי רפואת חירום</p>
            <p className="text-white/35 font-medium" style={{ fontSize: 'clamp(0.60rem, 2.2vw, 0.68rem)', letterSpacing: '0.06em' }}>
              משתמשים בחובש+ בכל משמרת
            </p>
          </div>

          {/* Partnership badge */}
          <div className="flex items-center gap-2 px-4 py-1 rounded-full mt-2" style={{
            border: '1px solid rgba(59,130,246,0.30)',
            background: 'rgba(59,130,246,0.10)',
          }}>
            <Users size={12} style={{ color: '#93c5fd' }} />
            <span style={{ color: '#93c5fd', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em' }}>שותפות לחיים</span>
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div variants={fadeIn} className="flex justify-center my-3 shrink-0">
          <div className="h-px w-28 rounded-full" style={{
            background: 'linear-gradient(90deg, transparent, rgba(99,179,237,0.55), transparent)',
          }} />
        </motion.div>

        {/* ── Headline ── */}
        <motion.h1
          variants={fadeUp}
          className="text-center font-black leading-tight tracking-tight shrink-0"
          style={{
            fontSize: 'clamp(1.7rem, 7vw, 2.3rem)',
            background: 'linear-gradient(135deg, #ffe4e6 0%, #fda4af 22%, #fb7185 50%, #f43f5e 75%, #be123c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 22px rgba(244,63,94,0.40))',
          }}
        >
          שותפים לדרך,{' '}שותפים להצלת חיים
        </motion.h1>

        {/* ── Body text ── */}
        <motion.div variants={fadeUp} className="text-right mt-3 shrink-0">
          <p className="text-white/82 font-medium mb-2" style={{ fontSize: 'clamp(0.90rem, 3.6vw, 1.0rem)', lineHeight: 1.72 }}>
            האפליקציה הזאת נבנתה נטו מתוך אהבה והתנדבות, כדי לתת לכם את הכלי הכי חזק ומהיר בזמן אמת – בלי פרסומות ובלי כאב ראש.
          </p>
          <p className="text-white/55" style={{ fontSize: 'clamp(0.84rem, 3.3vw, 0.92rem)', lineHeight: 1.70 }}>
            כל שותפות מכסה את העלויות, נותנת כוח להמשיך לפתח, ומאפשרת להציל חיים – יחד איתכם.
          </p>
        </motion.div>

        {/* ── Donation buttons ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 mt-4 shrink-0">

          {/* Bit */}
          <motion.button
            onClick={() => handleDonate('bit', 'https://bit.co.il')}
            className="relative overflow-hidden flex items-center justify-center gap-3 rounded-2xl text-white font-black select-none w-full"
            style={{
              paddingTop: '1.55rem', paddingBottom: '1.55rem',
              fontSize: 'clamp(0.97rem, 4vw, 1.1rem)',
              background: 'linear-gradient(135deg, #1d6dea 0%, #1a56d4 55%, #1740b0 100%)',
              boxShadow: '0 8px 36px rgba(29,109,234,0.55), 0 2px 8px rgba(0,0,0,0.35)',
            }}
            whileHover={{ scale: 1.025, boxShadow: '0 14px 50px rgba(29,109,234,0.72)' }}
            whileTap={{ scale: 0.97 }}
          >
            <ShimmerLayer />
            {donated === 'bit' ? (
              <motion.div
                className="absolute inset-0 flex items-center justify-center rounded-2xl"
                style={{ background: 'rgba(22,163,74,0.97)' }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Check size={28} strokeWidth={3} className="text-white" />
                </div>
              </motion.div>
            ) : (
              <>
                <Heart size={20} fill="currentColor" className="text-blue-200 relative z-10 shrink-0" />
                <span className="relative z-10">תרומה מהירה דרך ביט</span>
              </>
            )}
          </motion.button>

          {/* PayBox */}
          <motion.button
            onClick={() => handleDonate('paybox', 'https://www.paybox.co.il')}
            className="relative overflow-hidden flex items-center justify-center gap-3 rounded-2xl text-white font-black select-none w-full"
            style={{
              paddingTop: '1.55rem', paddingBottom: '1.55rem',
              fontSize: 'clamp(0.97rem, 4vw, 1.1rem)',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6527d4 55%, #5318b0 100%)',
              boxShadow: '0 8px 36px rgba(124,58,237,0.55), 0 2px 8px rgba(0,0,0,0.35)',
            }}
            whileHover={{ scale: 1.025, boxShadow: '0 14px 50px rgba(124,58,237,0.72)' }}
            whileTap={{ scale: 0.97 }}
          >
            <ShimmerLayer />
            {donated === 'paybox' ? (
              <motion.div
                className="absolute inset-0 flex items-center justify-center rounded-2xl"
                style={{ background: 'rgba(22,163,74,0.97)' }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Check size={28} strokeWidth={3} className="text-white" />
                </div>
              </motion.div>
            ) : (
              <>
                <Heart size={20} fill="currentColor" className="text-purple-200 relative z-10 shrink-0" />
                <span className="relative z-10">תרומה מהירה דרך פייבוקס</span>
              </>
            )}
          </motion.button>

        </motion.div>

        {/* Footer */}
        <motion.p variants={fadeIn} className="text-center text-white/25 mt-3 shrink-0" style={{ fontSize: '0.68rem' }}>
          תודה שאתם הלב הפועם של הפרויקט הזה. בזכותכם אנחנו כאן ❤️
        </motion.p>

      </motion.div>
    </div>
  );
}

function ShimmerLayer() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.14) 50%, transparent 75%)' }}
      animate={{ x: ['-120%', '220%'] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
    />
  );
}
