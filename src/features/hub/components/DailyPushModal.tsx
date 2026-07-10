import { useEffect, useState } from 'react';
import { X, Bell, Pill, Stethoscope, Brain, AlertTriangle } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';
import { usePwaInstall } from '../../pwa/PwaInstallContext';
import { enableDailyPush, disableDailyPush, updatePushPrefs, isPushSupported, requestNotificationPermission } from '../../../utils/pushNotifications';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface StoredPrefs {
  enabled: boolean;
  medication: boolean;
  disease: boolean;
  concept: boolean;
  chosenHour: number;
  chosenMinute: number;
}

const PREFS_KEY = 'daily_push_prefs_v1';

const DEFAULT_PREFS: StoredPrefs = {
  enabled: false,
  medication: true,
  disease: true,
  concept: true,
  chosenHour: 8,
  chosenMinute: 0,
};

function loadPrefs(): StoredPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch { return DEFAULT_PREFS; }
}

function savePrefs(prefs: StoredPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// Same standalone-display check PwaInstallContext uses on mount to mark
// hoveshPlus_isInstalled — kept inline here since the context doesn't expose it.
function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
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

const CATEGORIES: { key: 'medication' | 'disease' | 'concept'; label: string; icon: typeof Pill; color: string }[] = [
  { key: 'medication', label: 'תרופה חדשה', icon: Pill, color: 'text-emerald-400' },
  { key: 'disease', label: 'מחלה חדשה', icon: Stethoscope, color: 'text-purple-400' },
  { key: 'concept', label: 'מושג חדש', icon: Brain, color: 'text-sky-400' },
];

export default function DailyPushModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const { isIOS } = usePwaInstall();
  const [prefs, setPrefs] = useState<StoredPrefs>(() => loadPrefs());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPrefs(loadPrefs());
    if (isPushSupported()) requestNotificationPermission().catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const showIosCaveat = isIOS && !isStandaloneDisplay();
  const noCategorySelected = !prefs.medication && !prefs.disease && !prefs.concept;

  const persist = (next: StoredPrefs) => {
    setPrefs(next);
    savePrefs(next);
  };

  const handleToggle = async () => {
    setError(null);
    if (!prefs.enabled) {
      if (!isPushSupported()) {
        setError('הדפדפן הזה אינו תומך בהתראות פוש');
        return;
      }
      setBusy(true);
      try {
        await enableDailyPush({
          medication: prefs.medication,
          disease: prefs.disease,
          concept: prefs.concept,
          chosenHour: prefs.chosenHour,
          chosenMinute: prefs.chosenMinute,
        });
        persist({ ...prefs, enabled: true });
      } catch {
        setError('לא הצלחנו להפעיל התראות — ודא שאישרת הרשאת התראות בדפדפן');
      } finally {
        setBusy(false);
      }
    } else {
      setBusy(true);
      try {
        await disableDailyPush();
      } finally {
        persist({ ...prefs, enabled: false });
        setBusy(false);
      }
    }
  };

  const handleCategoryToggle = async (key: 'medication' | 'disease' | 'concept') => {
    const next = { ...prefs, [key]: !prefs[key] };
    persist(next);
    if (next.enabled) {
      try {
        await updatePushPrefs({ medication: next.medication, disease: next.disease, concept: next.concept, chosenHour: next.chosenHour, chosenMinute: next.chosenMinute });
      } catch { /* noop — next save/toggle will retry the upsert */ }
    }
  };

  const handleTimeChange = async (hour: number, minute: number) => {
    const next = { ...prefs, chosenHour: hour, chosenMinute: minute };
    persist(next);
    if (next.enabled) {
      try {
        await updatePushPrefs({ medication: next.medication, disease: next.disease, concept: next.concept, chosenHour: hour, chosenMinute: minute });
      } catch { /* noop */ }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-pink-400" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">פוש יומי</h2>
        </div>
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

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">

        {/* Enable toggle */}
        <section
          className={`bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl p-4
                      flex items-center justify-between transition-opacity ${busy ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Bell size={18} className="text-pink-400" />
            </div>
            <div>
              <p className="text-gray-900 dark:text-emt-light font-medium text-sm">קבלת פוש יומי</p>
              <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">תזכורת יומית עם התוכן שבחרת</p>
            </div>
          </div>
          <Toggle enabled={prefs.enabled} onToggle={handleToggle} />
        </section>

        {error && <p className="text-emt-red text-xs text-center -mt-3 px-1">{error}</p>}

        {/* iOS caveat — informational only, never blocks the toggle */}
        {showIosCaveat && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3.5">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-amber-700 dark:text-amber-300 text-xs leading-relaxed">
              באייפון, פוש יתחיל לעבוד רק אחרי שמוסיפים את האפליקציה למסך הבית (בדפדפן Safari: כפתור השיתוף ← הוסף למסך הבית).
            </p>
          </div>
        )}

        {/* Categories */}
        <section>
          <p className="text-gray-500 dark:text-emt-muted text-xs font-semibold uppercase tracking-wide px-1 mb-2">
            מה תרצה לקבל?
          </p>
          <div className="bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-emt-border">
            {CATEGORIES.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Icon size={18} className={color} />
                  <span className="text-gray-900 dark:text-emt-light font-medium text-sm">{label}</span>
                </div>
                <Toggle enabled={prefs[key]} onToggle={() => handleCategoryToggle(key)} />
              </div>
            ))}
          </div>
          <p className="text-gray-500 dark:text-emt-muted text-xs px-1 mt-2 leading-relaxed">
            תקבל פוש אחד ביום עם כל המושגים שבחרת — לא פוש נפרד לכל קטגוריה.
          </p>
          {noCategorySelected && (
            <p className="text-emt-red text-xs px-1 mt-1">יש לבחור לפחות קטגוריה אחת כדי לקבל פוש</p>
          )}
        </section>

        {/* Time picker */}
        <section>
          <p className="text-gray-500 dark:text-emt-muted text-xs font-semibold uppercase tracking-wide px-1 mb-2">
            שעת קבלה מדויקת (שעון ישראל)
          </p>
          <div className="bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl p-4 flex items-center justify-center">
            <input
              type="time"
              dir="ltr"
              value={`${String(prefs.chosenHour).padStart(2, '0')}:${String(prefs.chosenMinute).padStart(2, '0')}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                if (Number.isNaN(h) || Number.isNaN(m)) return;
                handleTimeChange(h, m);
              }}
              className="bg-gray-100 dark:bg-emt-dark border border-gray-200 dark:border-emt-border rounded-xl px-4 py-2.5
                         text-gray-900 dark:text-emt-light font-bold text-lg tracking-wide"
            />
          </div>
        </section>

      </div>
    </div>
  );
}
