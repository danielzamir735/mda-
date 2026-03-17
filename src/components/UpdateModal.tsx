import { useState } from 'react';

interface Props {
  onUpdate: () => void;
}

export default function UpdateModal({ onUpdate }: Props) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = () => {
    setLoading(true);
    onUpdate();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Card */}
      <div
        className="relative w-full max-w-xs bg-[#111114] border border-white/10
                   rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] px-8 py-10
                   flex flex-col items-center gap-7 animate-fade-scale"
      >
        {/* Text block */}
        <div className="text-center flex flex-col gap-3">
          <h2 className="text-emt-light font-black text-2xl tracking-tight">
            עדכון גרסה זמין
          </h2>
          <p className="text-emt-muted text-sm leading-relaxed">
            העדכון ייקח שנייה בדיוק. אל דאגה, שום נתון ששמרת לא יימחק והאפליקציה תעלה מיד מחדש עם הכלים החדשים.
          </p>
        </div>

        {/* Update button */}
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full py-4 rounded-2xl
                     bg-emt-green text-white font-black text-base
                     shadow-[0_8px_24px_rgba(34,197,94,0.4)]
                     active:scale-[0.97] transition-all duration-150
                     disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'מעדכן…' : 'עדכן עכשיו'}
        </button>
      </div>
    </div>
  );
}
