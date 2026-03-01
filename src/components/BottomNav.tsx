import { FileText, Images, Activity, LayoutGrid } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface Props {
  onGalleryOpen: () => void;
  onNotesOpen: () => void;
  onVitalsOpen: () => void;
  onHubOpen: () => void;
}

const btnCls =
  'flex-1 flex flex-col items-center justify-center gap-1 h-full ' +
  'text-gray-400 dark:text-emt-muted ' +
  'hover:text-blue-400 active:text-blue-500 ' +
  'transition-colors duration-150';

export default function BottomNav({ onGalleryOpen, onNotesOpen, onVitalsOpen, onHubOpen }: Props) {
  const t = useTranslation();

  return (
    <nav
      className="shrink-0 flex items-center bg-white dark:bg-[#0D0D10] border-t border-gray-200 dark:border-emt-border safe-area-bottom"
      style={{ height: '4rem' }}
    >
      <button onClick={onNotesOpen} className={btnCls} aria-label={t('notes')}>
        <FileText size={22} />
        <span className="text-xs font-medium">{t('notes')}</span>
      </button>

      <div className="w-px h-8 bg-gray-200 dark:bg-emt-border" />

      <button onClick={onGalleryOpen} className={btnCls} aria-label={t('photos')}>
        <Images size={22} />
        <span className="text-xs font-medium">{t('photos')}</span>
      </button>

      <div className="w-px h-8 bg-gray-200 dark:bg-emt-border" />

      <button onClick={onVitalsOpen} className={btnCls} aria-label={t('vitalsHistory')}>
        <Activity size={22} />
        <span className="text-[0.6rem] font-medium leading-tight text-center">
          {t('vitalsHistory')}
        </span>
      </button>

      <div className="w-px h-8 bg-gray-200 dark:bg-emt-border" />

      <button onClick={onHubOpen} className={btnCls} aria-label={t('hub')}>
        <LayoutGrid size={22} />
        <span className="text-xs font-medium">{t('hub')}</span>
      </button>
    </nav>
  );
}
