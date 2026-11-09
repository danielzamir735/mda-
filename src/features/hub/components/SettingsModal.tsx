import { useState, type ReactNode } from 'react';
import { X, Sun, Moon, Globe, Monitor, Vibrate, Trash2, Scale, ChevronRight, FileText, ShieldCheck, Accessibility } from 'lucide-react';
import LegalDocsModal from '../../legal/LegalDocsModal';
import type { LegalDocId } from '../../legal/legalContent';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useSettingsStore } from '../../../store/settingsStore';
import type { Theme, Language } from '../../../store/settingsStore';
import { useTranslation, type TranslationKey } from '../../../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'he', label: 'עברית' }, // i18n-ok: a language is always listed by its own name
  { value: 'en', label: 'English' },
];

const LEGAL_LINKS: { id: LegalDocId; label: TranslationKey; Icon: typeof FileText }[] = [
  { id: 'terms', label: 'termsOfUse', Icon: FileText },
  { id: 'privacy', label: 'privacyPolicy', Icon: ShieldCheck },
  { id: 'accessibility', label: 'accessibilityStatement', Icon: Accessibility },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${
        enabled ? 'bg-emt-green' : 'bg-line-strong'
      }`}
    >
      <span
        // theme-ok: the switch knob is white in both modes
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-fg-muted text-xs font-semibold uppercase tracking-wide px-1 mb-2">
      {children}
    </p>
  );
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const { theme, language, setTheme, setLanguage, hapticsEnabled, wakeLockEnabled, setHapticsEnabled, setWakeLockEnabled } =
    useSettingsStore();
  const [docOpen, setDocOpen] = useState<LegalDocId | null>(null);
  const t = useTranslation();

  if (!isOpen) return null;

  const handleClearData = () => {
    if (window.confirm(t('resetSavedDataConfirm'))) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleDisclaimer = () => {
    window.alert(t('legalDisclaimerBody'));
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-page">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <h2 className="text-fg font-bold text-xl">{t('settingsTitle')}</h2>
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

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">

        {/* Section 1: Display & Language */}
        <section>
          <SectionLabel>{t('displayAndLanguage')}</SectionLabel>
          <div className="bg-surface border border-line rounded-2xl overflow-hidden divide-y divide-line">
            {/* Theme */}
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-2 mb-3">
                <Monitor size={13} className="text-fg-subtle" />
                <p className="text-xs font-semibold text-fg-muted">{t('themeLabel')}</p>
              </div>
              <div className="flex gap-2.5">
                {(['dark', 'light'] as Theme[]).map((mode) => {
                  const active = theme === mode;
                  const Icon = mode === 'dark' ? Moon : Sun;
                  return (
                    <button
                      key={mode}
                      aria-pressed={active}
                      onClick={() => setTheme(mode)}
                      className={[
                        'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all duration-200 text-sm font-bold',
                        active
                          ? 'border-fg/50 bg-fg/10 text-fg'
                          : 'border-line bg-surface-2 text-fg-muted',
                      ].join(' ')}
                    >
                      <Icon size={16} />
                      {t(mode === 'dark' ? 'themeDark' : 'themeLight')}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Language */}
            {LANGUAGES.map(({ value, label }) => {
              const active = language === value;
              return (
                <button
                  key={value}
                  onClick={() => setLanguage(value)}
                  aria-pressed={active}
                  className="w-full flex items-center justify-between px-4 py-3.5 active:bg-surface-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-fg-subtle" />
                    <span lang={value} className="text-fg font-medium text-sm">{label}</span>
                  </div>
                  {active && (
                    <span className="text-[11px] bg-emt-green text-white px-2 py-0.5 rounded-full font-bold">{t('activeBadge')}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: Field Preferences */}
        <section>
          <SectionLabel>{t('fieldPreferences')}</SectionLabel>
          <div className="bg-surface border border-line rounded-2xl overflow-hidden divide-y divide-line">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Monitor size={18} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-fg font-medium text-sm">{t('keepScreenOn')}</p>
                  <p className="text-fg-muted text-xs mt-0.5">{t('keepScreenOnHint')}</p>
                </div>
              </div>
              <Toggle enabled={wakeLockEnabled} onToggle={() => setWakeLockEnabled(!wakeLockEnabled)} />
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Vibrate size={18} className="text-purple-500" />
                </div>
                <p className="text-fg font-medium text-sm">{t('hapticFeedback')}</p>
              </div>
              <Toggle enabled={hapticsEnabled} onToggle={() => setHapticsEnabled(!hapticsEnabled)} />
            </div>
          </div>
        </section>

        {/* Section 3: Data Management */}
        <section>
          <SectionLabel>{t('dataManagement')}</SectionLabel>
          <div className="bg-surface border border-line rounded-2xl overflow-hidden">
            <button
              onClick={handleClearData}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-red-50 dark:active:bg-red-900/10 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <span className="text-red-500 font-medium text-sm">{t('resetSavedData')}</span>
            </button>
          </div>
        </section>

        {/* Section 4: About & Support */}
        <section>
          <SectionLabel>{t('aboutAndSupport')}</SectionLabel>
          <div className="bg-surface border border-line rounded-2xl overflow-hidden divide-y divide-line">
            <button
              onClick={handleDisclaimer}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-surface-2 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-fg/5 flex items-center justify-center">
                <Scale size={18} className="text-fg-muted" />
              </div>
              <span className="text-fg font-medium text-sm flex-1 text-start">{t('legalDisclaimer')}</span>
              <ChevronRight size={16} className="text-fg-subtle" />
            </button>
            {LEGAL_LINKS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setDocOpen(id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-surface-2 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-fg/5 flex items-center justify-center">
                  <Icon size={18} className="text-fg-muted" />
                </div>
                <span className="text-fg font-medium text-sm flex-1 text-start">{t(label)}</span>
                <ChevronRight size={16} className="text-fg-subtle" />
              </button>
            ))}
          </div>
        </section>

        {/* Footer */}
        <p className="text-center text-fg-subtle text-xs mt-1 pb-2">
          {t('appVersion', { version: '2.1' })}
        </p>

      </div>

      <LegalDocsModal
        isOpen={docOpen !== null}
        onClose={() => setDocOpen(null)}
        initialDoc={docOpen ?? 'terms'}
      />
    </div>
  );
}
