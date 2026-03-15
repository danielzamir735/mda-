import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowRight, Zap, Users, Check } from 'lucide-react';
import { motion, type Variants, useInView } from 'framer-motion';
import { useRef } from 'react';
import CountUp from 'react-countup';

/* ── Glowing particles ── */
const PARTICLES = [
  { w: 5, h: 5, top: '4%',  left: '7%',  delay: 0,   dur: 5.2, color: 'rgba(251,146,60,0.7)'  },
  { w: 3, h: 3, top: '11%', left: '79%', delay: 1.3, dur: 6.9, color: 'rgba(244,63,94,0.6)'   },
  { w: 6, h: 6, top: '24%', left: '92%', delay: 0.5, dur: 4.9, color: 'rgba(251,146,60,0.5)'  },
  { w: 4, h: 4, top: '41%', left: '4%',  delay: 2.0, dur: 5.6, color: 'rgba(168,85,247,0.6)'  },
  { w: 3, h: 3, top: '58%', left: '85%', delay: 1.6, dur: 7.0, color: 'rgba(251,146,60,0.6)'  },
  { w: 4, h: 4, top: '73%', left: '19%', delay: 0.8, dur: 5.3, color: 'rgba(244,63,94,0.5)'   },
  { w: 6, h: 6, top: '87%', left: '56%', delay: 2.9, dur: 6.1, color: 'rgba(251,146,60,0.5)'  },
  { w: 3, h: 3, top: '19%', left: '44%', delay: 1.9, dur: 4.7, color: 'rgba(168,85,247,0.5)'  },
  { w: 5, h: 5, top: '63%', left: '67%', delay: 3.3, dur: 5.9, color: 'rgba(244,63,94,0.6)'   },
];

/* ── animation variants ── */
const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.06 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};
const fadeIn: Variants = {
  hidden: { opacity: 0, scale: 0.93 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } },
};

