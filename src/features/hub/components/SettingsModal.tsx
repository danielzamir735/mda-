import type { ReactNode } from 'react';
import { X, Sun, Moon, Globe, Monitor, Vibrate, Trash2, Coffee, Scale, ChevronRight } from 'lucide-react';
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
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${
        enabled ? 'bg-emt-green' : 'bg-gray-300 dark:bg-emt-border'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-gray-500 dark:text-emt-muted text-xs font-semibold uppercase tracking-wide px-1 mb-2">
      {children}
    </p>
  );
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const { theme, language, setTheme, setLanguage, hapticsEnabled, wakeLockEnabled, setHapticsEnabled, setWakeLockEnabled } =
    useSettingsStore();

  if (!isOpen) return null;

  const handleClearData = () => {
    if (window.confirm('האם אתה בטוח? כל הנתונים, הפתקים וההגדרות יימחקו.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleDisclaimer = () => {
    window.alert(
      'האפליקציה הינה כלי עזר בלבד עבור אנשי רפואה ומתנדבים. היא אינה מחליפה שיקול דעת רפואי מקצועי, הכשרה רפואית, או פרוטוקולים רשמיים. המפתחים אינם אחראים לכל נזק שייגרם עקב הסתמכות על האפליקציה.',
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">הגדרות</h2>
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

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">

        {/* Section 1: Display & Language */}
        <section>
          <SectionLabel>תצוגה ושפה</SectionLabel>
          <div className="bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-emt-border">
            {/* Theme */}
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-2 mb-3">
                <Monitor size={13} className="text-gray-400 dark:text-emt-muted" />
                <p className="text-xs font-semibold text-gray-500 dark:text-emt-muted">ערכת נושא</p>
              </div>
              <div className="flex gap-2.5">
                {(['dark', 'light'] as Theme[]).map((t) => {
                  const active = theme === t;
                  const Icon = t === 'dark' ? Moon : Sun;
                  return (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={[
                        'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all duration-200 text-sm font-bold',
                        active
                          ? 'border-gray-400 dark:border-emt-light/60 bg-gray-200 dark:bg-emt-light/10 text-gray-900 dark:text-emt-light'
                          : 'border-gray-200 dark:border-emt-border bg-gray-100 dark:bg-emt-dark text-gray-400 dark:text-emt-muted',
                      ].join(' ')}
                    >
                      <Icon size={16} />
                      {t === 'dark' ? 'כהה' : 'בהיר'}
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
                  className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 dark:active:bg-emt-dark/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-gray-400 dark:text-emt-muted" />
                    <span className="text-gray-900 dark:text-emt-light font-medium text-sm">{label}</span>
                  </div>
                  {active && (
                    <span className="text-[11px] bg-emt-green text-white px-2 py-0.5 rounded-full font-bold">פעיל</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: Field Preferences */}
        <section>
          <SectionLabel>העדפות שטח</SectionLabel>
          <div className="bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-emt-border">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Monitor size={18} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-emt-light font-medium text-sm">מניעת כיבוי מסך</p>
                  <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">מונע מהמסך להינעל במהלך שימוש</p>
                </div>
              </div>
              <Toggle enabled={wakeLockEnabled} onToggle={() => setWakeLockEnabled(!wakeLockEnabled)} />
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Vibrate size={18} className="text-purple-500" />
                </div>
                <p className="text-gray-900 dark:text-emt-light font-medium text-sm">רטט בלחיצות</p>
              </div>
              <Toggle enabled={hapticsEnabled} onToggle={() => setHapticsEnabled(!hapticsEnabled)} />
            </div>
          </div>
        </section>

        {/* Section 3: Data Management */}
        <section>
          <SectionLabel>ניהול נתונים</SectionLabel>
          <div className="bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl overflow-hidden">
            <button
              onClick={handleClearData}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-red-50 dark:active:bg-red-900/10 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <span className="text-red-500 font-medium text-sm">איפוס נתונים שמורים</span>
            </button>
          </div>
        </section>

        {/* Section 4: About & Support */}
        <section>
          <SectionLabel>אודות ותמיכה</SectionLabel>
          <div className="bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-emt-border">
            <a
              href="https://buymeacoffee.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3.5 active:bg-yellow-50 dark:active:bg-yellow-900/10 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-yellow-400/15 flex items-center justify-center">
                <Coffee size={18} className="text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-emt-light font-medium text-sm">תמכו בפיתוח</p>
                <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">Buy Me a Coffee ☕</p>
              </div>
              <ChevronRight size={16} className="text-gray-400 dark:text-emt-muted" />
            </a>
            <button
              onClick={handleDisclaimer}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 dark:active:bg-emt-dark/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-400/10 flex items-center justify-center">
                <Scale size={18} className="text-gray-500 dark:text-emt-muted" />
              </div>
              <span className="text-gray-900 dark:text-emt-light font-medium text-sm flex-1 text-right">הצהרה משפטית</span>
              <ChevronRight size={16} className="text-gray-400 dark:text-emt-muted" />
            </button>
          </div>
        </section>

        {/* Footer */}
        <p className="text-center text-gray-400 dark:text-emt-muted text-xs mt-1 pb-2">
          חובש+ | גרסה 2.1
        </p>

      </div>
    </div>
  );
}
