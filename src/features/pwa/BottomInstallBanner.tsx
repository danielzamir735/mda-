import { X } from 'lucide-react';
import { usePwaInstall } from './PwaInstallContext';

export default function BottomInstallBanner() {
  const { showBottomBanner, closeBanner, openFullModal } = usePwaInstall();

  if (!showBottomBanner) return null;

  const handleInstall = () => {
    openFullModal();
  };

  return (
    <div
      className="fixed bottom-20 inset-x-0 z-[9998] flex justify-center px-4 animate-slide-up"
      style={{ direction: 'rtl' }}
    >
      <div className="w-full max-w-md flex items-center gap-3
                      bg-[#12131f] border border-white/10 rounded-2xl px-4 py-3
                      shadow-2xl shadow-black/60">
        {/* App star icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700
                        flex items-center justify-center shadow-md shadow-blue-500/30">
          <svg viewBox="0 0 48 48" className="w-5 h-5" fill="none">
            <path d="M24 6L28 18H40L30 26L34 38L24 30L14 38L18 26L8 18H20L24 6Z" fill="white" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-emt-light font-bold text-sm leading-tight truncate">
            התקן את האפליקציה
          </p>
          <p className="text-emt-muted text-xs mt-0.5 leading-tight truncate">
            גישה מהירה ונוחה יותר
          </p>
        </div>

        {/* Install button */}
        <button
          onClick={handleInstall}
          className="flex-shrink-0 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400
                     active:scale-95 text-white text-sm font-bold transition-all duration-200
                     shadow-md shadow-blue-500/30"
        >
          התקנה
        </button>

        {/* Close */}
        <button
          onClick={closeBanner}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors
                     text-emt-muted hover:text-emt-light"
          aria-label="סגור"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
