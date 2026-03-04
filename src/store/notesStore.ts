import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

interface NotesState {
  notes: Note[];
  addNote: () => string;
  updateNote: (id: string, title: string, content: string) => void;
  deleteNote: (id: string) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      addNote: () => {
        const id = Date.now().toString();
        set((s) => ({
          notes: [...s.notes, { id, title: '', content: '', updatedAt: Date.now() }],
        }));
        return id;
      },
      updateNote: (id, title, content) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, title, content, updatedAt: Date.now() } : n
          ),
        })),
      deleteNote: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
    }),
    { name: 'notes-storage' },
  ),
);
