import { Stethoscope } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">

        {/* Icon + Title */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-full bg-emt-red/10 flex items-center justify-center">
            <Stethoscope size={28} className="text-emt-red" />
          </div>
          <h2 className="text-gray-900 dark:text-emt-light font-black text-xl leading-snug">
            ברוכים הבאים לעוזר חובש
          </h2>
        </div>

        {/* Body */}
        <p className="text-gray-600 dark:text-emt-muted text-sm text-center leading-relaxed">
          האפליקציה נמצאת כרגע בשלבי פיתוח ובטא.
          <br />
          תודה רבה לכל מי שעוזר, בודק ומשתמש!
        </p>

        {/* Feedback line */}
        <p className="text-gray-500 dark:text-emt-muted text-xs text-center leading-relaxed">
          להערות והצעות לשיפור, ניתן לפנות למייל:{' '}
          <a
            href="mailto:ydbyd4723@gmail.com"
            className="text-emt-red font-semibold underline underline-offset-2 active:opacity-70"
          >
            ydbyd4723@gmail.com
          </a>
        </p>

        {/* CTA */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-emt-red text-white font-bold text-base active:scale-95 transition-transform"
        >
          אני מבין, המשך
        </button>
      </div>
    </div>
  );
}
