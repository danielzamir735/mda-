import { useState } from 'react';
import { X, Pill, Search } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

interface Med {
  name: string;
  generic: string;
  indication: string;
}

interface Category {
  title: string;
  color: string;
  border: string;
  bg: string;
  divider: string;
  items: Med[];
}

const CATEGORIES: Category[] = [
  {
    title: 'לב ולחץ דם',
    color: 'text-red-400',
    border: 'border-red-400/30',
    bg: 'bg-red-400/5',
    divider: 'border-b border-red-400/20',
    items: [
      { name: 'אספירין / קרטיה / מיקרופירין', generic: 'Aspirin', indication: 'מדלל דם (מונע צימוד טסיות), למניעת התקפי לב ושבץ' },
      { name: 'קרדילוק', generic: 'Bisoprolol', indication: 'הורדת דופק ולחץ דם (חסם בטא)' },
      { name: 'אליקוויס / קסרלטו', generic: 'Apixaban / Rivaroxaban', indication: 'נוגדי קרישה (מדללי דם חזקים), לפרפור עליות או קרישי דם' },
      { name: 'פלביקס', generic: 'Clopidogrel', indication: 'מדלל דם, לרוב לאחר צנתור או אירוע מוחי' },
      { name: 'טריטייס / רמיפריל', generic: 'Ramipril', indication: 'הורדת לחץ דם (מעכב ACE), אי ספיקת לב' },
      { name: 'נורווסק / אמלודיפין', generic: 'Amlodipine', indication: 'הורדת לחץ דם (חסם תעלות סידן)' },
      { name: 'פוסיד / קלוריל', generic: 'Furosemide / Thiazide', indication: 'תרופות משתנות - לבצקות, אי ספיקת לב ויתר לחץ דם' },
    ],
  },
  {
    title: 'סוכרת ובלוטות',
    color: 'text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/5',
    divider: 'border-b border-amber-400/20',
    items: [
      { name: "גלוקופאג' / יוקריאס", generic: 'Metformin', indication: 'סוכרת סוג 2' },
      { name: "ג'ארדיאנס / פורסיגה", generic: 'Empagliflozin / Dapagliflozin', indication: 'סוכרת, וגם אי ספיקת לב' },
      { name: 'אינסולין', generic: 'Insulin', indication: 'סוכרת (תלוית אינסולין)' },
      { name: 'אלטרוקסין / יותירוקס', generic: 'Levothyroxine', indication: 'תת-פעילות בלוטת התריס' },
    ],
  },
  {
    title: 'כולסטרול ועיכול',
    color: 'text-emerald-400',
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-400/5',
    divider: 'border-b border-emerald-400/20',
    items: [
      { name: 'ליפיטור / סימבסטטין', generic: 'Statins', indication: 'הורדת כולסטרול ושומנים בדם' },
      { name: 'אומפרדקס / לוסק', generic: 'Omeprazole', indication: 'הפחתת חומציות בקיבה (צרבות, כיב קיבה)' },
    ],
  },
  {
    title: 'נשימה',
    color: 'text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/5',
    divider: 'border-b border-sky-400/20',
    items: [
      { name: 'ונטולין / סימביקורט / אירובנט', generic: 'Inhalers', indication: 'מרחיבי סמפונות לאסטמה או COPD' },
    ],
  },
];

function MedCard({ name, generic, indication, divider = '' }: Med & { divider?: string }) {
  return (
    <div className={`px-4 py-3 ${divider}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{name}</span>
        <span className="shrink-0 text-xs font-mono text-gray-400 dark:text-emt-muted mt-0.5" dir="ltr">{generic}</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-emt-muted leading-relaxed">{indication}</p>
    </div>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommonMedsModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [query, setQuery] = useState('');
  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? CATEGORIES.flatMap((c) =>
        c.items.filter(
          (m) =>
            m.name.includes(q) ||
            m.generic.toLowerCase().includes(q) ||
            m.indication.includes(q)
        )
      )
    : null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <Pill size={22} className="text-emerald-400" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">תרופות נפוצות</h2>
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
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-emt-muted pointer-events-none" />
          <input
            type="text"
            placeholder="חפש תרופה, שם גנרי או אינדיקציה..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-emt-border
                       bg-white dark:bg-emt-gray text-gray-900 dark:text-emt-light
                       placeholder-gray-400 dark:placeholder-emt-muted
                       pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {filtered ? (
          filtered.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-emt-muted py-8 text-sm">לא נמצאו תוצאות</p>
          ) : (
            <div className="rounded-2xl border border-gray-200 dark:border-emt-border overflow-hidden">
              {filtered.map((m, i) => (
                <MedCard
                  key={m.name}
                  {...m}
                  divider={i < filtered.length - 1 ? 'border-b border-gray-200 dark:border-emt-border' : ''}
                />
              ))}
            </div>
          )
        ) : (
          CATEGORIES.map((cat) => (
            <div key={cat.title}>
              <h3 className={`text-xs font-black uppercase tracking-widest ${cat.color} mb-2 pr-1`}>
                {cat.title}
              </h3>
              <div className={`rounded-2xl border ${cat.border} ${cat.bg} overflow-hidden`}>
                {cat.items.map((m, i) => (
                  <MedCard
                    key={m.name}
                    {...m}
                    divider={i < cat.items.length - 1 ? cat.divider : ''}
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
