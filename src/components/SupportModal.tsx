import { X, Heart, Coffee, Star } from 'lucide-react';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center" dir="rtl">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Sheet */}
      <div
        className="relative w-full max-w-md bg-[#0f0f12] border border-white/10
                   rounded-t-3xl shadow-[0_-24px_80px_rgba(0,0,0,0.8)]
                   flex flex-col gap-0 animate-slide-up overflow-hidden"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Subtle gradient strip at top */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />

        <div className="p-6 flex flex-col gap-5">
          {/* Drag handle */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto -mt-1" />

          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Heart size={22} className="text-rose-400" fill="currentColor" />
              <h2 className="text-white font-black text-xl tracking-tight">תמכו בנו</h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 border border-white/10
                         flex items-center justify-center active:scale-90 transition-transform
                         text-white/50 hover:text-white"
              aria-label="סגור"
            >
              <X size={18} />
            </button>
          </div>

          {/* Hero copy */}
          <div className="rounded-2xl bg-white/5 border border-white/8 p-4 text-center">
            <p className="text-white/90 text-base leading-relaxed font-medium">
              האפליקציה פותחה בהתנדבות מתוך אהבה לעבודת ההצלה —
              <br />
              <span className="text-rose-300 font-bold">בחינם, לכל הצוות הרפואי, ללא מטרות רווח.</span>
            </p>
            <p className="text-white/55 text-sm leading-relaxed mt-2">
              אם היא עוזרת לך בשטח, שקול לתמוך בהמשך הפיתוח 🙏
            </p>
          </div>

          {/* Social proof stars */}
          <div className="flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className="text-amber-400" fill="currentColor" />
            ))}
            <span className="text-white/40 text-xs mr-2">מאות חובשים כבר משתמשים</span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <a
              href="https://www.buymeacoffee.com/danielzamir"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 font-black text-base rounded-2xl px-5 py-4
                         active:scale-[0.97] transition-transform shadow-lg text-[#111114]"
              style={{ background: 'linear-gradient(135deg, #FFDD00 0%, #FFB800 100%)' }}
            >
              <Coffee size={22} />
              קנו לי קפה ☕
            </a>

            <a
              href="https://www.paybox.co.il"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 font-bold text-base rounded-2xl px-5 py-4
                         bg-purple-600/80 border border-purple-500/40 text-white
                         active:scale-[0.97] transition-transform"
            >
              <Heart size={20} fill="currentColor" className="text-purple-200" />
              תרומה בפייבוקס
            </a>
          </div>

          {/* Thank you */}
          <p className="text-center text-white/35 text-xs leading-relaxed">
            כל תמיכה — גדולה כקטנה — עוזרת לשמור את האפליקציה חיה ומתפתחת
          </p>
        </div>
      </div>
    </div>
  );
}
