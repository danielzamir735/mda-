import { FileText, Images } from 'lucide-react';

interface Props {
  onGalleryOpen: () => void;
}

export default function BottomNav({ onGalleryOpen }: Props) {
  return (
    <nav
      className="shrink-0 flex items-center
                 bg-emt-gray/95 backdrop-blur-md
                 border-t border-white/10
                 safe-area-bottom"
      style={{ height: '4rem' }}
    >
      {/* Notes — right side in RTL */}
      <button
        className="flex-1 flex flex-col items-center justify-center gap-1
                   text-emt-light/40 hover:text-emt-light/80
                   active:text-emt-light transition-colors duration-150
                   h-full"
        aria-label="פתקים"
      >
        <FileText size={22} />
        <span className="text-xs font-medium">פתקים</span>
      </button>

      {/* Divider */}
      <div className="w-px h-8 bg-white/10" />

      {/* Gallery — left side in RTL */}
      <button
        onClick={onGalleryOpen}
        className="flex-1 flex flex-col items-center justify-center gap-1
                   text-emt-light/40 hover:text-emt-light/80
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
