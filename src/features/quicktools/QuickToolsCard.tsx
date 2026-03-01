import { useState } from 'react';
import { Camera, Activity } from 'lucide-react';
import CameraCapture from '../camera/CameraCapture';
import AddVitalsModal from '../vitals/components/AddVitalsModal';
import { useCameraStore } from '../../store/cameraStore';

export default function QuickToolsCard() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [addVitalsOpen, setAddVitalsOpen] = useState(false);
  const addPhoto = useCameraStore((s) => s.addPhoto);

  return (
    <>
      <div
        className="flex flex-col items-center gap-2 rounded-3xl border border-emt-border
                   p-3 h-full w-full bg-emt-gray"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
      >
        <p className="text-emt-light font-black text-lg tracking-wide text-center w-full">
          כלי עזר
        </p>

        <div className="flex-1 w-full flex flex-col justify-evenly gap-1">

          {/* Camera */}
          <button
            onClick={() => setCameraOpen(true)}
            className="flex items-center gap-3 px-3 py-2 rounded-2xl
                       transition-all duration-200 active:scale-95"
            aria-label="מצלמה"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0
                         bg-emt-border/30 border border-emt-border"
            >
              <Camera size={18} className="text-emt-muted" />
            </div>
            <span className="text-emt-light text-sm font-bold">מצלמה</span>
          </button>

          {/* Add Vitals */}
          <button
            onClick={() => setAddVitalsOpen(true)}
            className="flex items-center gap-3 px-3 py-2 rounded-2xl
                       transition-all duration-200 active:scale-95"
            aria-label="הוספת מדדים"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0
                         border border-emt-green/40 bg-emt-green/10"
            >
              <Activity size={18} className="text-emt-green" />
            </div>
            <span className="text-emt-green text-sm font-bold">הוספת מדדים</span>
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
