import { X, Sparkles, Pill, Stethoscope, Tablet } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const VERSION_KEY = 'app-version-2.1';

type UpdateItem =
  | { type: 'icon'; Icon: React.ElementType; iconClass: string; text: string }
  | { type: 'emoji'; emoji: string; text: string };

const UPDATES: UpdateItem[] = [
  {
    type: 'icon',
    Icon: Pill,
    iconClass: 'text-green-400',
    text: 'קבוצות תרופות לטאבלט: מילון חכם לסיווג תרופות לפי קבוצות, תואם בדיוק לטאבלט מד"א.',
  },
  {
    type: 'icon',
    Icon: Stethoscope,
    iconClass: 'text-sky-400',
    text: 'תרופות נפוצות בשטח: רשימה מהירה של התרופות הכי נפוצות בישראל (אליקוויס, קרדילוק ועוד) והמשמעות שלהן.',
  },
  {
    type: 'icon',
    Icon: Tablet,
    iconClass: 'text-purple-400',
    text: 'מחלות רקע מהטאבלט: נוסף מתג בחלון מחלות הרקע המציג את הרשימה המדויקת שמופיעה בטאבלט.',
  },
  { type: 'emoji', emoji: '🏥', text: "בתי חולים: עדכון מספרי טלפון והוספת כפתור 'ניווט לבית החולים הקרוב ביותר'." },
  { type: 'emoji', emoji: '⏱️', text: 'מטרונום: שדרוג הממשק לעבודה נוחה ומדויקת יותר.' },
  { type: 'emoji', emoji: '📸', text: 'מצלמה: מנגנון צילום חדש, מהיר ויציב.' },
  { type: 'emoji', emoji: '✨', text: 'עיצוב: שדרוג חוויית המשתמש והנראות הכללית באפליקציה.' },
  { type: 'emoji', emoji: '🛠️', text: 'יציבות: תיקוני באגים ושיפורי ביצועים תחת מכסה המנוע.' },
];

export default function WhatsNewModal({ isOpen, onClose }: Props) {
  const [autoOpen, setAutoOpen] = useState(false);
  const visible = isOpen || autoOpen;

  useModalBackHandler(visible, handleClose);

  useEffect(() => {
    if (!localStorage.getItem(VERSION_KEY)) {
      setAutoOpen(true);
    }
  }, []);

  function handleClose() {
    if (autoOpen) {
      localStorage.setItem(VERSION_KEY, 'true');
      setAutoOpen(false);
    }
    onClose();
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-emt-dark" dir="rtl">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles size={22} className="text-emt-yellow" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מה חדש ב'חובש +'? 🚀</h2>
        </div>
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-dark border border-gray-200 dark:border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
          aria-label="סגור"
        >
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="w-full rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100 dark:divide-emt-border">
            {UPDATES.map((item, i) => (
              <li key={i} className="flex items-start gap-4 px-5 py-4">
                {item.type === 'icon' ? (
                  <item.Icon size={22} className={`${item.iconClass} shrink-0 mt-0.5`} strokeWidth={1.8} />
                ) : (
                  <span className="text-2xl shrink-0 leading-tight">{item.emoji}</span>
                )}
                <span className="text-base text-gray-700 dark:text-emt-light leading-relaxed">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-emt-muted font-medium">
          תודה שאתם שותפים לדרך! ❤️
        </p>
      </div>
    </div>
  );
}
