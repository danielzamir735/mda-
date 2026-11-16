import type { FlashcardItem } from '../../../components/FlashcardTrainer';

// Medical content for the "memory drill" in the simulators screen. Stays Hebrew
// for now, like the other files in this folder (see THEME_I18N_PLAN.md, session 10).
export const SIMULATOR_FLASHCARDS: FlashcardItem[] = [
  { front: 'קצב לחיצות CPR', back: '100–120 לחיצות לדקה' },
  { front: 'עומק לחיצות CPR — מבוגר', back: '5–6 ס"מ' },
  { front: 'עומק לחיצות CPR — ילד (מעל גיל שנה)', back: '≈ 5 ס"מ (שליש עומק החזה)' },
  { front: 'יחס לחיצות:נשימות — מחייה אחד', back: '30:2' },
  { front: 'יחס לחיצות:נשימות — שני מחיים (ילד)', back: '15:2' },
  { front: 'קצבים בעלי דפיברילציה', back: 'VF · pVT (פרפור חדרים / טכיקרדיה חדרית ללא דופק)' },
  { front: 'אנרגיה ראשונה לדפיברילציה (דו-פאזי)', back: '150–200 ג\'ול (לפי הוראת היצרן)' },
  { front: 'כל כמה זמן מזריקים אדרנלין ב-CPR?', back: 'כל 3–5 דקות (1 מ"ג IV/IO)' },
  { front: 'אינדיקציה ל-RSI בשדה', back: 'חסימת דרכי אוויר, GCS ≤ 8, נשימה לא מספיקה' },
  { front: 'ציון APGAR — 5 פרמטרים', back: 'Appearance · Pulse · Grimace · Activity · Respiration' },
  { front: 'מהו שוק חסימתי (Obstructive Shock)?', back: 'חסימה פיזית לזרימת דם: טמפונדה, פנאומוטורקס מתח, תסחיף ריאתי' },
  { front: 'טריאס בק — סימני טמפונדה', back: 'צלילות לב מופחתת · ורידי צוואר נפוחים · לחץ דם נמוך' },
  { front: 'Glasgow Coma Scale — טווח', back: '3 (מינימום) עד 15 (תקין)' },
  { front: 'סימני שוק — 5 עיקריים', back: 'דופק מהיר וחלש · לחץ דם נמוך · חיוורון/הזעה · בלבול · שתן מועט' },
  { front: 'מינון אסקורין (Aspirin) ב-ACS', back: '300 מ"ג ללעיסה' },
];
