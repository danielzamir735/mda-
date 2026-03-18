import { useState, useEffect, useRef } from 'react';
import { X, Languages, Volume2, ArrowRight, ExternalLink, Thermometer } from 'lucide-react';
import HapticButton from '../../../components/HapticButton';
import {
  PHRASES, CATEGORIES, LANG_FLAGS, LANG_DIR,
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

// Task 4: Hebrew names for the language selection grid
const LANG_LABELS_HE: Record<Lang, string> = {
  en: 'אנגלית',
  ru: 'רוסית',
  ar: 'ערבית',
  fr: 'צרפתית',
  am: 'אמהרית',
};

// VAS dot color stops along the gradient (green → red)
const VAS_DOT_COLORS: Record<number, string> = {
  0:  '#22c55e',
  1:  '#4ade80',
  2:  '#84cc16',
  3:  '#a3e635',
  4:  '#eab308',
  5:  '#f59e0b',
  6:  '#f97316',
  7:  '#ef4444',
  8:  '#dc2626',
  9:  '#b91c1c',
  10: '#7f1d1d',
};

export default function MedicalTranslatorModal({ isOpen, onClose }: Props) {
  const [selectedLang, setSelectedLang] = useState<Lang | null>(null);
  const [category, setCategory] = useState('הכל');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showPainScale, setShowPainScale] = useState(false);
  const [selectedPain, setSelectedPain] = useState<number | null>(null);

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
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
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

        {/* Pain Scale Button */}
        <div className="shrink-0 px-4 pt-3">
          <HapticButton
            pressScale={0.95}
            onClick={() => setShowPainScale(true)}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-3
                       bg-red-500/90 active:bg-red-600 shadow-lg"
            aria-label="פתח סרגל כאב"
          >
            <Thermometer size={24} className="text-white" />
            <span className="text-white font-black text-xl tracking-wide">סרגל כאב (1-10)</span>
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
                {/* Task 4: Hebrew language names */}
                <span className="text-gray-900 dark:text-white font-bold text-2xl">
                  {LANG_LABELS_HE[l]}
                </span>
              </HapticButton>
            ))}
          </div>
        </div>

        {/* Pain Scale Overlay — Visual Analogue Scale */}
        {showPainScale && (
          <div className="fixed inset-0 z-[99999] flex flex-col bg-emt-dark">
            {/* Header */}
            <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-emt-border">
              <Thermometer size={20} className="text-red-400" />
              <h2 className="text-white font-bold text-lg tracking-wide">סרגל עוצמת כאב</h2>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-10">
              {/* Question */}
              <p dir="rtl" className="text-white font-bold text-2xl text-center leading-snug tracking-wide">
                כמה כואב לך?
              </p>

              {/* VAS Bar section */}
              <div className="w-full">
                {/* Numbers row */}
                <div className="flex justify-between mb-3 px-[10px]">
                  {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                    <span
                      key={n}
                      className="text-xs font-semibold text-slate-400 w-5 text-center select-none"
                    >
                      {n}
                    </span>
                  ))}
                </div>

                {/* Gradient bar + dots */}
                <div className="relative w-full">
                  {/* Continuous gradient bar */}
                  <div
                    className="w-full h-4 rounded-full shadow-inner"
                    style={{
                      background: 'linear-gradient(to left, #7f1d1d, #ef4444, #f97316, #eab308, #84cc16, #22c55e)',
                    }}
                  />

                  {/* Selection dots overlay — positioned absolutely over the bar */}
                  <div className="absolute inset-0 flex items-center justify-between px-[2px]">
                    {[0,1,2,3,4,5,6,7,8,9,10].map(n => {
                      const isSelected = selectedPain === n;
                      return (
                        <button
                          key={n}
                          onClick={() => setSelectedPain(n)}
                          aria-label={`עוצמת כאב ${n}`}
                          className="relative flex items-center justify-center focus:outline-none"
                          style={{ width: 28, height: 28 }}
                        >
                          {/* Glow ring when selected */}
                          {isSelected && (
                            <span
                              className="absolute rounded-full animate-pulse"
                              style={{
                                width: 34,
                                height: 34,
                                background: VAS_DOT_COLORS[n] + '55',
                                boxShadow: `0 0 12px 4px ${VAS_DOT_COLORS[n]}88`,
                              }}
                            />
                          )}
                          {/* Dot */}
                          <span
                            className="rounded-full transition-all duration-150"
                            style={{
                              width: isSelected ? 22 : 14,
                              height: isSelected ? 22 : 14,
                              background: VAS_DOT_COLORS[n],
                              border: isSelected ? '3px solid #ffffff' : '2px solid rgba(255,255,255,0.35)',
                              boxShadow: isSelected
                                ? `0 0 0 2px ${VAS_DOT_COLORS[n]}, 0 0 16px 4px ${VAS_DOT_COLORS[n]}99`
                                : 'none',
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Labels + face icons row */}
                <div className="flex items-center justify-between mt-4 px-0">
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-2xl select-none">😌</span>
                    <span className="text-green-400 text-xs font-semibold leading-tight" style={{ maxWidth: 90 }}>
                      אין כאב בכלל
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-2xl select-none">😭</span>
                    <span
                      dir="rtl"
                      className="text-red-400 text-xs font-semibold leading-tight text-right"
                      style={{ maxWidth: 110 }}
                    >
                      הכאב הגרוע ביותר שניתן לדמיין
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected value display */}
              <div
                className="flex flex-col items-center gap-1 min-h-[64px] justify-center"
              >
                {selectedPain !== null ? (
                  <>
                    <span
                      className="text-5xl font-black tabular-nums transition-all duration-200"
                      style={{ color: VAS_DOT_COLORS[selectedPain] }}
                    >
                      {selectedPain}
                    </span>
                    <span className="text-slate-400 text-sm font-semibold tracking-widest uppercase">
                      {selectedPain === 0 && 'ללא כאב'}
                      {selectedPain >= 1 && selectedPain <= 3 && 'כאב קל'}
                      {selectedPain >= 4 && selectedPain <= 6 && 'כאב בינוני'}
                      {selectedPain >= 7 && selectedPain <= 9 && 'כאב חמור'}
                      {selectedPain === 10 && 'כאב בלתי נסבל'}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-600 text-sm font-semibold">בחר עוצמת כאב</span>
                )}
              </div>
            </div>

            {/* Close button */}
            <div className="shrink-0 px-4 pb-6">
              <HapticButton
                pressScale={0.95}
                onClick={() => { setShowPainScale(false); setSelectedPain(null); }}
                className="w-full py-4 rounded-2xl bg-slate-800 border border-slate-700
                           flex items-center justify-center text-white font-bold text-lg tracking-wide"
                aria-label="סגור סרגל כאב"
              >
                סגור
              </HapticButton>
            </div>
          </div>
        )}
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
          {/* Task 4: Hebrew name in the phrase list header too */}
          <span className="text-gray-900 dark:text-emt-light font-bold text-base">
            {LANG_LABELS_HE[selectedLang]}
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
          onClick={handleCloseExpanded}
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">{LANG_FLAGS[selectedLang]}</span>
            <p className="text-orange-400 text-sm font-bold uppercase tracking-widest">
              {LANG_LABELS_HE[selectedLang]}
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
