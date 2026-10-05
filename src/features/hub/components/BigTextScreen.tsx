import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Mic, Square, Trash2 } from 'lucide-react';
import HapticButton from '../../../components/HapticButton';
import { trackEvent } from '../../../utils/analytics';

// Minimal typing for the Web Speech API — not part of TypeScript's DOM lib
interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}
interface SpeechRecognizer {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognizerCtor = new () => SpeechRecognizer;

function getRecognizerCtor(): SpeechRecognizerCtor | null {
  const w = window as unknown as { SpeechRecognition?: SpeechRecognizerCtor; webkitSpeechRecognition?: SpeechRecognizerCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Shorter text gets bigger letters; long text shrinks so it still fits without much scrolling
function fontSizeFor(length: number) {
  if (length <= 18) return '4.5rem';
  if (length <= 45) return '3.5rem';
  if (length <= 110) return '2.6rem';
  if (length <= 220) return '2rem';
  return '1.6rem';
}

interface Props { onBack: () => void; }

export default function BigTextScreen({ onBack }: Props) {
  const [text, setText]           = useState('');
  const [interim, setInterim]     = useState('');
  const [listening, setListening] = useState(false);
  const [micError, setMicError]   = useState('');
  const [micSupported]            = useState(() => getRecognizerCtor() !== null);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const inputRef      = useRef<HTMLTextAreaElement>(null);
  const displayRef    = useRef<HTMLDivElement>(null);

  useEffect(() => () => recognizerRef.current?.abort(), []);

  // Keep the newest words in view while the text grows
  useEffect(() => {
    const el = displayRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [text, interim]);

  const stopListening = () => recognizerRef.current?.stop();

  const startListening = () => {
    const Ctor = getRecognizerCtor();
    if (!Ctor) return;
    setMicError('');
    inputRef.current?.blur();

    const rec = new Ctor();
    rec.lang = 'he-IL';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalChunk += r[0].transcript;
        else interimChunk += r[0].transcript;
      }
      if (finalChunk) setText(prev => (prev ? `${prev.trimEnd()} ` : '') + finalChunk.trim());
      setInterim(interimChunk);
    };
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      setMicError(
        e.error === 'not-allowed' || e.error === 'service-not-allowed'
          ? 'אין הרשאה למיקרופון. אפשר להקליד במקום.'
          : e.error === 'network'
            ? 'ההקלטה דורשת חיבור לאינטרנט. אפשר להקליד במקום.'
            : 'ההקלטה לא זמינה כרגע. אפשר להקליד במקום.',
      );
    };
    rec.onend = () => { setListening(false); setInterim(''); recognizerRef.current = null; };

    try {
      rec.start();
      recognizerRef.current = rec;
      setListening(true);
      trackEvent('big_text_dictation_started');
    } catch {
      setMicError('ההקלטה לא זמינה כרגע. אפשר להקליד במקום.');
    }
  };

  const clear = () => {
    setText('');
    setInterim('');
    inputRef.current?.focus();
  };

  const shown = [text, interim].filter(Boolean).join(' ');

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <HapticButton
          pressScale={0.9}
          onClick={() => { recognizerRef.current?.abort(); onBack(); }}
          className="flex items-center gap-1.5 text-orange-400 font-bold text-sm"
          aria-label="חזור לתרגום"
        >
          <ArrowRight size={16} />
          חזור
        </HapticButton>
        <h2 className="text-gray-900 dark:text-emt-light font-bold text-base">כתוביות למטופל</h2>
        <HapticButton
          pressScale={0.9}
          onClick={clear}
          disabled={!shown}
          className="flex items-center gap-1.5 text-gray-500 dark:text-emt-muted font-bold text-sm disabled:opacity-30"
          aria-label="נקה טקסט"
        >
          <Trash2 size={16} />
          נקה
        </HapticButton>
      </div>

      {/* Big text — what the patient reads. Tapping it hides the keyboard so the text fills the screen */}
      <div
        ref={displayRef}
        onClick={() => inputRef.current?.blur()}
        className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex"
        aria-live="polite"
      >
        {shown ? (
          <p
            dir="auto"
            className="m-auto w-full text-center font-black leading-tight break-words whitespace-pre-wrap
                       text-gray-900 dark:text-white"
            style={{ fontSize: fontSizeFor(shown.length) }}
          >
            {text}
            {interim && <span className="opacity-50">{text ? ' ' : ''}{interim}</span>}
          </p>
        ) : (
          <p className="m-auto text-center text-gray-400 dark:text-emt-muted text-lg leading-relaxed max-w-xs">
            מה שתקלידו או תאמרו יופיע כאן באותיות גדולות. גם המטופל יכול להקליד תשובה.
          </p>
        )}
      </div>

      {micError && (
        <p role="alert" className="shrink-0 px-4 pb-2 text-sm font-semibold text-red-600 dark:text-red-400 text-center">
          {micError}
        </p>
      )}

      {/* Input row */}
      <div className="shrink-0 flex items-end gap-2 px-3 pt-2 pb-4 border-t border-gray-200 dark:border-emt-border">
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          rows={2}
          dir="auto"
          placeholder="הקלידו כאן..."
          aria-label="טקסט להצגה למטופל"
          className="flex-1 resize-none rounded-2xl border border-gray-300 dark:border-emt-border bg-white dark:bg-emt-gray
                     px-4 py-3 text-lg text-gray-900 dark:text-emt-light placeholder:text-gray-400
                     focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        {micSupported && (
          <HapticButton
            pressScale={0.92}
            onClick={listening ? stopListening : startListening}
            className={`shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-white text-[11px] font-bold
                        ${listening ? 'bg-emt-red animate-pulse' : 'bg-orange-500'}`}
            aria-label={listening ? 'עצור הקלטה' : 'הקלט דיבור'}
            aria-pressed={listening}
          >
            {listening ? <Square size={22} /> : <Mic size={24} />}
            {listening ? 'עצור' : 'הקלט'}
          </HapticButton>
        )}
      </div>
    </div>
  );
}
