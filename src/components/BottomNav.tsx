import { FileText, Images, Activity, LayoutGrid } from 'lucide-react';

interface Props {
  onGalleryOpen: () => void;
  onNotesOpen: () => void;
  onVitalsOpen: () => void;
  onHubOpen: () => void;
}

export default function BottomNav({ onGalleryOpen, onNotesOpen, onVitalsOpen, onHubOpen }: Props) {
  return (
    <nav
      className="shrink-0 flex items-center
                 bg-[#0D0D10] border-t border-emt-border
                 safe-area-bottom"
      style={{ height: '4rem' }}
    >
      <button
        onClick={onNotesOpen}
        className="flex-1 flex flex-col items-center justify-center gap-1
                   text-emt-muted hover:text-emt-light
                   active:text-emt-light transition-colors duration-150
                   h-full"
        aria-label="פתקים"
      >
        <FileText size={22} />
        <span className="text-xs font-medium">פתקים</span>
      </button>

      <div className="w-px h-8 bg-emt-border" />

      <button
        onClick={onGalleryOpen}
        className="flex-1 flex flex-col items-center justify-center gap-1
                   text-emt-muted hover:text-emt-light
                   active:text-emt-light transition-colors duration-150
                   h-full"
        aria-label="תמונות"
      >
        <Images size={22} />
        <span className="text-xs font-medium">תמונות</span>
      </button>

      <div className="w-px h-8 bg-emt-border" />

      <button
        onClick={onVitalsOpen}
        className="flex-1 flex flex-col items-center justify-center gap-1
                   text-emt-muted hover:text-emt-light
                   active:text-emt-light transition-colors duration-150
                   h-full"
        aria-label="היסטוריית מדדים"
      >
        <Activity size={22} />
        <span className="text-[0.6rem] font-medium leading-tight text-center">היסטוריית מדדים</span>
      </button>

      <div className="w-px h-8 bg-emt-border" />

      <button
        onClick={onHubOpen}
        className="flex-1 flex flex-col items-center justify-center gap-1
                   text-emt-muted hover:text-emt-light
                   active:text-emt-light transition-colors duration-150
                   h-full"
        aria-label="עזרים"
      >
        <LayoutGrid size={22} />
        <span className="text-xs font-medium">עזרים</span>
      </button>
    </nav>
  );
}
