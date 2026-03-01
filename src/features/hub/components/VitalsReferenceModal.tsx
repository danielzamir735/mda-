import { X, BookOpen } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

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

export default function VitalsReferenceModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
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

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="w-full rounded-2xl border border-gray-200 dark:border-emt-border overflow-hidden">

          {/* Column headers */}
          <div className="grid grid-cols-4 bg-gray-200 dark:bg-emt-gray border-b-2 border-gray-300 dark:border-emt-border">
            {HEADERS.map((h) => (
              <div key={h} className="px-3 py-4 text-base font-black text-gray-700 dark:text-emt-light text-center">
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
                  : 'bg-blue-50 dark:bg-white/[0.05]',
                i < ROWS.length - 1 ? 'border-b border-gray-200 dark:border-emt-border' : '',
              ].join(' ')}
            >
              {/* Vital name cell */}
              <div className="px-4 py-4 text-base font-bold text-gray-900 dark:text-emt-light text-right flex items-center border-l border-gray-200 dark:border-emt-border">
                {row.label}
              </div>

              {/* Value cells */}
              {[row.adult, row.child, row.infant].map((val, j) => (
                <div
                  key={j}
                  className={[
                    'px-3 py-4 text-lg tabular-nums font-semibold text-center flex items-center justify-center',
                    'text-gray-700 dark:text-emt-muted',
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
  );
}
