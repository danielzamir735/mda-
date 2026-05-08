import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Concept {
  id: string;
  term: string;
  definition: string;
  createdAt: number;
}

interface ConceptsState {
  concepts: Concept[];
  addConcept: (term: string, definition: string) => void;
  deleteConcept: (id: string) => void;
  updateConcept: (id: string, term: string, definition: string) => void;
}

export const useConceptsStore = create<ConceptsState>()(
  persist(
    (set) => ({
      concepts: [],
      addConcept: (term, definition) =>
        set((s) => ({
          concepts: [
            { id: Date.now().toString(), term: term.trim(), definition: definition.trim(), createdAt: Date.now() },
            ...s.concepts,
          ],
        })),
      deleteConcept: (id) =>
        set((s) => ({ concepts: s.concepts.filter((c) => c.id !== id) })),
      updateConcept: (id, term, definition) =>
        set((s) => ({
          concepts: s.concepts.map((c) =>
            c.id === id ? { ...c, term: term.trim(), definition: definition.trim() } : c
          ),
        })),
    }),
    { name: 'concepts-storage' },
  ),
);
