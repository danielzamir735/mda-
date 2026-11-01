import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Personal debrief after a hard call — stored on the device only (localStorage), never sent anywhere.

export interface DebriefEntry {
  id: string;
  createdAt: number;
  what: string;     // מה קרה
  didWell: string;  // מה עשיתי טוב
  onMind: string;   // מה מעסיק אותי
}

interface DebriefState {
  entries: DebriefEntry[];
  supportName: string;
  supportPhone: string;
  addEntry: (data: Omit<DebriefEntry, 'id' | 'createdAt'>) => void;
  deleteEntry: (id: string) => void;
  deleteAll: () => void;
  setSupport: (name: string, phone: string) => void;
}

export const useDebriefStore = create<DebriefState>()(
  persist(
    (set) => ({
      entries: [],
      supportName: '',
      supportPhone: '',
      addEntry: (data) =>
        set((state) => ({ entries: [{ ...data, id: crypto.randomUUID(), createdAt: Date.now() }, ...state.entries] })),
      deleteEntry: (id) => set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
      deleteAll: () => set({ entries: [] }),
      setSupport: (supportName, supportPhone) => set({ supportName, supportPhone }),
    }),
    { name: 'debrief-store' },
  ),
);
