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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-[90%] max-w-md bg-slate-900 shadow-2xl rounded-2xl border border-emerald-500/30 p-6 sm:p-8 text-center">
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 mx-auto mb-4">
          <DownloadCloud size={28} className="text-emerald-400" />
        </div>

        {/* Text */}
        <p className="text-2xl font-bold text-white mb-3">
          עדכון גרסה זמין
        </p>
        <p className="text-base text-slate-300 mb-6">
          העדכון ייקח שנייה בדיוק. אל דאגה, שום נתון ששמרת לא יימחק והאפליקציה תעלה מיד מחדש.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full py-3 text-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold
                       rounded-xl transition-colors duration-150
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'מעדכן…' : 'עדכן עכשיו'}
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="w-full py-2.5 text-slate-400 hover:text-white text-base
                         transition-colors duration-150"
            >
              מאוחר יותר
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
