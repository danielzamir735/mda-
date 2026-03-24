import { useState } from 'react';
import { Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onAccept: () => void;
}

export default function LegalDisclaimerModal({ isOpen, onAccept }: Props) {
  const [checked, setChecked] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:px-4">
      <div className="bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)] overflow-hidden">

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Icon + Title */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Info size={32} className="text-blue-500" />
            </div>
            <h2 className="text-gray-900 dark:text-emt-light font-black text-xl leading-snug">
              הצהרה חשובה לפני השימוש באפליקציה
            </h2>
          </div>

          {/* Disclaimer text */}
          <div className="text-right text-gray-700 dark:text-emt-light text-sm leading-relaxed space-y-3 border border-gray-200 dark:border-emt-border rounded-xl p-4 bg-gray-50 dark:bg-emt-dark/50">
            <p className="font-bold text-gray-800 dark:text-emt-light">הצהרה חשובה לפני השימוש באפליקציה</p>
            <p>
              אפליקציה זו פותחה ככלי עזר בלבד עבור אנשי רפואה ומתנדבים בשירותי חירום.{' '}
              <strong>היא אינה מחליפה שיקול דעת רפואי מקצועי</strong>, הכשרה רפואית, או את
              הפרוטוקולים הרשמיים של ארגון מגן דוד אדום ורשויות הבריאות.
            </p>
            <p>
              כל המידע, החישובים, הנתונים והכלים המוצגים באפליקציה ניתנים{' '}
              <strong>כמדריך כללי בלבד</strong>. אין לראות בהם המלצה רפואית, אבחנה, או הוראת
              טיפול מחייבת.
            </p>
            <p>
              המפתחים ומפעילי האפליקציה <strong>אינם אחראים</strong> לכל נזק, תוצאה, או סיבוך
              שייגרמו כתוצאה מהסתמכות על המידע או בכלים שבאפליקציה. בכל מקרה של ספק, יש לפעול
              על פי הפרוטוקולים הרשמיים.
            </p>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-blue-500 cursor-pointer"
            />
            <span className="text-gray-800 dark:text-emt-light text-sm font-semibold leading-relaxed text-right">
              קראתי, הבנתי ואני מאשר את תנאי השימוש.
            </span>
          </label>
        </div>

        {/* Sticky bottom button — always visible, respects iPhone home indicator */}
        <div className="flex-shrink-0 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),1.5rem)] border-t border-gray-100 dark:border-emt-border">
          <button
            onClick={onAccept}
            disabled={!checked}
            className="w-full py-3.5 rounded-xl bg-emt-green text-white font-bold text-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            המשך
          </button>
        </div>
      </div>
    </div>
  );
}
