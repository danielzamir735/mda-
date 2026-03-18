import { X, Sparkles, Pill, Stethoscope, Tablet, BookOpen, Zap, Camera, Wrench } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type UpdateItem =
  | { type: 'icon'; Icon: React.ElementType; iconClass: string; text: string }
  | { type: 'emoji'; emoji: string; text: string }
  | { type: 'section'; label: string };

const UPDATES: UpdateItem[] = [
  // ── v2.1 ──────────────────────────────────────────
  { type: 'section', label: 'גרסה 2.1 — עדכון אחרון' },
  {
    type: 'icon',
    Icon: BookOpen,
    iconClass: 'text-amber-400',
    text: 'מילון רפואי מובנה: הוספנו הסברים רפואיים מקיפים וברורים. פשוט לחצו על כל מחלה במסך \'מחלות רקע נפוצות\' לקבלת הפירוט.',
  },
  {
    type: 'icon',
    Icon: Zap,
    iconClass: 'text-yellow-400',
    text: 'התקנה מהירה וחלקה: שדרגנו את חוויית ההתקנה! כעת ניתן להתקין את \'חובש+\' למסך הבית בלחיצת כפתור אחת (זמין במסך כלים).',
  },
  {
    type: 'icon',
    Icon: Camera,
    iconClass: 'text-sky-400',
    text: 'איכות מצלמה 4K: שברנו את מגבלות הדפדפן! צילום מסמכים, א.ק.ג ופציעות מתוך האפליקציה כעת חד וברור מתמיד.',
  },
  {
    type: 'icon',
    Icon: Wrench,
    iconClass: 'text-slate-400',
    text: 'שיפורי ביצועים: תיקוני באגים, שדרוג ממשק המשתמש, ייעול המטרונום, וחוויית שימוש חלקה יותר.',
  },
  // ── v2.0 ──────────────────────────────────────────
  { type: 'section', label: 'גרסה 2.0' },
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
  useModalBackHandler(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-emt-dark" dir="rtl">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles size={22} className="text-emt-yellow" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מה חדש ב'חובש +'? 🚀</h2>
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
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="w-full rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100 dark:divide-emt-border">
            {UPDATES.map((item, i) => {
              if (item.type === 'section') {
                return (
                  <li key={i} className="px-5 py-2.5 bg-gray-50 dark:bg-emt-dark/60">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-emt-muted">
                      {item.label}
                    </span>
                  </li>
                );
              }
              return (
                <li key={i} className="flex items-start gap-4 px-5 py-4">
                  {item.type === 'icon' ? (
                    <item.Icon size={22} className={`${item.iconClass} shrink-0 mt-0.5`} strokeWidth={1.8} />
                  ) : (
                    <span className="text-2xl shrink-0 leading-tight">{item.emoji}</span>
                  )}
                  <span className="text-base text-gray-700 dark:text-emt-light leading-relaxed">{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-emt-muted font-medium">
          תודה שאתם שותפים לדרך! ❤️
        </p>
      </div>
    </div>
  );
}
