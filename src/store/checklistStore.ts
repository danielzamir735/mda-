import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CustomItem {
  id: string;
  category: string;
  name: string;
}

interface ChecklistState {
  checkedItems: Record<string, boolean>;
  hiddenItems: Record<string, boolean>;
  customItems: CustomItem[];
  toggleItem: (id: string) => void;
  clearChecklist: () => void;
  toggleItemVisibility: (id: string) => void;
  addCustomItem: (category: string, name: string) => void;
  removeCustomItem: (id: string) => void;
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set) => ({
      checkedItems: {},
      hiddenItems: {},
      customItems: [],

      toggleItem: (id) =>
        set((state) => ({
          checkedItems: { ...state.checkedItems, [id]: !state.checkedItems[id] },
        })),

      // Only resets checked state — hiddenItems and customItems are intentionally preserved
      clearChecklist: () => set({ checkedItems: {} }),

      toggleItemVisibility: (id) =>
        set((state) => ({
          hiddenItems: { ...state.hiddenItems, [id]: !state.hiddenItems[id] },
        })),

      addCustomItem: (category, name) =>
        set((state) => ({
          customItems: [
            ...state.customItems,
            {
              id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
              category,
              name,
            },
          ],
        })),

      removeCustomItem: (id) =>
        set((state) => ({
          customItems: state.customItems.filter((ci) => ci.id !== id),
        })),
    }),
    { name: 'checklist-storage' },
  ),
);
