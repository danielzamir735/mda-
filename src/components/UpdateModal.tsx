import { RefreshCw, Sparkles } from 'lucide-react';
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
                   rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] p-8
                   flex flex-col items-center gap-6 animate-fade-scale"
      >
        {/* Glow ring behind icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-emt-green/20 blur-2xl" />
          <div
            className="relative w-20 h-20 rounded-full
                       bg-gradient-to-br from-emt-green/30 to-emt-green/10
                       border border-emt-green/40
                       flex items-center justify-center
                       shadow-[0_0_30px_rgba(34,197,94,0.35)]"
          >
            <Sparkles size={34} className="text-emt-green" strokeWidth={1.8} />
          </div>
        </div>

        {/* Text block */}
        <div className="text-center flex flex-col gap-3">
          <h2 className="text-white font-black text-2xl tracking-tight">
            עדכון זמין
          </h2>
          <p className="text-white text-xl leading-relaxed font-semibold">
            גרסה חדשה ומשופרת מוכנה.
            <br />
            העדכון ייקח שנייה אחת בלבד.
          </p>

          {/* Reassurance notes */}
          <div className="mt-1 flex flex-col gap-2 border-t border-white/20 pt-3">
            <p className="text-base leading-relaxed text-white/95">
              אל דאגה, העדכון בטוח ולא ימחק נתונים שהזנתם באפליקציה.
            </p>
            <p className="text-sm leading-relaxed text-white/80">
              ניתן לראות את פירוט החידושים במסך ״מה חדש״ תחת תפריט כלים.
            </p>
          </div>
        </div>

        {/* Update button */}
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full py-4 rounded-2xl
                     bg-emt-green text-white font-black text-base
                     flex items-center justify-center gap-2.5
                     shadow-[0_8px_24px_rgba(34,197,94,0.4)]
                     active:scale-[0.97] transition-all duration-150
                     disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <RefreshCw
            size={18}
            strokeWidth={2.5}
            className={loading ? 'animate-spin' : ''}
          />
          {loading ? 'מעדכן…' : 'עדכן עכשיו'}
        </button>
      </div>
    </div>
  );
}
