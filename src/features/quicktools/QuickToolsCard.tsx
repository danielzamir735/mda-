import { useState, useRef } from 'react';
import { Flashlight, Camera, Calculator } from 'lucide-react';
import CameraCapture from '../camera/CameraCapture';
import OxygenCalculatorModal from './OxygenCalculatorModal';
import { useCameraStore } from '../../store/cameraStore';

export default function QuickToolsCard() {
  const [torchOn, setTorchOn] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [o2CalcOpen, setO2CalcOpen] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const addPhoto = useCameraStore((s) => s.addPhoto);

  const toggleFlashlight = async () => {
    if (torchOn) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setTorchOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      // @ts-expect-error — torch not in standard TS types
      await track.applyConstraints({ advanced: [{ torch: true }] });
      setTorchOn(true);
    } catch {
      alert('לא ניתן להפעיל פנס במכשיר זה');
    }
  };

  return (
    <>
      <div
        className={[
          'flex flex-col items-center gap-2',
          'rounded-3xl border p-3 h-full w-full',
          'transition-all duration-300',
          torchOn ? 'bg-amber-50' : 'bg-emt-gray',
        ].join(' ')}
        style={{
          borderColor: torchOn ? '#FCD34D' : '#E2E8F0',
          borderWidth: torchOn ? '2px' : '1px',
          boxShadow: '0 2px 12px rgba(15,23,42,0.08)',
        }}
      >
        {/* Title */}
        <p className="text-emt-light font-black text-lg tracking-wide text-center w-full">
          כלי עזר
        </p>

        {/* 3 tool buttons */}
        <div className="flex-1 w-full flex flex-col justify-evenly gap-1">

          {/* Flashlight */}
          <button
            onClick={toggleFlashlight}
            className="flex items-center gap-3 px-3 py-2 rounded-2xl
                       transition-all duration-200 active:scale-95
                       hover:bg-slate-50"
            aria-label={torchOn ? 'כבה פנס' : 'הפעל פנס'}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0
                         border-2 transition-all duration-300"
              style={{
                backgroundColor: torchOn ? 'rgba(251,191,36,0.15)' : 'rgba(15,23,42,0.05)',
                borderColor: torchOn ? '#FCD34D' : '#E2E8F0',
              }}
            >
              <Flashlight size={20} style={{ color: torchOn ? '#D97706' : '#64748B' }} />
            </div>
            <span
              className="text-sm font-bold transition-colors duration-300"
              style={{ color: torchOn ? '#D97706' : '#475569' }}
            >
              {torchOn ? 'פנס פועל' : 'פנס'}
            </span>
          </button>

          {/* Camera */}
          <button
            onClick={() => setCameraOpen(true)}
            className="flex items-center gap-3 px-3 py-2 rounded-2xl
                       transition-all duration-200 active:scale-95
                       hover:bg-slate-50"
            aria-label="מצלמה"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0
                         border-2 border-slate-200 bg-slate-50"
            >
              <Camera size={20} className="text-slate-500" />
            </div>
            <span className="text-slate-600 text-sm font-bold">מצלמה</span>
          </button>

          {/* Oxygen Calculator */}
          <button
            onClick={() => setO2CalcOpen(true)}
            className="flex items-center gap-3 px-3 py-2 rounded-2xl
                       transition-all duration-200 active:scale-95
                       hover:bg-blue-50"
            aria-label="מחשבון חמצן"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0
                         border-2 border-blue-200 bg-blue-50"
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
