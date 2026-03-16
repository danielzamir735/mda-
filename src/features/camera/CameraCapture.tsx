import { useRef, useEffect, useState, useCallback } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { useCameraStore } from '../../store/cameraStore';

interface Props {
  onClose: () => void;
}

export default function CameraCapture({ onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frozenImage, setFrozenImage] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const addPhoto = useCameraStore((s) => s.addPhoto);

  // Attach stream to video element — called on mount and after retake
  const attachStream = useCallback((stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.onplaying = () => setReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          facingMode: 'environment',
          width: { ideal: 4096 },
          height: { ideal: 2160 },
        },
      })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        attachStream(stream);
      })
      .catch(() => {
        if (!cancelled) setError('לא ניתן לגשת למצלמה. אנא אשר הרשאה.');
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [attachStream]);

  function stopAndClose() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    onClose();
  }

  function handleShutter() {
    const video = videoRef.current;
    if (!video || !ready || frozenImage) return;

    try {
      if (video.readyState !== 4) {
        setError('המצלמה טרם מוכנה. נסה שוב.');
        return;
      }

      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) {
        setError('המצלמה טרם מוכנה. נסה שוב.');
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 1.0);

      // Save immediately to global store, then freeze UI
      addPhoto(dataUrl);
      setFrozenImage(dataUrl);

      // Shutter flash
      setFlash(true);
      setTimeout(() => setFlash(false), 150);
    } catch {
      setError('שגיאה בצילום. נסה שוב.');
    }
  }

  function handleRetake() {
    setFrozenImage(null);
    setError(null);
    // Re-attach the still-running stream to the video element
    // (video was never unmounted, but srcObject may need refresh)
    if (streamRef.current) {
      // Small tick so the overlay is removed before we touch the video
      requestAnimationFrame(() => attachStream(streamRef.current!));
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">

      {/* ── LIVE VIDEO — always mounted so retake works instantly ── */}
      {error ? (
        <div className="flex-1 flex items-center justify-center px-8">
          <p className="text-white text-center text-base leading-relaxed">{error}</p>
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

      {/* ── SHUTTER FLASH ── */}
      {flash && (
        <div className="absolute inset-0 bg-white z-20 pointer-events-none" />
      )}

      {/* ── FROZEN IMAGE OVERLAY ── */}
      {frozenImage && (
        <div className="absolute inset-0 z-10 flex flex-col bg-black">
          <img
            src={frozenImage}
            alt="תמונה שצולמה"
            className="flex-1 w-full object-cover"
          />

          {/* Retake / Confirm bar */}
          <div className="absolute bottom-10 inset-x-0 flex items-center justify-between px-12">
            <button
              onClick={handleRetake}
              aria-label="צלם שוב"
              className="flex flex-col items-center gap-1 text-white active:opacity-70 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <RotateCcw size={24} />
              </div>
              <span className="text-xs font-medium">צלם שוב</span>
            </button>

            <button
              onClick={stopAndClose}
              aria-label="השתמש בתמונה"
              className="flex flex-col items-center gap-1 text-white active:opacity-70 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
                <Check size={28} strokeWidth={3} />
              </div>
              <span className="text-xs font-medium">אישור</span>
            </button>
          </div>
        </div>
      )}

      {/* ── VIEWFINDER CONTROLS (hidden while frozen) ── */}
      {!frozenImage && (
        <>
          {/* X — top right */}
          <button
            onClick={stopAndClose}
            aria-label="סגור מצלמה"
            className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full
                       bg-black/60 backdrop-blur-sm border border-white/20
                       flex items-center justify-center text-white
                       active:scale-90 transition-transform"
          >
            <X size={22} />
          </button>

          {/* Shutter button — bottom center */}
          <div className="absolute bottom-10 inset-x-0 flex justify-center z-10">
            <button
              onClick={handleShutter}
              disabled={!ready || !!error}
              aria-label="צלם תמונה"
              className="w-20 h-20 rounded-full border-4 border-white bg-white/10
                         active:scale-90 transition-transform duration-100
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="block w-full h-full rounded-full bg-white" />
            </button>
          </div>
        </>
      )}

    </div>
  );
}
