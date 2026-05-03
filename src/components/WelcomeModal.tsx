import { Stethoscope, WifiOff, Home, Mail, Smartphone } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:px-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)] overflow-hidden">

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-5">
          {/* Icon + Title */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-emt-red/10 flex items-center justify-center">
              <Stethoscope size={32} className="text-emt-red" />
            </div>
            <h2 className="text-gray-900 dark:text-emt-light font-black text-2xl leading-snug">
              ברוכים הבאים לאפליקציית חובש+
            </h2>
            <span className="inline-block bg-emt-red/10 text-emt-red font-bold text-sm px-3 py-1 rounded-full">
              גרסת בטא
            </span>
          </div>

          {/* Feature bullets */}
          <ul className="flex flex-col gap-3 text-right">
            <li className="flex items-start gap-3">
              <WifiOff size={20} className="text-emt-green shrink-0 mt-0.5" />
              <p className="text-gray-700 dark:text-emt-light text-base leading-relaxed">
                <span className="font-bold">עבודה ללא אינטרנט (Offline)!</span>{' '}
                האפליקציה תומכת כעת בעבודה מלאה גם ללא חיבור לרשת.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <Home size={20} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-gray-700 dark:text-emt-light text-base leading-relaxed">
                <span className="font-bold">הוסף למסך הבית (Add to Home Screen)</span>{' '}
                לשליפה מהירה בזמן חירום — מומלץ מאוד!
              </p>
            </li>
            <li className="flex items-start gap-3">
              <Smartphone size={20} className="text-purple-400 shrink-0 mt-0.5" />
              <p className="text-gray-700 dark:text-emt-light text-base leading-relaxed">
                <span className="font-bold">שימו לב:</span>{' '}
                כרגע האפליקציה פועלת בגרסת דפדפן (Web) בלבד. בהמשך תצא גם כאפליקציה רשמית להורדה.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <Mail size={20} className="text-emt-muted shrink-0 mt-0.5" />
              <p className="text-gray-500 dark:text-emt-muted text-base leading-relaxed">
                להערות והצעות לשיפור:{' '}
                <a
                  href="mailto:ydbyd4723@gmail.com"
                  className="text-emt-red font-semibold underline underline-offset-2 active:opacity-70"
                >
                  ydbyd4723@gmail.com
                </a>
              </p>
            </li>
          </ul>

        </div>

        {/* Sticky bottom button — always visible, respects iPhone home indicator */}
        <div className="flex-shrink-0 px-8 pt-3 pb-[max(env(safe-area-inset-bottom),1.5rem)] border-t border-gray-100 dark:border-emt-border">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-emt-red text-white font-bold text-lg active:scale-95 transition-transform"
          >
            המשך
          </button>
        </div>
      </div>
    </div>
  );
}
