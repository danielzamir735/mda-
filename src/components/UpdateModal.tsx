import { RefreshCw } from 'lucide-react';
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
    <div className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center p-4 pb-6 pointer-events-none">
      {/* Toast card */}
      <div
        className="pointer-events-auto w-full max-w-sm
                   bg-white/10 backdrop-blur-xl
                   border border-white/20
                   rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]
                   p-4
                   flex items-center gap-4
                   animate-slide-up"
      >
        {/* Icon */}
        <div className="relative flex-shrink-0 flex items-center justify-center w-12 h-12">
          <div className="absolute inset-0 rounded-full bg-emt-green/25 blur-lg" />
          <div
            className="relative w-12 h-12 rounded-full
                       bg-gradient-to-br from-emt-green/40 to-emt-green/15
                       border border-emt-green/50
                       flex items-center justify-center
                       shadow-[0_0_20px_rgba(34,197,94,0.4)]
                       text-xl"
          >
            🚀
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 text-right">
          <p className="text-white font-black text-base leading-tight">
            גרסה חדשה זמינה! 🚀
          </p>
          <p className="text-white/70 text-sm mt-0.5 leading-snug">
            נוספו כלים חדשים ושיפורים
          </p>
        </div>

        {/* Update button */}
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="flex-shrink-0 px-4 py-2.5 rounded-xl
                     bg-emt-green text-white font-black text-sm
                     flex items-center gap-1.5
                     shadow-[0_4px_16px_rgba(34,197,94,0.45)]
                     active:scale-[0.96] transition-all duration-150
                     disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <RefreshCw
            size={14}
            strokeWidth={2.5}
            className={loading ? 'animate-spin' : ''}
          />
          {loading ? 'מעדכן…' : 'עדכן'}
        </button>
      </div>
    </div>
  );
}
