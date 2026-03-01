import { X, Calculator, BookOpen, ClipboardList, Settings, Languages } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onChecklistOpen: () => void;
  onCalculatorsOpen: () => void;
  onSettingsOpen: () => void;
}

const HUB_ITEMS = [
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
    label: 'מידע קליני',
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
    id: 'translation',
    label: 'תרגום בזמן אמת',
    icon: Languages,
    color: 'text-purple-400',
    border: 'border-purple-400/30',
    bg: 'bg-purple-400/10',
  },
  {
    id: 'settings',
    label: 'הגדרות',
    icon: Settings,
    color: 'text-gray-500 dark:text-emt-muted',
    border: 'border-gray-200 dark:border-emt-border',
    bg: 'bg-gray-100 dark:bg-emt-gray',
  },
] as const;

const ENABLED = new Set(['checklist', 'calculators', 'settings']);

export default function HubModal({
  isOpen,
  onClose,
  onChecklistOpen,
  onCalculatorsOpen,
  onSettingsOpen,
}: Props) {
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  const handleItemClick = (id: string) => {
    if (id === 'checklist') onChecklistOpen();
    if (id === 'calculators') onCalculatorsOpen();
    if (id === 'settings') onSettingsOpen();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-emt-dark">
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
      <div className="flex-1 grid grid-cols-2 gap-3 p-4 content-start">
        {HUB_ITEMS.map(({ id, label, icon: Icon, color, border, bg }) => {
          const enabled = ENABLED.has(id);
          return (
            <button
              key={id}
              disabled={!enabled}
              onClick={() => handleItemClick(id)}
              className={`flex flex-col items-center justify-center gap-3
                          rounded-2xl border ${border} ${bg}
                          h-36 transition-transform
                          ${enabled ? 'active:scale-95 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
            >
              <Icon size={36} className={color} />
              <span className={`text-sm font-bold ${color}`}>{label}</span>
              {!enabled && (
                <span className="text-[10px] text-gray-400 dark:text-emt-muted">בקרוב</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
