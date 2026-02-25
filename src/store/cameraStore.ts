import { create } from 'zustand';

interface CameraState {
  photos: string[];
  addPhoto: (dataUrl: string) => void;
  removePhoto: (index: number) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  photos: [],
  addPhoto: (dataUrl) => set((state) => ({ photos: [...state.photos, dataUrl] })),
  removePhoto: (index) =>
    set((state) => ({ photos: state.photos.filter((_, i) => i !== index) })),
}));
