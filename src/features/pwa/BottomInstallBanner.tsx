import { X } from 'lucide-react';
import { usePwaInstall } from './PwaInstallContext';

const StarIcon = () => (
  <svg viewBox="0 0 48 48" width={20} height={20} fill="none">
    <path d="M24 4L29 17H43L32 26L36 39L24 31L12 39L16 26L5 17H19L24 4Z" fill="white" />
  </svg>
);

export default function BottomInstallBanner() {
  const { showBottomBanner, closeBanner, openFullModal } = usePwaInstall();

  if (!showBottomBanner) return null;

  return (
    <div
      className="fixed bottom-20 inset-x-0 z-[9998] flex justify-center px-4 animate-slide-up"
      style={{ direction: 'rtl' }}
    >
      <div
        className="w-full max-w-md flex items-center gap-3
                   bg-gradient-to-l from-[#0f1120] to-[#111328]
                   border border-white/10 rounded-2xl px-4 py-3
                   shadow-2xl shadow-black/70 backdrop-blur-sm"
      >
        {/* App icon (right side in RTL) */}
        <div
          className="flex-shrink-0 w-11 h-11 rounded-2xl
                     bg-gradient-to-br from-blue-500 to-blue-700
                     flex items-center justify-center shadow-lg shadow-blue-600/40"
        >
          <StarIcon />
        </div>

        {/* Stacked text */}
        <div className="flex-1 min-w-0 text-right">
          <p className="text-white font-bold text-sm leading-tight truncate">
            התקן את האפליקציה
          </p>
          <p className="text-slate-400 text-xs mt-0.5 leading-tight truncate">
            גישה מהירה ונוחה יותר
          </p>
        </div>

        {/* Install button */}
        <button
          onClick={openFullModal}
          className="flex-shrink-0 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500
                     active:scale-95 text-white text-sm font-bold transition-all duration-200
                     shadow-md shadow-blue-600/35"
        >
          התקנה
        </button>

        {/* Close button (far left in RTL) */}
        <button
          onClick={closeBanner}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors
                     text-slate-500 hover:text-slate-200"
          aria-label="סגור"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
