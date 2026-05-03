import { lazy, Suspense, useState } from 'react';
import { Camera, Activity, Trophy } from 'lucide-react';
import CameraCapture from '../camera/CameraCapture';
import AddVitalsModal from '../vitals/components/AddVitalsModal';
import { useTranslation } from '../../hooks/useTranslation';
import { useCameraStore } from '../../store/cameraStore';
import { trackInteraction } from '../../utils/analytics';

const DailyChallengeModal = lazy(() => import('../hub/components/DailyChallengeModal'));

export default function QuickToolsCard() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [addVitalsOpen, setAddVitalsOpen] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const t = useTranslation();
  const addPhoto = useCameraStore((s) => s.addPhoto);

  return (
    <>
      <div
        className="flex flex-col items-center gap-2 rounded-3xl border border-gray-200 dark:border-emt-border
                   p-2 h-full w-full bg-white dark:bg-emt-gray"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <p className="text-gray-900 dark:text-emt-light font-black text-lg tracking-wide text-center w-full">
          {t('utilities')}
        </p>

        <div className="flex-1 w-full flex flex-col justify-evenly gap-1">

          {/* Camera */}
          <button
            onClick={() => { trackInteraction('מצלמה', 'main_tools'); setCameraOpen(true); }}
            className="flex items-center gap-3 px-3 py-2 rounded-2xl
                       transition-all duration-200 active:scale-95"
            aria-label={t('camera')}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0
                         bg-gray-200 dark:bg-emt-border/30 border border-gray-300 dark:border-emt-border"
            >
              <Camera size={18} className="text-gray-500 dark:text-emt-muted" />
            </div>
            <span className="text-gray-900 dark:text-emt-light text-sm font-bold">{t('camera')}</span>
          </button>

          {/* Add Vitals */}
          <button
            onClick={() => { trackInteraction('הוספת מדדים', 'main_tools'); setAddVitalsOpen(true); }}
            className="flex items-center gap-3 px-3 py-2 rounded-2xl
                       transition-all duration-200 active:scale-95"
            aria-label={t('addVitals')}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0
                         border border-emt-green/40 bg-emt-green/10"
            >
              <Activity size={18} className="text-emt-green" />
            </div>
            <span className="text-emt-green text-sm font-bold">{t('addVitals')}</span>
          </button>

          {/* Daily Challenge */}
          <button
            onClick={() => { trackInteraction('האתגר היומי', 'main_tools'); setChallengeOpen(true); }}
            className="relative flex items-center gap-3 px-3 py-2 rounded-2xl
                       transition-all duration-200 active:scale-95"
            aria-label="אתגר יומי"
          >
            <div
              className="relative w-9 h-9 rounded-full flex items-center justify-center shrink-0
                         border border-amber-400/40 bg-amber-400/10"
            >
              <span className="absolute inset-0 rounded-full border border-amber-400/60 animate-ping opacity-70" aria-hidden="true" />
              <Trophy size={18} className="text-amber-400 relative" />
            </div>
            <span className="text-amber-400 text-sm font-bold">אתגר יומי</span>
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

      <Suspense fallback={null}>
        <DailyChallengeModal
          isOpen={challengeOpen}
          onClose={() => setChallengeOpen(false)}
        />
      </Suspense>
    </>
  );
}
