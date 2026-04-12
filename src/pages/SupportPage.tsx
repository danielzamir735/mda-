import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, CheckCircle, HandHeart, Server, Zap, Lock } from 'lucide-react';
import { trackInteraction } from '../utils/analytics';

interface Props { isOpen: boolean; onClose: () => void; }

const REASONS = [
  { icon: Server,  color: 'text-sky-400',   bg: 'bg-sky-400/10',   border: 'border-sky-400/20',   title: 'שרתים', desc: 'זמינות 24/7 גם בלחץ' },
  { icon: Zap,     color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', title: 'פיתוח', desc: 'יכולות חדשות כל הזמן' },
  { icon: Lock,    color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', title: 'חינמי', desc: 'נגיש לכל חובש שדה' },
];

export default function SupportModal({ isOpen, onClose }: Props) {
  const [donationDone, setDonationDone] = useState(false);

  useEffect(() => {
    if (!isOpen) setDonationDone(false);
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="support-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="fixed inset-0 z-[60] h-[100dvh] flex flex-col backdrop-blur-xl"
          style={{ background: 'radial-gradient(ellipse at top center, rgba(110, 8, 28, 0.94) 0%, rgba(8, 10, 35, 0.97) 65%)' }}
          dir="rtl"
        >
          <style>{`
            @keyframes shineBtn {
              0%   { transform: translateX(-200%) skewX(-15deg); }
              25%  { transform: translateX(-200%) skewX(-15deg); }
              72%  { transform: translateX(550%)  skewX(-15deg); }
              100% { transform: translateX(550%)  skewX(-15deg); }
            }
          `}</style>

          {/* Close */}
          <div className="ios-safe-header flex justify-start px-4 pt-4 shrink-0">
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 active:bg-white/20 transition-colors"
              aria-label="סגור"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Body – justify-between ממלא את כל הגובה */}
          <div className="flex-1 flex flex-col items-center justify-between px-5 pb-10 pt-2">

            {/* Heart + Title */}
            <div className="flex flex-col items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.28, 1, 1.16, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, times: [0, 0.14, 0.28, 0.42, 0.56], ease: 'easeInOut' }}
                className="drop-shadow-[0_0_28px_rgba(244,63,94,0.7)] text-rose-500"
              >
                <Heart size={62} fill="currentColor" />
              </motion.div>
              <h1 className="text-3xl font-black text-white text-center leading-tight">
                חובש<span className="text-rose-400">+</span> מחפשים שותפים
              </h1>
              <p className="text-white/55 text-sm text-center max-w-[260px]">
                לא תורמים – שותפים. כי בלעדיכם זה לא קורה.
              </p>
            </div>

            {/* 3 reason cards */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-sm grid grid-cols-3 gap-2.5"
            >
              {REASONS.map(({ icon: Icon, color, bg, border, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 + i * 0.08 }}
                  className={`rounded-2xl border ${border} ${bg} flex flex-col items-center gap-1.5 py-4 px-2`}
                >
                  <Icon size={22} className={color} />
                  <span className="text-white font-bold text-sm">{title}</span>
                  <span className="text-white/50 text-[11px] text-center leading-tight">{desc}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Copy */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.38 }}
              className="text-center space-y-2 max-w-xs"
            >
              <p className="text-white/80 text-base leading-relaxed">
                חובש+ פותחה בהתנדבות, אבל השרתים, הפיתוח והתחזוקה עולים כסף.
                {' '}<span className="text-white font-semibold">שותף הוא מישהו שמאמין שגם חובש שדה מגיע לכלים טובים –</span> ועושה את זה לאפשרי.
              </p>
              <p className="text-rose-300 font-bold text-base">
                תרומה קטנה? זה מה שמשאיר אותנו כאן.
              </p>
            </motion.div>

            {/* Button + fine print */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.48, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-full max-w-sm flex flex-col items-center gap-3"
            >
              <ShinyButton
                label="גם אני רוצה להיות שותף ❤️"
                sublabel="תרומה חד-פעמית דרך PayBox"
                gradient="from-rose-500 via-rose-600 to-pink-700"
                done={donationDone}
                icon={<HandHeart size={20} />}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(50);
                  trackInteraction('paybox_donation', 'support');
                  setDonationDone(true);
                  window.open('https://links.payboxapp.com/ikLxTdoky1b', '_blank');
                }}
              />
              <p className="text-white/30 text-xs text-center">
                כל תרומה, גם הקטנה ביותר, עוזרת לנו להמשיך לפתח ולשמור על האפליקציה חופשית לכולם.
              </p>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShinyButton({ label, sublabel, gradient, done, icon, onClick }: {
  label: string;
  sublabel?: string;
  gradient: string;
  done: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative w-full py-4 px-5 rounded-2xl font-bold text-white overflow-hidden bg-gradient-to-l ${gradient} shadow-xl active:brightness-90 transition-[filter]`}
    >
      <span
        className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        style={{ animation: 'shineBtn 3s ease-in-out infinite' }}
      />
      <AnimatePresence mode="wait">
        {done ? (
          <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="flex items-center justify-center gap-2 relative z-10"
          >
            <CheckCircle size={22} /> <span>תודה! אתה שותף ❤️</span>
          </motion.span>
        ) : (
          <motion.span key="label" exit={{ opacity: 0 }} className="relative z-10 flex flex-col items-center gap-0.5">
            <span className="flex items-center gap-2 text-lg leading-tight">
              {icon}
              {label}
            </span>
            {sublabel && (
              <span className="text-white/70 text-sm font-medium">{sublabel}</span>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
