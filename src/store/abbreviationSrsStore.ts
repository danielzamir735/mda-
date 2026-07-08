import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Spaced Repetition (שיטת Leitner מפושטת) עבור רובריקת "מושגים רפואיים".
// כל מושג נמצא ב"קופסה" 0–3: "לא זכרתי" מוריד קופסה (יופיע בתדירות גבוהה יותר),
// "זכרתי" מעלה קופסה. ההתקדמות נשמרת ב-localStorage בין אימונים.

export const MAX_BOX = 3;

export interface TermProgress {
  /** 0 = קשה (מוצג הכי הרבה) · 3 = שולט (מוצג הכי מעט) */
  box: number;
  correct: number;
  wrong: number;
  lastReviewed: number;
}

interface AbbreviationSrsState {
  progress: Record<string, TermProgress>;
  markRemembered: (id: string) => void;
  markForgotten: (id: string) => void;
  resetProgress: () => void;
}

const emptyProgress = (): TermProgress => ({ box: 0, correct: 0, wrong: 0, lastReviewed: 0 });

export const useAbbreviationSrsStore = create<AbbreviationSrsState>()(
  persist(
    (set) => ({
      progress: {},
      markRemembered: (id) =>
        set((s) => {
          const current = s.progress[id] ?? emptyProgress();
          return {
            progress: {
              ...s.progress,
              [id]: {
                ...current,
                box: Math.min(MAX_BOX, current.box + 1),
                correct: current.correct + 1,
                lastReviewed: Date.now(),
              },
            },
          };
        }),
      markForgotten: (id) =>
        set((s) => {
          const current = s.progress[id] ?? emptyProgress();
          return {
            progress: {
              ...s.progress,
              [id]: {
                ...current,
                box: Math.max(0, current.box - 1),
                wrong: current.wrong + 1,
                lastReviewed: Date.now(),
              },
            },
          };
        }),
      resetProgress: () => set({ progress: {} }),
    }),
    { name: 'medical-abbr-srs-storage' },
  ),
);
