import { FileText, Images } from 'lucide-react';

interface Props {
  onGalleryOpen: () => void;
  onNotesOpen: () => void;
}

export default function BottomNav({ onGalleryOpen, onNotesOpen }: Props) {
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
    </nav>
  );
}
