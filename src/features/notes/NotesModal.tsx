import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  noteText: string;
  onTextChange: (text: string) => void;
  onClose: () => void;
}

export default function NotesModal({ isOpen, noteText, onTextChange, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-emt-light font-bold text-xl">פתקים</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 border border-white/15
                     flex items-center justify-center
                     active:scale-90 transition-transform"
          aria-label="סגור"
        >
          <X size={20} className="text-emt-light" />
        </button>
      </div>

      {/* Textarea */}
      <textarea
        className="flex-1 bg-transparent text-emt-light text-base leading-relaxed
                   p-4 resize-none focus:outline-none placeholder:text-emt-light/25"
        placeholder="כתוב פתק כאן..."
        value={noteText}
        onChange={e => onTextChange(e.target.value)}
        dir="rtl"
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
      />
    </div>
  );
}
