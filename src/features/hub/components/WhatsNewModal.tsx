import { X, Sparkles } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useSettingsStore } from '../../../store/settingsStore';
import { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const UPDATES = [
  {
    version: 'גרסה 2.4',
    date: 'מרץ 2026',
    items: [
      'צליל התראה בסיום טיימר מדדים — כעת נמשך 2 שניות',
      'שיפורי טיימר CPR: נעילת מסך ואות צליל בין מחזורים',
      'הוספת מידע פסיכיאטרי — מעלה הכרמל (טירת הכרמל)',
      'עדכון מיקום ביה"ח כרמל — חיפה, רחוב מיכל 7',
    ],
  },
  {
    version: 'גרסה 2.3',
    date: 'פברואר 2026',
    items: [
      'מחשבון כוויות עם דיאגרמת גוף וקטורית מקצועית',
      'מסך בתי חולים — מרכזיות ומיוני ברחבי הארץ',
      'מחלות רקע נפוצות — מילון מונחים קליני',
    ],
  },
  {
    version: 'גרסה 2.2',
    date: 'ינואר 2026',
    items: [
      'מחשבון APGAR לתינוקות',
      'מחשבון חמצן וטבלת מדדים קלינית',
      'טיימר ציריות ותיעוד לידה',
    ],
  },
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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {UPDATES.map((release) => (
          <div
            key={release.version}
            className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray overflow-hidden shadow-sm"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-emt-border/60 bg-gray-50 dark:bg-emt-gray/80">
              <span className="font-bold text-gray-900 dark:text-emt-light text-base">{release.version}</span>
              <span className="text-xs text-gray-500 dark:text-emt-muted">{release.date}</span>
            </div>
            <ul className="px-4 py-3 space-y-2">
              {release.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-emt-light">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emt-yellow shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
