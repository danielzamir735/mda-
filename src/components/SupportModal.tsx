import { useState } from 'react';
import { X, Heart, Users, Zap, Check } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import CountUp from 'react-countup';
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
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.08 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};
const fadeIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } },
};

export default function SupportModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [donated, setDonated] = useState<'bit' | 'paybox' | null>(null);

  const handleDonate = (type: 'bit' | 'paybox', url: string) => {
    setDonated(type);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => setDonated(null), 2600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" dir="rtl">

      {/* ══ BACKGROUND ══ */}
      <div className="fixed inset-0" style={{
        background: 'linear-gradient(155deg, #09050f 0%, #130410 38%, #0f0608 65%, #080408 100%)',
      }} />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 110% 60% at 50% -5%, rgba(244,63,94,0.22) 0%, transparent 65%)',
      }} />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(190,18,60,0.13) 0%, transparent 70%)',
      }} />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 35% at 50% 105%, rgba(136,14,79,0.15) 0%, transparent 65%)',
      }} />

      {/* ══ PARTICLES ══ */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="fixed rounded-full pointer-events-none"
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

      {/* ══ CONTENT ══ */}
      <motion.div
        className="relative z-10 flex flex-col min-h-full px-7 pb-16"
        style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >

        {/* Close */}
        <motion.div variants={fadeIn} className="flex justify-start mb-7">
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
        </motion.div>

        {/* ── Hero + Counter ── */}
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-5 mb-7">

          {/* Pulsing heart cluster */}
          <div className="relative flex items-center justify-center" style={{ height: 148 }}>
            <motion.div
              className="absolute rounded-full border border-rose-500/15"
              style={{ width: 134, height: 134 }}
              animate={{ scale: [0.9, 1.5], opacity: [0.6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute rounded-full bg-rose-500/8"
              style={{ width: 110, height: 110 }}
              animate={{ scale: [0.85, 1.38], opacity: [0.7, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute rounded-full bg-rose-400/12"
              style={{ width: 84, height: 84 }}
              animate={{ scale: [0.85, 1.38], opacity: [0.7, 0] }}
              transition={{ duration: 2.6, delay: 0.55, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute rounded-full" style={{
              width: 80, height: 80,
              background: 'radial-gradient(circle at 40% 35%, rgba(255,80,110,0.32) 0%, rgba(200,30,80,0.15) 60%, transparent 100%)',
              border: '1px solid rgba(255,100,130,0.22)',
              backdropFilter: 'blur(6px)',
            }} />
            <motion.div
              animate={{ scale: [1, 1.2, 1, 1.12, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Heart size={42} fill="currentColor" style={{
                color: '#fb7185',
                filter: 'drop-shadow(0 0 18px rgba(220,38,90,0.95)) drop-shadow(0 0 8px rgba(255,120,150,0.6))',
              }} />
            </motion.div>
          </div>

          {/* Counter — prefix + */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-end gap-0.5 leading-none">
              <span className="font-black" style={{
                fontSize: 'clamp(2rem, 8vw, 2.5rem)',
                background: 'linear-gradient(135deg, #fecdd3 0%, #fb7185 35%, #f43f5e 65%, #e11d48 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.03em',
              }}>+</span>
              <CountUp start={0} end={1500} duration={2.5} separator="," useEasing>
                {({ countUpRef }) => (
                  <span ref={countUpRef} className="font-black tabular-nums" style={{
                    fontSize: 'clamp(2.9rem, 11.5vw, 3.5rem)',
                    letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #fecdd3 0%, #fb7185 35%, #f43f5e 65%, #e11d48 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 14px rgba(244,63,94,0.55))',
                  }} />
                )}
              </CountUp>
            </div>
            <p className="text-white/60 font-bold" style={{
              fontSize: 'clamp(0.7rem, 2.8vw, 0.82rem)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}>אנשי רפואת חירום</p>
            <p className="text-white/35 font-medium" style={{ fontSize: 'clamp(0.62rem, 2.4vw, 0.7rem)', letterSpacing: '0.06em' }}>
              משתמשים בחובש+ בכל משמרת
            </p>
          </div>

          {/* Partnership badge */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full" style={{
            border: '1px solid rgba(244,63,94,0.32)',
            background: 'rgba(244,63,94,0.10)',
          }}>
            <Users size={13} style={{ color: '#fda4af' }} />
            <span style={{ color: '#fda4af', fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.07em' }}>שותפות לחיים</span>
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div variants={fadeIn} className="flex justify-center mb-10">
          <div className="h-px w-28 rounded-full" style={{
            background: 'linear-gradient(90deg, transparent, rgba(244,63,94,0.6), transparent)',
          }} />
        </motion.div>

        {/* ── Headline ── */}
        <motion.h1
          variants={fadeUp}
          className="text-center font-black leading-tight tracking-tight mb-12"
          style={{
            fontSize: 'clamp(2rem, 7.5vw, 2.7rem)',
            background: 'linear-gradient(135deg, #ffe4e6 0%, #fda4af 22%, #fb7185 50%, #f43f5e 75%, #be123c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 28px rgba(244,63,94,0.45))',
          }}
        >
          שותפים לדרך,{' '}
          שותפים להצלת חיים
        </motion.h1>

        {/* ── Body text ── */}
        <motion.div variants={fadeUp} className="text-right mb-12">
          <p className="text-white/80 font-medium mb-10" style={{ fontSize: 'clamp(1rem, 4vw, 1.1rem)', lineHeight: 1.92 }}>
            האפליקציה הזו נבנתה נטו מתוך אהבה והערכה לעבודת הקודש שאתם עושים,
            במטרה אחת: לתת לכם שקט נפשי בשטח.
          </p>
          <p className="text-white/56" style={{ fontSize: 'clamp(0.93rem, 3.7vw, 1.02rem)', lineHeight: 1.9 }}>
            היום, כשהיא כבר משרתת מאות אנשי רפואת חירום ברחבי הארץ — כל שותפות,
            גדולה כקטנה, מכסה את העלויות, נותן לנו כוח להמשיך לפתח, ומאפשר לנו
            להציל חיים – יחד איתכם.
          </p>
        </motion.div>

        {/* ── CTA card ── */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl px-5 py-5 mb-12 text-right"
          style={{
            background: 'linear-gradient(135deg, rgba(244,63,94,0.14) 0%, rgba(190,18,60,0.08) 100%)',
            border: '1px solid rgba(244,63,94,0.30)',
            boxShadow: '0 0 36px rgba(244,63,94,0.12), inset 0 1px 0 rgba(255,210,220,0.06)',
          }}
        >
          <div className="flex items-center gap-2.5 mb-2.5">
            <motion.div
              animate={{ scale: [1, 1.4, 1], rotate: [0, 12, -12, 0] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Zap size={19} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 9px rgba(251,191,36,1))' }} />
            </motion.div>
            <span className="font-black" style={{
              fontSize: 'clamp(0.95rem, 3.8vw, 1.06rem)',
              background: 'linear-gradient(135deg, #fecdd3 0%, #fb7185 55%, #f43f5e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              תנו לנו קצת דלק למנוע!
            </span>
          </div>
          <p className="text-white/60" style={{ fontSize: 'clamp(0.87rem, 3.4vw, 0.94rem)', lineHeight: 1.78 }}>
            כל פרגון שלכם מכסה ישירות את העלויות, נותן לנו כוח להמשיך לפתח,
            ומאפשר לנו להציל חיים – יחד איתכם.
          </p>
        </motion.div>

        {/* ── Donation buttons ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-5 mb-10">

          {/* Bit */}
          <motion.button
            onClick={() => handleDonate('bit', 'https://bit.co.il')}
            className="relative overflow-hidden flex items-center justify-center gap-3 rounded-2xl text-white font-black select-none w-full"
            style={{
              paddingTop: '1.55rem', paddingBottom: '1.55rem',
              fontSize: 'clamp(1.02rem, 4.2vw, 1.18rem)',
              background: 'linear-gradient(135deg, #1d6dea 0%, #1a56d4 55%, #1740b0 100%)',
              boxShadow: '0 10px 44px rgba(29,109,234,0.52), 0 2px 10px rgba(0,0,0,0.3)',
            }}
            whileHover={{ scale: 1.04, boxShadow: '0 16px 54px rgba(29,109,234,0.68)' }}
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
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Check size={28} strokeWidth={3} className="text-white" />
                </div>
              </motion.div>
            ) : (
              <>
                <Heart size={22} fill="currentColor" className="text-blue-200 relative z-10 shrink-0" />
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
              fontSize: 'clamp(1.02rem, 4.2vw, 1.18rem)',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6527d4 55%, #5318b0 100%)',
              boxShadow: '0 10px 44px rgba(124,58,237,0.52), 0 2px 10px rgba(0,0,0,0.3)',
            }}
            whileHover={{ scale: 1.04, boxShadow: '0 16px 54px rgba(124,58,237,0.68)' }}
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
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Check size={28} strokeWidth={3} className="text-white" />
                </div>
              </motion.div>
            ) : (
              <>
                <Heart size={22} fill="currentColor" className="text-purple-200 relative z-10 shrink-0" />
                <span className="relative z-10">תרומה מהירה דרך פייבוקס</span>
              </>
            )}
          </motion.button>

        </motion.div>

        {/* Footer */}
        <motion.p variants={fadeIn} className="text-center text-white/25 pb-4" style={{ fontSize: '0.72rem' }}>
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
