import { FileText, Images } from 'lucide-react';

interface Props {
  onGalleryOpen: () => void;
  onNotesOpen: () => void;
}

export default function BottomNav({ onGalleryOpen, onNotesOpen }: Props) {
  return (
    <nav
      className="shrink-0 flex items-center
                 bg-white border-t border-slate-200
                 safe-area-bottom"
      style={{ height: '4rem' }}
    >
      {/* Notes — right side in RTL */}
      <button
        onClick={onNotesOpen}
        className="flex-1 flex flex-col items-center justify-center gap-1
                   text-slate-400 hover:text-slate-700
                   active:text-emt-light transition-colors duration-150
                   h-full"
        aria-label="פתקים"
      >
        <FileText size={22} />
        <span className="text-xs font-medium">פתקים</span>
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-slate-200" />

      {/* Gallery — left side in RTL */}
      <button
        onClick={onGalleryOpen}
        className="flex-1 flex flex-col items-center justify-center gap-1
                   text-slate-400 hover:text-slate-700
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
