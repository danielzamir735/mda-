import { X, Building2 } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function HospitalsModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-emt-dark">
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מידע בתי חולים</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
          aria-label="סגור"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <Building2 size={56} className="text-cyan-400 opacity-60" />
        <p className="text-gray-500 dark:text-emt-muted font-bold text-lg">מידע בתי חולים</p>
        <p className="text-gray-400 dark:text-emt-muted text-sm opacity-70">
          תכונה זו תכלול מידע על בתי חולים קרובים, מחלקות חירום, וזמני המתנה.
        </p>
        <span className="text-sm font-bold bg-blue-600 text-white px-4 py-1.5 rounded-full shadow-sm">
          בקרוב
        </span>
      </div>
    </div>
  );
}
