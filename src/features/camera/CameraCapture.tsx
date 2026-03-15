import { useRef, useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { useCameraStore } from '../../store/cameraStore';

interface Props {
  onClose: () => void;
}

export default function CameraCapture({ onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPhoto = useCameraStore((s) => s.addPhoto);

  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          facingMode: 'environment',
          width: { ideal: 3840 },
          height: { ideal: 2160 },
        },
      })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        // 'playing' fires only when the browser is actually rendering frames
        // — at this point videoWidth/videoHeight are guaranteed > 0
        video.onplaying = () => { if (!cancelled) setReady(true); };
      })
      .catch(() => {
        if (!cancelled) setError('לא ניתן לגשת למצלמה. אנא אשר הרשאה.');
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  function stopAndClose() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    onClose();
  }

  function handleShutter() {
    const video = videoRef.current;
    if (!video || !ready || isDone) return;

    const w = video.videoWidth;
    const h = video.videoHeight;

    if (!w || !h) {
      setError('המצלמה טרם מוכנה. נסה שוב.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 1.0);

    addPhoto(dataUrl);
    setIsDone(true);

    setTimeout(stopAndClose, 700);
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">

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

      {/* Video / Error */}
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

      {/* Shutter button — bottom center */}
      <div className="absolute bottom-10 inset-x-0 flex justify-center">
        {isDone ? (
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
            <Check size={40} strokeWidth={3} className="text-white" />
          </div>
        ) : (
          <button
            onClick={handleShutter}
            disabled={!ready || !!error}
            aria-label="צלם תמונה"
            className="w-20 h-20 rounded-full bg-white
                       active:scale-90 transition-transform duration-100
                       disabled:opacity-40 disabled:cursor-not-allowed"
          />
        )}
      </div>

    </div>
  );
}
