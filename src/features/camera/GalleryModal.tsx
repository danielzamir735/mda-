import { X, Trash2, Images } from 'lucide-react';
import { useCameraStore } from '../../store/cameraStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function GalleryModal({ isOpen, onClose }: Props) {
  const { photos, removePhoto } = useCameraStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-emt-dark/95 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4
                      border-b border-white/10 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center
                     text-emt-light/70 hover:text-emt-light active:scale-90 transition-all"
          aria-label="סגור"
        >
          <X size={18} />
        </button>
        <h2 className="text-emt-light font-bold text-base">תמונות</h2>
        <div className="w-9" />
      </div>

      {/* Content */}
      {photos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-emt-light/30">
          <Images size={52} strokeWidth={1.2} />
          <p className="text-sm">אין תמונות שמורות</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-3 overflow-y-auto flex-1">
          {photos.map((photo, i) => (
            <div key={i} className="relative rounded-2xl overflow-hidden aspect-[4/3]
                                   bg-white/5 border border-white/10">
              <img
                src={photo}
                alt={`תמונה ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full
                           bg-black/60 backdrop-blur-sm
                           flex items-center justify-center text-white
                           active:scale-90 transition-transform"
                aria-label={`מחק תמונה ${i + 1}`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
