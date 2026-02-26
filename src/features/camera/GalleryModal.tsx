import { useState } from 'react';
import { X, Trash2, Images, Download, ChevronRight, ChevronLeft } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { useCameraStore } from '../../store/cameraStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function GalleryModal({ isOpen, onClose }: Props) {
  const { photos, removePhoto } = useCameraStore();
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  // Close fullscreen on back, then close gallery on a second back press.
  useModalBackHandler(isOpen, onClose);
  useModalBackHandler(fullscreenIndex !== null, () => setFullscreenIndex(null));

  if (!isOpen) return null;

  const handleSave = (dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `mda-photo-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const goNext = () => {
    if (fullscreenIndex === null) return;
    setFullscreenIndex((fullscreenIndex + 1) % photos.length);
  };

  const goPrev = () => {
    if (fullscreenIndex === null) return;
    setFullscreenIndex((fullscreenIndex - 1 + photos.length) % photos.length);
  };

  return (
    <>
      {/* ── Gallery grid ── */}
      <div className="fixed inset-0 z-50 flex flex-col bg-emt-dark">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4
                        border-b border-emt-border shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-emt-gray border border-emt-border
                       flex items-center justify-center
                       text-emt-muted hover:text-emt-light active:scale-90 transition-all"
            aria-label="סגור"
          >
            <X size={18} />
          </button>
          <h2 className="text-emt-light font-black text-lg">תמונות</h2>
          <div className="w-9" />
        </div>

        {/* Content */}
        {photos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-emt-border">
            <Images size={52} strokeWidth={1.2} />
            <p className="text-sm text-emt-muted">אין תמונות שמורות</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-3 overflow-y-auto flex-1">
            {photos.map((photo, i) => (
              <div
                key={i}
                className="flex flex-col gap-1"
              >
                <div
                  className="relative rounded-2xl overflow-hidden aspect-[4/3]
                             bg-emt-gray border border-emt-border cursor-pointer
                             active:scale-95 transition-transform duration-150"
                  onClick={() => setFullscreenIndex(i)}
                >
                  <img
                    src={photo.dataUrl}
                    alt={`תמונה ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full
                               bg-black/60 border border-white/20
                               flex items-center justify-center text-white
                               active:scale-90 transition-transform"
                    aria-label={`מחק תמונה ${i + 1}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {/* Timestamp */}
                <p className="text-emt-muted text-[0.65rem] font-medium text-center px-1 leading-tight">
                  {photo.timestamp}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Fullscreen photo viewer ── */}
      {fullscreenIndex !== null && photos[fullscreenIndex] && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black">
          {/* Top bar */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3
                          bg-black/80 border-b border-white/10">
            <button
              onClick={() => setFullscreenIndex(null)}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/20
                         flex items-center justify-center text-white
                         active:scale-90 transition-transform"
              aria-label="חזור לגלריה"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center gap-0.5">
              <span className="text-white/60 text-sm font-medium">
                {fullscreenIndex + 1} / {photos.length}
              </span>
              <span className="text-white/40 text-xs">
                {photos[fullscreenIndex].timestamp}
              </span>
            </div>

            <button
              onClick={() => handleSave(photos[fullscreenIndex].dataUrl)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl
                         bg-emt-green border border-green-600
                         text-white font-bold text-sm
                         active:scale-95 transition-transform"
              aria-label="שמור לגלריה"
            >
              <Download size={16} />
              שמור לגלריה
            </button>
          </div>

          {/* Photo */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <img
              src={photos[fullscreenIndex].dataUrl}
              alt={`תמונה ${fullscreenIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {photos.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute right-2 top-1/2 -translate-y-1/2
                             w-10 h-10 rounded-full bg-black/60 border border-white/20
                             flex items-center justify-center text-white
                             active:scale-90 transition-transform"
                  aria-label="תמונה קודמת"
                >
                  <ChevronRight size={22} />
                </button>
                <button
                  onClick={goNext}
                  className="absolute left-2 top-1/2 -translate-y-1/2
                             w-10 h-10 rounded-full bg-black/60 border border-white/20
                             flex items-center justify-center text-white
                             active:scale-90 transition-transform"
                  aria-label="תמונה הבאה"
                >
                  <ChevronLeft size={22} />
                </button>
              </>
            )}
          </div>

          {/* Bottom bar — delete */}
          <div className="shrink-0 flex justify-center px-4 py-4 bg-black/80 border-t border-white/10">
            <button
              onClick={() => {
                removePhoto(fullscreenIndex);
                if (photos.length <= 1) {
                  setFullscreenIndex(null);
                } else {
                  setFullscreenIndex(Math.min(fullscreenIndex, photos.length - 2));
                }
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl
                         bg-red-600/20 border border-red-500/40
                         text-red-400 font-bold text-sm
                         active:scale-95 transition-transform"
              aria-label="מחק תמונה"
            >
              <Trash2 size={16} />
              מחק תמונה
            </button>
          </div>
        </div>
      )}
    </>
  );
}
