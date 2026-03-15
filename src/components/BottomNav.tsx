import { FileText, Images, Activity, LayoutGrid, Heart } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useHaptics } from '../hooks/useHaptics';

interface Props {
  onGalleryOpen: () => void;
  onNotesOpen: () => void;
  onVitalsOpen: () => void;
  onHubOpen: () => void;
  onSupportOpen: () => void;
}

export default function BottomNav({ onGalleryOpen, onNotesOpen, onVitalsOpen, onHubOpen, onSupportOpen }: Props) {
  const t = useTranslation();
  const vibrate = useHaptics();

  return (
    <nav
      className="shrink-0 flex items-center gap-2 px-2 min-h-[4rem] bg-white dark:bg-[#0D0D10] border-t border-gray-200 dark:border-emt-border safe-area-bottom"
    >
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.18); }
        }
        .animate-breathe {
          animation: breathe 2.2s ease-in-out infinite;
          display: inline-flex;
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          14%  { transform: scale(1.25); }
          28%  { transform: scale(1); }
          42%  { transform: scale(1.18); }
          56%  { transform: scale(1); }
        }
        .animate-heartbeat {
          animation: heartbeat 1.4s ease-in-out infinite;
          display: inline-flex;
        }
      `}</style>

      {/* Support — far right in RTL */}
      <button
        onClick={() => { vibrate(); onSupportOpen(); }}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2
                   text-rose-400
                   active:scale-95 transition-all duration-150"
        aria-label="תמיכה"
      >
        <span className="animate-heartbeat">
          <Heart size={20} fill="currentColor" />
        </span>
      </button>

      <button
        onClick={() => { vibrate(); onNotesOpen(); }}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2
                   text-blue-600 dark:text-blue-400
                   active:scale-95 transition-all duration-150"
        aria-label={t('notes')}
      >
        <FileText size={20} />
        <span className="text-[0.65rem] font-semibold">{t('notes')}</span>
      </button>

      <button
        onClick={() => { vibrate(); onGalleryOpen(); }}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2
                   text-purple-600 dark:text-purple-400
                   active:scale-95 transition-all duration-150"
        aria-label={t('photos')}
      >
        <Images size={20} />
        <span className="text-[0.65rem] font-semibold">{t('photos')}</span>
      </button>

      <button
        onClick={() => { vibrate(); onVitalsOpen(); }}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2
                   text-green-600 dark:text-green-400
                   active:scale-95 transition-all duration-150"
        aria-label={t('vitalsHistory')}
      >
        <Activity size={20} />
        <span className="text-[0.6rem] font-semibold leading-tight text-center">{t('vitalsHistory')}</span>
      </button>

      <button
        onClick={() => { vibrate(); onHubOpen(); }}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2
                   text-amber-500 dark:text-amber-400
                   active:scale-95 transition-all duration-150"
        aria-label={t('hub')}
      >
        <span className="animate-breathe">
          <LayoutGrid size={20} />
        </span>
        <span className="text-[0.65rem] font-semibold">{t('hub')}</span>
      </button>
    </nav>
  );
}
