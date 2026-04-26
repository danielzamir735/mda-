import { useState, useEffect } from 'react';
import { X, Pill, Search, Brain } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import FlashcardTrainer, { type FlashcardItem } from '../../../components/FlashcardTrainer';
import { trackInteraction, trackEvent } from '../../../utils/analytics';

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
      { name: 'קרדילוק (Cardiloc)', generic: 'Bisoprolol', indication: 'הורדת לחץ דם, האטת דופק (חוסמי בטא)' },
      { name: 'אמלודיפין / נורבסק', generic: 'Amlodipine', indication: 'הורדת לחץ דם (חוסמי תעלות סידן)' },
      { name: 'פוסיד / קלארין', generic: 'Furosemide', indication: 'טיפול בבצקות ואי ספיקת לב, הוצאת נוזלים בשתן' },
    ],
  },
  {
    title: 'מדללי דם',
    color: 'text-rose-400',
    border: 'border-rose-400/30',
    bg: 'bg-rose-400/5',
    divider: 'border-b border-rose-400/20',
    items: [
      { name: 'קרטיה / מיקרופירין', generic: 'Aspirin', indication: 'מניעת קרישי דם (מונע צימות טסיות)' },
      { name: 'אליקוויס / קסרלטו', generic: 'Apixaban / Rivaroxaban', indication: 'מדללי דם חדשים (NOAC) למניעת קרישים (לרוב בפרפור עליות)' },
      { name: 'פלאביקס', generic: 'Clopidogrel', indication: 'מניעת קרישי דם (לרוב לאחר צנתור)' },
    ],
  },
  {
    title: 'סוכרת ובלוטות',
    color: 'text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/5',
    divider: 'border-b border-amber-400/20',
    items: [
      { name: "מטפורמין / גלוקופאז'", generic: 'Metformin', indication: 'איזון סוכר בדם (סוכרת סוג 2)' },
      { name: "ג'ארדיאנס", generic: 'Empagliflozin', indication: 'הפרשת סוכר בשתן, מגן על הלב והכליות' },
      { name: 'אלטרוקסין / יוטירוקס', generic: 'Levothyroxine', indication: 'הורמון חלופי לתת-פעילות בלוטת התריס' },
    ],
  },
  {
    title: 'נשימה',
    color: 'text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/5',
    divider: 'border-b border-sky-400/20',
    items: [
      { name: 'ונטולין / אירובנט', generic: 'Salbutamol / Ipratropium', indication: 'הרחבת סמפונות (אסטמה / COPD)' },
      { name: 'סימביקורט', generic: 'Budesonide + Formoterol', indication: 'משאף משולב: סטרואידים + מרחיב סמפונות ארוך טווח' },
    ],
  },
  {
    title: 'שיכוך כאבים',
    color: 'text-violet-400',
    border: 'border-violet-400/30',
    bg: 'bg-violet-400/5',
    divider: 'border-b border-violet-400/20',
    items: [
      { name: 'אופטלגין', generic: 'Metamizole', indication: 'הורדת חום ושיכוך כאב בינוני-חזק' },
      { name: 'טרמדקס / טרמאל', generic: 'Tramadol', indication: 'משכך כאבים נרקוטי קל-בינוני' },
    ],
  },
  {
    title: 'שומנים ועיכול',
    color: 'text-emerald-400',
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-400/5',
    divider: 'border-b border-emerald-400/20',
    items: [
      { name: 'ליפיטור / סימבסטטין', generic: 'Atorvastatin / Simvastatin', indication: 'הורדת כולסטרול בדם' },
      { name: 'אומפרדקס / לוסק', generic: 'Omeprazole', indication: 'הורדת חומציות בקיבה (צרבות, כיבים)' },
    ],
  },
];

const FLASHCARD_DATA: FlashcardItem[] = CATEGORIES.flatMap((cat) =>
  cat.items.map((m) => ({
    front: m.name,
    back: `${m.indication}\n(${m.generic})`,
  }))
);

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
  const [trainerOpen, setTrainerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) trackInteraction('common_meds', 'reference');
  }, [isOpen]);

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
    <>
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

        {/* Flashcard trainer trigger */}
        <button
          onClick={() => { setTrainerOpen(true); trackEvent('open_flashcard_trainer', { tool: 'common_meds' }); }}
          className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/8 dark:bg-emerald-500/10
                     backdrop-blur-sm px-4 py-3.5 flex items-center gap-3
                     active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Brain size={20} className="text-emerald-400" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-emerald-200 font-bold text-base leading-tight">התחל אימון שינון</span>
            <span className="text-emerald-300/50 text-xs mt-0.5">{FLASHCARD_DATA.length} כרטיסיות · תרופות נפוצות</span>
          </div>
          <div className="mr-auto text-emerald-400/40 text-lg">←</div>
        </button>

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

    {trainerOpen && (
      <FlashcardTrainer data={FLASHCARD_DATA} onClose={() => setTrainerOpen(false)} />
    )}
    </>
  );
}
