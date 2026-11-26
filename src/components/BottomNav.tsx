import { FileText, Images, Calculator, LayoutGrid, Heart, Globe } from 'lucide-react';
import { useTranslation } from '../i18n';
import HapticButton from './HapticButton';

interface Props {
  onGalleryOpen: () => void;
  onNotesOpen: () => void;
  onCalculatorsOpen: () => void;
  onHubOpen: () => void;
  onSupportOpen?: () => void;
  onLanguageBridgeOpen?: () => void;
}

export default function BottomNav({ onGalleryOpen, onNotesOpen, onCalculatorsOpen, onHubOpen, onSupportOpen, onLanguageBridgeOpen }: Props) {
  const t = useTranslation();

  return (
    <nav
      className="shrink-0 flex items-center gap-2 px-2 min-h-[4rem] bg-surface border-t border-line"
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
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-rose-700 dark:text-rose-400"
        aria-label={t('homeNavSupport')}
      >
        <span className="animate-heartbeat">
          <Heart size={24} strokeWidth={1.5} fill="currentColor" />
        </span>
        <span className="text-[0.65rem] font-semibold">{t('homeNavSupport')}</span>
      </HapticButton>

      <HapticButton
        onClick={onNotesOpen}
        pressScale={0.88}
        hapticPattern={10}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-blue-700 dark:text-blue-400"
        aria-label={t('notes')}
      >
        <FileText size={24} strokeWidth={1.5} />
        <span className="text-[0.65rem] font-semibold">{t('notes')}</span>
      </HapticButton>

      <HapticButton
        onClick={onGalleryOpen}
        pressScale={0.88}
        hapticPattern={10}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-purple-700 dark:text-purple-400"
        aria-label={t('photos')}
      >
        <Images size={24} strokeWidth={1.5} />
        <span className="text-[0.65rem] font-semibold">{t('photos')}</span>
      </HapticButton>

      <HapticButton
        onClick={onCalculatorsOpen}
        pressScale={0.88}
        hapticPattern={10}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-indigo-700 dark:text-indigo-400"
        aria-label={t('calculators')}
      >
        <Calculator size={24} strokeWidth={1.5} />
        <span className="text-[0.6rem] font-semibold leading-tight text-center">{t('calculators')}</span>
      </HapticButton>

      <HapticButton
        onClick={() => onLanguageBridgeOpen?.()}
        pressScale={0.88}
        hapticPattern={10}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-blue-700 dark:text-blue-400"
        aria-label={t('languageBridge')}
      >
        <Globe size={24} strokeWidth={1.5} />
        <span className="text-[0.6rem] font-semibold leading-tight text-center">{t('languageBridge')}</span>
      </HapticButton>

      {/* All tools — filled, with a count badge, so it doesn't read as one more single tool */}
      <HapticButton
        onClick={onHubOpen}
        pressScale={0.88}
        hapticPattern={10}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5"
        aria-label={t('hubNavLabel')}
      >
        <span
          // theme-ok: white icon on the filled amber button, the one filled item in the bar
          className="relative w-11 h-8 rounded-xl flex items-center justify-center bg-amber-500 text-white"
          style={{ boxShadow: '0 2px 10px rgba(245,158,11,0.45)' }}
        >
          <LayoutGrid size={20} strokeWidth={2.2} />
          <span
            dir="ltr"
            // theme-ok: white count on the red badge
            className="absolute -top-2 -end-3 min-w-[1.6rem] h-[1.1rem] px-1 rounded-full bg-rose-600 text-white
                       text-[0.6rem] font-black leading-[1.1rem] text-center border-2 border-surface"
          >
            20+
          </span>
        </span>
        <span className="text-[0.65rem] font-black text-amber-800 dark:text-amber-400 leading-tight">{t('hub')}</span>
      </HapticButton>
    </nav>
  );
}
