import { FileText, Images, Activity, LayoutGrid, Heart, Globe } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import HapticButton from './HapticButton';

interface Props {
  onGalleryOpen: () => void;
  onNotesOpen: () => void;
  onVitalsOpen: () => void;
  onHubOpen: () => void;
  onSupportOpen?: () => void;
  onLanguageBridgeOpen?: () => void;
}

export default function BottomNav({ onGalleryOpen, onNotesOpen, onVitalsOpen, onHubOpen, onSupportOpen, onLanguageBridgeOpen }: Props) {
  const t = useTranslation();

  return (
    <nav
      className="shrink-0 flex items-center gap-2 px-2 min-h-[4rem] bg-white dark:bg-[#0D0D10] border-t border-gray-200 dark:border-emt-border"
    >
      <style>{`
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

      {/* Support */}
      <HapticButton
        onClick={() => onSupportOpen?.()}
        pressScale={0.88}
        hapticPattern={10}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-rose-400"
        aria-label="תמיכה"
      >
        <span className="animate-heartbeat">
          <Heart size={24} strokeWidth={1.5} fill="currentColor" />
        </span>
        <span className="text-[0.65rem] font-semibold">Support</span>
      </HapticButton>

      <HapticButton
        onClick={onNotesOpen}
        pressScale={0.88}
        hapticPattern={10}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-blue-600 dark:text-blue-400"
        aria-label={t('notes')}
      >
        <FileText size={24} strokeWidth={1.5} />
        <span className="text-[0.65rem] font-semibold">{t('notes')}</span>
      </HapticButton>

      <HapticButton
        onClick={onGalleryOpen}
        pressScale={0.88}
        hapticPattern={10}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-purple-600 dark:text-purple-400"
        aria-label={t('photos')}
      >
        <Images size={24} strokeWidth={1.5} />
        <span className="text-[0.65rem] font-semibold">{t('photos')}</span>
      </HapticButton>

      <HapticButton
        onClick={onVitalsOpen}
        pressScale={0.88}
        hapticPattern={10}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-green-600 dark:text-green-400"
        aria-label={t('vitalsHistory')}
      >
        <Activity size={24} strokeWidth={1.5} />
        <span className="text-[0.6rem] font-semibold leading-tight text-center">{t('vitalsHistory')}</span>
      </HapticButton>

      <HapticButton
        onClick={() => onLanguageBridgeOpen?.()}
        pressScale={0.88}
        hapticPattern={10}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-blue-500 dark:text-blue-400"
        aria-label={t('languageBridge')}
      >
        <Globe size={24} strokeWidth={1.5} />
        <span className="text-[0.6rem] font-semibold leading-tight text-center">{t('languageBridge')}</span>
      </HapticButton>

      <HapticButton
        onClick={onHubOpen}
        pressScale={0.88}
        hapticPattern={10}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-amber-400"
        aria-label={t('hub')}
      >
        <LayoutGrid size={24} strokeWidth={1.5} />
        <span className="text-[0.65rem] font-black">{t('hub')}</span>
      </HapticButton>
    </nav>
  );
}
