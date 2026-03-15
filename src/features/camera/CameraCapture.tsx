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
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    let active = true;

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 4096 }, height: { ideal: 2160 } },
        audio: false,
      })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => setError('לא ניתן לגשת למצלמה. אנא אשר הרשאה.'));

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const handleClose = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    onClose();
  };

  const handleCapture = () => {
    if (!videoRef.current || !ready || captured) return;

    // (a) Draw at native resolution
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 1.0);

    // (b) Save to gallery
    onPhoto(dataUrl);

    // (c) Show green checkmark
    setCaptured(true);

    // (d) Auto-close after exactly 700ms
    setTimeout(() => {
      handleClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full
                   bg-black/60 backdrop-blur-sm border border-white/20
                   flex items-center justify-center text-white
                   active:scale-90 transition-transform"
        aria-label="סגור מצלמה"
      >
        <X size={22} />
      </button>

      {/* Video feed or error */}
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

      {/* Shutter button */}
      <div className="absolute bottom-10 inset-x-0 flex justify-center">
        {!captured ? (
          <button
            onClick={handleCapture}
            disabled={!ready || !!error}
            className="w-20 h-20 rounded-full bg-white
                       flex items-center justify-center
                       active:scale-90 transition-transform duration-150
                       disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="צלם תמונה"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full bg-green-500
                       flex items-center justify-center"
          >
            <Check size={38} strokeWidth={3} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
