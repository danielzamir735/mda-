import { X, Phone, MessageCircle, AlertTriangle } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PoisonCentersModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-emt-dark overflow-hidden">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מרכזי הרעלות</h2>
        <HapticButton
          onClick={onClose}
          pressScale={0.88}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                     flex items-center justify-center
                     text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
          aria-label="סגור"
        >
          <X size={20} />
        </HapticButton>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Intro */}
        <p className="text-sm text-gray-600 dark:text-emt-muted leading-relaxed">
          מרכזים אלו זמינים להתייעצות בנושאי תרופות ומינון יתר של תרופות, הרעלות מחומרים כימיים, הכשות נחשים, עקיצות עקרבים, הרעלות מזון ועוד.
        </p>

        {/* Card 1 — Rambam */}
        <div className="rounded-2xl border border-emt-red/30 bg-emt-red/5 dark:bg-emt-red/10 p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800 dark:text-emt-light leading-snug">
            המכון הארצי למידע בהרעלות – מרכז רפואי רמב&quot;ם
          </p>
          <a
            href="tel:047771900"
            className="flex items-center justify-center gap-3 py-4 rounded-xl
                       bg-emt-red text-white font-bold text-2xl active:scale-95 transition-transform shadow-md"
          >
            <Phone size={28} />
            04-777-1900
          </a>
        </div>

        {/* Card 2 — Assaf HaRofeh */}
        <div className="rounded-2xl border border-orange-400/30 bg-orange-400/5 dark:bg-orange-400/10 p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800 dark:text-emt-light leading-snug">
            הריופון – מרכז ייעוץ תרופתי במרכז הרפואי שמיר (אסף הרופא), 8:00–14:00
          </p>
          <a
            href="tel:089779309"
            className="flex items-center justify-center gap-3 py-3 rounded-xl
                       bg-orange-500 text-white font-bold text-xl active:scale-95 transition-transform shadow-md"
          >
            <Phone size={24} />
            08-977-9309
          </a>
        </div>

        {/* Card 3 — WhatsApp images */}
        <div className="rounded-2xl border border-green-500/30 bg-green-500/5 dark:bg-green-500/10 p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800 dark:text-emt-light leading-snug">
            לשליחת תמונות למכון הארצי בווטסאפ בלבד למספר: 050-206-3304
          </p>
          <a
            href="https://wa.me/972502063304"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 py-3 rounded-xl
                       bg-green-600 text-white font-bold text-xl active:scale-95 transition-transform shadow-md"
          >
            <MessageCircle size={24} />
            פתח WhatsApp
          </a>
        </div>

        {/* Protocol button */}
        <HapticButton
          pressScale={0.95}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl
                     border-2 border-yellow-500/50 bg-yellow-500/10
                     text-yellow-600 dark:text-emt-yellow font-bold text-lg"
        >
          <AlertTriangle size={24} />
          פרוטוקול חומ&quot;ס
        </HapticButton>
      </div>
    </div>
  );
}
