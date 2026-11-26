import { useState, useEffect, useRef } from 'react';
import { X, Languages, Volume2, ArrowRight, ExternalLink, Brain, Captions, ChevronLeft } from 'lucide-react';
import HapticButton from '../../../components/HapticButton';
import {
  PHRASES, CATEGORIES, LANG_FLAGS, LANG_DIR, LANG_GT,
  type Lang, type Phrase,
} from '../data/medicalTranslationsData';
import { trackEvent, trackInteraction } from '../../../utils/analytics';
import FlashcardTrainer from '../../../components/FlashcardTrainer';
import BigTextScreen from './BigTextScreen';
import { useTranslation, useLanguage, translate, type TranslationKey } from '../../../i18n';

interface Props { isOpen: boolean; onClose: () => void; initialLang?: Lang; }

const ALL_LANGS: Lang[] = ['en', 'ru', 'ar', 'fr', 'am'];

const TTS_LANGS: Record<string, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  ar: 'ar-SA',
  fr: 'fr-FR',
  am: 'am-ET',
};

// Names of the patient's language, in the EMT's interface language
const LANG_LABEL_KEYS: Record<Lang, TranslationKey> = {
  en: 'mtLangEn',
  ru: 'mtLangRu',
  ar: 'mtLangAr',
  fr: 'mtLangFr',
  am: 'mtLangAm',
};

// The phrase data keeps its Hebrew category names; these map them to interface labels.
const ALL_CATEGORY = CATEGORIES[0];
const CATEGORY_KEYS: Record<string, TranslationKey> = {
  'הכל': 'all', // i18n-ok: category id from the data file
  'כאב': 'mtCatPain', // i18n-ok: category id from the data file
  'נשימה': 'mtCatBreathing', // i18n-ok: category id from the data file
  'רקע': 'mtCatHistory', // i18n-ok: category id from the data file
  'כללי': 'mtCatGeneral', // i18n-ok: category id from the data file
  'נשים': 'mtCatWomen', // i18n-ok: category id from the data file
  'טראומה': 'mtCatTrauma', // i18n-ok: category id from the data file
  'עצבי': 'mtCatNeuro', // i18n-ok: category id from the data file
  'בטן': 'mtCatAbdomen', // i18n-ok: category id from the data file
};
const categoryLabel = (cat: string) => (CATEGORY_KEYS[cat] ? translate(CATEGORY_KEYS[cat]) : cat);

