import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotesState {
  noteText: string;
  setNoteText: (text: string) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      noteText: '',
      setNoteText: (text) => set({ noteText: text }),
    }),
    { name: 'notes-storage' },
  ),
);
