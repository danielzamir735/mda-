import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChecklistState {
  checkedItems: Record<string, boolean>;
  toggleItem: (id: string) => void;
  clearChecklist: () => void;
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set) => ({
      checkedItems: {},
      toggleItem: (id) =>
        set((state) => ({
          checkedItems: {
            ...state.checkedItems,
            [id]: !state.checkedItems[id],
          },
        })),
      clearChecklist: () => set({ checkedItems: {} }),
    }),
    { name: 'checklist-storage' },
  ),
);
