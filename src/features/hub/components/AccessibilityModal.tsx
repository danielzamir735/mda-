import { Sun, Moon, Share2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation, useLanguage, translate } from '../../../i18n';
import type { TranslationKey } from '../../../i18n';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useSettingsStore } from '../../../store/settingsStore';
import type { Theme } from '../../../store/settingsStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const BG_COLORS: { labelKey: TranslationKey; value: string }[] = [
  { labelKey: 'hubColorLightGreen', value: '#d1fae5' },
  { labelKey: 'hubColorBeige',      value: '#fef3c7' },
  { labelKey: 'hubColorYellow',     value: '#fef9c3' },
  { labelKey: 'hubColorPink',       value: '#fce7f3' },
  { labelKey: 'hubColorLightBlue',  value: '#dbeafe' },
  { labelKey: 'hubColorGray',       value: '#e5e7eb' },
  { labelKey: 'hubColorBlack',      value: '#000000' },
  { labelKey: 'hubColorWhite',      value: '#ffffff' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-fg-muted text-xs font-semibold uppercase tracking-wide px-1 mb-2">
      {children}
    </p>
  );
}


export default function AccessibilityModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const t = useTranslation();
  const { isEn } = useLanguage();
  // "Back" points toward the start edge, "open" toward the end edge.
  const BackIcon = isEn ? ChevronLeft : ChevronRight;
  const ForwardIcon = isEn ? ChevronRight : ChevronLeft;
  const { theme, setTheme, bgColor, setBgColor, fontSize, setFontSize } = useSettingsStore();

  if (!isOpen) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: t('hubA11yShareTitle'),
        text: t('hubA11yShareText'),
        url: window.location.origin,
      }).catch(() => {});
    } else {
      window.alert(translate('hubShareUnsupported'));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-page">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <h2 className="text-fg font-bold text-xl">{t('hubItemAccessibility')}</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-surface-2 border border-line
                     flex items-center justify-center active:scale-90 transition-transform
                     text-fg-muted hover:text-fg"
          aria-label={t('close')}
        >
          <BackIcon size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">

        {/* Section 1: Background Color */}
        <section>
          <SectionLabel>{t('hubA11yBgColor')}</SectionLabel>
          <div className="bg-surface border border-line rounded-2xl p-4">
            <div className="grid grid-cols-4 gap-3">
              {/* Default/reset swatch */}
              <button
                onClick={() => setBgColor('')}
                className={`flex flex-col items-center gap-1.5 group`}
                aria-label={t('hubA11yDefault')}
              >
                <span
                  className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center text-xs font-bold
                    ${!bgColor
                      ? 'border-emt-green ring-2 ring-emt-green/40'
                      : 'border-line-strong'
                    } bg-gradient-to-br from-surface-3 to-line-strong text-fg-muted`}
                >
                  ✕
                </span>
                <span className="text-[10px] text-fg-muted leading-none">{t('hubA11yDefault')}</span>
              </button>

              {BG_COLORS.map(({ labelKey, value }) => (
                <button
                  key={value}
                  onClick={() => setBgColor(value)}
                  className="flex flex-col items-center gap-1.5"
                  aria-label={t(labelKey)}
                >
                  <span
                    className={`w-12 h-12 rounded-xl border-2 transition-all
                      ${bgColor === value
                        ? 'border-emt-green ring-2 ring-emt-green/40 scale-110'
                        : 'border-line-strong'
                      }`}
                    style={{ backgroundColor: value }}
                  />
                  <span className="text-[10px] text-fg-muted leading-none text-center">{t(labelKey)}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Day/Night Mode */}
        <section>
          <SectionLabel>{t('hubA11yDayNight')}</SectionLabel>
          <div className="bg-surface border border-line rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5">
              <div className="flex gap-2.5">
                {(['dark', 'light'] as Theme[]).map((mode) => {
                  const active = theme === mode;
                  const Icon = mode === 'dark' ? Moon : Sun;
                  return (
                    <button
                      key={mode}
                      onClick={() => setTheme(mode)}
                      className={[
                        'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all duration-200 text-sm font-bold',
                        active
                          ? 'border-fg/50 bg-surface-3 text-fg'
                          : 'border-line bg-surface-2 text-fg-subtle',
                      ].join(' ')}
                    >
                      <Icon size={16} />
                      {mode === 'dark' ? t('hubA11yNight') : t('hubA11yDay')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Font Size */}
        <section>
          <SectionLabel>{t('hubA11yFontSize')}</SectionLabel>
          <div className="bg-surface border border-line rounded-2xl px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-fg-muted">{t('hubA11yFontLetter')}</span>
              <span className="text-fg font-bold text-sm">{fontSize}px</span>
              <span className="text-xl text-fg font-bold">{t('hubA11yFontLetter')}</span>
            </div>
            <input
              type="range"
              min={13}
              max={22}
              step={1}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full h-2 rounded-full accent-emt-green cursor-pointer"
              aria-label={t('hubA11yFontSize')}
            />
            <div className="flex justify-between mt-1.5 text-[10px] text-fg-subtle">
              <span>{t('hubA11ySmall')}</span>
              <span>{t('hubA11yNormalSize')}</span>
              <span>{t('hubA11yLarge')}</span>
            </div>
          </div>
        </section>

        {/* Section 4: Share */}
        <section>
          <SectionLabel>{t('hubA11yShareSection')}</SectionLabel>
          <div className="bg-surface border border-line rounded-2xl overflow-hidden">
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-surface-2 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Share2 size={18} className="text-blue-700 dark:text-blue-500" />
              </div>
              <span className="text-fg font-medium text-sm flex-1 text-start">{t('hubA11yShareApp')}</span>
              <ForwardIcon size={16} className="text-fg-subtle" />
            </button>
          </div>
        </section>

      </div>

      {/* Back button */}
      <div className="shrink-0 p-4 border-t border-line">
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-surface-3 border border-line-strong
                     text-fg font-bold text-base active:scale-[0.98] transition-transform"
        >
          {t('back')}
        </button>
      </div>
    </div>
  );
}
