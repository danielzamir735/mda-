import { useState } from 'react';
import { X, Languages, Maximize2, Volume2 } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';
import { PHRASES, CATEGORIES, LANG_LABELS, LANG_DIR, type Lang } from '../data/medicalTranslationsData';

interface Props { isOpen: boolean; onClose: () => void; }

export default function MedicalTranslatorModal({ isOpen, onClose }: Props) {
  const [lang, setLang] = useState<Lang>('en');
  const [category, setCategory] = useState('הכל');
  const [expanded, setExpanded] = useState<string | null>(null);

  const speakText = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) {
      alert('מנוע דיבור אינו נתמך במכשיר זה');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const ttsLangs: Record<string, string> = {
      en: 'en-US',
      ru: 'ru-RU',
      ar: 'ar-SA',
    };
    utterance.lang = ttsLangs[langCode] || 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  const filtered = category === 'הכל' ? PHRASES : PHRASES.filter(p => p.category === category);
  const expandedPhrase = PHRASES.find(p => p.id === expanded);

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <Languages size={20} className="text-orange-400" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">תרגומון רפואי</h2>
        </div>
        <HapticButton
          onClick={onClose}
          pressScale={0.88}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                     flex items-center justify-center text-gray-500 dark:text-emt-muted"
          aria-label="סגור"
        >
          <X size={20} />
        </HapticButton>
      </div>

      {/* Language Tabs */}
      <div className="shrink-0 flex gap-2 px-4 pt-3 pb-2">
        {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
          <HapticButton
            key={l}
            pressScale={0.92}
            onClick={() => setLang(l)}
            className={[
              'flex-1 py-2 rounded-xl font-bold text-sm border transition-colors',
              lang === l
                ? 'bg-orange-400/20 border-orange-400/50 text-orange-400'
                : 'bg-gray-100 dark:bg-emt-gray border-gray-200 dark:border-emt-border text-gray-500 dark:text-emt-muted',
            ].join(' ')}
          >
            {LANG_LABELS[l]}
          </HapticButton>
        ))}
      </div>

      {/* Category Chips */}
      <div className="shrink-0 flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
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
            onClick={() => setExpanded(phrase.id)}
            className="w-full text-right rounded-2xl border border-gray-200 dark:border-emt-border
                       bg-white dark:bg-emt-gray p-4 flex items-start justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <p
                dir={LANG_DIR[lang]}
                className="text-gray-900 dark:text-emt-light font-bold text-base leading-snug"
              >
                {phrase[lang]}
              </p>
              <p className="text-gray-400 dark:text-emt-muted text-xs mt-1 truncate" dir="rtl">
                {phrase.he}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
            <HapticButton
              pressScale={0.85}
              onClick={e => { e.stopPropagation(); speakText(phrase[lang], lang); }}
              className="w-8 h-8 rounded-full bg-orange-400/20 border border-orange-400/40
                         flex items-center justify-center text-orange-400"
              aria-label="השמע"
            >
              <Volume2 size={15} />
            </HapticButton>
            <Maximize2 size={14} className="shrink-0 text-gray-400 dark:text-emt-muted" />
          </div>
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
          <p className="text-orange-400 text-sm font-bold mb-6 uppercase tracking-widest">
            {LANG_LABELS[lang]}
          </p>
          <p
            dir={LANG_DIR[lang]}
            className="text-white font-bold text-3xl text-center leading-relaxed mb-6"
          >
            {expandedPhrase[lang]}
          </p>
          <HapticButton
            pressScale={0.9}
            onClick={e => { e.stopPropagation(); speakText(expandedPhrase[lang], lang); }}
            className="mb-8 px-6 py-3 rounded-2xl bg-orange-400/20 border border-orange-400/50
                       flex items-center gap-2 text-orange-400 font-bold text-base"
            aria-label="השמע"
          >
            <Volume2 size={20} />
            השמע
          </HapticButton>
          <div className="w-full h-px bg-emt-border mb-6" />
          <p dir="rtl" className="text-emt-muted text-base text-center">
            {expandedPhrase.he}
          </p>
          <p className="text-emt-muted text-xs mt-10">לחץ לסגירה</p>
        </div>
      )}
    </div>
  );
}
