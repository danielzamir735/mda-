import { Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n';

interface Props {
  onClose: () => void;
}

export default function WhatsNewModal({ onClose }: Props) {
  const t = useTranslation();
  const handleClose = () => {
    localStorage.setItem('whatsNew_v2_seen', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-end justify-center p-4 sm:items-center">
      {/* Backdrop – theme-ok: stays dark in both modes */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-surface rounded-3xl shadow-2xl p-7 flex flex-col gap-5 animate-fade-scale">
        {/* Icon badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emt-yellow/15 flex items-center justify-center shrink-0">
            <Sparkles size={24} className="text-emt-yellow" strokeWidth={2} />
          </div>
          <h2 className="text-fg font-black text-2xl">{t('obWnShortTitle')}</h2>
        </div>

        <ul className="flex flex-col gap-3 text-fg-muted text-sm leading-relaxed">
          {(['obWnShort1', 'obWnShort2', 'obWnShort3'] as const).map((key) => (
            <li key={key} className="flex gap-2">
              <span className="text-emt-yellow font-bold shrink-0">•</span>
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>

        {/* Dismiss button */}
        <button
          onClick={handleClose}
          // theme-ok: dark text on the fixed yellow button reads in both modes
          className="w-full py-3.5 rounded-2xl bg-emt-yellow text-black font-black text-lg
                     flex items-center justify-center
                     active:scale-[0.97] transition-all duration-150"
        >
          {t('obGotItThanks')}
        </button>
      </div>
    </div>
  );
}
