import { useState } from 'react';
import { X, Phone, MessageCircle, AlertTriangle } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';
import { trackEvent, trackInteraction } from '../../../utils/analytics';
import HazmatLookup from './HazmatLookup';
import { useTranslation, type TranslationKey } from '../../../hooks/useTranslation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'poison' | 'hazmat';

const TABS: { id: Tab; label: TranslationKey }[] = [
  { id: 'poison', label: 'refTabPoison' },
  { id: 'hazmat', label: 'refTabHazmat' },
];

export default function PoisonCentersModal({ isOpen, onClose }: Props) {
  const t = useTranslation();
  const [tab, setTab] = useState<Tab>('poison');
  // Always reopen on the phone numbers — the most urgent content
  const close = () => { setTab('poison'); onClose(); };
  useModalBackHandler(isOpen, close);

  if (!isOpen) return null;

  const selectTab = (next: Tab) => {
    setTab(next);
    if (next === 'hazmat') trackInteraction('חומרים מסוכנים', 'emergency_info'); // i18n-ok: analytics label, kept stable
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-page overflow-hidden">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <h2 className="text-fg font-bold text-xl">{t('refPoisonTitle')}</h2>
        <HapticButton
          onClick={close}
          pressScale={0.88}
          className="w-10 h-10 rounded-full bg-surface-2 border border-line
                     flex items-center justify-center
                     text-fg-muted hover:text-fg"
          aria-label={t('close')}
        >
          <X size={20} />
        </HapticButton>
      </div>

      {/* Tabs */}
      <div role="tablist" className="shrink-0 flex gap-2 px-4 pt-3">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => selectTab(id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors
                        ${tab === id
                          ? 'bg-emt-red text-white border-emt-red'
                          : 'bg-surface-2 text-fg-muted border-line'}`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {tab === 'hazmat' && <HazmatLookup />}
        {tab === 'poison' && (<>
        {/* Intro */}
        <p className="text-sm text-fg-muted leading-relaxed">
          {t('refPoisonIntro')}
        </p>

        {/* Card 1 — Rambam */}
        <div className="rounded-2xl border border-emt-red/30 bg-emt-red/5 dark:bg-emt-red/10 p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-fg leading-snug">
            {t('refPoisonRambam')}
          </p>
          <a
            href="tel:047771900"
            dir="ltr"
            onClick={() => trackEvent('poison_center_call', { center: 'rambam' })}
            className="flex items-center justify-center gap-3 py-4 rounded-xl
                       bg-emt-red text-white font-bold text-2xl active:scale-95 transition-transform shadow-md"
          >
            <Phone size={28} />
            04-777-1900
          </a>
        </div>

        {/* Card 2 — Assaf HaRofeh */}
        <div className="rounded-2xl border border-orange-400/30 bg-orange-400/5 dark:bg-orange-400/10 p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-fg leading-snug">
            {t('refPoisonAssaf')}
          </p>
          <a
            href="tel:089779309"
            dir="ltr"
            onClick={() => trackEvent('poison_center_call', { center: 'assaf_harofeh' })}
            className="flex items-center justify-center gap-3 py-3 rounded-xl
                       bg-orange-500 text-white font-bold text-xl active:scale-95 transition-transform shadow-md"
          >
            <Phone size={24} />
            08-977-9309
          </a>
        </div>

        {/* Card 3 — WhatsApp images */}
        <div className="rounded-2xl border border-green-500/30 bg-green-500/5 dark:bg-green-500/10 p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-fg leading-snug">
            {t('refPoisonWhatsapp')} <span dir="ltr">050-206-3304</span>
          </p>
          <a
            href="https://wa.me/972502063304"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('poison_center_whatsapp')}
            className="flex items-center justify-center gap-3 py-3 rounded-xl
                       bg-green-600 text-white font-bold text-xl active:scale-95 transition-transform shadow-md"
          >
            <MessageCircle size={24} />
            {t('refOpenWhatsapp')}
          </a>
        </div>

        {/* First Aid Guidelines */}
        <div className="rounded-2xl border border-red-400/50 bg-red-50 dark:bg-red-900/20 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400 shrink-0" />
            <h3 className="text-red-700 dark:text-red-300 font-bold text-base">
              {t('refFirstAidTitle')}
            </h3>
          </div>
          <ul className="flex flex-col gap-2 text-sm text-red-800 dark:text-red-200 leading-relaxed">
            <li>{t('refFirstAid1')}</li>
            <li>{t('refFirstAid2')}</li>
            <li>{t('refFirstAid3')}</li>
            <li>{t('refFirstAid4')}</li>
          </ul>
        </div>
        </>)}
      </div>
    </div>
  );
}
