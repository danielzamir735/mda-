import { useState } from 'react';
import { X, Pill, Search } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';

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
    category: 'מערכת הלב וכלי הדם',
    categoryEn: 'Cardiovascular system',
    color: 'text-red-400',
    border: 'border-red-400/30',
    bg: 'bg-red-400/5',
    items: [
      { he: 'נוגדי הפרעות קצב',     en: 'Antiarrhythmics' },
      { he: 'טיפול בתסמונת כלילית', en: 'Antianginals' },
      { he: 'הורדת לחץ דם',          en: 'Antihypertensives' },
      { he: 'נוגד צימוד טסיות',      en: 'Antiagregants' },
      { he: 'נוגד קרישה',            en: 'Anticoagulants' },
      { he: 'תרופות משתנות',         en: 'Diuretics' },
      { he: 'תרופות נוספות במערכת',  en: 'Other cardiovascular' },
    ],
  },
  {
    category: 'מערכת העיכול',
    categoryEn: 'Alimentary system',
    color: 'text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/5',
    items: [
      { he: 'נוגדי חומצה',                     en: 'Antacids' },
      { he: 'תרופות משלשלות',                   en: 'Laxatives' },
      { he: 'תרופות נוספות מערכת העיכול',       en: 'Other GI' },
    ],
  },
  {
    category: 'מערכת הנשימה',
    categoryEn: 'Respiratory system',
    color: 'text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/5',
    items: [
      { he: 'מרפי סימפונות', en: 'Bronchial relaxants' },
    ],
  },
  {
    category: 'מערכת המין והשתן',
    categoryEn: 'Genitourinary',
    color: 'text-purple-400',
    border: 'border-purple-400/30',
    bg: 'bg-purple-400/5',
    items: [
      { he: 'תרופות לטיפול בערמונית',    en: 'Prostate acting preparations' },
      { he: 'הפרעות הקשורות בגיל המעבר', en: 'Menopausal disorders' },
      { he: 'תרופות נוספות במערכת',      en: 'Other genitourinary' },
    ],
  },
  {
    category: 'מחלות זיהומיות',
    categoryEn: 'Infectious dis',
    color: 'text-green-400',
    border: 'border-green-400/30',
    bg: 'bg-green-400/5',
    items: [
      { he: 'אנטיביוטיקה',  en: 'Antibiotics' },
      { he: 'טיפול באיידס', en: 'Anti HIV' },
    ],
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MedicationsModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [query, setQuery] = useState('');

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
      <span className="text-sm font-bold text-gray-900 dark:text-white">{he}</span>
      <span className="text-sm font-bold text-gray-500 dark:text-emt-muted font-mono" dir="ltr">{en}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <Pill size={22} className="text-teal-400" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">קבוצות תרופות</h2>
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
            placeholder="חפש תרופה בעברית או באנגלית..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-emt-border
                       bg-white dark:bg-emt-gray text-gray-900 dark:text-emt-light
                       placeholder-gray-400 dark:placeholder-emt-muted
                       pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {filtered ? (
          <div className="rounded-2xl border border-gray-200 dark:border-emt-border overflow-hidden">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-emt-muted py-8 text-sm">לא נמצאו תוצאות</p>
            ) : (
              filtered.map((item, i) => (
                <Row
                  key={`${item.en}-${i}`}
                  he={item.he}
                  en={item.en}
                  borderClass={i < filtered.length - 1 ? 'border-b border-gray-200 dark:border-emt-border' : ''}
                />
              ))
            )}
          </div>
        ) : (
          CATEGORIES.map((cat) => (
            <div key={cat.categoryEn}>
              <h3 className={`text-xs font-black uppercase tracking-widest ${cat.color} mb-2 pr-1`}>
                {cat.category}
                <span className="font-normal normal-case tracking-normal mr-1 opacity-60">· {cat.categoryEn}</span>
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
  );
}
