import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  /** null / undefined = uncategorized ("כללי") */
  folderId?: string | null;
}

export interface NoteFolder {
  id: string;
  name: string;
  createdAt: number;
}

interface NotesState {
  notes: Note[];
  folders: NoteFolder[];
  addNote: (folderId?: string | null) => string;
  updateNote: (id: string, title: string, content: string) => void;
  deleteNote: (id: string) => void;
  moveNote: (id: string, folderId: string | null) => void;
  addFolder: (name: string) => string;
  renameFolder: (id: string, name: string) => void;
  /** Deletes the folder; its notes fall back to uncategorized. */
  deleteFolder: (id: string) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      folders: [],
      addNote: (folderId = null) => {
        const id = Date.now().toString();
        set((s) => ({
          notes: [...s.notes, { id, title: '', content: '', updatedAt: Date.now(), folderId }],
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
      moveNote: (id, folderId) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, folderId, updatedAt: Date.now() } : n
          ),
        })),
      addFolder: (name) => {
        const id = `f${Date.now()}`;
        set((s) => ({
          folders: [...s.folders, { id, name: name.trim() || 'קבוצה', createdAt: Date.now() }],
        }));
        return id;
      },
      renameFolder: (id, name) =>
        set((s) => ({
          folders: s.folders.map((f) =>
            f.id === id ? { ...f, name: name.trim() || f.name } : f
          ),
        })),
      deleteFolder: (id) =>
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          notes: s.notes.map((n) => (n.folderId === id ? { ...n, folderId: null } : n)),
        })),
    }),
    { name: 'notes-storage' },
  ),
);
