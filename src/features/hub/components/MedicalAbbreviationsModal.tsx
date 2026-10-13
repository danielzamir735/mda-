import { useEffect, useState } from 'react';
import { X, Search, Brain, Volume2, GraduationCap, ChevronDown, Syringe } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import AbbreviationFlashcards from './AbbreviationFlashcards';
import FlashcardTrainer, { type FlashcardItem } from '../../../components/FlashcardTrainer';
import {
  ABBREVIATION_CATEGORIES,
  ALL_ABBREVIATIONS,
  type MedicalAbbreviation,
} from '../data/medicalAbbreviations';
import {
  DICTIONARY_SECTIONS,
  TOTAL_DICTIONARY_TERMS,
  VENFLON_SIZES,
  type DictionaryTerm,
} from '../data/medicalDictionary';
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

function DictionaryRow({
  item,
  color,
  borderClass,
}: {
  item: DictionaryTerm;
  color: string;
  borderClass?: string;
}) {
  return (
    <div className={['px-4 py-3', borderClass ?? ''].join(' ')}>
      <p className={`text-sm font-black ${color}`}>{item.term}</p>
      <p className="text-sm text-gray-700 dark:text-emt-light/90 leading-relaxed mt-0.5">{item.def}</p>
    </div>
  );
}

function VenflonTable() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray overflow-hidden">
      {VENFLON_SIZES.map((v, i) => (
        <div
          key={v.gauge}
          className={[
            'flex items-center gap-3 px-4 py-3',
            i < VENFLON_SIZES.length - 1 ? 'border-b border-gray-200 dark:border-emt-border' : '',
          ].join(' ')}
        >
          <span className={`w-4 h-4 rounded-full shrink-0 ${v.dot}`} aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {v.colorName} · <span dir="ltr" className="font-mono">{v.gauge}</span>
              </span>
              <span className="text-xs font-bold text-gray-500 dark:text-emt-muted shrink-0">{v.flow}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-emt-muted mt-0.5 leading-relaxed">{v.indication}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const DICTIONARY_FLASHCARDS: FlashcardItem[] = DICTIONARY_SECTIONS.flatMap((section) =>
  section.terms.map((t) => ({ front: t.term, back: t.def })),
);

type Tab = 'abbreviations' | 'dictionary';

export default function MedicalAbbreviationsModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [query, setQuery] = useState('');
  const [trainerOpen, setTrainerOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('abbreviations');
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [dictionaryDeck, setDictionaryDeck] = useState<FlashcardItem[] | null>(null);
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

  // אותו חיפוש רץ גם על המילון: שם המושג, ההגדרה או שם הפרק
  const filteredDictionary = q
    ? DICTIONARY_SECTIONS.flatMap((section) =>
        section.terms
          .filter(
            (t) =>
              t.term.toLowerCase().includes(q) ||
              t.def.toLowerCase().includes(q) ||
              section.title.toLowerCase().includes(q),
          )
          .map((item) => ({ item, color: section.color })),
      )
    : null;
  const showVenflonInSearch = q
    ? 'ונפלונים וציוד חדירה ורידית'.includes(q) ||
      VENFLON_SIZES.some(
        (v) => v.gauge.toLowerCase().includes(q) || v.colorName.includes(q) || v.indication.includes(q),
      )
    : false;

  const startDictionaryTrainer = (deck: FlashcardItem[]) => {
    trackEvent('medical_dictionary_flashcards_started');
    setDictionaryDeck(deck);
  };

  return (
    <>
      <div className="fixed inset-0 z-[75] flex flex-col bg-gray-50 dark:bg-emt-dark" dir="rtl">
        {/* Header */}
        <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
          <div className="flex items-center gap-2">
            <GraduationCap size={22} className="text-sky-400" />
            <div>
              <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl leading-tight">מושגים רפואיים</h2>
              <p className="text-gray-500 dark:text-emt-muted text-xs">קיצורים · מילון · שינון</p>
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
              placeholder="חפש קיצור, מושג, הגדרה או קטגוריה..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-emt-border
                         bg-white dark:bg-emt-gray text-gray-900 dark:text-emt-light
                         placeholder-gray-400 dark:placeholder-emt-muted
                         pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
            />
          </div>
          {!q && (
            <div className="mt-2.5 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border p-1">
              {([
                ['abbreviations', `קיצורים (${ALL_ABBREVIATIONS.length})`],
                ['dictionary', `מילון (${TOTAL_DICTIONARY_TERMS})`],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => { setTab(id); if (id === 'dictionary') trackEvent('medical_dictionary_opened'); }}
                  aria-pressed={tab === id}
                  className={[
                    'rounded-lg py-2 text-sm font-bold transition-colors',
                    tab === id
                      ? 'bg-sky-500/20 text-sky-700 dark:text-sky-200 border border-sky-400/40'
                      : 'text-gray-500 dark:text-emt-muted border border-transparent',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">

          {q ? (
            <>
              {filtered && filtered.length > 0 && (
                <div>
                  <h3 className="text-xs font-black tracking-widest text-gray-500 dark:text-emt-muted mb-2 pr-1">קיצורים</h3>
                  <div className="rounded-2xl border border-gray-200 dark:border-emt-border overflow-hidden">
                    {filtered.map(({ item, color }, i) => (
                      <TermRow
                        key={item.id}
                        item={item}
                        color={color}
                        borderClass={i < filtered.length - 1 ? 'border-b border-gray-200 dark:border-emt-border' : ''}
                      />
                    ))}
                  </div>
                </div>
              )}
              {filteredDictionary && filteredDictionary.length > 0 && (
                <div>
                  <h3 className="text-xs font-black tracking-widest text-gray-500 dark:text-emt-muted mb-2 pr-1">מילון</h3>
                  <div className="rounded-2xl border border-gray-200 dark:border-emt-border overflow-hidden">
                    {filteredDictionary.map(({ item, color }, i) => (
                      <DictionaryRow
                        key={item.term}
                        item={item}
                        color={color}
                        borderClass={i < filteredDictionary.length - 1 ? 'border-b border-gray-200 dark:border-emt-border' : ''}
                      />
                    ))}
                  </div>
                </div>
              )}
              {showVenflonInSearch && (
                <div>
                  <h3 className="text-xs font-black tracking-widest text-gray-500 dark:text-emt-muted mb-2 pr-1">ונפלונים וציוד חדירה ורידית</h3>
                  <VenflonTable />
                </div>
              )}
              {!filtered?.length && !filteredDictionary?.length && !showVenflonInSearch && (
                <p className="text-center text-gray-400 dark:text-emt-muted py-8 text-sm">לא נמצאו תוצאות</p>
              )}
            </>
          ) : tab === 'dictionary' ? (
            <>
              <button
                onClick={() => startDictionaryTrainer(DICTIONARY_FLASHCARDS)}
                className="w-full rounded-2xl border border-sky-400/30 bg-sky-500/8 dark:bg-sky-500/10
                           backdrop-blur-sm px-4 py-3.5 flex items-center gap-3
                           active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0">
                  <Brain size={20} className="text-sky-400" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sky-700 dark:text-sky-200 font-bold text-base leading-tight">שינון המילון</span>
                  <span className="text-sky-600/60 dark:text-sky-300/50 text-xs mt-0.5">
                    {TOTAL_DICTIONARY_TERMS} מושגים · {DICTIONARY_SECTIONS.length} פרקים
                  </span>
                </div>
                <div className="mr-auto text-sky-400/40 text-lg">←</div>
              </button>

              {DICTIONARY_SECTIONS.map((section) => {
                const open = openSectionId === section.id;
                return (
                  <div key={section.id} className={`rounded-2xl border ${section.border} ${section.bg} overflow-hidden`}>
                    <button
                      onClick={() => setOpenSectionId(open ? null : section.id)}
                      aria-expanded={open}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-right"
                    >
                      <span className={`flex-1 text-sm font-black ${section.color}`}>{section.title}</span>
                      <span className="text-xs font-bold text-gray-500 dark:text-emt-muted shrink-0">{section.terms.length}</span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-gray-400 dark:text-emt-muted transition-transform ${open ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {open && (
                      <div className={`border-t ${section.border}`}>
                        {section.terms.map((item) => (
                          <DictionaryRow key={item.term} item={item} color={section.color} borderClass={`border-b ${section.border}`} />
                        ))}
                        <button
                          onClick={() => startDictionaryTrainer(section.terms.map((t) => ({ front: t.term, back: t.def })))}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold ${section.color} active:scale-[0.98] transition-transform`}
                        >
                          <Brain size={16} />
                          שינון הפרק הזה
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div>
                <h3 className="flex items-center gap-1.5 text-xs font-black tracking-widest text-gray-500 dark:text-emt-muted mb-2 pr-1">
                  <Syringe size={14} />
                  ונפלונים וציוד חדירה ורידית
                </h3>
                <VenflonTable />
              </div>
            </>
          ) : (
            <>
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

          {ABBREVIATION_CATEGORIES.map((cat) => (
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
            ))}
            </>
          )}
        </div>
      </div>

      {trainerOpen && <AbbreviationFlashcards onClose={() => setTrainerOpen(false)} />}
      {dictionaryDeck && (
        <FlashcardTrainer
          data={dictionaryDeck}
          onClose={() => setDictionaryDeck(null)}
          statsKey="medical-dictionary"
        />
      )}
    </>
  );
}
