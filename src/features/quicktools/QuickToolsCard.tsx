import { useState } from 'react';
import { Camera, Activity, Trophy, History } from 'lucide-react';
import CameraCapture from '../camera/CameraCapture';
import AddVitalsModal from '../vitals/components/AddVitalsModal';
import VitalsHistoryModal from '../vitals/components/VitalsHistoryModal';
import { useTranslation } from '../../i18n';
import { useCameraStore } from '../../store/cameraStore';
import { trackInteraction } from '../../utils/analytics';
import DailyChallengeModal from '../hub/components/DailyChallengeModal';

export default function QuickToolsCard() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [addVitalsOpen, setAddVitalsOpen] = useState(false);
  const [vitalsHistoryOpen, setVitalsHistoryOpen] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const t = useTranslation();
  const addPhoto = useCameraStore((s) => s.addPhoto);

  return (
    <>
      <div
        className="flex flex-col items-center gap-2 rounded-3xl border border-line
                   p-2 h-full w-full bg-surface"
        style={{ boxShadow: '0 2px 8px rgb(0 0 0 / 0.08)' }}
      >
        <p className="text-fg font-black text-lg tracking-wide text-center w-full">
          {t('utilities')}
        </p>

        <div className="flex-1 w-full flex flex-col justify-evenly gap-1">

          {/* Camera */}
          <button
            // i18n-ok: analytics event label, kept stable across languages
            onClick={() => { trackInteraction('מצלמה', 'main_tools'); setCameraOpen(true); }}
            className="flex items-center gap-3 px-3 py-2 rounded-2xl
                       transition-all duration-200 active:scale-95"
            aria-label={t('camera')}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0
                         bg-surface-3 border border-line-strong"
            >
              <Camera size={18} className="text-fg-muted" />
            </div>
            <span className="text-fg text-sm font-bold">{t('camera')}</span>
          </button>

          {/* Add Vitals */}
          <button
            // i18n-ok: analytics event label, kept stable across languages
            onClick={() => { trackInteraction('הוספת מדדים', 'main_tools'); setAddVitalsOpen(true); }}
            className="flex items-center gap-3 px-3 py-2 rounded-2xl
                       transition-all duration-200 active:scale-95"
            aria-label={t('addVitals')}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0
                         border border-emt-green/40 bg-emt-green/10"
            >
              <Activity size={18} className="text-green-600 dark:text-emt-green" />
            </div>
            <span className="text-green-600 dark:text-emt-green text-sm font-bold">{t('addVitals')}</span>
          </button>

          {/* Vitals History */}
          <button
            // i18n-ok: analytics event label, kept stable across languages
            onClick={() => { trackInteraction('היסטוריית מדדים', 'main_tools'); setVitalsHistoryOpen(true); }}
            className="flex items-center gap-3 px-3 py-2 rounded-2xl
                       transition-all duration-200 active:scale-95"
            aria-label={t('vitalsHistory')}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0
                         border border-emt-green/40 bg-emt-green/10"
            >
              <History size={18} className="text-green-600 dark:text-emt-green" />
            </div>
            <span className="text-green-600 dark:text-emt-green text-sm font-bold">{t('vitalsHistory')}</span>
          </button>

          {/* Daily Challenge */}
          <button
            // i18n-ok: analytics event label, kept stable across languages
            onClick={() => { trackInteraction('האתגר היומי', 'main_tools'); setChallengeOpen(true); }}
            className="relative flex items-center gap-3 px-3 py-2 rounded-2xl
                       transition-all duration-200 active:scale-95"
            aria-label={t('homeDailyChallenge')}
          >
            <div
              className="relative w-9 h-9 rounded-full flex items-center justify-center shrink-0
                         border border-amber-400/40 bg-amber-400/10"
            >
              <span className="absolute inset-0 rounded-full border border-amber-400/60 animate-ping opacity-70" aria-hidden="true" />
              <Trophy size={18} className="text-amber-600 dark:text-amber-400 relative" />
            </div>
            <span className="text-amber-600 dark:text-amber-400 text-sm font-bold">{t('homeDailyChallenge')}</span>
          </button>

        </div>
      </div>

      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onPhoto={(dataUrl) => addPhoto(dataUrl)}
        />
      )}

      <AddVitalsModal
        isOpen={addVitalsOpen}
        onClose={() => setAddVitalsOpen(false)}
      />

      <VitalsHistoryModal
        isOpen={vitalsHistoryOpen}
        onClose={() => setVitalsHistoryOpen(false)}
      />

      <DailyChallengeModal
        isOpen={challengeOpen}
        onClose={() => setChallengeOpen(false)}
      />
    </>
  );
}
