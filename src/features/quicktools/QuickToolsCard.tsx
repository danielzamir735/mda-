import { useState } from 'react';
import { Camera, Calculator } from 'lucide-react';
import CameraCapture from '../camera/CameraCapture';
import OxygenCalculatorModal from './OxygenCalculatorModal';
import { useCameraStore } from '../../store/cameraStore';

export default function QuickToolsCard() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [o2CalcOpen, setO2CalcOpen] = useState(false);
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl
                       transition-all duration-200 active:scale-95"
            aria-label="מצלמה"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0
                         bg-emt-border/30 border border-emt-border"
            >
              <Camera size={20} className="text-emt-muted" />
            </div>
            <span className="text-emt-light text-sm font-bold">מצלמה</span>
          </button>

          {/* Oxygen Calculator */}
          <button
            onClick={() => setO2CalcOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl
                       transition-all duration-200 active:scale-95"
            aria-label="מחשבון חמצן"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0
                         border border-emt-blue/40 bg-emt-blue/10"
            >
              <Calculator size={20} className="text-emt-blue" />
            </div>
            <span className="text-emt-blue text-sm font-bold">מחשבון חמצן</span>
          </button>

        </div>
      </div>

      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onPhoto={(dataUrl) => addPhoto(dataUrl)}
        />
      )}

      <OxygenCalculatorModal
        isOpen={o2CalcOpen}
        onClose={() => setO2CalcOpen(false)}
      />
    </>
  );
}
