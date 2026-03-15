import { X, Heart, Coffee, Star, Mail } from 'lucide-react';
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
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />

      {/* Sheet */}
      <div
        className="relative w-full max-w-md bg-[#111114] border border-white/10
                   rounded-t-3xl shadow-[0_-20px_80px_rgba(0,0,0,0.7)]
                   p-6 flex flex-col gap-5 animate-slide-up"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto -mt-1" />

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Heart size={22} className="text-emt-red" fill="#EF233C" />
            <h2 className="text-emt-light font-black text-xl tracking-tight">תמכו בנו</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/10
                       flex items-center justify-center active:scale-90 transition-transform
                       text-emt-muted hover:text-emt-light"
            aria-label="סגור"
          >
            <X size={18} />
          </button>
        </div>

        {/* Description */}
        <p className="text-white/85 text-base leading-relaxed">
          האפליקציה פותחה מתוך אהבה לעבודת ההצלה ומוצעת בחינם לכלל הצוות הרפואי.
          <br />
          אם היא עוזרת לך בשטח — שקול לתמוך בפיתוח המשך 🙏
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <a
            href="https://www.buymeacoffee.com/danielzamir"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 font-black text-base rounded-2xl px-5 py-4
                       active:scale-[0.97] transition-transform shadow-lg text-[#111114]"
            style={{ background: '#FFDD00' }}
          >
            <Coffee size={22} />
            קנו לי קפה ☕
          </a>

          <a
            href="mailto:ydbyd4723@gmail.com?subject=תמיכה%20באפליקציה%20עוזר%20חובש"
            className="flex items-center gap-3 bg-white/10 border border-white/15
                       text-emt-light font-bold text-base rounded-2xl px-5 py-4
                       active:scale-[0.97] transition-transform"
          >
            <Mail size={22} />
            שלח הודעת תמיכה
          </a>
        </div>

        {/* Thank you note */}
        <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
          <Star size={13} className="text-emt-yellow" fill="#F59E0B" />
          <span>תודה על כל שיתוף, דירוג והמלצה!</span>
          <Star size={13} className="text-emt-yellow" fill="#F59E0B" />
        </div>
      </div>
    </div>
  );
}
