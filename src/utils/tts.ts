// הקראת קיצורים באנגלית (Text-to-Speech) — Web Speech API.
// חייב להיקרא מתוך מחוות משתמש (לחיצה) כדי לעבוד ב-iOS.

export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakEnglish(text: string) {
  try {
    if (!isTtsSupported()) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.75;
    const voices = synth.getVoices();
    const enVoice =
      voices.find((v) => v.lang === 'en-US') ?? voices.find((v) => v.lang.startsWith('en'));
    if (enVoice) utterance.voice = enVoice;
    synth.speak(utterance);
  } catch {
    /* TTS לא זמין בדפדפן — הכפתור פשוט לא יקריא */
  }
}

// התראות קוליות בעברית (מאמן ההחייאה). בלי cancel() — התראה לא קוטעת את קודמתה,
// והמטרונום (Web Audio) ממשיך לתקתק במקביל.
export function speakHebrew(text: string) {
  try {
    if (!isTtsSupported()) return;
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'he-IL';
    utterance.rate = 1;
    utterance.volume = 1;
    const voices = synth.getVoices();
    const heVoice = voices.find((v) => v.lang === 'he-IL') ?? voices.find((v) => v.lang.startsWith('he') || v.lang.startsWith('iw'));
    if (heVoice) utterance.voice = heVoice;
    synth.speak(utterance);
  } catch {
    /* TTS לא זמין — נשארות הרטט וההבהוב */
  }
}

// חלק מהדפדפנים טוענים קולות באיחור — קריאה מוקדמת מחממת את הרשימה
export function warmUpVoices() {
  try {
    if (isTtsSupported()) window.speechSynthesis.getVoices();
  } catch {
    /* ignore */
  }
}
