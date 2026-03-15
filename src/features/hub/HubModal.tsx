import { X, Calculator, BookOpen, Settings, Stethoscope, MessageSquare, MapPin, Pill, Mic, Building2, Sparkles, ClipboardList, Heart, CreditCard } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { useSettingsStore } from '../../store/settingsStore';
import type { LucideIcon } from 'lucide-react';

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
    id: 'kit-standards',
    label: 'תקנים לתיקי כונן',
    icon: ClipboardList,
    color: 'text-indigo-400',
    border: 'border-indigo-400/30',
    bg: 'bg-indigo-400/10',
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

const ENABLED = new Set(['calculators', 'settings', 'clinical', 'medhistory', 'defibrillator', 'hospitals', 'updates', 'kit-standards']);

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
}: Props) {
  const hasSeenLatestUpdate = useSettingsStore((s) => s.hasSeenLatestUpdate);
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  const handleItemClick = (id: string) => {
    if (id === 'calculators')  onCalculatorsOpen();
    if (id === 'settings')     onSettingsOpen();
    if (id === 'clinical')     onVitalsReferenceOpen();
    if (id === 'medhistory')   onMedicalHistoryOpen();
    if (id === 'hospitals')    onHospitalsOpen();
    if (id === 'updates')      onUpdatesOpen();
    if (id === 'kit-standards') onBagStandardsOpen();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-emt-dark overflow-hidden">
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

        {/* Support Us */}
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Heart size={18} className="text-yellow-500" />
            <span className="text-base font-bold text-yellow-500">תרומה ותמיכה</span>
            <Heart size={18} className="text-yellow-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-emt-muted leading-relaxed mb-4">
            אפליקציה זו פותחה בהתנדבות וללא מטרות רווח, כדי לשמש כלי עזר מציל חיים בשטח.
            תחזוקת השרתים, פיתוח הפיצ'רים והעלאת אפליקציה רשמית לחנויות כרוכים בעלויות.
            נשמח לתמיכתכם כדי שנוכל להמשיך לפתח ולהשתפר! כל תרומה עוזרת.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#TODO_BIT_LINK"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                         bg-teal-500 hover:bg-teal-400 text-white font-bold text-base
                         active:scale-95 transition-transform"
            >
              <Heart size={20} />
              תרומה בביט
            </a>
            <a
              href="#TODO_PAYBOX_LINK"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                         bg-purple-600 hover:bg-purple-500 text-white font-bold text-base
                         active:scale-95 transition-transform"
            >
              <CreditCard size={20} />
              תרומה בפייבוקס
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
