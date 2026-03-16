import { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useCameraStore } from '../../store/cameraStore';

interface Props {
  onClose: () => void;
}

export default function CameraCapture({ onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frozenImage, setFrozenImage] = useState<string | null>(null);

  const addPhoto = useCameraStore((s) => s.addPhoto);

  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
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

  function handleShutter() {
    const video = videoRef.current;
    if (!video || frozenImage) return;
    if (video.readyState !== 4) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    addPhoto(dataUrl);
    setFrozenImage(dataUrl);
    setTimeout(() => setFrozenImage(null), 500);
  }

  function handleClose() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">

      {/* Video — always mounted and playing */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="flex-1 w-full object-cover"
      />

      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center px-8 z-10">
          <p className="text-white text-center text-base leading-relaxed">{error}</p>
        </div>
      )}

      {/* Frozen image overlay — sits on top for 500ms then gone */}
      {frozenImage && (
        <img
          src={frozenImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-50 pointer-events-none"
        />
      )}

      {/* X — top right */}
      <button
        onClick={handleClose}
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
          disabled={!!error}
          aria-label="צלם תמונה"
          className="w-20 h-20 rounded-full border-4 border-white bg-white/10
                     active:scale-90 transition-transform duration-100
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="block w-full h-full rounded-full bg-white" />
        </button>
      </div>

    </div>
  );
}
