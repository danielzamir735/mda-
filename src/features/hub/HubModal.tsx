import { useState } from 'react';
import { X, Calculator, BookOpen, ClipboardList, Settings, Stethoscope, MessageSquare, MapPin, Pill, Mic, Building2, Sparkles } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { useSettingsStore } from '../../store/settingsStore';
import type { LucideIcon } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onChecklistOpen: () => void;
  onCalculatorsOpen: () => void;
  onSettingsOpen: () => void;
  onVitalsReferenceOpen: () => void;
  onFeedbackOpen: () => void;
  onMedicalHistoryOpen: () => void;
  onHospitalsOpen: () => void;
  onUpdatesOpen: () => void;
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
    id: 'calculators',
    label: 'מחשבונים',
    icon: Calculator,
    color: 'text-emt-green',
    border: 'border-emt-green/30',
    bg: 'bg-emt-green/10',
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
    id: 'checklist',
    label: 'בדיקת אמבולנס',
    icon: ClipboardList,
    color: 'text-emt-yellow',
    border: 'border-emt-yellow/30',
    bg: 'bg-emt-yellow/10',
  },
  {
    id: 'medhistory',
    label: 'מחלות רקע נפוצות',
    icon: Stethoscope,
    color: 'text-purple-400',
    border: 'border-purple-400/30',
    bg: 'bg-purple-400/10',
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
    id: 'realtime-translate',
    label: 'תרגום רפואי בזמן אמת',
    icon: Mic,
    color: 'text-orange-400',
    border: 'border-orange-400/30',
    bg: 'bg-orange-400/10',
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
    id: 'pharmacy',
    label: 'מילון תרופות',
    icon: Pill,
    color: 'text-teal-400',
    border: 'border-teal-400/30',
    bg: 'bg-teal-400/10',
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
    id: 'settings',
    label: 'הגדרות',
    icon: Settings,
    color: 'text-gray-500 dark:text-emt-muted',
    border: 'border-gray-200 dark:border-emt-border',
    bg: 'bg-gray-100 dark:bg-emt-gray',
  },
];

const ENABLED = new Set(['checklist', 'calculators', 'settings', 'clinical', 'medhistory', 'defibrillator', 'hospitals', 'updates']);

export default function HubModal({
  isOpen,
  onClose,
  onChecklistOpen,
  onCalculatorsOpen,
  onSettingsOpen,
  onVitalsReferenceOpen,
  onFeedbackOpen,
  onMedicalHistoryOpen,
  onHospitalsOpen,
  onUpdatesOpen,
}: Props) {
  const hasSeenLatestUpdate = useSettingsStore((s) => s.hasSeenLatestUpdate);
  const [showAmbulanceChoice, setShowAmbulanceChoice] = useState(false);
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  const handleItemClick = (id: string) => {
    if (id === 'checklist')    { setShowAmbulanceChoice(true); return; }
    if (id === 'calculators')  onCalculatorsOpen();
    if (id === 'settings')     onSettingsOpen();
    if (id === 'clinical')     onVitalsReferenceOpen();
    if (id === 'medhistory')   onMedicalHistoryOpen();
    if (id === 'hospitals')    onHospitalsOpen();
    if (id === 'updates')      onUpdatesOpen();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-emt-dark relative">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מרכז עזרים</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
          aria-label="סגור"
        >
          <X size={20} />
        </button>
      </div>

      {/* Ambulance type choice overlay */}
      {showAmbulanceChoice && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-emt-gray rounded-3xl p-6 mx-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
            <h3 className="text-gray-900 dark:text-emt-light font-black text-xl text-center">בחר סוג אמבולנס</h3>
            <button
              onClick={() => { setShowAmbulanceChoice(false); onChecklistOpen(); }}
              className="w-full py-5 rounded-2xl bg-emt-yellow/10 border-2 border-emt-yellow/40 text-emt-yellow font-black text-xl active:scale-95 transition-transform"
            >
              אמבולנס לבן
            </button>
            <button
              onClick={() => { setShowAmbulanceChoice(false); alert('יועלה קובץ אט״ן בהמשך'); }}
              className="w-full py-5 rounded-2xl bg-blue-500/10 border-2 border-blue-400/40 text-blue-400 font-black text-xl active:scale-95 transition-transform"
            >
              אט״ן
            </button>
            <button
              onClick={() => setShowAmbulanceChoice(false)}
              className="text-gray-400 dark:text-emt-muted text-sm font-medium active:opacity-70"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

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
              <div className="relative flex flex-col items-center justify-center gap-2 w-full h-full">
                {id === 'updates' && !hasSeenLatestUpdate && (
                  <span className="absolute top-2 left-2 w-3 h-3 rounded-full bg-emt-red shadow-md" />
                )}
                <Icon size={36} className={color} />
                <span className={`text-sm font-bold ${color} text-center leading-tight`}>{label}</span>
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
              <button
                key={id}
                disabled={!enabled}
                onClick={() => handleItemClick(id)}
                className={sharedClass}
              >
                {content}
              </button>
            );
          })}
        </div>

        {/* Feedback button */}
        <button
          onClick={onFeedbackOpen}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl
                     border border-emt-red/30 bg-emt-red/10
                     text-emt-red font-bold text-base active:scale-95 transition-transform"
        >
          <MessageSquare size={22} />
          שליחת משוב
        </button>
      </div>
    </div>
  );
}
