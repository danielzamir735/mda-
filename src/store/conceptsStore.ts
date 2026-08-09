import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Concept {
  id: string;
  term: string;
  definition: string;
  createdAt: number;
  categoryId?: string | null;
}

export interface ConceptCategory {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

interface ConceptsState {
  concepts: Concept[];
  categories: ConceptCategory[];
  addConcept: (term: string, definition: string, categoryId?: string | null) => void;
  deleteConcept: (id: string) => void;
  updateConcept: (id: string, term: string, definition: string, categoryId?: string | null) => void;
  setConceptCategory: (id: string, categoryId: string | null) => void;
  addCategory: (name: string, color: string) => string;
  renameCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
}

export const useConceptsStore = create<ConceptsState>()(
  persist(
    (set) => ({
      concepts: [],
      categories: [],
      addConcept: (term, definition, categoryId = null) =>
        set((s) => ({
          concepts: [
            { id: Date.now().toString(), term: term.trim(), definition: definition.trim(), createdAt: Date.now(), categoryId },
            ...s.concepts,
          ],
        })),
      deleteConcept: (id) =>
        set((s) => ({ concepts: s.concepts.filter((c) => c.id !== id) })),
      updateConcept: (id, term, definition, categoryId) =>
        set((s) => ({
          concepts: s.concepts.map((c) =>
            c.id === id
              ? { ...c, term: term.trim(), definition: definition.trim(), ...(categoryId !== undefined ? { categoryId } : {}) }
              : c
          ),
        })),
      setConceptCategory: (id, categoryId) =>
        set((s) => ({
          concepts: s.concepts.map((c) => (c.id === id ? { ...c, categoryId } : c)),
        })),
      addCategory: (name, color) => {
        const id = `cat_${Date.now().toString()}`;
        set((s) => ({
          categories: [...s.categories, { id, name: name.trim(), color, createdAt: Date.now() }],
        }));
        return id;
      },
      renameCategory: (id, name) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, name: name.trim() } : c)),
        })),
      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          concepts: s.concepts.map((c) => (c.categoryId === id ? { ...c, categoryId: null } : c)),
        })),
    }),
    { name: 'concepts-storage' },
  ),
);
