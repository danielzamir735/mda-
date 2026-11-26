import { useState } from 'react';
import { X, Pill, Search, Brain } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import FlashcardTrainer, { type FlashcardItem } from '../../components/FlashcardTrainer';
import { useTranslation, useLanguage } from '../../i18n';

interface MedItem { he: string; en: string; }
interface MedCategory {
  category: string;
  categoryEn: string;
  color: string;
  border: string;
  bg: string;
  items: MedItem[];
}

const CATEGORIES: MedCategory[] = [
  {
    category: 'מערכת הלב וכלי הדם', // i18n-ok: bilingual medication vocabulary (content)
    categoryEn: 'Cardiovascular system',
    color: 'text-red-700 dark:text-red-400',
    border: 'border-red-400/30',
    bg: 'bg-red-400/5',
    items: [
      { he: 'נוגדי הפרעות קצב',     en: 'Antiarrhythmics' }, // i18n-ok: bilingual medication vocabulary (content)
      { he: 'טיפול בתסמונת כלילית', en: 'Antianginals' }, // i18n-ok: bilingual medication vocabulary (content)
      { he: 'הורדת לחץ דם',          en: 'Antihypertensives' }, // i18n-ok: bilingual medication vocabulary (content)
      { he: 'נוגד צימוד טסיות',      en: 'Antiagregants' }, // i18n-ok: bilingual medication vocabulary (content)
      { he: 'נוגד קרישה',            en: 'Anticoagulants' }, // i18n-ok: bilingual medication vocabulary (content)
      { he: 'תרופות משתנות',         en: 'Diuretics' }, // i18n-ok: bilingual medication vocabulary (content)
      { he: 'תרופות נוספות במערכת',  en: 'Other cardiovascular' }, // i18n-ok: bilingual medication vocabulary (content)
    ],
  },
  {
    category: 'מערכת העיכול', // i18n-ok: bilingual medication vocabulary (content)
    categoryEn: 'Alimentary system',
    color: 'text-amber-800 dark:text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/5',
    items: [
      { he: 'נוגדי חומצה',                     en: 'Antacids' }, // i18n-ok: bilingual medication vocabulary (content)
      { he: 'תרופות משלשלות',                   en: 'Laxatives' }, // i18n-ok: bilingual medication vocabulary (content)
      { he: 'תרופות נוספות מערכת העיכול',       en: 'Other GI' }, // i18n-ok: bilingual medication vocabulary (content)
    ],
  },
  {
    category: 'מערכת הנשימה', // i18n-ok: bilingual medication vocabulary (content)
    categoryEn: 'Respiratory system',
    color: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/5',
    items: [
      { he: 'מרפי סימפונות', en: 'Bronchial relaxants' }, // i18n-ok: bilingual medication vocabulary (content)
    ],
  },
  {
    category: 'מערכת המין והשתן', // i18n-ok: bilingual medication vocabulary (content)
    categoryEn: 'Genitourinary',
    color: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-400/30',
    bg: 'bg-purple-400/5',
    items: [
      { he: 'תרופות לטיפול בערמונית',    en: 'Prostate acting preparations' }, // i18n-ok: bilingual medication vocabulary (content)
      { he: 'הפרעות הקשורות בגיל המעבר', en: 'Menopausal disorders' }, // i18n-ok: bilingual medication vocabulary (content)
      { he: 'תרופות נוספות במערכת',      en: 'Other genitourinary' }, // i18n-ok: bilingual medication vocabulary (content)
    ],
  },
  {
    category: 'מחלות זיהומיות', // i18n-ok: bilingual medication vocabulary (content)
    categoryEn: 'Infectious dis',
    color: 'text-green-800 dark:text-green-400',
    border: 'border-green-400/30',
    bg: 'bg-green-400/5',
    items: [
      { he: 'אנטיביוטיקה',  en: 'Antibiotics' }, // i18n-ok: bilingual medication vocabulary (content)
      { he: 'טיפול באיידס', en: 'Anti HIV' }, // i18n-ok: bilingual medication vocabulary (content)
    ],
  },
];

