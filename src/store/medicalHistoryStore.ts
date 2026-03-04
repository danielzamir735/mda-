import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomMedicalItem {
  id: string;
  he: string;
  en: string;
}

interface MedicalHistoryState {
  customItems: CustomMedicalItem[];
  addItem: (he: string, en: string) => void;
  removeItem: (id: string) => void;
}

export const useMedicalHistoryStore = create<MedicalHistoryState>()(
  persist(
    (set) => ({
      customItems: [],
      addItem: (he, en) =>
        set((s) => ({
          customItems: [
            ...s.customItems,
            { id: Date.now().toString(), he, en },
          ],
        })),
      removeItem: (id) =>
        set((s) => ({ customItems: s.customItems.filter((i) => i.id !== id) })),
    }),
    { name: 'medical-history-custom' },
  ),
);
