import { useRef, useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface Props {
  onClose: () => void;
  onPhoto: (dataUrl: string) => void;
}

export default function CameraCapture({ onClose, onPhoto }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCaptured, setIsCaptured] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 4096 }, height: { ideal: 2160 } },
        audio: false,
      })
      .then((s) => {
        if (!mounted) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => setError('לא ניתן לגשת למצלמה. אנא אשר הרשאה.'));

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const closeCameraModal = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    onClose();
  };

  const capture = () => {
    if (!videoRef.current || !ready || isCaptured) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
    // Save image immediately
    onPhoto(dataUrl);
    // Stop stream after capture
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    // Shutter flash
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    // Show success state, then auto-close
    setIsCaptured(true);
    setTimeout(() => { closeCameraModal(); }, 800);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* Shutter flash overlay */}
      {flash && (
        <div className="absolute inset-0 z-20 bg-white pointer-events-none" style={{ opacity: 0.85 }} />
      )}
      <button
        onClick={closeCameraModal}
        className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full
                   bg-black/60 backdrop-blur-sm border border-white/20
                   flex items-center justify-center text-white
                   active:scale-90 transition-transform"
        aria-label="סגור מצלמה"
      >
        <X size={20} />
      </button>

      {error ? (
        <div className="flex-1 flex items-center justify-center px-8">
          <p className="text-white text-center text-base">{error}</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="flex-1 w-full object-cover"
        />
      )}

      <div className="absolute bottom-10 inset-x-0 flex justify-center">
        {!isCaptured ? (
          <button
            onClick={capture}
            disabled={!ready || !!error}
            className="w-20 h-20 rounded-full border-4 border-white
                       flex items-center justify-center
                       active:scale-90 transition-all duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
            aria-label="צלם תמונה"
          >
            <div className="w-14 h-14 rounded-full bg-white" />
          </button>
        ) : (
          <div
            className="w-20 h-20 rounded-full border-4 border-green-400
                       flex items-center justify-center
                       animate-pulse"
            style={{ background: 'rgba(34,197,94,0.85)', backdropFilter: 'blur(4px)' }}
          >
            <Check size={36} strokeWidth={3} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
