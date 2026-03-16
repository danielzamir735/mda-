import { Sparkles } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function WhatsNewModal({ onClose }: Props) {
  const handleClose = () => {
    localStorage.setItem('whatsNew_v2_seen', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-end justify-center p-4 sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-emt-gray rounded-3xl shadow-2xl p-7 flex flex-col gap-5 animate-fade-scale">
        {/* Icon badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emt-yellow/15 flex items-center justify-center shrink-0">
            <Sparkles size={24} className="text-emt-yellow" strokeWidth={2} />
          </div>
          <h2 className="text-gray-900 dark:text-emt-light font-black text-2xl">מה חדש? ✨</h2>
        </div>

        <ul className="flex flex-col gap-3 text-gray-700 dark:text-emt-muted text-sm leading-relaxed">
          <li className="flex gap-2">
            <span className="text-emt-yellow font-bold shrink-0">•</span>
            <span>נוספו בתי חולים לרשימה</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emt-yellow font-bold shrink-0">•</span>
            <span>נוספו תקנים לתיקי כונן</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emt-yellow font-bold shrink-0">•</span>
            <span>מטרונום החייאה מקצועי עם תיעוד מדדים</span>
          </li>
        </ul>

        {/* Dismiss button */}
        <button
          onClick={handleClose}
          className="w-full py-3.5 rounded-2xl bg-emt-yellow text-black font-black text-lg
                     flex items-center justify-center
                     active:scale-[0.97] transition-all duration-150"
        >
          הבנתי, תודה!
        </button>
      </div>
    </div>
  );
}
