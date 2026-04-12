import { useState, useEffect, useRef } from 'react';
import { X, Languages, Volume2, ArrowRight, ExternalLink } from 'lucide-react';
import HapticButton from '../../../components/HapticButton';
import {
  PHRASES, CATEGORIES, LANG_FLAGS, LANG_DIR,
  type Lang,
} from '../data/medicalTranslationsData';
import { trackEvent, trackInteraction } from '../../../utils/analytics';

interface Props { isOpen: boolean; onClose: () => void; initialLang?: Lang; }

const ALL_LANGS: Lang[] = ['en', 'ru', 'ar', 'fr', 'am'];

const TTS_LANGS: Record<string, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  ar: 'ar-SA',
  fr: 'fr-FR',
  am: 'am-ET',
};

// Task 4: Hebrew names for the language selection grid
const LANG_LABELS_HE: Record<Lang, string> = {
  en: 'אנגלית',
  ru: 'רוסית',
  ar: 'ערבית',
  fr: 'צרפתית',
  am: 'אמהרית',
};

export default function MedicalTranslatorModal({ isOpen, onClose, initialLang }: Props) {
  const [selectedLang, setSelectedLang] = useState<Lang | null>(initialLang ?? null);
  const [category, setCategory] = useState('הכל');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Refs for popstate handler — avoids stale closures
  const selectedLangRef = useRef<Lang | null>(null);
  const expandedRef = useRef<string | null>(null);
  const onCloseRef = useRef(onClose);
  // Tracks how many history entries this modal has pushed
  const pushCountRef = useRef(0);
  selectedLangRef.current = selectedLang;
  expandedRef.current = expanded;
  onCloseRef.current = onClose;

  const speakText = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) {
      alert('מנוע דיבור אינו נתמך במכשיר זה');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = TTS_LANGS[langCode] || 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Task 2: Stop audio immediately when closing the fullscreen phrase view
  const handleCloseExpanded = () => {
    window.speechSynthesis.cancel();
    setExpanded(null);
  };

  const handleClose = () => {
    window.speechSynthesis.cancel();
    setSelectedLang(null);
    setCategory('הכל');
    setExpanded(null);
    onClose();
  };

  // Sync selectedLang to initialLang when modal opens
  useEffect(() => {
    if (isOpen) setSelectedLang(initialLang ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Task 1: Step-by-step hardware back button
  // Push base history entry when modal opens; register popstate handler
  useEffect(() => {
    if (!isOpen) return;

    pushCountRef.current = 1;
    window.history.pushState({ mtLevel: 'base' }, '');

    const handlePopState = () => {
      pushCountRef.current = Math.max(0, pushCountRef.current - 1);
      if (expandedRef.current !== null) {
        // Fullscreen phrase → back to phrase list
        window.speechSynthesis.cancel();
        setExpanded(null);
      } else if (selectedLangRef.current !== null) {
        // Phrase list → back to language list
        setSelectedLang(null);
        setCategory('הכל');
      } else {
        // Language list → close modal
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Pop any remaining history entries when modal closes programmatically
      if (pushCountRef.current > 0) {
        window.history.go(-pushCountRef.current);
        pushCountRef.current = 0;
      }
    };
  }, [isOpen]);

  // Push history entry when a language is selected (phrase list level)
  useEffect(() => {
    if (!isOpen || selectedLang === null) return;
    pushCountRef.current++;
    window.history.pushState({ mtLevel: 'lang' }, '');
  }, [selectedLang, isOpen]);

  // Push history entry when a phrase is expanded (fullscreen level)
  useEffect(() => {
    if (!isOpen || expanded === null) return;
    pushCountRef.current++;
    window.history.pushState({ mtLevel: 'phrase' }, '');
  }, [expanded, isOpen]);

  if (!isOpen) return null;

  const filtered = category === 'הכל' ? PHRASES : PHRASES.filter(p => p.category === category);
  const expandedPhrase = PHRASES.find(p => p.id === expanded);


  /* ── STEP 1: Language Selection ── */
  if (selectedLang === null) {
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col bg-gray-50 dark:bg-emt-dark">
        {/* Header */}
        <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
          <div className="flex items-center gap-2">
            <Languages size={20} className="text-orange-400" />
            <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">תרגום רפואי</h2>
          </div>
          <HapticButton
            onClick={handleClose}
            pressScale={0.88}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                       flex items-center justify-center text-gray-500 dark:text-emt-muted"
            aria-label="סגור"
          >
            <X size={20} />
          </HapticButton>
        </div>

        {/* Language Grid */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 pb-8 pt-4 gap-4">
          <p className="text-gray-400 dark:text-emt-muted text-sm font-bold uppercase tracking-widest">
            בחר שפה
          </p>
          <div className="w-full grid grid-cols-1 gap-3">
            {ALL_LANGS.map(l => (
              <HapticButton
                key={l}
                pressScale={0.95}
                onClick={() => {
                  trackEvent('translation_started', { source_lang: 'he', target_lang: l });
                  trackInteraction('translation_language_select', 'translation');
                  setSelectedLang(l);
                }}
                className="w-full py-5 px-6 rounded-2xl border-2 border-gray-200 dark:border-emt-border
                           bg-white dark:bg-emt-gray flex items-center gap-4
                           active:border-orange-400/60 active:bg-orange-400/10"
              >
                <span className="text-4xl">{LANG_FLAGS[l]}</span>
                {/* Task 4: Hebrew language names */}
                <span className="text-gray-900 dark:text-white font-bold text-2xl">
                  {LANG_LABELS_HE[l]}
                </span>
              </HapticButton>
            ))}

          </div>
        </div>

      </div>
    );
  }

  /* ── STEP 2: Questions Screen ── */
  const activeLang = selectedLang as Lang;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <HapticButton
          pressScale={0.9}
          onClick={() => { setSelectedLang(null); setCategory('הכל'); }}
          className="flex items-center gap-1.5 text-orange-400 font-bold text-sm"
          aria-label="חזור לשפות"
        >
          <ArrowRight size={16} />
          חזור לשפות
        </HapticButton>

        <div className="flex items-center gap-2">
          <span className="text-lg">{LANG_FLAGS[activeLang]}</span>
          {/* Task 4: Hebrew name in the phrase list header too */}
          <span className="text-gray-900 dark:text-emt-light font-bold text-base">
            {LANG_LABELS_HE[activeLang]}
          </span>
        </div>

        <HapticButton
          onClick={handleClose}
          pressScale={0.88}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                     flex items-center justify-center text-gray-500 dark:text-emt-muted"
          aria-label="סגור"
        >
          <X size={20} />
        </HapticButton>
      </div>

      {/* Category Chips */}
      <div className="shrink-0 flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {CATEGORIES.map(cat => (
          <HapticButton
            key={cat}
            pressScale={0.92}
            onClick={() => setCategory(cat)}
            className={[
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors',
              category === cat
                ? 'bg-orange-400/20 border-orange-400/50 text-orange-400'
                : 'bg-gray-100 dark:bg-emt-gray border-gray-200 dark:border-emt-border text-gray-500 dark:text-emt-muted',
            ].join(' ')}
          >
            {cat}
          </HapticButton>
        ))}
      </div>

      {/* Phrase Cards */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-3">
        {filtered.map(phrase => (
          <HapticButton
            key={phrase.id}
            pressScale={0.97}
            onClick={() => { setExpanded(phrase.id); speakText(phrase[activeLang], activeLang); }}
            className="w-full text-right rounded-2xl border border-gray-200 dark:border-emt-border
                       bg-white dark:bg-emt-gray p-4 flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0 text-right">
              {/* Hebrew — primary large text */}
              <p dir="rtl" className="text-gray-900 dark:text-white font-bold text-xl leading-snug">
                {phrase.he}
              </p>
              {/* Translated — smaller subtitle */}
              <p
                dir={LANG_DIR[activeLang]}
                className="text-gray-400 dark:text-emt-muted text-sm mt-1 leading-snug"
              >
                {phrase[activeLang]}
              </p>
            </div>
            <HapticButton
              pressScale={0.85}
              onClick={e => { e.stopPropagation(); speakText(phrase[activeLang], activeLang); }}
              className="shrink-0 w-10 h-10 rounded-full bg-orange-400/20 border border-orange-400/40
                         flex items-center justify-center text-orange-400"
              aria-label="השמע"
            >
              <Volume2 size={17} />
            </HapticButton>
          </HapticButton>
        ))}
      </div>

      {/* Expanded / Patient View Overlay */}
      {expandedPhrase && (
        <div
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center
                     bg-emt-dark/95 backdrop-blur-sm p-8"
          onClick={handleCloseExpanded}
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">{LANG_FLAGS[activeLang]}</span>
            <p className="text-orange-400 text-sm font-bold uppercase tracking-widest">
              {LANG_LABELS_HE[activeLang]}
            </p>
          </div>
          <p
            dir={LANG_DIR[activeLang]}
            className="text-white font-bold text-4xl text-center leading-relaxed mb-8"
          >
            {expandedPhrase[activeLang]}
          </p>
          <HapticButton
            pressScale={0.9}
            onClick={e => { e.stopPropagation(); speakText(expandedPhrase[activeLang], activeLang); }}
            className="mb-8 px-6 py-3 rounded-2xl bg-orange-400/20 border border-orange-400/50
                       flex items-center gap-2 text-orange-400 font-bold text-base"
            aria-label="השמע"
          >
            <Volume2 size={20} />
            השמע
          </HapticButton>
          <div className="w-full h-px bg-emt-border mb-6" />
          <p dir="rtl" className="text-emt-muted text-lg text-center font-semibold">
            {expandedPhrase.he}
          </p>
          {/* Record Patient Answer — floating pill */}
          <HapticButton
            pressScale={0.93}
            onClick={e => {
              e.stopPropagation();
              window.open('https://translate.google.com/', '_blank');
            }}
            className="mt-8 flex items-center gap-2 bg-slate-800 border border-slate-600
                       hover:bg-slate-700 text-white px-6 py-4 rounded-full shadow-2xl
                       transition-all text-lg font-medium"
            aria-label="פתח גוגל טרנסלייט"
          >
            <ExternalLink size={20} />
            פתח גוגל טרנסלייט (יש לבחור שפה באפליקציה)
          </HapticButton>
          {/* Task 3: Enlarged 'click to close' text */}
          <p className="text-xl md:text-2xl font-bold py-6 text-slate-300 mt-4">לחץ לסגירה</p>
        </div>
      )}
    </div>
  );
}