const FLASHCARD_DATA: FlashcardItem[] = CATEGORIES.flatMap((cat) =>
  cat.items.map((item) => ({
    front: item.he,
    back: `${item.en} · ${cat.category}`,
  }))
);

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MedicationsModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [query, setQuery] = useState('');
  const [trainerOpen, setTrainerOpen] = useState(false);
  const t = useTranslation();
  const { isEn } = useLanguage();

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? CATEGORIES.flatMap((cat) =>
        cat.items
          .filter((item) => item.he.includes(q) || item.en.toLowerCase().includes(q))
          .map((item) => ({ ...item, color: cat.color, border: cat.border }))
      )
    : null;

  const Row = ({
    he,
    en,
    borderClass,
  }: {
    he: string;
    en: string;
    borderClass?: string;
  }) => (
    <div className={['flex justify-between items-center px-4 py-3', borderClass ?? ''].join(' ')}>
      <span className="text-sm font-bold text-fg">{he}</span>
      <span className="text-sm font-bold text-fg-muted font-mono" dir="ltr">{en}</span>
    </div>
  );

  return (
    <>
    <div className="fixed inset-0 z-[9999] flex flex-col bg-page">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Pill size={22} className="text-teal-700 dark:text-teal-400" />
          <h2 className="text-fg font-bold text-xl">{t('homeMedGroupsTitle')}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-surface-2 border border-line
                     flex items-center justify-center active:scale-90 transition-transform
                     text-fg-muted hover:text-fg"
          aria-label={t('close')}
        >
          <X size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="relative">
          <Search
            size={16}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
          />
          <input
            type="text"
            placeholder={t('homeMedSearchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-line
                       bg-surface text-fg
                       placeholder:text-fg-subtle
                       pe-3 ps-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">

        {/* Flashcard trainer trigger */}
        <button
          onClick={() => setTrainerOpen(true)}
          className="w-full rounded-2xl border border-teal-400/30 bg-teal-500/8 dark:bg-teal-500/10
                     backdrop-blur-sm px-4 py-3.5 flex items-center gap-3
                     active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
            <Brain size={20} className="text-teal-700 dark:text-teal-400" />
          </div>
          <div className="flex flex-col items-start text-start">
            <span className="text-teal-700 dark:text-teal-200 font-bold text-base leading-tight">{t('homeMedStartTraining')}</span>
            <span className="text-teal-700 dark:text-teal-300/50 text-xs mt-0.5">{t('homeMedCardsCount', { count: FLASHCARD_DATA.length })}</span>
          </div>
          <div className="ms-auto text-teal-700 dark:text-teal-400/40 text-lg ltr:rotate-180">←</div>
        </button>

        {filtered ? (
          <div className="rounded-2xl border border-line overflow-hidden">
            {filtered.length === 0 ? (
              <p className="text-center text-fg-subtle py-8 text-sm">{t('noResults')}</p>
            ) : (
              filtered.map((item, i) => (
                <Row
                  key={`${item.en}-${i}`}
                  he={item.he}
                  en={item.en}
                  borderClass={i < filtered.length - 1 ? 'border-b border-line' : ''}
                />
              ))
            )}
          </div>
        ) : (
          CATEGORIES.map((cat) => (
            <div key={cat.categoryEn}>
              <h3 className={`text-xs font-black uppercase tracking-widest ${cat.color} mb-2 pe-1`}>
                {isEn ? cat.categoryEn : cat.category}
                <span className="font-normal normal-case tracking-normal ms-1 opacity-60">· {isEn ? cat.category : cat.categoryEn}</span>
              </h3>
              <div className={`rounded-2xl border ${cat.border} ${cat.bg} overflow-hidden`}>
                {cat.items.map((item, i) => (
                  <Row
                    key={item.en}
                    he={item.he}
                    en={item.en}
                    borderClass={i < cat.items.length - 1 ? `border-b ${cat.border}` : ''}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>

    {trainerOpen && (
      <FlashcardTrainer data={FLASHCARD_DATA} onClose={() => setTrainerOpen(false)} />
    )}
    </>
  );
}
