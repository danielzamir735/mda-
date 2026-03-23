import { X, Calculator, BookOpen, Settings, Stethoscope, MessageSquare, MapPin, Pill, Building2, Sparkles, ClipboardList, Download, Languages } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import HapticButton from '../../components/HapticButton';
import type { LucideIcon } from 'lucide-react';
import { usePwaInstall } from '../pwa/PwaInstallContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCalculatorsOpen: () => void;
  onSettingsOpen: () => void;
  onVitalsReferenceOpen: () => void;
  onFeedbackOpen: () => void;
  onMedicalHistoryOpen: () => void;
  onHospitalsOpen: () => void;
  onUpdatesOpen: () => void;
  onBagStandardsOpen: () => void;
  onMedicationsOpen: () => void;
  onCommonMedsOpen: () => void;
  onTranslatorOpen: () => void;
}

type HubItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  border: string;
  bg: string;
  href?: string;
};

const HUB_ITEMS: HubItem[] = [
  {
    id: 'medhistory',
    label: 'מחלות רקע נפוצות',
    icon: Stethoscope,
    color: 'text-purple-400',
    border: 'border-purple-400/30',
    bg: 'bg-purple-400/10',
  },
  {
    id: 'medications-classification',
    label: 'קבוצות תרופות',
    icon: Pill,
    color: 'text-teal-400',
    border: 'border-teal-400/30',
    bg: 'bg-teal-400/10',
  },
  {
    id: 'common-meds',
    label: 'תרופות נפוצות',
    icon: Pill,
    color: 'text-emerald-400',
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-400/10',
  },
  {
    id: 'clinical',
    label: 'טבלת מדדים',
    icon: BookOpen,
    color: 'text-blue-400',
    border: 'border-blue-400/30',
    bg: 'bg-blue-400/10',
  },
  {
    id: 'calculators',
    label: 'מחשבונים',
    icon: Calculator,
    color: 'text-emt-green',
    border: 'border-emt-green/30',
    bg: 'bg-emt-green/10',
  },
  {
    id: 'kit-standards',
    label: 'תקנים לתיקי כונן',
    icon: ClipboardList,
    color: 'text-indigo-400',
    border: 'border-indigo-400/30',
    bg: 'bg-indigo-400/10',
  },
  {
    id: 'hospitals',
    label: 'מידע בתי חולים',
    icon: Building2,
    color: 'text-cyan-400',
    border: 'border-cyan-400/30',
    bg: 'bg-cyan-400/10',
  },
  {
    id: 'defibrillator',
    label: 'מצא דפיברילטור קרוב',
    icon: MapPin,
    color: 'text-emt-red',
    border: 'border-emt-red/30',
    bg: 'bg-emt-red/10',
    href: 'https://defi.co.il/#/map',
  },
  {
    id: 'realtime-translate',
    label: 'תרגום רפואי',
    icon: Languages,
    color: 'text-orange-400',
    border: 'border-orange-400/30',
    bg: 'bg-orange-400/10',
  },
  {
    id: 'updates',
    label: 'מה חדש?',
    icon: Sparkles,
    color: 'text-emt-yellow',
    border: 'border-emt-yellow/30',
    bg: 'bg-emt-yellow/10',
  },
  {
    id: 'install-app',
    label: 'התקנת האפליקציה',
    icon: Download,
    color: 'text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/10',
  },
  {
    id: 'settings',
    label: 'הגדרות',
    icon: Settings,
    color: 'text-gray-500 dark:text-emt-muted',
    border: 'border-gray-200 dark:border-emt-border',
    bg: 'bg-gray-100 dark:bg-emt-gray',
  },
];

const ENABLED = new Set(['calculators', 'settings', 'clinical', 'medhistory', 'defibrillator', 'hospitals', 'updates', 'kit-standards', 'medications-classification', 'common-meds', 'install-app', 'realtime-translate']);

export default function HubModal({
  isOpen,
  onClose,
  onCalculatorsOpen,
  onSettingsOpen,
  onVitalsReferenceOpen,
  onFeedbackOpen,
  onMedicalHistoryOpen,
  onHospitalsOpen,
  onUpdatesOpen,
  onBagStandardsOpen,
  onMedicationsOpen,
  onCommonMedsOpen,
  onTranslatorOpen,
}: Props) {
  const [hasSeenWhatsNew, setHasSeenWhatsNew] = useState(false);
  const { openFullModal } = usePwaInstall();

  useEffect(() => {
    if (localStorage.getItem('whatsNew_v2_seen') === 'true') {
      setHasSeenWhatsNew(true);
    }
  }, []);
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  const handleItemClick = (id: string) => {
    if (id === 'calculators')  onCalculatorsOpen();
    if (id === 'settings')     onSettingsOpen();
    if (id === 'clinical')     onVitalsReferenceOpen();
    if (id === 'medhistory')   onMedicalHistoryOpen();
    if (id === 'hospitals')    onHospitalsOpen();
    if (id === 'updates') {
      localStorage.setItem('whatsNew_v2_seen', 'true');
      setHasSeenWhatsNew(true);
      onUpdatesOpen();
    }
    if (id === 'kit-standards') onBagStandardsOpen();
    if (id === 'medications-classification') onMedicationsOpen();
    if (id === 'common-meds') onCommonMedsOpen();
    if (id === 'realtime-translate') onTranslatorOpen();
    if (id === 'install-app') { onClose(); setTimeout(openFullModal, 150); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-emt-dark overflow-hidden">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מרכז עזרים</h2>
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

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {HUB_ITEMS.map(({ id, label, icon: Icon, color, border, bg, href }) => {
            const enabled = ENABLED.has(id);
            const sharedClass = [
              'flex flex-col items-center justify-center gap-2',
              'rounded-2xl border', border, bg,
              'h-36 transition-transform px-2',
              enabled ? 'active:scale-95 cursor-pointer' : 'opacity-60 cursor-not-allowed',
            ].join(' ');

            const content = (
              <div className="relative flex flex-col items-center justify-center gap-2 w-full h-full px-1">
                {id === 'updates' && !hasSeenWhatsNew && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse z-10" />
                )}
                <Icon size={36} className={color} />
                <span className={`text-sm font-bold ${color} text-center leading-tight`}>{label}</span>
                {id === 'install-app' && (
                  <span className="text-xs text-slate-400 text-center leading-tight">
                    גישה ללא רשת
                  </span>
                )}
                {!enabled && (
                  <span className="text-xs font-bold bg-blue-600 text-white px-3 py-1 rounded-full shadow-sm">
                    בקרוב
                  </span>
                )}
              </div>
            );

            if (href) {
              return (
                <a
                  key={id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={sharedClass}
                >
                  {content}
                </a>
              );
            }

            return (
              <HapticButton
                key={id}
                disabled={!enabled}
                onClick={(e) => { e.stopPropagation(); handleItemClick(id); }}
                className={sharedClass}
                pressScale={enabled ? 0.93 : 1}
              >
                {content}
              </HapticButton>
            );
          })}
        </div>

        {/* Feedback button */}
        <HapticButton
          onClick={onFeedbackOpen}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl
                     border border-emt-red/30 bg-emt-red/10
                     text-emt-red font-bold text-base"
        >
          <MessageSquare size={22} />
          שליחת משוב
        </HapticButton>

      </div>
    </div>
  );
}
