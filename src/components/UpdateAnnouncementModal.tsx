import { useState, useEffect } from 'react';
import { Rocket, ScanSearch, Wind, X } from 'lucide-react';

const STORAGE_KEY = 'hasSeenUpdateV2';

export default function UpdateAnnouncementModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4"
      onClick={handleDismiss}
    >
      <div
        className="w-full max-w-md bg-slate-900/95 border border-slate-700/60 rounded-2xl shadow-2xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          aria-label="סגור"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
            <Rocket size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white leading-tight">
            🚀 שדרוג מרגש למערכת!
          </h2>
          <p className="text-slate-300 text-base">
            הוספנו שני כלים חכמים שיעזרו לכם בשטח:
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/50" />

        {/* Features */}
        <div className="flex flex-col gap-4">
          {/* Feature 1 — Medication Scanner */}
          <div className="flex items-start gap-3">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 mt-0.5">
              <ScanSearch size={20} className="text-teal-400" />
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">
              <span className="font-bold text-teal-300">מידע על תרופות:</span>{' '}
              צלמו קופסת תרופה וקבלו מיד את הייעוד שלה, מינונים והתוויות נגד קריטיות - מסודר, ברור ובטוח.
            </p>
          </div>

          {/* Feature 2 — Breathing Synchronizer */}
          <div className="flex items-start gap-3">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 mt-0.5">
              <Wind size={20} className="text-sky-400" />
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">
              <span className="font-bold text-sky-300">מסנכרן נשימות:</span>{' '}
              כלי עזר אודיו-ויזואלי להרגעת מטופלים בחרדה, כולל הנחיה קולית ומוזיקה מרגיעה.
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleDismiss}
          className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95
                     text-white font-bold text-lg transition-all duration-150 shadow-lg shadow-emerald-900/30"
        >
          הבנתי, תודה!
        </button>
      </div>
    </div>
  );
}
