import { useState } from 'react';
import { Camera, Activity } from 'lucide-react';
import CameraCapture from '../camera/CameraCapture';
import AddVitalsModal from '../vitals/components/AddVitalsModal';
import { useCameraStore } from '../../store/cameraStore';
import { useTranslation } from '../../hooks/useTranslation';

export default function QuickToolsCard() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [addVitalsOpen, setAddVitalsOpen] = useState(false);
  const addPhoto = useCameraStore((s) => s.addPhoto);
  const t = useTranslation();

  return (
    <>
      <div
        className="flex flex-col items-center gap-2 rounded-3xl border border-gray-200 dark:border-emt-border
                   p-3 h-full w-full bg-white dark:bg-emt-gray"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <p className="text-gray-900 dark:text-emt-light font-black text-lg tracking-wide text-center w-full">
          {t('utilities')}
        </p>

        <div className="flex-1 w-full flex flex-col justify-evenly gap-1">

          {/* Camera */}
          <button
            onClick={() => setCameraOpen(true)}
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
            onClick={() => setAddVitalsOpen(true)}
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
    </>
  );
}
