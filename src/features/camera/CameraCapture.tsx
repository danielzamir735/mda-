import { useRef, useEffect, useState, useCallback } from 'react';
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

  // Start camera stream
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
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play().then(() => setReady(true)).catch(() => setReady(true));
          };
        }
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

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    stopStream();
    onClose();
  }, [stopStream, onClose]);

  const handleShutter = useCallback(() => {
    const video = videoRef.current;
    if (!video || !ready || isDone) return;

    try {
      // a) Canvas at native stream resolution
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // b) Draw current frame
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas context unavailable');
      ctx.drawImage(video, 0, 0);

      // c) High-quality JPEG dataURL
      const dataUrl = canvas.toDataURL('image/jpeg', 1.0);

      // d) Save to global images state
      addPhoto(dataUrl);

      // e) Mark capture as done → show green checkmark
      setIsDone(true);

      // f) Stop stream and close after 700ms
      setTimeout(() => {
        stopStream();
        onClose();
      }, 700);
    } catch (err) {
      console.error('Capture failed:', err);
      setError('שגיאה בצילום. נסה שוב.');
    }
  }, [ready, isDone, addPhoto, stopStream, onClose]);

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col overflow-hidden">

      {/* Close (X) button — top right */}
      <button
        onClick={handleClose}
        aria-label="סגור מצלמה"
        className="absolute top-4 right-4 z-10
                   w-11 h-11 rounded-full
                   bg-black/60 backdrop-blur-sm border border-white/20
                   flex items-center justify-center text-white
                   active:scale-90 transition-transform"
      >
        <X size={22} />
      </button>

      {/* Video feed */}
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

      {/* Shutter / Done button — bottom center */}
      <div className="absolute bottom-10 inset-x-0 flex justify-center pointer-events-none">
        {isDone ? (
          /* Solid green circle with white checkmark */
          <div
            className="w-20 h-20 rounded-full bg-green-500
                       flex items-center justify-center"
          >
            <Check size={40} strokeWidth={3} className="text-white" />
          </div>
        ) : (
          /* Large white solid shutter button */
          <button
            onClick={handleShutter}
            disabled={!ready || !!error}
            aria-label="צלם תמונה"
            className="pointer-events-auto
                       w-20 h-20 rounded-full bg-white
                       active:scale-90 transition-transform duration-100
                       disabled:opacity-40 disabled:cursor-not-allowed"
          />
        )}
      </div>
    </div>
  );
}
