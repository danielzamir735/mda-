import { Sun, Moon, Share2, ChevronRight } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useSettingsStore } from '../../../store/settingsStore';
import type { Theme } from '../../../store/settingsStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const BG_COLORS = [
  { label: 'ירוק בהיר', value: '#d1fae5' },
  { label: 'בז\'',       value: '#fef3c7' },
  { label: 'צהוב',       value: '#fef9c3' },
  { label: 'ורוד',       value: '#fce7f3' },
  { label: 'תכלת',      value: '#dbeafe' },
  { label: 'אפור',       value: '#e5e7eb' },
  { label: 'שחור',       value: '#000000' },
  { label: 'לבן',        value: '#ffffff' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-gray-500 dark:text-emt-muted text-xs font-semibold uppercase tracking-wide px-1 mb-2">
      {children}
    </p>
  );
}

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

export default function AccessibilityModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const { theme, setTheme, bgColor, setBgColor, fontSize, setFontSize } = useSettingsStore();

  if (!isOpen) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'חובש+ – עוזר חובש',
        text: 'גיליתי אפליקציית עזר לחובשים ומתנדבי חירום – חובש+! כוללת מחשבונים רפואיים, מדדים, CPR ועוד. שווה להתקין!',
        url: window.location.origin,
      }).catch(() => {});
    } else {
      window.alert('שיתוף אינו נתמך בדפדפן זה.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">נגישות</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
          aria-label="סגור"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">

        {/* Section 1: Background Color */}
        <section>
          <SectionLabel>צבע רקע</SectionLabel>
          <div className="bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl p-4">
            <div className="grid grid-cols-4 gap-3">
              {/* Default/reset swatch */}
              <button
                onClick={() => setBgColor('')}
                className={`flex flex-col items-center gap-1.5 group`}
                aria-label="ברירת מחדל"
              >
                <span
                  className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center text-xs font-bold
                    ${!bgColor
                      ? 'border-emt-green ring-2 ring-emt-green/40'
                      : 'border-gray-300 dark:border-emt-border'
                    } bg-gradient-to-br from-gray-200 to-gray-400 dark:from-emt-border dark:to-emt-dark text-gray-600 dark:text-emt-muted`}
                >
                  ✕
                </span>
                <span className="text-[10px] text-gray-500 dark:text-emt-muted leading-none">ברירת מחדל</span>
              </button>

              {BG_COLORS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setBgColor(value)}
                  className="flex flex-col items-center gap-1.5"
                  aria-label={label}
                >
                  <span
                    className={`w-12 h-12 rounded-xl border-2 transition-all
                      ${bgColor === value
                        ? 'border-emt-green ring-2 ring-emt-green/40 scale-110'
                        : 'border-gray-300 dark:border-emt-border'
                      }`}
                    style={{ backgroundColor: value }}
                  />
                  <span className="text-[10px] text-gray-500 dark:text-emt-muted leading-none text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Day/Night Mode */}
        <section>
          <SectionLabel>מצב יום / לילה</SectionLabel>
          <div className="bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5">
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
                      {t === 'dark' ? 'לילה' : 'יום'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Font Size */}
        <section>
          <SectionLabel>גודל גופן</SectionLabel>
          <div className="bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 dark:text-emt-muted">א</span>
              <span className="text-gray-900 dark:text-emt-light font-bold text-sm">{fontSize}px</span>
              <span className="text-xl text-gray-700 dark:text-emt-light font-bold">א</span>
            </div>
            <input
              type="range"
              min={13}
              max={22}
              step={1}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full h-2 rounded-full accent-emt-green cursor-pointer"
              aria-label="גודל גופן"
            />
            <div className="flex justify-between mt-1.5 text-[10px] text-gray-400 dark:text-emt-muted">
              <span>קטן</span>
              <span>רגיל (16)</span>
              <span>גדול</span>
            </div>
          </div>
        </section>

        {/* Section 4: Share */}
        <section>
          <SectionLabel>שיתוף עם חברים</SectionLabel>
          <div className="bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl overflow-hidden">
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 dark:active:bg-emt-dark/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Share2 size={18} className="text-blue-500" />
              </div>
              <span className="text-gray-900 dark:text-emt-light font-medium text-sm flex-1 text-right">שתף את האפליקציה</span>
              <ChevronRight size={16} className="text-gray-400 dark:text-emt-muted" />
            </button>
          </div>
        </section>

      </div>

      {/* Back button */}
      <div className="shrink-0 p-4 border-t border-gray-200 dark:border-emt-border">
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gray-200 dark:bg-emt-gray border border-gray-300 dark:border-emt-border
                     text-gray-900 dark:text-emt-light font-bold text-base active:scale-[0.98] transition-transform"
        >
          חזור
        </button>
      </div>
    </div>
  );
}
