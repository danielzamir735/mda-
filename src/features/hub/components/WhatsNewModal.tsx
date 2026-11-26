import { X, Sparkles, Pill, Stethoscope, Tablet, BookOpen, Zap, Camera, Wrench, Wind } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useTranslation, type TranslationKey } from '../../../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isRead?: boolean;
}

type UpdateItem =
  | { type: 'icon'; Icon: React.ElementType; iconClass: string; text: TranslationKey }
  | { type: 'emoji'; emoji: string; text: TranslationKey }
  | { type: 'section'; label: TranslationKey };

const UPDATES: UpdateItem[] = [
  // ── v2.2 ──────────────────────────────────────────
  { type: 'section', label: 'obWnV22' },
  {
    type: 'icon',
    Icon: Wind,
    iconClass: 'text-teal-500',
    text: 'obWnBreathing',
  },
  // ── v2.1 ──────────────────────────────────────────
  { type: 'section', label: 'obWnV21' },
  {
    type: 'icon',
    Icon: BookOpen,
    iconClass: 'text-amber-500',
    text: 'obWnDictionary',
  },
  {
    type: 'icon',
    Icon: Zap,
    iconClass: 'text-yellow-500',
    text: 'obWnInstall',
  },
  {
    type: 'icon',
    Icon: Camera,
    iconClass: 'text-sky-500',
    text: 'obWnCamera4k',
  },
  {
    type: 'icon',
    Icon: Wrench,
    iconClass: 'text-fg-subtle',
    text: 'obWnPerf',
  },
  // ── v2.0 ──────────────────────────────────────────
  { type: 'section', label: 'obWnV20' },
  {
    type: 'icon',
    Icon: Pill,
    iconClass: 'text-green-500',
    text: 'obWnMedGroups',
  },
  {
    type: 'icon',
    Icon: Stethoscope,
    iconClass: 'text-sky-500',
    text: 'obWnCommonMeds',
  },
  {
    type: 'icon',
    Icon: Tablet,
    iconClass: 'text-purple-500',
    text: 'obWnTabletHistory',
  },
  { type: 'emoji', emoji: '🏥', text: 'obWnHospitals' },
  { type: 'emoji', emoji: '⏱️', text: 'obWnMetronome' },
  { type: 'emoji', emoji: '📸', text: 'obWnCamera' },
  { type: 'emoji', emoji: '✨', text: 'obWnDesign' },
  { type: 'emoji', emoji: '🛠️', text: 'obWnStability' },
];

export default function WhatsNewModal({ isOpen, onClose, isRead = false }: Props) {
  const t = useTranslation();
  useModalBackHandler(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-page">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line bg-surface shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles size={22} className="text-emt-yellow" />
          <h2 className="text-fg font-bold text-xl">{t('obWnTitle')}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-surface-2 border border-line
                     flex items-center justify-center active:scale-90 transition-transform
                     text-fg-muted hover:text-fg"
          aria-label={t('close')}
        >
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {isRead ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <p className="text-center text-fg-subtle text-base font-medium">
              {t('obWnNoUpdates')}
            </p>
          </div>
        ) : (
          <>
            <div className="w-full rounded-2xl border border-line bg-surface shadow-sm overflow-hidden">
              <ul className="divide-y divide-line">
                {UPDATES.map((item, i) => {
                  if (item.type === 'section') {
                    return (
                      <li key={i} className="px-5 py-2.5 bg-page">
                        <span className="text-xs font-bold uppercase tracking-widest text-fg-subtle">
                          {t(item.label)}
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li key={i} className="flex items-start gap-4 px-5 py-4">
                      {item.type === 'icon' ? (
                        <item.Icon size={22} className={`${item.iconClass} shrink-0 mt-0.5`} strokeWidth={1.8} />
                      ) : (
                        <span className="text-2xl shrink-0 leading-tight">{item.emoji}</span>
                      )}
                      <span className="text-base text-fg/85 leading-relaxed">{t(item.text)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="mt-6 text-center text-sm text-fg-muted font-medium">
              {t('obWnThanks')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
