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
          'flex flex-col items-center gap-3',
          'rounded-3xl border p-3 h-full w-full',
          'transition-all duration-300',
          torchOn ? 'bg-emt-yellow/[0.07]' : 'bg-emt-gray',
        ].join(' ')}
        style={{
          borderColor: torchOn ? 'rgba(253,216,53,0.50)' : 'rgba(255,255,255,0.12)',
          borderWidth: torchOn ? '2px' : '1px',
        }}
      >
        {/* Title — top-center, large & bold */}
        <p className="text-emt-light font-black text-lg tracking-wide text-center w-full">
          כלי עזר
        </p>

        {/* Flashlight */}
        <button
          onClick={toggleFlashlight}
          className="flex flex-col items-center gap-2 flex-1 justify-center"
          aria-label={torchOn ? 'כבה פנס' : 'הפעל פנס'}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center
                       border-2 transition-all duration-300 active:scale-90"
            style={{
              backgroundColor: torchOn ? 'rgba(253,216,53,0.15)' : 'rgba(255,255,255,0.06)',
              borderColor: torchOn ? '#FDD835' : 'rgba(255,255,255,0.20)',
            }}
          >
            <Flashlight size={24} style={{ color: torchOn ? '#FDD835' : '#999' }} />
          </div>
          <span
            className="text-sm font-semibold transition-colors duration-300"
            style={{ color: torchOn ? '#FDD835' : '#888' }}
          >
            {torchOn ? 'פנס פועל' : 'פנס'}
          </span>
        </button>

        {/* Camera */}
        <button
          onClick={() => setCameraOpen(true)}
          className="flex flex-col items-center gap-2 flex-1 justify-center"
          aria-label="מצלמה"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center
                       border-2 border-white/20 bg-white/[0.06]
                       active:scale-90 transition-all duration-150"
          >
            <Camera size={24} className="text-emt-light/70" />
          </div>
          <span className="text-emt-light/65 text-sm font-semibold">מצלמה</span>
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
