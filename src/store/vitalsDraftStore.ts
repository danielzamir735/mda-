import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VitalsDraftState {
  draftHeartRate: string;
  draftBreathing: string;
  setDraftHeartRate: (v: string) => void;
  setDraftBreathing: (v: string) => void;
  clearDraft: () => void;
}

// Persisted (not just in-memory): an in-progress draft is real user input
// that a crash-triggered reload — or just closing the tab — must not throw
// away.
export const useVitalsDraftStore = create<VitalsDraftState>()(
  persist(
    (set) => ({
      draftHeartRate: '',
      draftBreathing: '',
      setDraftHeartRate: (v) => set({ draftHeartRate: v }),
      setDraftBreathing: (v) => set({ draftBreathing: v }),
      clearDraft: () => set({ draftHeartRate: '', draftBreathing: '' }),
    }),
    { name: 'vitals-draft-store' },
  ),
);
