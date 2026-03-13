import { RefreshCw } from 'lucide-react';

interface Props {
  onUpdate: () => void;
}

export default function UpdateModal({ onUpdate }: Props) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-emt-gray rounded-3xl shadow-2xl p-7 flex flex-col items-center gap-5 animate-fade-scale">
        {/* Icon badge */}
        <div className="w-20 h-20 rounded-full bg-emt-green/10 dark:bg-emt-green/15 flex items-center justify-center">
          <RefreshCw size={38} className="text-emt-green" strokeWidth={2.2} />
        </div>

        {/* Text */}
        <div className="text-center flex flex-col gap-1.5">
          <h2 className="text-gray-900 dark:text-emt-light font-black text-2xl">עדכון זמין</h2>
          <p className="text-gray-500 dark:text-emt-muted text-sm leading-relaxed">
            גרסה חדשה של האפליקציה מוכנה ומחכה לך.
            <br />
            העדכון ייקח שנייה אחת בלבד.
          </p>
        </div>

        {/* Update button */}
        <button
          onClick={onUpdate}
          className="w-full py-3.5 rounded-2xl bg-emt-green text-white font-black text-lg
                     flex items-center justify-center gap-2.5
                     active:scale-[0.97] transition-all duration-150 shadow-lg shadow-emt-green/25"
        >
          <RefreshCw size={20} strokeWidth={2.5} />
          עדכן עכשיו
        </button>
      </div>
    </div>
  );
}
