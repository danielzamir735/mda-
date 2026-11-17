import { useState, useEffect } from 'react';
import {
  MoreVertical, CheckCircle, ExternalLink, ListChecks,
  PlusCircle, ChevronRight, ChevronLeft, Download, Smartphone, Apple, AlertTriangle,
  X, ShieldPlus, Activity, CheckCircle2,
} from 'lucide-react';
import { usePwaInstall } from './PwaInstallContext';
import { useTranslation, useLanguage } from '../../i18n';

type Tab = 'android' | 'ios';

/* ── Premium EMS app icon ── */
const AppIcon = () => (
  <div className="relative flex items-center justify-center">
    {/* theme-ok: white icon on the blue badge */}
    <ShieldPlus className="w-9 h-9 text-white drop-shadow-lg" strokeWidth={1.5} />
    <Activity
      className="absolute bottom-0 end-0 w-4 h-4 text-blue-200 opacity-90"
      strokeWidth={2}
    />
  </div>
);

/* ── Step card ── */
function StepCard({
  index, icon, title, desc,
}: { index: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-fg/5 border border-fg/10">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs
                       font-bold flex items-center justify-center mt-0.5">
        {index}
      </span>
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30
                      flex items-center justify-center text-blue-600 dark:text-blue-400 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 text-start">
        <p className="text-fg font-semibold text-sm leading-snug">{title}</p>
        <p className="text-fg-muted text-xs mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ── Android tab content ── */
function AndroidContent({
  installPromptEvent,
  onInstall,
}: {
  installPromptEvent: ReturnType<typeof usePwaInstall>['installPromptEvent'];
  onInstall: () => Promise<void>;
}) {
  const t = useTranslation();
  const manualSteps = [
    {
      icon: <MoreVertical className="w-4 h-4 rotate-90" />,
      title: t('obInstOpenMenu'),
      desc: t('obInstOpenMenuDesc'),
    },
    {
      icon: <Download className="w-4 h-4" />,
      title: t('obInstChoose'),
      desc: t('obInstChooseDesc'),
    },
    {
      icon: <CheckCircle className="w-4 h-4" />,
      title: t('obInstConfirm'),
      desc: t('obInstConfirmDesc'),
    },
  ];

  if (installPromptEvent) {
    /* ── Automatic install is ready ── */
    return (
      <div className="flex flex-col gap-4">
        {/* Status banner */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div className="flex-1 text-start">
            <p className="text-green-700 dark:text-green-300 font-bold text-sm">{t('obInstPreparing')}</p>
            <p className="text-green-600 dark:text-green-400/80 text-xs mt-0.5">{t('obInstReady')}</p>
          </div>
        </div>

        {/* One-tap install button — massive and prominent */}
        <button
          onClick={onInstall}
          className="w-full py-6 rounded-2xl bg-gradient-to-l from-blue-500 to-blue-600 text-white font-extrabold text-xl shadow-2xl shadow-blue-500/50
                     active:scale-95 transition-all duration-200 hover:from-blue-400 hover:to-blue-500
                     flex items-center justify-center gap-3 border border-blue-400/30"
        >
          <Download className="w-7 h-7" />
          {t('obInstQuick')}
        </button>

        <p className="text-fg-muted text-xs text-center">
          {t('obInstBrowserPrompt')}
        </p>
      </div>
    );
  }

  /* ── Native prompt unavailable — manual steps only ── */
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-fg/5 border border-fg/10 px-4 py-3">
        <p className="text-fg/85 text-sm font-semibold text-start">{t('obInstManual')}</p>
        <p className="text-fg-muted text-xs mt-1 text-start leading-relaxed">
          {t('obInstManualDesc')}
        </p>
      </div>

      {manualSteps.map((s, i) => (
        <StepCard key={i} index={i + 1} icon={s.icon} title={s.title} desc={s.desc} />
      ))}
    </div>
  );
}

/* ── iOS tab content ── */
function IosContent() {
  const t = useTranslation();
  const steps = [
    {
      icon: <ExternalLink className="w-4 h-4" />,
      title: t('obInstShare'),
      desc: t('obInstShareDesc'),
    },
    {
      icon: <ListChecks className="w-4 h-4" />,
      title: t('obInstAddHome'),
      desc: t('obInstAddHomeDesc'),
    },
    {
      icon: <PlusCircle className="w-4 h-4" />,
      title: t('obInstFinish'),
      desc: t('obInstFinishDesc'),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-amber-500/15 border border-amber-500/35 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-800 dark:text-amber-300 text-sm font-medium leading-snug text-start">
          {t('obInstSafariOnly')}
        </p>
      </div>

      {steps.map((s, i) => (
        <StepCard key={i} index={i + 1} icon={s.icon} title={s.title} desc={s.desc} />
      ))}
    </div>
  );
}

/* ── Main modal ── */
export default function FullInstallModal() {
  const { showFullModal, closeFullModal, installPromptEvent, isIOS } = usePwaInstall();
  const t = useTranslation();
  const { isEn } = useLanguage();
  const BackIcon = isEn ? ChevronLeft : ChevronRight;
  const [tab, setTab] = useState<Tab>(isIOS ? 'ios' : 'android');

  useEffect(() => {
    window.history.pushState({ installModalOpen: true }, '');

    const handleHardwareBack = (_e: PopStateEvent) => {
      closeFullModal();
    };

    window.addEventListener('popstate', handleHardwareBack);

    return () => {
      window.removeEventListener('popstate', handleHardwareBack);
    };
  }, [closeFullModal]);

  const handleQuickInstall = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      closeFullModal();
    }
  };

  if (!showFullModal) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-page flex flex-col overflow-y-auto"
    >
      {/* Glow accents */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 30% 15%, rgba(59,130,246,0.12) 0%, transparent 70%), ' +
            'radial-gradient(ellipse 50% 40% at 75% 80%, rgba(99,102,241,0.09) 0%, transparent 70%)',
        }}
      />

      {/* X close button — top-left */}
      <button
        onClick={closeFullModal}
        className="absolute top-4 end-4 p-2 text-fg-muted hover:text-fg transition-colors z-10"
        aria-label={t('close')}
      >
        <X size={24} />
      </button>

      {/* Content container */}
      <div className="relative flex flex-col min-h-full w-full max-w-md mx-auto px-5 py-8 gap-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700
                          flex items-center justify-center shadow-2xl shadow-blue-500/50
                          border-2 border-blue-400/30 ring-4 ring-blue-500/10">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '2.5s' }} />
            <AppIcon />
          </div>
          <div className="text-center">
            <h1 className="text-fg font-extrabold text-2xl tracking-tight">{t('obInstTitle')}</h1>
            <p className="text-fg-muted text-sm mt-1">{t('obInstSubtitle')}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl bg-fg/5 border border-fg/10 p-1 gap-1">
          {([
            { id: 'android' as Tab, label: t('obInstAndroid'), Icon: Smartphone },
            { id: 'ios' as Tab, label: t('obInstIos'), Icon: Apple },
          ]).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                          flex items-center justify-center gap-2 ${
                tab === id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1">
          {tab === 'android' ? (
            <AndroidContent installPromptEvent={installPromptEvent} onInstall={handleQuickInstall} />
          ) : (
            <IosContent />
          )}
        </div>

        {/* Back button footer */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); closeFullModal(); }}
          className="w-full py-4 rounded-2xl border border-fg/15 text-fg/85
                     hover:text-fg hover:bg-fg/5 active:scale-95 transition-all duration-200
                     flex items-center justify-center gap-2 font-semibold text-base mt-2"
        >
          <BackIcon className="w-5 h-5" />
          {t('obInstBack')}
        </button>
      </div>
    </div>
  );
}
