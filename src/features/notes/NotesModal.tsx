import { X, Trash2 } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';

interface Props {
  isOpen: boolean;
  noteText: string;
  onTextChange: (text: string) => void;
  onClose: () => void;
}

export default function NotesModal({ isOpen, noteText, onTextChange, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3
                      border-b border-emt-border">
        <h2 className="text-emt-light font-bold text-xl">פתקים</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTextChange('')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                       bg-red-600/20 border border-red-500/40 text-red-400
                       text-sm font-bold active:scale-95 transition-all duration-150"
            aria-label="נקה נתונים"
          >
            <Trash2 size={14} />
            נקה נתונים
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-emt-gray border border-emt-border
                       flex items-center justify-center
                       active:scale-90 transition-transform text-emt-muted hover:text-emt-light"
            aria-label="סגור"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        className="flex-1 bg-[#09090B] text-emt-light text-base leading-relaxed
                   p-4 resize-none focus:outline-none placeholder:text-emt-border"
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
