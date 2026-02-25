import { useState, useRef } from 'react';
import { Flashlight, Camera } from 'lucide-react';
import CameraCapture from '../camera/CameraCapture';
import { useCameraStore } from '../../store/cameraStore';

export default function QuickToolsCard() {
  const [torchOn, setTorchOn] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
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
          'flex flex-col items-center justify-around gap-3',
          'rounded-3xl border p-4 h-full w-full',
          'backdrop-blur-lg transition-all duration-300',
          'shadow-[0_8px_32px_rgba(0,0,0,0.45)]',
          torchOn ? 'bg-emt-yellow/[0.07]' : 'bg-white/[0.06]',
        ].join(' ')}
        style={{
          borderColor: torchOn ? 'rgba(253,216,53,0.40)' : 'rgba(255,255,255,0.10)',
        }}
      >
        <p className="text-emt-light/50 text-xs tracking-widest uppercase self-start">
          כלי עזר
        </p>

        {/* Flashlight */}
        <button
          onClick={toggleFlashlight}
          className="flex flex-col items-center gap-2"
          aria-label={torchOn ? 'כבה פנס' : 'הפעל פנס'}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center
                       border-2 transition-all duration-300 active:scale-90"
            style={{
              backgroundColor: torchOn ? 'rgba(253,216,53,0.15)' : 'rgba(255,255,255,0.06)',
              borderColor: torchOn ? '#FDD835' : 'rgba(255,255,255,0.15)',
              boxShadow: torchOn ? '0 0 24px rgba(253,216,53,0.5)' : 'none',
            }}
          >
            <Flashlight size={24} style={{ color: torchOn ? '#FDD835' : '#888' }} />
          </div>
          <span
            className="text-xs font-medium transition-colors duration-300"
            style={{ color: torchOn ? '#FDD835' : '#666' }}
          >
            {torchOn ? 'פנס פועל' : 'פנס'}
          </span>
        </button>

        {/* Camera */}
        <button
          onClick={() => setCameraOpen(true)}
          className="flex flex-col items-center gap-2"
          aria-label="מצלמה"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center
                       border-2 border-white/15 bg-white/[0.06]
                       active:scale-90 transition-all duration-150"
          >
            <Camera size={24} className="text-emt-light/60" />
          </div>
          <span className="text-emt-light/50 text-xs">מצלמה</span>
        </button>
      </div>

      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onPhoto={(dataUrl) => addPhoto(dataUrl)}
        />
      )}
    </>
  );
}
