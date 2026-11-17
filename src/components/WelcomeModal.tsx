import { Stethoscope, WifiOff, Home, Mail, Smartphone } from 'lucide-react';
import { useTranslation } from '../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: Props) {
  const t = useTranslation();
  if (!isOpen) return null;

  return (
    // theme-ok: the dim backdrop behind a pop-up stays dark in both modes
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:px-4">
      <div className="bg-surface border border-line rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)] overflow-hidden">

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-5">
          {/* Icon + Title */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-emt-red/10 flex items-center justify-center">
              <Stethoscope size={32} className="text-emt-red" />
            </div>
            <h2 className="text-fg font-black text-2xl leading-snug">
              {t('obWelcomeTitle')}
            </h2>
            <span className="inline-block bg-emt-red/10 text-emt-red font-bold text-sm px-3 py-1 rounded-full">
              {t('obBeta')}
            </span>
          </div>

          {/* Feature bullets */}
          <ul className="flex flex-col gap-3 text-start">
            <li className="flex items-start gap-3">
              <WifiOff size={20} className="text-emt-green shrink-0 mt-0.5" />
              <p className="text-fg/85 text-base leading-relaxed">
                <span className="font-bold">{t('obWelcomeOfflineBold')}</span>{' '}
                {t('obWelcomeOfflineText')}
              </p>
            </li>
            <li className="flex items-start gap-3">
              <Home size={20} className="text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-fg/85 text-base leading-relaxed">
                <span className="font-bold">{t('obWelcomeHomeBold')}</span>{' '}
                {t('obWelcomeHomeText')}
              </p>
            </li>
            <li className="flex items-start gap-3">
              <Smartphone size={20} className="text-purple-500 dark:text-purple-400 shrink-0 mt-0.5" />
              <p className="text-fg/85 text-base leading-relaxed">
                <span className="font-bold">{t('obWelcomeNoteBold')}</span>{' '}
                {t('obWelcomeNoteText')}
              </p>
            </li>
            <li className="flex items-start gap-3">
              <Mail size={20} className="text-fg-subtle shrink-0 mt-0.5" />
              <p className="text-fg-muted text-base leading-relaxed">
                {t('obWelcomeContact')}{' '}
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
        <div className="flex-shrink-0 px-8 pt-3 pb-[max(env(safe-area-inset-bottom),1.5rem)] border-t border-line">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-emt-red text-white font-bold text-lg active:scale-95 transition-transform"
          >
            {t('continueAction')}
          </button>
        </div>
      </div>
    </div>
  );
}
