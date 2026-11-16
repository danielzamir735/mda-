import { useState, useEffect } from 'react';
import { Rocket, ScanSearch, Wind, X } from 'lucide-react';
import { useTranslation } from '../i18n';

const STORAGE_KEY = 'hasSeenUpdateV2';

export default function UpdateAnnouncementModal() {
  const t = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={handleDismiss}
    >
      <div
        className="relative w-full max-w-md bg-surface border border-line rounded-2xl shadow-2xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 end-4 w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-fg-muted hover:text-fg transition-colors"
          aria-label={t('close')}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
            <Rocket size={28} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-fg leading-tight">
            {t('obAnnTitle')}
          </h2>
          <p className="text-fg-muted text-base">
            {t('obAnnSubtitle')}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-line" />

        {/* Features */}
        <div className="flex flex-col gap-4">
          {/* Feature 1 — Medication Scanner */}
          <div className="flex items-start gap-3">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 mt-0.5">
              <ScanSearch size={20} className="text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-fg/85 text-sm leading-relaxed">
              <span className="font-bold text-teal-700 dark:text-teal-300">{t('obAnnScannerBold')}</span>{' '}
              {t('obAnnScannerText')}
            </p>
          </div>

          {/* Feature 2 — Breathing Synchronizer */}
          <div className="flex items-start gap-3">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 mt-0.5">
              <Wind size={20} className="text-sky-600 dark:text-sky-400" />
            </div>
            <p className="text-fg/85 text-sm leading-relaxed">
              <span className="font-bold text-sky-700 dark:text-sky-300">{t('obAnnBreathBold')}</span>{' '}
              {t('obAnnBreathText')}
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleDismiss}
          className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95
                     text-white font-bold text-lg transition-all duration-150 shadow-lg shadow-emerald-900/30"
        >
          {t('obGotItThanks')}
        </button>
      </div>
    </div>
  );
}
