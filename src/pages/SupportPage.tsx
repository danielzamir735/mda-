import { useNavigate } from 'react-router-dom';
import { Heart, ArrowRight, Zap, Users } from 'lucide-react';
import { motion, type Variants, useInView } from 'framer-motion';
import { useRef } from 'react';
import CountUp from 'react-countup';

/* ── tiny sparks ── */
const SPARKS = [
  { w: 3, h: 3, top: '7%',  left: '9%',  delay: 0,   dur: 4.8 },
  { w: 2, h: 5, top: '14%', left: '80%', delay: 1.1, dur: 6.2 },
  { w: 4, h: 4, top: '32%', left: '92%', delay: 0.4, dur: 5.0 },
  { w: 2, h: 2, top: '50%', left: '4%',  delay: 2.1, dur: 5.5 },
  { w: 3, h: 6, top: '68%', left: '86%', delay: 1.6, dur: 4.3 },
  { w: 2, h: 2, top: '80%', left: '20%', delay: 0.8, dur: 6.0 },
  { w: 3, h: 3, top: '91%', left: '58%', delay: 3.0, dur: 5.3 },
];

/* ── animation variants ── */
const containerVariants: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } },
};
const fadeIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show:   { opacity: 1, scale: 1,   transition: { duration: 0.45, ease: 'easeOut' } },
};