export default function MedicalTranslatorModal({ isOpen, onClose, initialLang }: Props) {
  const t = useTranslation();
  const { isEn } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<Lang | null>(initialLang ?? null);
  const [category, setCategory] = useState(ALL_CATEGORY);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [trainerOpen, setTrainerOpen] = useState(false);
  const [bigTextOpen, setBigTextOpen] = useState(false);

  // Refs for popstate handler — avoids stale closures
  const selectedLangRef = useRef<Lang | null>(null);
  const expandedRef = useRef<string | null>(null);
  const bigTextRef = useRef(false);
  const onCloseRef = useRef(onClose);
  // Tracks how many history entries this modal has pushed
  const pushCountRef = useRef(0);
  selectedLangRef.current = selectedLang;
  expandedRef.current = expanded;
  bigTextRef.current = bigTextOpen;
  onCloseRef.current = onClose;

  /** The phrase in the EMT's own language (the patient-facing text is phrase[activeLang]). */
  const emtText = (p: Phrase) => (isEn ? p.en : p.he);

  const speakText = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) {
      alert(t('mtNoTts'));
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
    setCategory(ALL_CATEGORY);
    setExpanded(null);
    setBigTextOpen(false);
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
      if (bigTextRef.current) {
        // Big-text captions → back to language list
        setBigTextOpen(false);
      } else if (expandedRef.current !== null) {
        // Fullscreen phrase → back to phrase list
        window.speechSynthesis.cancel();
        setExpanded(null);
      } else if (selectedLangRef.current !== null) {
        // Phrase list → back to language list
        setSelectedLang(null);
        setCategory(ALL_CATEGORY);
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

  // Push history entry when the big-text captions screen opens
  useEffect(() => {
    if (!isOpen || !bigTextOpen) return;
    pushCountRef.current++;
    window.history.pushState({ mtLevel: 'bigtext' }, '');
  }, [bigTextOpen, isOpen]);

  // Push history entry when a phrase is expanded (fullscreen level)
  useEffect(() => {
    if (!isOpen || expanded === null) return;
    pushCountRef.current++;
    window.history.pushState({ mtLevel: 'phrase' }, '');
  }, [expanded, isOpen]);

  if (!isOpen) return null;
  if (bigTextOpen) return <BigTextScreen onBack={() => setBigTextOpen(false)} />;

  const filtered = category === ALL_CATEGORY ? PHRASES : PHRASES.filter(p => p.category === category);
  const expandedPhrase = PHRASES.find(p => p.id === expanded);

  const buildFlashcards = (lang: Lang) =>
    PHRASES.map(p => ({ front: emtText(p), back: p[lang] }));


  /* ── STEP 1: Language Selection ── */
  if (selectedLang === null) {
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col bg-page">
        {/* Header */}
        <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Languages size={20} className="text-orange-700 dark:text-orange-400" />
            <h2 className="text-fg font-bold text-xl">{t('mtTitle')}</h2>
          </div>
          <HapticButton
            onClick={handleClose}
            pressScale={0.88}
            className="w-10 h-10 rounded-full bg-surface-2 border border-line
                       flex items-center justify-center text-fg-muted"
            aria-label={t('close')}
          >
            <X size={20} />
          </HapticButton>
        </div>

        {/* Language Grid */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 pb-8 pt-4 gap-4">
          <p className="text-fg-muted text-sm font-bold uppercase tracking-widest">
            {t('mtChooseLang')}
          </p>
          <div className="w-full grid grid-cols-1 gap-3">
            {ALL_LANGS.map(l => (
              <HapticButton
                key={l}
                pressScale={0.95}
                onClick={() => {
                  trackEvent('translation_started', { source_lang: isEn ? 'en' : 'he', target_lang: l });
                  trackInteraction('תרגום רפואי', 'translation'); // i18n-ok: fixed analytics label
                  setSelectedLang(l);
                }}
                className="w-full py-5 px-6 rounded-2xl border-2 border-line
                           bg-surface flex items-center gap-4
                           active:border-orange-400/60 active:bg-orange-400/10"
              >
                <span className="text-4xl">{LANG_FLAGS[l]}</span>
                <span className="text-fg font-bold text-2xl">
                  {t(LANG_LABEL_KEYS[l])}
                </span>
              </HapticButton>
            ))}

          </div>

          {/* Big-text captions for hard-of-hearing patients */}
          <p className="text-fg-muted text-sm font-bold uppercase tracking-widest mt-2">
            {t('mtHardOfHearing')}
          </p>
          <HapticButton
            pressScale={0.95}
            onClick={() => {
              trackInteraction('כתוביות למטופל', 'translation'); // i18n-ok: fixed analytics label
              setBigTextOpen(true);
            }}
            className="w-full py-5 px-6 rounded-2xl border-2 border-orange-400/40
                       bg-orange-400/10 flex items-center gap-4 text-start"
          >
            <Captions size={36} className="shrink-0 text-orange-700 dark:text-orange-400" />
            <span className="flex-1 flex flex-col gap-0.5">
              <span className="text-fg font-bold text-2xl leading-tight">{t('btTitle')}</span>
              <span className="text-fg-muted text-sm leading-snug">{t('mtCaptionsSub')}</span>
            </span>
            <ChevronLeft size={22} className="shrink-0 text-fg-subtle ltr:rotate-180" />
          </HapticButton>
        </div>

      </div>
    );
  }

  /* ── STEP 2: Questions Screen ── */
  const activeLang = selectedLang as Lang;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-page">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <HapticButton
          pressScale={0.9}
          onClick={() => { setSelectedLang(null); setCategory(ALL_CATEGORY); }}
          className="flex items-center gap-1.5 text-orange-700 dark:text-orange-400 font-bold text-sm"
          aria-label={t('mtBackToLangs')}
        >
          <ArrowRight size={16} className="ltr:rotate-180" />
          {t('mtBackToLangs')}
        </HapticButton>

        <div className="flex items-center gap-2">
          <span className="text-lg">{LANG_FLAGS[activeLang]}</span>
          <span className="text-fg font-bold text-base">
            {t(LANG_LABEL_KEYS[activeLang])}
          </span>
        </div>

        <HapticButton
          onClick={handleClose}
          pressScale={0.88}
          className="w-10 h-10 rounded-full bg-surface-2 border border-line
                     flex items-center justify-center text-fg-muted"
          aria-label={t('close')}
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
                ? 'bg-orange-400/20 border-orange-400/50 text-orange-700 dark:text-orange-400'
                : 'bg-surface-2 border-line text-fg-muted',
            ].join(' ')}
          >
            {categoryLabel(cat)}
          </HapticButton>
        ))}
      </div>

      {/* Phrase Cards */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-3">

        {/* Flashcard trainer */}
        <HapticButton
          pressScale={0.97}
          onClick={() => setTrainerOpen(true)}
          className="w-full rounded-2xl border border-orange-400/30 bg-orange-500/8 dark:bg-orange-500/10
                     backdrop-blur-sm px-4 py-3.5 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center shrink-0">
            <Brain size={20} className="text-orange-700 dark:text-orange-400" />
          </div>
          <div className="flex flex-col items-start text-start">
            <span className="text-orange-800 dark:text-orange-200 font-bold text-base leading-tight">{t('mtTrainer')}</span>
            <span className="text-orange-700 dark:text-orange-300/50 text-xs mt-0.5">{t('mtTrainerCount', { n: PHRASES.length, flag: LANG_FLAGS[activeLang] })}</span>
          </div>
          <div className="ms-auto text-orange-700 dark:text-orange-400/40 text-lg ltr:rotate-180">←</div>
        </HapticButton>

        {filtered.map(phrase => (
          <HapticButton
            key={phrase.id}
            pressScale={0.97}
            onClick={() => { setExpanded(phrase.id); speakText(phrase[activeLang], activeLang); }}
            className="w-full text-start rounded-2xl border border-line
                       bg-surface p-4 flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0 text-start">
              {/* EMT's language — primary large text */}
              <p dir={isEn ? 'ltr' : 'rtl'} className="text-fg font-bold text-xl leading-snug">
                {emtText(phrase)}
              </p>
              {/* Patient's language — smaller subtitle (does not follow the interface language) */}
              <p
                dir={LANG_DIR[activeLang]}
                className="text-fg-muted text-sm mt-1 leading-snug"
              >
                {phrase[activeLang]}
              </p>
            </div>
            <HapticButton
              pressScale={0.85}
              onClick={e => { e.stopPropagation(); speakText(phrase[activeLang], activeLang); }}
              className="shrink-0 w-10 h-10 rounded-full bg-orange-400/20 border border-orange-400/40
                         flex items-center justify-center text-orange-700 dark:text-orange-400"
              aria-label={t('mtSpeak')}
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
                     bg-page/95 backdrop-blur-sm p-8"
          onClick={handleCloseExpanded}
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">{LANG_FLAGS[activeLang]}</span>
            <p className="text-orange-700 dark:text-orange-400 text-sm font-bold uppercase tracking-widest">
              {t(LANG_LABEL_KEYS[activeLang])}
            </p>
          </div>
          <p
            dir={LANG_DIR[activeLang]}
            className="text-fg font-bold text-4xl text-center leading-relaxed mb-8"
          >
            {expandedPhrase[activeLang]}
          </p>
          <HapticButton
            pressScale={0.9}
            onClick={e => { e.stopPropagation(); speakText(expandedPhrase[activeLang], activeLang); }}
            className="mb-8 px-6 py-3 rounded-2xl bg-orange-400/20 border border-orange-400/50
                       flex items-center gap-2 text-orange-700 dark:text-orange-400 font-bold text-base"
            aria-label={t('mtSpeak')}
          >
            <Volume2 size={20} />
            {t('mtSpeak')}
          </HapticButton>
          <div className="w-full h-px bg-line mb-6" />
          <p dir={isEn ? 'ltr' : 'rtl'} className="text-fg-muted text-lg text-center font-semibold">
            {emtText(expandedPhrase)}
          </p>
          {/* Patient response — open Google Translate with patient's language pre-selected */}
          <HapticButton
            pressScale={0.93}
            onClick={e => {
              e.stopPropagation();
              const gtLang = LANG_GT[activeLang];
              window.open(
                `https://translate.google.com/?sl=${gtLang}&tl=${isEn ? 'en' : 'he'}&op=translate`,
                '_blank',
              );
            }}
            className="mt-8 flex items-center gap-2 bg-surface-3 border border-line-strong
                       hover:bg-surface-2 text-fg px-6 py-4 rounded-full shadow-2xl
                       transition-all text-lg font-medium"
            aria-label={t('mtPatientReplyAria')}
          >
            <ExternalLink size={20} />
            {t('mtPatientReply')}
          </HapticButton>
          {/* Task 3: Enlarged 'click to close' text */}
          <p className="text-xl md:text-2xl font-bold py-6 text-fg-muted mt-4">{t('mtTapToClose')}</p>
        </div>
      )}

      {trainerOpen && (
        <FlashcardTrainer
          data={buildFlashcards(activeLang)}
          onClose={() => setTrainerOpen(false)}
        />
      )}
    </div>
  );
}
