import { useState, useEffect } from 'react';
import { X, Heart, Users, Check } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PARTICLES = [
  { w: 5, h: 5, top: '5%',  left: '8%',  delay: 0,   dur: 5.2, color: 'rgba(244,63,94,0.7)'  },
  { w: 3, h: 3, top: '13%', left: '78%', delay: 1.2, dur: 6.8, color: 'rgba(251,146,60,0.6)'  },
  { w: 6, h: 6, top: '26%', left: '91%', delay: 0.5, dur: 4.9, color: 'rgba(244,63,94,0.5)'  },
  { w: 4, h: 4, top: '42%', left: '5%',  delay: 2.1, dur: 5.6, color: 'rgba(168,85,247,0.6)' },
  { w: 3, h: 3, top: '59%', left: '84%', delay: 1.5, dur: 7.1, color: 'rgba(244,63,94,0.6)'  },
  { w: 4, h: 4, top: '72%', left: '17%', delay: 0.8, dur: 5.3, color: 'rgba(251,146,60,0.5)' },
  { w: 6, h: 6, top: '86%', left: '55%', delay: 2.9, dur: 6.1, color: 'rgba(244,63,94,0.5)'  },
  { w: 3, h: 3, top: '20%', left: '43%', delay: 1.8, dur: 4.6, color: 'rgba(168,85,247,0.5)' },
  { w: 5, h: 5, top: '64%', left: '66%', delay: 3.3, dur: 5.9, color: 'rgba(251,146,60,0.6)' },
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
    const DURATION = 1800; // ms
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

      {/* ══ BACKGROUND ══ */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(155deg, #09050f 0%, #130410 38%, #0f0608 65%, #080408 100%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 110% 60% at 50% -5%, rgba(244,63,94,0.22) 0%, transparent 65%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(190,18,60,0.13) 0%, transparent 70%)',
      }} />

      {/* ══ PARTICLES ══ */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.w, height: p.h,
            top: p.top, left: p.left,
            background: p.color,
            boxShadow: `0 0 ${p.w * 4}px ${p.color}`,
          }}
          animate={{ y: [-8, 8], opacity: [0.35, 1, 0.35], scale: [0.8, 1.4, 0.8] }}
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
        <motion.div variants={fadeIn} className="flex justify-start mb-2 shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/8 border border-white/12
                       flex items-center justify-center active:scale-90
                       transition-all duration-200 text-white/40 hover:text-white/70
                       hover:bg-white/12"
            aria-label="סגור"
          >
            <X size={16} />
          </button>
        </motion.div>

        {/* ── Hero + Counter ── */}
        <motion.div variants={fadeUp} className="flex flex-col items-center shrink-0">

          {/* Pulsing heart cluster — tighter */}
          <div className="relative flex items-center justify-center" style={{ height: 108 }}>
            <motion.div
              className="absolute rounded-full border border-rose-500/15"
              style={{ width: 98, height: 98 }}
              animate={{ scale: [0.9, 1.5], opacity: [0.6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute rounded-full bg-rose-500/8"
              style={{ width: 80, height: 80 }}
              animate={{ scale: [0.85, 1.38], opacity: [0.7, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute rounded-full bg-rose-400/12"
              style={{ width: 62, height: 62 }}
              animate={{ scale: [0.85, 1.38], opacity: [0.7, 0] }}
              transition={{ duration: 2.6, delay: 0.55, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute rounded-full" style={{
              width: 60, height: 60,
              background: 'radial-gradient(circle at 40% 35%, rgba(255,80,110,0.32) 0%, rgba(200,30,80,0.15) 60%, transparent 100%)',
              border: '1px solid rgba(255,100,130,0.22)',
              backdropFilter: 'blur(6px)',
            }} />
            <motion.div
              animate={{ scale: [1, 1.2, 1, 1.12, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Heart size={34} fill="currentColor" style={{
                color: '#fb7185',
                filter: 'drop-shadow(0 0 14px rgba(220,38,90,0.95)) drop-shadow(0 0 6px rgba(255,120,150,0.6))',
              }} />
            </motion.div>
          </div>

          {/* Counter: 0 → 2000+ */}
          <div className="flex flex-col items-center gap-1 mt-1">
            <div className="flex items-end gap-0.5 leading-none">
              <span className="font-black tabular-nums" style={{
                fontSize: 'clamp(2.6rem, 10vw, 3.2rem)',
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #fecdd3 0%, #fb7185 35%, #f43f5e 65%, #e11d48 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 14px rgba(244,63,94,0.55))',
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
                    fontSize: 'clamp(2rem, 8vw, 2.5rem)',
                    background: 'linear-gradient(135deg, #fecdd3 0%, #fb7185 35%, #f43f5e 65%, #e11d48 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                  }}>+</motion.span>
              )}
            </div>
            <p className="text-white/60 font-bold" style={{
              fontSize: 'clamp(0.65rem, 2.6vw, 0.78rem)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}>אנשי רפואת חירום</p>
            <p className="text-white/35 font-medium" style={{ fontSize: 'clamp(0.6rem, 2.2vw, 0.68rem)', letterSpacing: '0.06em' }}>
              משתמשים בחובש+ בכל משמרת
            </p>
          </div>

          {/* Partnership badge */}
          <div className="flex items-center gap-2 px-4 py-1 rounded-full mt-2" style={{
            border: '1px solid rgba(244,63,94,0.32)',
            background: 'rgba(244,63,94,0.10)',
          }}>
            <Users size={12} style={{ color: '#fda4af' }} />
            <span style={{ color: '#fda4af', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em' }}>שותפות לחיים</span>
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div variants={fadeIn} className="flex justify-center my-3 shrink-0">
          <div className="h-px w-24 rounded-full" style={{
            background: 'linear-gradient(90deg, transparent, rgba(244,63,94,0.6), transparent)',
          }} />
        </motion.div>

        {/* ── Headline ── */}
        <motion.h1
          variants={fadeUp}
          className="text-center font-black leading-tight tracking-tight shrink-0"
          style={{
            fontSize: 'clamp(1.6rem, 6.5vw, 2.2rem)',
            background: 'linear-gradient(135deg, #ffe4e6 0%, #fda4af 22%, #fb7185 50%, #f43f5e 75%, #be123c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 24px rgba(244,63,94,0.45))',
          }}
        >
          שותפים לדרך,{' '}שותפים להצלת חיים
        </motion.h1>

        {/* ── Body text ── */}
        <motion.div variants={fadeUp} className="text-right mt-3 shrink-0">
          <p className="text-white/80 font-medium mb-2" style={{ fontSize: 'clamp(0.88rem, 3.5vw, 0.97rem)', lineHeight: 1.75 }}>
            האפליקציה הזו נבנתה נטו מתוך אהבה והערכה לעבודת הקודש שאתם עושים,
            במטרה אחת: לתת לכם שקט נפשי בשטח.
          </p>
          <p className="text-white/56" style={{ fontSize: 'clamp(0.82rem, 3.2vw, 0.9rem)', lineHeight: 1.72 }}>
            כל שותפות, גדולה כקטנה, מכסה את העלויות, נותנת לנו כוח להמשיך לפתח,
            ומאפשרת לנו להציל חיים – יחד איתכם.
          </p>
        </motion.div>

        {/* ── Donation buttons ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-3 mt-4 shrink-0">

          {/* Bit */}
          <motion.button
            onClick={() => handleDonate('bit', 'https://bit.co.il')}
            className="relative overflow-hidden flex items-center justify-center gap-3 rounded-2xl text-white font-black select-none w-full"
            style={{
              paddingTop: '1.2rem', paddingBottom: '1.2rem',
              fontSize: 'clamp(0.97rem, 4vw, 1.1rem)',
              background: 'linear-gradient(135deg, #1d6dea 0%, #1a56d4 55%, #1740b0 100%)',
              boxShadow: '0 8px 36px rgba(29,109,234,0.52), 0 2px 8px rgba(0,0,0,0.3)',
            }}
            whileHover={{ scale: 1.03, boxShadow: '0 14px 48px rgba(29,109,234,0.68)' }}
            whileTap={{ scale: 0.97 }}
          >
            <ShimmerLayer />
            {donated === 'bit' ? (
              <motion.div
                className="absolute inset-0 flex items-center justify-center rounded-2xl"
                style={{ background: 'rgba(22,163,74,0.96)' }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              >
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                  <Check size={26} strokeWidth={3} className="text-white" />
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
              paddingTop: '1.2rem', paddingBottom: '1.2rem',
              fontSize: 'clamp(0.97rem, 4vw, 1.1rem)',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6527d4 55%, #5318b0 100%)',
              boxShadow: '0 8px 36px rgba(124,58,237,0.52), 0 2px 8px rgba(0,0,0,0.3)',
            }}
            whileHover={{ scale: 1.03, boxShadow: '0 14px 48px rgba(124,58,237,0.68)' }}
            whileTap={{ scale: 0.97 }}
          >
            <ShimmerLayer />
            {donated === 'paybox' ? (
              <motion.div
                className="absolute inset-0 flex items-center justify-center rounded-2xl"
                style={{ background: 'rgba(22,163,74,0.96)' }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              >
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                  <Check size={26} strokeWidth={3} className="text-white" />
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
        <motion.p variants={fadeIn} className="text-center text-white/25 mt-3 shrink-0" style={{ fontSize: '0.69rem' }}>
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
      style={{ background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 75%)' }}
      animate={{ x: ['-120%', '220%'] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
    />
  );
}
