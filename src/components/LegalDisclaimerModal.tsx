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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl p-6 max-w-xl w-full shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">

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

        {/* Continue button */}
        <button
          onClick={onAccept}
          disabled={!checked}
          className="w-full py-3.5 rounded-xl bg-emt-green text-white font-bold text-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          המשך
        </button>
      </div>
    </div>
  );
}
