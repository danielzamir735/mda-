import { useState, useEffect } from 'react';
import { X, BookOpen, Brain } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import FlashcardTrainer, { type FlashcardItem } from '../../../components/FlashcardTrainer';
import { trackInteraction, trackEvent } from '../../../utils/analytics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const HEADERS = ['מדד', 'מבוגר', 'ילד', 'תינוק'];

const ROWS = [
  { label: 'נשימה (לדקה)',       adult: '12–20',  child: '18–30',  infant: '24–40'  },
  { label: 'דופק (לדקה)',         adult: '60–100', child: '60–140', infant: '100–190'},
  { label: 'לחץ דם סיסטולי',     adult: '90–140', child: '90–110', infant: '60–90'  },
  { label: 'לחץ דם דיאסטולי',    adult: '60–90',  child: '50–80',  infant: '40–60'  },
  { label: 'לחץ דופק',           adult: '30–60',  child: '30–60',  infant: '30–60'  },
  { label: 'סוכר (mg/dL)',        adult: '60–110', child: '60–110', infant: '60–110' },
];

const FLASHCARD_DATA: FlashcardItem[] = ROWS.flatMap((row) => [
  {
    front: `${row.label} — מבוגר`,
    back: row.adult,
  },
  {
    front: `${row.label} — ילד`,
    back: row.child,
  },
  {
    front: `${row.label} — תינוק`,
    back: row.infant,
  },
]);

export default function VitalsReferenceModal({ isOpen, onClose }: Props) {
  const [trainerOpen, setTrainerOpen] = useState(false);
  useModalBackHandler(isOpen, onClose);

  useEffect(() => {
    if (isOpen) trackInteraction('vitals_reference', 'reference');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark">
        {/* Header */}
        <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
          <div className="flex items-center gap-2">
            <BookOpen size={22} className="text-blue-400" />
            <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">טבלת מדדים</h2>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4" dir="rtl">

          {/* ── Flashcard Trainer Trigger ── */}
          <button
            onClick={() => { setTrainerOpen(true); trackEvent('open_flashcard_trainer', { tool: 'vitals_reference' }); }}
            className="w-full mb-4 rounded-2xl border border-purple-400/30 bg-purple-500/8 dark:bg-purple-500/10
                       backdrop-blur-sm px-4 py-3.5 flex items-center gap-3
                       active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
              <Brain size={20} className="text-purple-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-purple-200 font-bold text-base leading-tight">התחל אימון שינון</span>
              <span className="text-purple-300/50 text-xs mt-0.5">{FLASHCARD_DATA.length} כרטיסיות · מדדים לפי גיל</span>
            </div>
            <div className="mr-auto text-purple-400/40 text-lg">←</div>
          </button>

          {/* Table */}
          <div className="w-full rounded-2xl border border-gray-200 dark:border-emt-border overflow-hidden">

            {/* Column headers */}
            <div className="grid grid-cols-4 bg-blue-600 dark:bg-blue-900 border-b-2 border-blue-700 dark:border-blue-800">
              {HEADERS.map((h) => (
                <div key={h} className="px-3 py-4 text-base font-black text-white text-center">
                  {h}
                </div>
              ))}
            </div>

            {/* Data rows */}
            {ROWS.map((row, i) => (
              <div
                key={row.label}
                className={[
                  'grid grid-cols-4 items-stretch',
                  i % 2 === 0
                    ? 'bg-white dark:bg-emt-dark'
                    : 'bg-blue-50 dark:bg-blue-950/40',
                  i < ROWS.length - 1 ? 'border-b border-gray-200 dark:border-emt-border' : '',
                ].join(' ')}
              >
                {/* Vital name cell */}
                <div className="px-4 py-4 text-base font-black text-blue-700 dark:text-blue-300 text-right flex items-center border-l border-gray-200 dark:border-emt-border bg-blue-50/60 dark:bg-blue-950/30">
                  {row.label}
                </div>

                {/* Value cells */}
                {[row.adult, row.child, row.infant].map((val, j) => (
                  <div
                    key={j}
                    className={[
                      'px-3 py-4 text-lg tabular-nums font-semibold text-center flex items-center justify-center',
                      'text-gray-800 dark:text-emt-light',
                      j < 2 ? 'border-l border-gray-200 dark:border-emt-border' : '',
                    ].join(' ')}
                  >
                    {val}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 dark:text-emt-border text-center mt-4 leading-relaxed">
            * ערכי ייחוס בלבד — אין להחליף שיקול דעת קליני
          </p>
        </div>
      </div>

      {/* Flashcard Trainer overlay */}
      {trainerOpen && (
        <FlashcardTrainer
          data={FLASHCARD_DATA}
          onClose={() => setTrainerOpen(false)}
        />
      )}
    </>
  );
}
