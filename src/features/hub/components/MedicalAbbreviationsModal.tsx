import { useEffect, useState } from 'react';
import { X, Search, Brain, Volume2, GraduationCap } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import AbbreviationFlashcards from './AbbreviationFlashcards';
import {
  ABBREVIATION_CATEGORIES,
  ALL_ABBREVIATIONS,
  type MedicalAbbreviation,
} from '../data/medicalAbbreviations';
import { useAbbreviationSrsStore, MAX_BOX } from '../../../store/abbreviationSrsStore';
import { speakEnglish, warmUpVoices } from '../../../utils/tts';
import { trackEvent } from '../../../utils/analytics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function TermRow({
  item,
  color,
  borderClass,
}: {
  item: MedicalAbbreviation;
  color: string;
  borderClass?: string;
}) {
  return (
    <div className={['flex items-center gap-3 px-4 py-3', borderClass ?? ''].join(' ')}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-gray-900 dark:text-white">{item.he}</span>
          <span className={`text-base font-black font-mono ${color}`} dir="ltr">
            {item.abbr}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-emt-muted mt-0.5">
          הגייה: {item.phonetic}
        </p>
      </div>
      <button
        onClick={() => { trackEvent('medical_term_tts_played'); speakEnglish(item.speech); }}
        className="w-10 h-10 shrink-0 rounded-xl bg-sky-500/10 border border-sky-400/25
                   flex items-center justify-center text-sky-400
                   active:scale-90 transition-transform"
        aria-label={`השמע הגייה של ${item.abbr}`}
      >
        <Volume2 size={18} />
      </button>
    </div>
  );
}

export default function MedicalAbbreviationsModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [query, setQuery] = useState('');
  const [trainerOpen, setTrainerOpen] = useState(false);
  const progress = useAbbreviationSrsStore((s) => s.progress);

  // חלק מהדפדפנים טוענים קולות TTS באיחור — מחממים ברגע שהמודל נפתח
  useEffect(() => {
    if (isOpen) warmUpVoices();
  }, [isOpen]);

  if (!isOpen) return null;

  const masteredCount = ALL_ABBREVIATIONS.filter(
    (item) => (progress[item.id]?.box ?? 0) >= MAX_BOX,
  ).length;

  // חיפוש חכם: קיצור באנגלית, משמעות בעברית, תעתיק פונטי או שם קטגוריה
  const q = query.trim().toLowerCase();
  const filtered = q
    ? ABBREVIATION_CATEGORIES.flatMap((cat) =>
        cat.items
          .filter(
            (item) =>
              item.abbr.toLowerCase().includes(q) ||
              item.he.includes(q) ||
              item.phonetic.includes(q) ||
              cat.title.includes(q),
          )
          .map((item) => ({ item, color: cat.color })),
      )
    : null;

  return (
    <>
      <div className="fixed inset-0 z-[75] flex flex-col bg-gray-50 dark:bg-emt-dark" dir="rtl">
        {/* Header */}
        <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
          <div className="flex items-center gap-2">
            <GraduationCap size={22} className="text-sky-400" />
            <div>
              <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl leading-tight">מושגים רפואיים</h2>
              <p className="text-gray-500 dark:text-emt-muted text-xs">קיצורים · הגייה · שינון</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                       flex items-center justify-center active:scale-90 transition-transform
                       text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
            aria-label="סגור"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 px-4 pt-3 pb-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-emt-muted pointer-events-none"
            />
            <input
              type="text"
              placeholder="חפש קיצור, משמעות בעברית או קטגוריה..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-emt-border
                         bg-white dark:bg-emt-gray text-gray-900 dark:text-emt-light
                         placeholder-gray-400 dark:placeholder-emt-muted
                         pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">

          {/* Flashcard trainer trigger */}
          <button
            onClick={() => { trackEvent('medical_terms_flashcards_started'); setTrainerOpen(true); }}
            className="w-full rounded-2xl border border-sky-400/30 bg-sky-500/8 dark:bg-sky-500/10
                       backdrop-blur-sm px-4 py-3.5 flex items-center gap-3
                       active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0">
              <Brain size={20} className="text-sky-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sky-700 dark:text-sky-200 font-bold text-base leading-tight">מצב שינון</span>
              <span className="text-sky-600/60 dark:text-sky-300/50 text-xs mt-0.5">
                {ALL_ABBREVIATIONS.length} מושגים · {masteredCount} בשליטה מלאה
              </span>
            </div>
            <div className="mr-auto text-sky-400/40 text-lg">←</div>
          </button>

          {filtered ? (
            <div className="rounded-2xl border border-gray-200 dark:border-emt-border overflow-hidden">
              {filtered.length === 0 ? (
                <p className="text-center text-gray-400 dark:text-emt-muted py-8 text-sm">לא נמצאו תוצאות</p>
              ) : (
                filtered.map(({ item, color }, i) => (
                  <TermRow
                    key={item.id}
                    item={item}
                    color={color}
                    borderClass={i < filtered.length - 1 ? 'border-b border-gray-200 dark:border-emt-border' : ''}
                  />
                ))
              )}
            </div>
          ) : (
            ABBREVIATION_CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <h3 className={`text-xs font-black uppercase tracking-widest ${cat.color} mb-2 pr-1`}>
                  {cat.title}
                </h3>
                <div className={`rounded-2xl border ${cat.border} ${cat.bg} overflow-hidden`}>
                  {cat.items.map((item, i) => (
                    <TermRow
                      key={item.id}
                      item={item}
                      color={cat.color}
                      borderClass={i < cat.items.length - 1 ? `border-b ${cat.border}` : ''}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {trainerOpen && <AbbreviationFlashcards onClose={() => setTrainerOpen(false)} />}
    </>
  );
}
