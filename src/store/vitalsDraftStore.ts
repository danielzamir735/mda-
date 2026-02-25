import { create } from 'zustand';

interface VitalsDraftState {
  draftHeartRate: string;
  draftBreathing: string;
  setDraftHeartRate: (v: string) => void;
  setDraftBreathing: (v: string) => void;
  clearDraft: () => void;
}

export const useVitalsDraftStore = create<VitalsDraftState>((set) => ({
  draftHeartRate: '',
  draftBreathing: '',
  setDraftHeartRate: (v) => set({ draftHeartRate: v }),
  setDraftBreathing: (v) => set({ draftBreathing: v }),
  clearDraft: () => set({ draftHeartRate: '', draftBreathing: '' }),
}));
