// סטטיסטיקת אימוני שינון (Flashcards) — נצברת ב-localStorage לפי מפתח לכל מאגר.

export interface FlashcardStats {
  sessions: number;
  remembered: number;
  forgotten: number;
  lastCompleted?: string;
}

const EMPTY_STATS: FlashcardStats = { sessions: 0, remembered: 0, forgotten: 0 };

export function readFlashcardStats(key: string): FlashcardStats {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...EMPTY_STATS, ...JSON.parse(raw) };
  } catch { /* corrupt/unavailable storage — fall through to empty */ }
  return { ...EMPTY_STATS };
}

export function updateFlashcardStats(key: string, patch: Partial<FlashcardStats>) {
  try {
    const current = readFlashcardStats(key);
    localStorage.setItem(key, JSON.stringify({
      ...current,
      ...patch,
      sessions: current.sessions + (patch.sessions ?? 0),
      remembered: current.remembered + (patch.remembered ?? 0),
      forgotten: current.forgotten + (patch.forgotten ?? 0),
    }));
  } catch { /* storage unavailable — stats are best-effort */ }
}
