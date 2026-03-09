import { X, Sparkles } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useSettingsStore } from '../../../store/settingsStore';
import { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const UPDATES = [
  'נוספו בתי חולים לרשימה',
  'נוספו תקנים לתיקי כונן',
  'מטרונום החייאה מקצועי עם תיעוד מדדים',
];

export default function WhatsNewModal({ isOpen, onClose }: Props) {
  const setHasSeenLatestUpdate = useSettingsStore((s) => s.setHasSeenLatestUpdate);
  useModalBackHandler(isOpen, onClose);

  useEffect(() => {
    if (isOpen) setHasSeenLatestUpdate(true);
  }, [isOpen, setHasSeenLatestUpdate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-emt-dark" dir="rtl">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles size={22} className="text-emt-yellow" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מה חדש?</h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-dark border border-gray-200 dark:border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
          aria-label="סגור"
        >
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray overflow-hidden shadow-sm">
          <ul className="px-4 py-3 space-y-3">
            {UPDATES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-base text-gray-700 dark:text-emt-light">
                <span className="mt-2 w-2 h-2 rounded-full bg-emt-yellow shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
