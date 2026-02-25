import { create } from 'zustand';

export interface Photo {
  dataUrl: string;
  timestamp: string;
}

interface CameraState {
  photos: Photo[];
  addPhoto: (dataUrl: string) => void;
  removePhoto: (index: number) => void;
}

function formatTimestamp(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y} ${h}:${min}`;
}

export const useCameraStore = create<CameraState>((set) => ({
  photos: [],
  addPhoto: (dataUrl) => {
    const timestamp = formatTimestamp(new Date());
    set((state) => ({ photos: [...state.photos, { dataUrl, timestamp }] }));
  },
  removePhoto: (index) =>
    set((state) => ({ photos: state.photos.filter((_, i) => i !== index) })),
}));
