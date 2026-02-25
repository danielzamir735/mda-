import { useState, useRef } from 'react';
import { Flashlight, Camera } from 'lucide-react';

export default function QuickToolsCard() {
  const [torchOn, setTorchOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const toggleFlashlight = async () => {
    if (torchOn) {
      // Turn off
      streamRef.current?.getTracks().forEach(t => t.stop());
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
      // @ts-expect-error — torch is not in standard TS types yet
      await track.applyConstraints({ advanced: [{ torch: true }] });
      setTorchOn(true);
    } catch {
      alert('לא ניתן להפעיל פנס במכשיר זה');
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-around gap-3
                 rounded-3xl border border-emt-border p-4 h-full w-full
                 transition-all duration-300"
      style={{
        background: 'linear-gradient(135deg, #141414 0%, #1E1E1E 100%)',
        borderColor: torchOn ? 'rgba(253,216,53,0.45)' : '#2C2C2C',
      }}
    >
      <p className="text-emt-light/50 text-xs tracking-widest uppercase self-start">
        כלי עזר
      </p>

      {/* Flashlight */}
      <button
        onClick={toggleFlashlight}
        className="flex flex-col items-center gap-2 group"
        aria-label={torchOn ? 'כבה פנס' : 'הפעל פנס'}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center
                     border-2 transition-all duration-300 active:scale-90"
          style={{
            backgroundColor: torchOn ? 'rgba(253,216,53,0.15)' : 'rgba(44,44,44,0.8)',
            borderColor: torchOn ? '#FDD835' : '#3a3a3a',
            boxShadow: torchOn ? '0 0 24px rgba(253,216,53,0.5)' : 'none',
          }}
        >
          <Flashlight
            size={28}
            style={{ color: torchOn ? '#FDD835' : '#888' }}
          />
        </div>
        <span
          className="text-xs font-medium transition-colors duration-300"
          style={{ color: torchOn ? '#FDD835' : '#666' }}
        >
          {torchOn ? 'פנס פועל' : 'פנס'}
        </span>
      </button>

      {/* Camera placeholder */}
      <button
        disabled
        className="flex flex-col items-center gap-2 opacity-40 cursor-not-allowed"
        aria-label="מצלמה - בקרוב"
      >
        <div className="w-16 h-16 rounded-full bg-emt-border/50 border-2 border-emt-border
                        flex items-center justify-center">
          <Camera size={28} className="text-emt-light/40" />
        </div>
        <span className="text-emt-light/40 text-xs">מצלמה</span>
      </button>
    </div>
  );
}
