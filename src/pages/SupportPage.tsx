import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, CheckCircle } from 'lucide-react';

function useCountUp(target: number, durationMs: number, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) { setCount(0); return; }
    const totalFrames = Math.round(durationMs / 16);
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      const t = frame / totalFrames;
      const eased = 1 - Math.pow(1 - t, 3); // easeOut cubic
      setCount(Math.min(Math.floor(eased * target), target));
      if (frame >= totalFrames) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, durationMs, active]);
  return count;
}

interface Props { isOpen: boolean; onClose: () => void; }

export default function SupportModal({ isOpen, onClose }: Props) {
  const [donated, setDonated] = useState(false);
  const count = useCountUp(2000, 3000, isOpen);

  useEffect(() => {
    if (!isOpen) setDonated(false);
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
          className="fixed inset-0 z-[60] h-[100dvh] overflow-hidden backdrop-blur-xl flex flex-col"
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

          {/* Body */}
          <div className="flex-1 flex flex-col items-center justify-between px-5 pb-6 gap-2">

            {/* Heart + Title */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <motion.div
                animate={{ scale: [1, 1.28, 1, 1.16, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, times: [0, 0.14, 0.28, 0.42, 0.56], ease: 'easeInOut' }}
                className="drop-shadow-[0_0_24px_rgba(244,63,94,0.65)] text-rose-500"
              >
                <Heart size={60} fill="currentColor" />
              </motion.div>
              <h1 className="text-2xl font-black text-white text-center leading-tight">
                חובש<span className="text-rose-400">+</span> זקוק לכם
              </h1>
            </div>

            {/* Count-up */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl font-black text-white tabular-nums leading-none"
              >
                {count.toLocaleString('he-IL')}
                <span className="text-rose-400">+</span>
              </motion.div>
              <p className="text-sm text-white/50 mt-1 font-medium">חובשים כבר משתמשים באפליקציה</p>
            </div>

            {/* Copy */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-center space-y-2 max-w-xs"
            >
              <p className="text-white/80 text-sm leading-relaxed font-medium">
                כדי שנוכל להמשיך להשקיע בכם, להוסיף יכולות חדשות ולשמור על חובש+ נקייה, מקצועית ובשירות מלא עבורכם.
              </p>
              <p className="text-white font-bold text-xl leading-relaxed">
                כל פרגון שלכם מכסה ישירות את העלויות, נותן לנו כוח להמשיך לפתח, ומאפשר לנו להציל חיים – יחד איתכם.
              </p>
            </motion.div>

            {/* Button */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-full max-w-sm"
            >
              <ShinyButton
                label="פרגנו לנו דרך PayBox"
                gradient="from-sky-400 via-blue-600 to-indigo-700"
                done={donated}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(50);
                  setDonated(true);
                  window.open('https://links.payboxapp.com/ikLxTdoky1b', '_blank');
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShinyButton({ label, gradient, done, onClick }: {
  label: string; gradient: string; done: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative w-full py-4 rounded-2xl font-bold text-lg text-white overflow-hidden bg-gradient-to-l ${gradient} shadow-xl active:brightness-90 transition-[filter]`}
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
            <CheckCircle size={22} /> <span>תודה ❤️</span>
          </motion.span>
        ) : (
          <motion.span key="label" exit={{ opacity: 0 }} className="relative z-10">{label}</motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