export default function SupportPage() {
  const navigate = useNavigate();
  const heroRef  = useRef<HTMLDivElement>(null);
  const inView   = useInView(heroRef, { once: true, margin: '-20px' });

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col overflow-hidden" dir="rtl">

      {/* ══ BACKGROUND ══ */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(155deg, #09050f 0%, #130410 38%, #0f0608 65%, #080408 100%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 110% 50% at 50% -5%, rgba(234,88,12,0.22) 0%, transparent 65%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(190,18,60,0.13) 0%, transparent 70%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 35% at 50% 105%, rgba(136,14,79,0.15) 0%, transparent 65%)',
      }} />
      {/* grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage:
          'linear-gradient(rgba(255,180,150,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,180,150,1) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
        opacity: 0.022,
      }} />

      {/* ══ SPARKS ══ */}
      {SPARKS.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none bg-amber-300"
          style={{ width: s.w, height: s.h, top: s.top, left: s.left, opacity: 0.35 }}
          animate={{ y: [-6, 6], opacity: [0.35, 0.08, 0.35] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* ══ CONTENT ══ */}
      <motion.div
        className="relative z-10 flex flex-col h-full px-5"
        style={{
          paddingTop: 'max(0.85rem, env(safe-area-inset-top))',
          paddingBottom: 'max(0.85rem, env(safe-area-inset-bottom))',
        }}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >

        {/* ── Back ── */}
        <motion.div variants={fadeIn} className="mb-3">
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
        <motion.div ref={heroRef} variants={fadeUp} className="flex flex-col items-center gap-2 mb-3">

          {/* People icon with ember glow */}
          <motion.div className="relative flex items-center justify-center" style={{ width: 68, height: 68 }}>
            <motion.div
              className="absolute rounded-full border border-orange-400/20"
              style={{ width: 68, height: 68 }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.15, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ width: 52, height: 52, background: 'radial-gradient(circle, rgba(234,88,12,0.35) 0%, transparent 70%)' }}
              animate={{ scale: [0.92, 1.08, 0.92] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <Users size={26} className="relative z-10" style={{
              color: '#fb923c',
              filter: 'drop-shadow(0 0 10px rgba(234,88,12,1)) drop-shadow(0 0 4px rgba(251,146,60,0.8))',
            }} />
          </motion.div>

          {/* Rolling number */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-end gap-0.5 leading-none">
              {inView && (
                <CountUp start={200} end={1500} duration={2.4} separator="," useEasing>
                  {({ countUpRef }) => (
                    <span ref={countUpRef} className="font-black tabular-nums" style={{
                      fontSize: 'clamp(2.8rem, 11vw, 3.4rem)',
                      letterSpacing: '-0.03em',
                      background: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 40%, #ea580c 80%, #c2410c 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 2px 12px rgba(234,88,12,0.5))',
                    }} />
                  )}
                </CountUp>
              )}
              <span className="font-black mb-1" style={{
                fontSize: 'clamp(1.8rem, 7vw, 2.2rem)',
                background: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 60%, #ea580c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}>+</span>
            </div>
            <p className="text-white/55 font-semibold" style={{
              fontSize: 'clamp(0.68rem, 2.7vw, 0.78rem)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}>
              אנשי רפואת חירום
            </p>
            <p className="text-white/32 font-medium" style={{ fontSize: 'clamp(0.6rem, 2.3vw, 0.68rem)', letterSpacing: '0.06em' }}>
              משתמשים בחובש+ בכל משמרת
            </p>
          </div>
        </motion.div>

        {/* thin divider */}
        <motion.div variants={fadeIn} className="flex justify-center mb-3">
          <div className="h-px w-24 rounded-full" style={{
            background: 'linear-gradient(90deg, transparent, rgba(251,146,60,0.5), rgba(244,63,94,0.4), transparent)',
          }} />
        </motion.div>

        {/* ── Title ── */}
        <motion.h1
          variants={fadeUp}
          className="text-center font-black leading-snug mb-2.5"
          style={{
            fontSize: 'clamp(1.35rem, 5.2vw, 1.65rem)',
            letterSpacing: '-0.025em',
            background: 'linear-gradient(135deg, #ffe4e6 0%, #fda4af 22%, #fb7185 50%, #f43f5e 75%, #be123c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          שותפים לדרך, שותפים להצלת חיים
        </motion.h1>

        {/* ── Body text ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-2.5 text-right mb-3">
          <p className="text-white/80 font-medium" style={{ fontSize: 'clamp(0.84rem, 3.3vw, 0.93rem)', lineHeight: 1.75 }}>
            האפליקציה הזו נבנתה נטו מתוך אהבה והערכה לעבודת הקודש שאתם עושים, במטרה
            אחת: לתת לכם שקט נפשי בשטח. היום, כשהיא כבר משרתת מאות אנשי רפואת חירום
            בכל משמרת, עלויות הפיתוח ותחזוקת השרתים שלנו הולכות וגדלות.
          </p>
          <p className="text-white/55" style={{ fontSize: 'clamp(0.8rem, 3.1vw, 0.88rem)', lineHeight: 1.72 }}>
            הפרויקט הזה הוא שלכם ובשבילכם. אנחנו מזמינים אתכם להיות הכוח שמניע אותנו
            קדימה, כדי שנוכל להמשיך להשקיע בכם, להוסיף יכולות חדשות ולשמור על
            'חובש +' נקייה, מקצועית ובשירות מלא עבורכם.
          </p>
        </motion.div>

        {/* ── CTA card ── */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl px-4 py-3 mb-3 text-right"
          style={{
            background: 'linear-gradient(135deg, rgba(234,88,12,0.15) 0%, rgba(190,18,60,0.09) 100%)',
            border: '1px solid rgba(251,146,60,0.20)',
            boxShadow: 'inset 0 1px 0 rgba(255,200,150,0.06)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <motion.div
              animate={{ scale: [1, 1.3, 1], rotate: [0, 8, -8, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Zap size={15} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.9))' }} />
            </motion.div>
            <span className="font-black" style={{
              fontSize: 'clamp(0.88rem, 3.4vw, 0.97rem)',
              background: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 55%, #ea580c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              תנו לנו קצת דלק למנוע!
            </span>
          </div>
          <p className="text-white/60" style={{ fontSize: 'clamp(0.77rem, 3vw, 0.84rem)', lineHeight: 1.65 }}>
            כל פרגון שלכם מכסה ישירות את העלויות, נותן לנו כוח להמשיך לפתח,
            ומאפשר לנו להציל חיים – יחד איתכם.
          </p>
        </motion.div>

        {/* ── Donation buttons ── */}
        <motion.div variants={fadeUp} className="flex flex-col gap-2.5 mb-2.5">

          {/* Bit */}
          <motion.a
            href="https://bit.co.il"
            target="_blank"
            rel="noopener noreferrer"
            className="relative overflow-hidden flex items-center justify-center gap-2.5 rounded-2xl text-white font-black select-none"
            style={{
              paddingTop: '0.88rem', paddingBottom: '0.88rem',
              fontSize: 'clamp(0.95rem, 3.8vw, 1.05rem)',
              background: 'linear-gradient(135deg, #1d6dea 0%, #1a56d4 55%, #1740b0 100%)',
              boxShadow: '0 8px 30px rgba(29,109,234,0.45), 0 1px 6px rgba(0,0,0,0.3)',
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(29,109,234,0.6)' }}
            whileTap={{ scale: 0.97 }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3.4, delay: 0.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ShimmerLayer delay={0.4} />
            <Heart size={19} fill="currentColor" className="text-blue-200 relative z-10 shrink-0" />
            <span className="relative z-10">תרומה מהירה ב-Bit</span>
          </motion.a>

          {/* PayBox */}
          <motion.a
            href="https://www.paybox.co.il"
            target="_blank"
            rel="noopener noreferrer"
            className="relative overflow-hidden flex items-center justify-center gap-2.5 rounded-2xl text-white font-black select-none"
            style={{
              paddingTop: '0.88rem', paddingBottom: '0.88rem',
              fontSize: 'clamp(0.95rem, 3.8vw, 1.05rem)',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6527d4 55%, #5318b0 100%)',
              boxShadow: '0 8px 30px rgba(124,58,237,0.45), 0 1px 6px rgba(0,0,0,0.3)',
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(124,58,237,0.6)' }}
            whileTap={{ scale: 0.97 }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3.4, delay: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ShimmerLayer delay={1.5} />
            <Heart size={19} fill="currentColor" className="text-purple-200 relative z-10 shrink-0" />
            <span className="relative z-10">תרומה מהירה ב-PayBox</span>
          </motion.a>

        </motion.div>

        {/* Footer */}
        <motion.p variants={fadeIn} className="text-center text-white/25 shrink-0" style={{ fontSize: '0.7rem' }}>
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
      style={{ background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.14) 50%, transparent 75%)' }}
      animate={{ x: ['-120%', '220%'] }}
      transition={{ duration: 3.2, delay, repeat: Infinity, ease: 'linear' }}
    />
  );
}
