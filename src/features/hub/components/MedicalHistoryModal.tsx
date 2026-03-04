import { useState } from 'react';
import { X, Languages, Search } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { MEDICAL_CATEGORIES } from '../data/medicalTerms';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MedicalHistoryModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? MEDICAL_CATEGORIES.flatMap((cat) =>
        cat.terms
          .filter((t) => t.he.includes(q) || t.en.toLowerCase().includes(q))
          .map((t) => ({ ...t, category: cat.title }))
      )
    : null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <Languages size={22} className="text-purple-400" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">תרגום מחלות רקע</h2>
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
            placeholder="חפש מחלה בעברית או באנגלית..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-emt-border
                       bg-white dark:bg-emt-gray text-gray-900 dark:text-emt-light
                       placeholder-gray-400 dark:placeholder-emt-muted
                       pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/40"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {filtered ? (
          /* Search results */
          <div className="rounded-2xl border border-gray-200 dark:border-emt-border overflow-hidden">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-emt-muted py-8 text-sm">לא נמצאו תוצאות</p>
            ) : (
              filtered.map((t, i) => (
                <div
                  key={`${t.en}-${i}`}
                  className={[
                    'flex justify-between items-center px-4 py-3',
                    i < filtered.length - 1 ? 'border-b border-gray-200 dark:border-emt-border' : '',
                    i % 2 === 0 ? 'bg-white dark:bg-emt-dark' : 'bg-gray-50 dark:bg-emt-gray/40',
                  ].join(' ')}
                >
                  {/* English → RIGHT in RTL layout (first child = flex-start = right) */}
                  <span className="text-sm font-mono text-gray-500 dark:text-emt-muted">{t.en}</span>
                  {/* Hebrew → LEFT in RTL layout (last child = flex-end = left) */}
                  <span className="text-sm font-bold text-gray-900 dark:text-emt-light">{t.he}</span>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Grouped by category */
          MEDICAL_CATEGORIES.map((cat) => (
            <div key={cat.title}>
              <h3 className={`text-xs font-black uppercase tracking-widest ${cat.color} mb-2 pr-1`}>
                {cat.title}
              </h3>
              <div className={`rounded-2xl border ${cat.border} ${cat.bg} overflow-hidden`}>
                {cat.terms.map((t, i) => (
                  <div
                    key={t.en}
                    className={[
                      'flex justify-between items-center px-4 py-3',
                      i < cat.terms.length - 1 ? `border-b ${cat.border}` : '',
                    ].join(' ')}
                  >
                    {/* English → RIGHT (first in RTL flex = flex-start = right edge) */}
                    <span className="text-sm font-mono text-gray-500 dark:text-emt-muted">{t.en}</span>
                    {/* Hebrew → LEFT (last in RTL flex = flex-end = left edge) */}
                    <span className="text-sm font-bold text-gray-900 dark:text-emt-light">{t.he}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
