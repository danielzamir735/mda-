import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../i18n';

const NEW_DOMAIN = 'hovesh-plus.vercel.app';
const DISMISSED_KEY = 'migrationBannerDismissed_v1';

export default function MigrationBanner() {
  const t = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.hostname === 'mda-phi.vercel.app' &&
      !localStorage.getItem(DISMISSED_KEY)
    ) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setShow(false);
  };

  const handleGo = () => {
    window.location.href = `https://${NEW_DOMAIN}${window.location.pathname}${window.location.search}`;
  };

  return (
    <div
      className="fixed bottom-0 inset-x-0 px-4 pt-0"
      style={{
        zIndex: 99999,
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
      }}
    >
      <div
        className="relative rounded-2xl overflow-hidden border border-line shadow-2xl"
        style={{
          background: 'rgb(var(--surface) / 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/70 to-transparent" />

        <div className="px-4 py-3 flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-fg/90 text-sm leading-relaxed flex-1">
              <span className="font-bold text-fg">{t('obMigBold')}</span>{' '}
              {t('obMigText')}{' '}
              <span className="text-rose-600 dark:text-rose-300 font-medium" dir="ltr">{NEW_DOMAIN}</span>
            </p>
            <button
              onClick={handleDismiss}
              aria-label={t('close')}
              className="shrink-0 mt-0.5 text-fg/50 hover:text-fg/90 transition-colors p-0.5"
            >
              <X size={16} />
            </button>
          </div>

          <button
            onClick={handleGo}
            // theme-ok: white text on the rose gradient button
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity active:opacity-70"
            style={{
              background: 'linear-gradient(135deg, #e11d48 0%, #be185d 100%)',
            }}
          >
            {t('obMigGo')}
          </button>
        </div>

        {/* Bottom accent line */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-fg/10 to-transparent" />
      </div>
    </div>
  );
}
