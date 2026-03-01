import { X, Sun, Moon, Globe } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useSettingsStore } from '../../../store/settingsStore';
import type { Theme, Language } from '../../../store/settingsStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'he', label: 'עברית' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
];

export default function SettingsModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-emt-border">
        <h2 className="text-emt-light font-bold text-xl">הגדרות</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-emt-gray border border-emt-border
                     flex items-center justify-center
                     active:scale-90 transition-transform text-emt-muted hover:text-emt-light"
          aria-label="סגור"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">

        {/* Theme */}
        <section className="flex flex-col gap-3">
          <p className="text-emt-muted text-xs font-semibold uppercase tracking-wide">מראה</p>
          <div className="flex gap-3">
            {(['dark', 'light'] as Theme[]).map((t) => {
              const active = theme === t;
              const Icon = t === 'dark' ? Moon : Sun;
              const label = t === 'dark' ? 'כהה' : 'בהיר';
              return (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={[
                    'flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all duration-200',
                    active
                      ? 'border-emt-light/60 bg-emt-light/10 text-emt-light'
                      : 'border-emt-border bg-emt-gray text-emt-muted',
                  ].join(' ')}
                >
                  <Icon size={22} />
                  <span className="text-sm font-bold">{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Language */}
        <section className="flex flex-col gap-3">
          <p className="text-emt-muted text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <Globe size={13} />
            שפה
          </p>
          <div className="flex flex-col gap-2">
            {LANGUAGES.map(({ value, label }) => {
              const active = language === value;
              return (
                <button
                  key={value}
                  onClick={() => setLanguage(value)}
                  className={[
                    'flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200',
                    active
                      ? 'border-emt-green/50 bg-emt-green/10 text-emt-green'
                      : 'border-emt-border bg-emt-gray text-emt-muted',
                  ].join(' ')}
                >
                  <span className="font-bold text-base">{label}</span>
                  {active && (
                    <span className="text-[11px] bg-emt-green text-emt-dark px-2 py-0.5 rounded-full font-bold">
                      פעיל
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