export default function SupportPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const inView  = useInView(heroRef, { once: true, margin: '-20px' });
  const [donated, setDonated] = useState<'bit' | 'paybox' | null>(null);

  const handleDonate = (type: 'bit' | 'paybox', url: string) => {
    setDonated(type);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => setDonated(null), 2600);
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" dir="rtl">

      {/* ══ BACKGROUND ══ */}
      <div className="fixed inset-0" style={{
        background: 'linear-gradient(155deg, #09050f 0%, #130410 38%, #0f0608 65%, #080408 100%)',
      }} />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 110% 55% at 50% -5%, rgba(234,88,12,0.24) 0%, transparent 65%)',
      }} />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(190,18,60,0.14) 0%, transparent 70%)',
      }} />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 35% at 50% 105%, rgba(136,14,79,0.16) 0%, transparent 65%)',
      }} />
      {/* subtle grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage:
          'linear-gradient(rgba(255,180,150,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,180,150,1) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
        opacity: 0.022,
      }} />

      {/* ══ GLOWING PARTICLES ══ */}
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
        className="relative z-10 flex flex-col px-6 pb-16"
        style={{
          paddingTop: 'max(0.85rem, env(safe-area-inset-top))',
        }}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >

        {/* ── Back ── */}
        <motion.div variants={fadeIn} className="mb-5">
          <motion.button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
                       bg-white/6 border border-white/10 text-white/50 active:scale-90"
            style={{ fontSize: '0.78rem', fontWeight: 600 }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
            whileTap={{ scale: 0.88 }}
            aria-label="חזור"
          >
            <ArrowRight size={13} />
            <span>חזור</span>
          </motion.button>
        </motion.div>

        {/* ══ HERO — rolling counter ══ */}
        <motion.div ref={heroRef} variants={fadeUp} className="flex flex-col items-center gap-3 mb-6">

          {/* People icon with ember glow */}
          <motion.div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
            <motion.div
              className="absolute rounded-full border border-orange-400/20"
              style={{ width: 72, height: 72 }}
              animate={{ scale: [1, 1.22, 1], opacity: [0.5, 0.12, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ width: 54, height: 54, background: 'radial-gradient(circle, rgba(234,88,12,0.38) 0%, transparent 70%)' }}
              animate={{ scale: [0.92, 1.1, 0.92] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <Users size={27} className="relative z-10" style={{
              color: '#fb923c',
              filter: 'drop-shadow(0 0 12px rgba(234,88,12,1)) drop-shadow(0 0 5px rgba(251,146,60,0.8))',
            }} />
          </motion.div>

          {/* Rolling number — prefix + */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-end gap-0.5 leading-none">
              <span className="font-black" style={{
                fontSize: 'clamp(2rem, 8vw, 2.5rem)',
                background: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 60%, #ea580c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.03em',
              }}>+</span>
              {inView && (
                <CountUp start={0} end={1500} duration={2.5} separator="," useEasing>
                  {({ countUpRef }) => (
                    <span ref={countUpRef} className="font-black tabular-nums" style={{
                      fontSize: 'clamp(2.9rem, 11.5vw, 3.5rem)',
                      letterSpacing: '-0.03em',
                      background: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 40%, #ea580c 80%, #c2410c 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 2px 14px rgba(234,88,12,0.55))',
                    }} />
                  )}
                </CountUp>
              )}
            </div>
            <p className="text-white/58 font-semibold" style={{
              fontSize: 'clamp(0.68rem, 2.7vw, 0.8rem)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}>
              אנשי רפואת חירום
            </p>
            <p className="text-white/33 font-medium" style={{ fontSize: 'clamp(0.6rem, 2.3vw, 0.7rem)', letterSpacing: '0.06em' }}>
              משתמשים בחובש+ בכל משמרת
            </p>
          </div>
        </motion.div>

        {/* thin divider */}
        <motion.div variants={fadeIn} className="flex justify-center mb-8">
          <div className="h-px w-28 rounded-full" style={{
            background: 'linear-gradient(90deg, transparent, rgba(251,146,60,0.55), rgba(244,63,94,0.45), transparent)',
          }} />
        </motion.div>

        {/* ── Title ── */}
        <motion.h1
          variants={fadeUp}
          className="text-center font-black leading-tight tracking-tight mb-12"
          style={{
            fontSize: 'clamp(2rem, 7.5vw, 2.7rem)',
            background: 'linear-gradient(135deg, #ffe4e6 0%, #fda4af 22%, #fb7185 50%, #f43f5e 75%, #be123c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 28px rgba(244,63,94,0.42))',
          }}
        >
          שותפים לדרך, שותפים להצלת חיים
        </motion.h1>

        {/* ── Body text ── */}
        <motion.div variants={fadeUp} className="text-right mb-12">
          <p className="text-white/80 font-medium mb-10" style={{ fontSize: 'clamp(1rem, 4vw, 1.1rem)', lineHeight: 1.92 }}>
            האפליקציה הזו נבנתה נטו מתוך אהבה והערכה לעבודת הקודש שאתם עושים, במטרה
            אחת: לתת לכם שקט נפשי בשטח. היום, כשהיא כבר משרתת מאות אנשי רפואת חירום
            בכל משמרת, עלויות הפיתוח ותחזוקת השרתים שלנו הולכות וגדלות.
          </p>
          <p className="text-white/56" style={{ fontSize: 'clamp(0.93rem, 3.7vw, 1.02rem)', lineHeight: 1.9 }}>
            הפרויקט הזה הוא שלכם ובשבילכם. אנחנו מזמינים אתכם להיות הכוח שמניע אותנו
            קדימה, כדי שנוכל להמשיך להשקיע בכם, להוסיף יכולות חדשות ולשמור על
            'חובש +' נקייה, מקצועית ובשירות מלא עבורכם.
          </p>
        </motion.div>

        {/* ── CTA card ── */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl px-5 py-5 mb-12 text-right"
          style={{
            background: 'linear-gradient(135deg, rgba(234,88,12,0.16) 0%, rgba(190,18,60,0.09) 100%)',
            border: '1px solid rgba(251,146,60,0.28)',
            boxShadow: '0 0 36px rgba(234,88,12,0.12), inset 0 1px 0 rgba(255,200,150,0.07)',
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
              background: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 55%, #ea580c 100%)',
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
            animate={donated !== 'bit' ? { y: [0, -4, 0] } : {}}
            transition={{ duration: 3.4, delay: 0.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ShimmerLayer delay={0.4} />
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
            animate={donated !== 'paybox' ? { y: [0, -4, 0] } : {}}
            transition={{ duration: 3.4, delay: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ShimmerLayer delay={1.5} />
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
        <motion.p variants={fadeIn} className="text-center text-white/25 pb-4" style={{ fontSize: '0.7rem' }}>
          תודה שאתם הלב הפועם של הפרויקט הזה. בזכותכם אנחנו כאן ❤️
        </motion.p>

      </motion.div>
    </div>
  );
}

function ShimmerLayer({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 75%)' }}
      animate={{ x: ['-120%', '220%'] }}
      transition={{ duration: 3.2, delay, repeat: Infinity, ease: 'linear' }}
    />
  );
}
