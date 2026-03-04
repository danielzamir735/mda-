import { FileText, Images, Activity, LayoutGrid } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useHaptics } from '../hooks/useHaptics';

interface Props {
  onGalleryOpen: () => void;
  onNotesOpen: () => void;
  onVitalsOpen: () => void;
  onHubOpen: () => void;
}

export default function BottomNav({ onGalleryOpen, onNotesOpen, onVitalsOpen, onHubOpen }: Props) {
  const t = useTranslation();
  const vibrate = useHaptics();

  return (
    <nav
      className="shrink-0 flex items-center gap-2 px-2 bg-white dark:bg-[#0D0D10] border-t border-gray-200 dark:border-emt-border safe-area-bottom"
      style={{ height: '4.5rem' }}
    >
      <button
        onClick={() => { vibrate(); onNotesOpen(); }}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-3xl
                   bg-blue-50 dark:bg-blue-500/10 border-none
                   text-blue-600 dark:text-blue-400
                   active:scale-95 transition-all duration-150"
        aria-label={t('notes')}
      >
        <FileText size={20} />
        <span className="text-[0.65rem] font-semibold">{t('notes')}</span>
      </button>

      <button
        onClick={() => { vibrate(); onGalleryOpen(); }}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-3xl
                   bg-purple-50 dark:bg-purple-500/10 border-none
                   text-purple-600 dark:text-purple-400
                   active:scale-95 transition-all duration-150"
        aria-label={t('photos')}
      >
        <Images size={20} />
        <span className="text-[0.65rem] font-semibold">{t('photos')}</span>
      </button>

      <button
        onClick={() => { vibrate(); onVitalsOpen(); }}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-3xl
                   bg-green-50 dark:bg-green-500/10 border-none
                   text-green-600 dark:text-green-400
                   active:scale-95 transition-all duration-150"
        aria-label={t('vitalsHistory')}
      >
        <Activity size={20} />
        <span className="text-[0.6rem] font-semibold leading-tight text-center">{t('vitalsHistory')}</span>
      </button>

      <button
        onClick={() => { vibrate(); onHubOpen(); }}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-3xl
                   bg-amber-50 dark:bg-amber-500/10 border-none
                   text-amber-600 dark:text-amber-400
                   active:scale-95 transition-all duration-150"
        aria-label={t('hub')}
      >
        <LayoutGrid size={20} />
        <span className="text-[0.65rem] font-semibold">{t('hub')}</span>
      </button>
    </nav>
  );
}
