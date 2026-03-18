import { useState } from 'react';
import { X, Languages, Volume2, ArrowRight } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';
import {
  PHRASES, CATEGORIES, LANG_LABELS, LANG_FLAGS, LANG_DIR,
  type Lang,
} from '../data/medicalTranslationsData';

interface Props { isOpen: boolean; onClose: () => void; }

const ALL_LANGS: Lang[] = ['en', 'ru', 'ar', 'fr', 'am'];

const TTS_LANGS: Record<string, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  ar: 'ar-SA',
  fr: 'fr-FR',
  am: 'am-ET',
};

export default function MedicalTranslatorModal({ isOpen, onClose }: Props) {
  const [selectedLang, setSelectedLang] = useState<Lang | null>(null);
  const [category, setCategory] = useState('הכל');
  const [expanded, setExpanded] = useState<string | null>(null);

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

  const handleClose = () => {
    setSelectedLang(null);
    setCategory('הכל');
    setExpanded(null);
    onClose();
  };

  useModalBackHandler(isOpen, handleClose);
  if (!isOpen) return null;

  const filtered = category === 'הכל' ? PHRASES : PHRASES.filter(p => p.category === category);
  const expandedPhrase = PHRASES.find(p => p.id === expanded);

  /* ── STEP 1: Language Selection ── */
  if (selectedLang === null) {
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col bg-gray-50 dark:bg-emt-dark">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
          <div className="flex items-center gap-2">
            <Languages size={20} className="text-orange-400" />
            <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">תרגומון רפואי</h2>
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
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 gap-4">
          <p className="text-gray-400 dark:text-emt-muted text-sm font-bold uppercase tracking-widest mb-2">
            בחר שפה
          </p>
          <div className="w-full grid grid-cols-1 gap-3">
            {ALL_LANGS.map(l => (
              <HapticButton
                key={l}
                pressScale={0.95}
                onClick={() => setSelectedLang(l)}
                className="w-full py-5 px-6 rounded-2xl border-2 border-gray-200 dark:border-emt-border
                           bg-white dark:bg-emt-gray flex items-center gap-4
                           active:border-orange-400/60 active:bg-orange-400/10"
              >
                <span className="text-4xl">{LANG_FLAGS[l]}</span>
                <span className="text-gray-900 dark:text-white font-bold text-2xl">
                  {LANG_LABELS[l]}
                </span>
              </HapticButton>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── STEP 2: Questions Screen ── */
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
          <span className="text-lg">{LANG_FLAGS[selectedLang]}</span>
          <span className="text-gray-900 dark:text-emt-light font-bold text-base">
            {LANG_LABELS[selectedLang]}
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
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
        {filtered.map(phrase => (
          <HapticButton
            key={phrase.id}
            pressScale={0.97}
            onClick={() => { setExpanded(phrase.id); speakText(phrase[selectedLang], selectedLang); }}
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
                dir={LANG_DIR[selectedLang]}
                className="text-gray-400 dark:text-emt-muted text-sm mt-1 leading-snug"
              >
                {phrase[selectedLang]}
              </p>
            </div>
            <HapticButton
              pressScale={0.85}
              onClick={e => { e.stopPropagation(); speakText(phrase[selectedLang], selectedLang); }}
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
          onClick={() => setExpanded(null)}
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">{LANG_FLAGS[selectedLang]}</span>
            <p className="text-orange-400 text-sm font-bold uppercase tracking-widest">
              {LANG_LABELS[selectedLang]}
            </p>
          </div>
          <p
            dir={LANG_DIR[selectedLang]}
            className="text-white font-bold text-4xl text-center leading-relaxed mb-8"
          >
            {expandedPhrase[selectedLang]}
          </p>
          <HapticButton
            pressScale={0.9}
            onClick={e => { e.stopPropagation(); speakText(expandedPhrase[selectedLang], selectedLang); }}
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
          <p className="text-emt-muted text-xs mt-10">לחץ לסגירה</p>
        </div>
      )}
    </div>
  );
}
