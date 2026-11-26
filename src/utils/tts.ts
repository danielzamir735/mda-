// הקראת טקסט (Text-to-Speech) — Web Speech API.
// חייב להיקרא מתוך מחוות משתמש (לחיצה) כדי לעבוד ב-iOS.
import { useSettingsStore } from '../store/settingsStore';

export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: 'he' | 'en') {
  if (lang === 'en') {
    return voices.find((v) => v.lang === 'en-US') ?? voices.find((v) => v.lang.startsWith('en'));
  }
  return voices.find((v) => v.lang === 'he-IL') ?? voices.find((v) => v.lang.startsWith('he') || v.lang.startsWith('iw'));
}

export function speakEnglish(text: string) {
  try {
    if (!isTtsSupported()) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.75;
    const enVoice = pickVoice(synth.getVoices(), 'en');
    if (enVoice) utterance.voice = enVoice;
    synth.speak(utterance);
  } catch {
    /* TTS לא זמין בדפדפן — הכפתור פשוט לא יקריא */
  }
}

// התראות קוליות של מאמן ההחייאה, בשפת הממשק (עברית או אנגלית). בלי cancel() — התראה
// לא קוטעת את קודמתה, והמטרונום (Web Audio) ממשיך לתקתק במקביל.
export function speakAlert(text: string, lang: 'he' | 'en' = useSettingsStore.getState().language) {
  try {
    if (!isTtsSupported()) return;
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'he-IL';
    utterance.rate = 1;
    utterance.volume = 1;
    const voice = pickVoice(synth.getVoices(), lang);
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  } catch {
    /* TTS לא זמין — נשארות הרטט וההבהוב */
  }
}

/** @deprecated use speakAlert — kept for existing callers */
export const speakHebrew = (text: string) => speakAlert(text, 'he');

// חלק מהדפדפנים טוענים קולות באיחור — קריאה מוקדמת מחממת את הרשימה
export function warmUpVoices() {
  try {
    if (isTtsSupported()) window.speechSynthesis.getVoices();
  } catch {
    /* ignore */
  }
}
