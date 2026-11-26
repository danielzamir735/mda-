import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Mic, Square, Trash2 } from 'lucide-react';
import HapticButton from '../../../components/HapticButton';
import { trackEvent } from '../../../utils/analytics';
import { useTranslation, useLanguage } from '../../../i18n';

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
  const t = useTranslation();
  const { isEn } = useLanguage();
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
    rec.lang = isEn ? 'en-US' : 'he-IL';
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
          ? t('btMicDenied')
          : e.error === 'network'
            ? t('btMicNetwork')
            : t('btMicUnavailable'),
      );
    };
    rec.onend = () => { setListening(false); setInterim(''); recognizerRef.current = null; };

    try {
      rec.start();
      recognizerRef.current = rec;
      setListening(true);
      trackEvent('big_text_dictation_started');
    } catch {
      setMicError(t('btMicUnavailable'));
    }
  };

  const clear = () => {
    setText('');
    setInterim('');
    inputRef.current?.focus();
  };

  const shown = [text, interim].filter(Boolean).join(' ');

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-page">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <HapticButton
          pressScale={0.9}
          onClick={() => { recognizerRef.current?.abort(); onBack(); }}
          className="flex items-center gap-1.5 text-orange-700 dark:text-orange-400 font-bold text-sm"
          aria-label={t('btBackAria')}
        >
          <ArrowRight size={16} className="ltr:rotate-180" />
          {t('back')}
        </HapticButton>
        <h2 className="text-fg font-bold text-base">{t('btTitle')}</h2>
        <HapticButton
          pressScale={0.9}
          onClick={clear}
          disabled={!shown}
          className="flex items-center gap-1.5 text-fg-muted font-bold text-sm disabled:opacity-30"
          aria-label={t('btClearAria')}
        >
          <Trash2 size={16} />
          {t('clear')}
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
                       text-fg"
            style={{ fontSize: fontSizeFor(shown.length) }}
          >
            {text}
            {interim && <span className="opacity-50">{text ? ' ' : ''}{interim}</span>}
          </p>
        ) : (
          <p className="m-auto text-center text-fg-subtle text-lg leading-relaxed max-w-xs">
            {t('btEmpty')}
          </p>
        )}
      </div>

      {micError && (
        <p role="alert" className="shrink-0 px-4 pb-2 text-sm font-semibold text-red-700 dark:text-red-400 text-center">
          {micError}
        </p>
      )}

      {/* Input row */}
      <div className="shrink-0 flex items-end gap-2 px-3 pt-2 pb-4 border-t border-line">
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          rows={2}
          dir="auto"
          placeholder={t('btPlaceholder')}
          aria-label={t('btInputAria')}
          className="flex-1 resize-none rounded-2xl border border-line-strong bg-surface
                     px-4 py-3 text-lg text-fg placeholder:text-fg-subtle
                     focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        {micSupported && (
          <HapticButton
            pressScale={0.92}
            onClick={listening ? stopListening : startListening}
            // theme-ok: white on the orange/red record button
            className={`shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-white text-[11px] font-bold
                        ${listening ? 'bg-emt-red animate-pulse' : 'bg-orange-500'}`}
            aria-label={listening ? t('btStopRec') : t('btRecord')}
            aria-pressed={listening}
          >
            {listening ? <Square size={22} /> : <Mic size={24} />}
            {listening ? t('stop') : t('btRecordShort')}
          </HapticButton>
        )}
      </div>
    </div>
  );
}
