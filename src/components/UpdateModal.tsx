import { useState } from 'react';
import { DownloadCloud } from 'lucide-react';

interface Props {
  onUpdate: () => void;
  onDismiss?: () => void;
}

export default function UpdateModal({ onUpdate, onDismiss }: Props) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = () => {
    setLoading(true);
    onUpdate();
  };

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96
                 z-[99999] animate-slide-up"
    >
      <div
        className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/30
                   rounded-2xl shadow-2xl shadow-black/60 px-5 py-4
                   flex items-start gap-4"
      >
        {/* Icon */}
        <div className="mt-0.5 shrink-0 flex items-center justify-center
                        w-10 h-10 rounded-xl bg-emerald-500/10">
          <DownloadCloud size={20} className="text-emerald-400" />
        </div>

        {/* Text */}
        <div className="flex-1 flex flex-col gap-1 text-right">
          <p className="text-white font-bold text-base leading-snug">
            עדכון גרסה זמין
          </p>
          <p className="text-slate-300 text-sm leading-relaxed">
            העדכון ייקח שנייה בדיוק. אל דאגה, שום נתון ששמרת לא יימחק והאפליקציה תעלה מיד מחדש.
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 mt-3">
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-white text-sm px-3 py-1.5
                           transition-colors duration-150"
              >
                מאוחר יותר
              </button>
            )}
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium
                         text-sm rounded-xl px-4 py-2 transition-colors duration-150
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'מעדכן…' : 'עדכן עכשיו'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
