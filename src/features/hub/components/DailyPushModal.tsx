import { useEffect, useState } from 'react';
import { X, Bell, Pill, Stethoscope, Brain, AlertTriangle } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';
import { usePwaInstall } from '../../pwa/PwaInstallContext';
import { useTranslation, type TranslationKey } from '../../../i18n';
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
        enabled ? 'bg-emt-green' : 'bg-line-strong'
      }`}
    >
      <span
        // theme-ok: switch knob is white on the coloured/grey track in both modes
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

const CATEGORIES: { key: 'medication' | 'disease' | 'concept'; label: TranslationKey; icon: typeof Pill; color: string }[] = [
  { key: 'medication', label: 'learnPushCatMedication', icon: Pill, color: 'text-emerald-400' },
  { key: 'disease', label: 'learnPushCatDisease', icon: Stethoscope, color: 'text-purple-400' },
  { key: 'concept', label: 'learnPushCatConcept', icon: Brain, color: 'text-sky-400' },
];

export default function DailyPushModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const t = useTranslation();
  const { isIOS } = usePwaInstall();
  const [prefs, setPrefs] = useState<StoredPrefs>(() => loadPrefs());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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
        setError(t('learnPushErrUnsupported'));
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
        setSyncStatus('saved');
      } catch (err) {
        console.error('[DailyPushModal] enableDailyPush failed:', err);
        const msg = err instanceof Error ? err.message : '';
        if (msg === 'permission-denied') {
          setError(t('learnPushErrDenied'));
        } else if (msg === 'permission-default') {
          setError(t('learnPushErrDefault'));
        } else if (msg === 'vapid-key-missing' || msg === 'push-unsupported') {
          setError(t('learnPushErrUnavailable'));
        } else if (msg.startsWith('db-upsert-failed')) {
          setError(t('learnPushErrDbFailed'));
        } else {
          setError(t('learnPushErrGeneric'));
        }
      } finally {
        setBusy(false);
      }
    } else {
      setBusy(true);
      try {
        await disableDailyPush();
      } finally {
        persist({ ...prefs, enabled: false });
        setSyncStatus('idle');
        setBusy(false);
      }
    }
  };

  const syncToServer = async (next: StoredPrefs) => {
    if (!next.enabled) { setSyncStatus('idle'); return; }
    setSyncStatus('saving');
    try {
      await updatePushPrefs({ medication: next.medication, disease: next.disease, concept: next.concept, chosenHour: next.chosenHour, chosenMinute: next.chosenMinute });
      setSyncStatus('saved');
    } catch (err) {
      console.error('[DailyPushModal] updatePushPrefs failed:', err);
      setSyncStatus('error');
    }
  };

  const handleCategoryToggle = async (key: 'medication' | 'disease' | 'concept') => {
    const next = { ...prefs, [key]: !prefs[key] };
    persist(next);
    await syncToServer(next);
  };

  const handleTimeChange = async (hour: number, minute: number) => {
    const next = { ...prefs, chosenHour: hour, chosenMinute: minute };
    persist(next);
    await syncToServer(next);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-page">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-pink-400" />
          <h2 className="text-fg font-bold text-xl">{t('learnPushTitle')}</h2>
        </div>
        <HapticButton
          onClick={onClose}
          pressScale={0.88}
          className="w-10 h-10 rounded-full bg-surface-2 border border-line
                     flex items-center justify-center
                     text-fg-muted hover:text-fg"
          aria-label={t('close')}
        >
          <X size={20} />
        </HapticButton>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">

        {/* Enable toggle */}
        <section
          className={`bg-surface border border-line rounded-2xl p-4
                      flex items-center justify-between transition-opacity ${busy ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Bell size={18} className="text-pink-400" />
            </div>
            <div>
              <p className="text-fg font-medium text-sm">{t('learnPushReceive')}</p>
              <p className="text-fg-muted text-xs mt-0.5">{t('learnPushReceiveDesc')}</p>
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
              {t('learnPushIosCaveat')}
            </p>
          </div>
        )}

        {/* Categories */}
        <section>
          <p className="text-fg-muted text-xs font-semibold uppercase tracking-wide px-1 mb-2">
            {t('learnPushWhatToGet')}
          </p>
          <div className="bg-surface border border-line rounded-2xl overflow-hidden divide-y divide-line">
            {CATEGORIES.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Icon size={18} className={color} />
                  <span className="text-fg font-medium text-sm">{t(label)}</span>
                </div>
                <Toggle enabled={prefs[key]} onToggle={() => handleCategoryToggle(key)} />
              </div>
            ))}
          </div>
          <p className="text-fg-muted text-xs px-1 mt-2 leading-relaxed">
            {t('learnPushOnePerDay')}
          </p>
          {noCategorySelected && (
            <p className="text-emt-red text-xs px-1 mt-1">{t('learnPushPickOne')}</p>
          )}
        </section>

        {/* Time picker */}
        <section>
          <p className="text-fg-muted text-xs font-semibold uppercase tracking-wide px-1 mb-2">
            {t('learnPushTime')}
          </p>
          <div className="bg-surface border border-line rounded-2xl p-4 flex items-center justify-center">
            <input
              type="time"
              dir="ltr"
              value={`${String(prefs.chosenHour).padStart(2, '0')}:${String(prefs.chosenMinute).padStart(2, '0')}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                if (Number.isNaN(h) || Number.isNaN(m)) return;
                handleTimeChange(h, m);
              }}
              className="bg-surface-2 border border-line rounded-xl px-4 py-2.5
                         text-fg font-bold text-lg tracking-wide"
            />
          </div>

          {/* Explicit save-state feedback — without this, the toggles/time picker
              look identical whether the change actually reached the server or not,
              which is exactly what made a "successfully configured" push silently
              never arrive. */}
          <div className="px-1 mt-2 min-h-[1rem]">
            {!prefs.enabled ? (
              <p className="text-fg-muted text-xs leading-relaxed">
                {t('learnPushSavedAfterEnable')}
              </p>
            ) : syncStatus === 'saving' ? (
              <p className="text-fg-muted text-xs">{t('learnPushSaving')}</p>
            ) : syncStatus === 'saved' ? (
              <p className="text-emt-green text-xs font-medium">{t('learnPushSaved')}</p>
            ) : syncStatus === 'error' ? (
              <p className="text-emt-red text-xs">{t('learnPushSaveFailed')}</p>
            ) : null}
          </div>
        </section>

      </div>
    </div>
  );
}
