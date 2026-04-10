import { useRef, useState, useEffect, useCallback } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';

interface Props {
  onClose: () => void;
  onPhoto: (dataUrl: string) => void;
}

const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 9999 },
    height: { ideal: 9999 },
    advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
  },
  audio: false,
};

export default function CameraCapture({ onClose, onPhoto }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(() => {
    setReady(false);
    setError(null);
    navigator.mediaDevices
      .getUserMedia(VIDEO_CONSTRAINTS)
      .then((s) => {
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => setError('לא ניתן לגשת למצלמה. אנא אשר הרשאה.'));
  }, []);

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices
      .getUserMedia(VIDEO_CONSTRAINTS)
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

  const handleClose = useCallback(() => {
    stopStream();
    onClose();
  }, [stopStream, onClose]);

  const capture = () => {
    if (!videoRef.current || !ready) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas context unavailable');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // PNG = lossless, maximum quality
      const dataUrl = canvas.toDataURL('image/png');
      stopStream();
      setCapturedUrl(dataUrl);
    } catch {
      setError('שגיאה בצילום. אנא נסה שוב.');
    }
  };

  const retake = () => {
    setCapturedUrl(null);
    startCamera();
  };

  const usePhoto = () => {
    if (!capturedUrl) return;
    onPhoto(capturedUrl);
    onClose();
  };

  // ── Preview mode ──────────────────────────────────────────────
  if (capturedUrl) {
    return (
      <div
        className="fixed inset-0 z-[60] bg-black"
        style={{ height: '100dvh' }}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full
                     bg-black/60 backdrop-blur-sm border border-white/20
                     flex items-center justify-center text-white
                     active:scale-90 transition-transform"
          aria-label="סגור מצלמה"
        >
          <X size={20} />
        </button>

        <img
          src={capturedUrl}
          alt="תמונה שצולמה"
          className="absolute inset-0 w-full h-full object-contain"
          style={{ bottom: '120px' }}
        />

        <div
          className="absolute bottom-0 left-0 right-0 flex gap-4 justify-center items-center bg-black"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)', paddingTop: '20px', minHeight: '100px' }}
        >
          <button
            onClick={retake}
            className="flex items-center gap-2 px-6 py-3 rounded-full
                       border border-white/40 text-white text-base font-medium
                       active:scale-95 transition-transform"
          >
            <RotateCcw size={18} />
            צלם מחדש
          </button>
          <button
            onClick={usePhoto}
            className="flex items-center gap-2 px-6 py-3 rounded-full
                       bg-green-500 text-white text-base font-medium
                       active:scale-95 transition-transform"
          >
            <Check size={18} strokeWidth={3} />
            אישור
          </button>
        </div>
      </div>
    );
  }

  // ── Camera / viewfinder mode ──────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[60] bg-black"
      style={{ height: '100dvh' }}
    >
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full
                   bg-black/60 backdrop-blur-sm border border-white/20
                   flex items-center justify-center text-white
                   active:scale-90 transition-transform"
        aria-label="סגור מצלמה"
      >
        <X size={20} />
      </button>

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center px-8">
          <p className="text-white text-center text-base">{error}</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      <div className="absolute bottom-12 inset-x-0 flex justify-center">
        <button
          onClick={capture}
          disabled={!ready || !!error}
          className="w-20 h-20 rounded-full border-4 border-white
                     flex items-center justify-center
                     active:scale-90 transition-all duration-150
                     disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(4px)',
          }}
          aria-label="צלם תמונה"
        />
      </div>
    </div>
  );
}
