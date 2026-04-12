import { useEffect, useState } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { Heart, X, CheckCircle, Users, HandHeart } from 'lucide-react';
import { trackInteraction } from '../utils/analytics';

interface Props { isOpen: boolean; onClose: () => void; }

const FACEBOOK_GROUP_URL = 'https://www.facebook.com/groups/hoveshplus'; // ← עדכן ל-URL האמיתי

const PARTNER_INITIALS = ['ד״ר', 'מד', 'אי', 'ית', 'נו', 'שר', 'מי', 'עד', 'לי', 'רן'];

export default function SupportModal({ isOpen, onClose }: Props) {
  const [donationDone, setDonationDone] = useState(false);
  const [fbDone, setFbDone] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setDisplayCount(0);
      const controls = animate(0, 143, {
        duration: 2.2,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (v) => setDisplayCount(Math.floor(v)),
      });
      return () => controls.stop();
    } else {
      setDisplayCount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) { setDonationDone(false); setFbDone(false); }
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
          className="fixed inset-0 z-[60] h-[100dvh] overflow-y-auto backdrop-blur-xl flex flex-col"
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
            @keyframes floatBadge {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-4px); }
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

          {/* Body */}
          <div className="flex-1 flex flex-col items-center px-5 pb-8 gap-5 pt-2">

            {/* Heart + Title */}
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.28, 1, 1.16, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, times: [0, 0.14, 0.28, 0.42, 0.56], ease: 'easeInOut' }}
                className="drop-shadow-[0_0_24px_rgba(244,63,94,0.65)] text-rose-500"
              >
                <Heart size={54} fill="currentColor" />
              </motion.div>
              <h1 className="text-2xl font-black text-white text-center leading-tight">
                חובש<span className="text-rose-400">+</span> מחפשים שותפים
              </h1>
              <p className="text-white/55 text-xs text-center max-w-[260px]">
                לא תורמים – שותפים. כי בלעדיכם זה לא קורה.
              </p>
            </div>

            {/* Partners row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-sm"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-3">
                {/* Avatars */}
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {PARTNER_INITIALS.slice(0, 7).map((initials, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 + i * 0.06, type: 'spring', stiffness: 300 }}
                      className="w-8 h-8 rounded-full border-2 border-[#0d0e2a] bg-gradient-to-br flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                      style={{
                        background: [
                          'linear-gradient(135deg,#f43f5e,#be185d)',
                          'linear-gradient(135deg,#6366f1,#4f46e5)',
                          'linear-gradient(135deg,#0ea5e9,#0284c7)',
                          'linear-gradient(135deg,#10b981,#059669)',
                          'linear-gradient(135deg,#f59e0b,#d97706)',
                          'linear-gradient(135deg,#8b5cf6,#7c3aed)',
                          'linear-gradient(135deg,#ec4899,#db2777)',
                        ][i % 7],
                      }}
                    >
                      {initials}
                    </motion.div>
                  ))}
                </div>

                {/* Count */}
                <div className="flex flex-col items-end">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white tabular-nums leading-none">
                      {displayCount}
                    </span>
                    <span className="text-rose-400 font-black text-lg leading-none">+</span>
                  </div>
                  <span className="text-white/50 text-[11px] font-medium">שותפים פעילים</span>
                </div>
              </div>
            </motion.div>

            {/* Copy */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-center space-y-2 max-w-xs"
            >
              <p className="text-white/75 text-sm leading-relaxed">
                חובש+ פותחה בהתנדבות, אבל השרתים, הפיתוח והתחזוקה עולים כסף.
                <br />
                <span className="text-white font-semibold">שותף הוא מישהו שמאמין שגם חובש שדה מגיע לכלים טובים –</span> ועושה את זה לאפשרי.
              </p>
              <p className="text-rose-300 font-bold text-sm">
                הצטרפות לפייסבוק מעולה. תרומה קטנה? זה מה שמשאיר אותנו כאן.
              </p>
            </motion.div>

            {/* Divider with icon */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.42 }}
              className="flex items-center gap-2 w-full max-w-sm"
            >
              <div className="flex-1 h-px bg-white/10" />
              <HandHeart size={16} className="text-white/30" />
              <div className="flex-1 h-px bg-white/10" />
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.48, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-full max-w-sm flex flex-col gap-3"
            >
              {/* Primary – become a partner */}
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

              {/* Secondary – Facebook */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  trackInteraction('facebook_community_join', 'support');
                  setFbDone(true);
                  window.open(FACEBOOK_GROUP_URL, '_blank');
                }}
                className="relative w-full py-3.5 rounded-2xl font-bold text-base text-white overflow-hidden border border-white/15 bg-white/8 active:bg-white/12 transition-colors flex items-center justify-center gap-2"
              >
                <Users size={18} className="text-blue-400" />
                <span>{fbDone ? 'בדרך לקהילה 👋' : 'הצטרפו לקהילה שלנו בפייסבוק'}</span>
              </motion.button>
            </motion.div>

            {/* Fine print */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/25 text-[10px] text-center max-w-xs"
            >
              כל תרומה, גם הקטנה ביותר, עוזרת לנו להמשיך לפתח ולשמור על האפליקציה חופשית לכולם.
            </motion.p>
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
              <span className="text-white/70 text-xs font-medium">{sublabel}</span>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
