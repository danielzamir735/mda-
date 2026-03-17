import { useState } from 'react';
import { X, BookHeart, Search, Plus, Trash2, Tablet, BookOpen } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { MEDICAL_CATEGORIES, TABLET_CATEGORIES } from '../data/medicalTerms';
import { useMedicalHistoryStore } from '../../../store/medicalHistoryStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MedicalHistoryModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [query, setQuery] = useState('');
  const [newHe, setNewHe] = useState('');
  const [newEn, setNewEn] = useState('');
  const [view, setView] = useState<'general' | 'tablet'>('general');
  const { customItems, addItem, removeItem } = useMedicalHistoryStore();

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? [
        ...MEDICAL_CATEGORIES.flatMap((cat) =>
          cat.terms
            .filter((t) => t.he.includes(q) || t.en.toLowerCase().includes(q))
            .map((t) => ({ ...t, isCustom: false, id: undefined as string | undefined }))
        ),
        ...customItems
          .filter((i) => i.he.includes(q) || i.en.toLowerCase().includes(q))
          .map((i) => ({ he: i.he, en: i.en, isCustom: true, id: i.id })),
      ]
    : null;

  const handleAdd = () => {
    const he = newHe.trim();
    const en = newEn.trim();
    if (!he || !en) return;
    addItem(he, en);
    setNewHe('');
    setNewEn('');
  };

  const Row = ({
    he,
    en,
    isCustom,
    id,
    border,
  }: {
    he: string;
    en: string;
    isCustom?: boolean;
    id?: string;
    border?: string;
  }) => (
    <div
      className={[
        'flex justify-between items-center px-4 py-3',
        border ?? '',
      ].join(' ')}
    >
      {/* Hebrew → RIGHT (first child in RTL = right) */}
      <span className="text-sm font-bold text-gray-900 dark:text-white">{he}</span>
      <div className="flex items-center gap-2">
        {/* English → LEFT (last child in RTL = left) */}
        <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">{en}</span>
        {isCustom && id && (
          <button
            onClick={() => removeItem(id)}
            className="text-red-400 hover:text-red-600 active:scale-90 transition-all"
            aria-label="מחק"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <BookHeart size={22} className="text-purple-400" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מחלות רקע נפוצות</h2>
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

      {/* View Toggle */}
      <div className="shrink-0 flex gap-2 px-4 pt-3">
        <button
          onClick={() => setView('general')}
          className={[
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all',
            view === 'general'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 dark:bg-emt-gray text-gray-500 dark:text-emt-muted',
          ].join(' ')}
        >
          <BookOpen size={13} />
          כללי
        </button>
        <button
          onClick={() => setView('tablet')}
          className={[
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all',
            view === 'tablet'
              ? 'bg-white/10 text-white border border-white/20'
              : 'bg-gray-100 dark:bg-emt-gray text-gray-500 dark:text-emt-muted',
          ].join(' ')}
        >
          <Tablet size={13} />
          מחלות רקע מהטאבלט
        </button>
      </div>

      {/* Search — general view only */}
      {view === 'general' && <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-emt-muted pointer-events-none" />
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
      </div>}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {view === 'tablet' ? (
          <>
            <p className="text-xs text-gray-400 dark:text-emt-muted pr-1">
              מחלות רקע לפי בחירות בטאבלט האמבולנס
            </p>
            {TABLET_CATEGORIES.map((cat) => (
              <div key={cat.category}>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-100 mb-2 pr-1">
                  {cat.category}
                </h3>
                <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                  {cat.items.map((item, i) => (
                    <div
                      key={item.abbr}
                      className={[
                        'flex items-center justify-between px-4 py-3',
                        i < cat.items.length - 1 ? 'border-b border-white/10' : '',
                      ].join(' ')}
                    >
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{item.he}</span>
                      <div className="flex items-center gap-2 text-left" dir="ltr">
                        <span className="text-xs text-gray-400 dark:text-gray-400">{item.en}</span>
                        <span className="text-xs font-black font-mono bg-white/10 text-white px-2 py-0.5 rounded-md whitespace-nowrap">
                          {item.abbr}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : filtered ? (
          <div className="rounded-2xl border border-gray-200 dark:border-emt-border overflow-hidden">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-emt-muted py-8 text-sm">לא נמצאו תוצאות</p>
            ) : (
              filtered.map((t, i) => (
                <Row
                  key={`${t.en}-${i}`}
                  he={t.he}
                  en={t.en}
                  isCustom={t.isCustom}
                  id={t.id}
                  border={i < filtered.length - 1 ? 'border-b border-gray-200 dark:border-emt-border' : ''}
                />
              ))
            )}
          </div>
        ) : (
          <>
            {MEDICAL_CATEGORIES.map((cat) => (
              <div key={cat.title}>
                <h3 className={`text-xs font-black uppercase tracking-widest ${cat.color} mb-2 pr-1`}>
                  {cat.title}
                </h3>
                <div className={`rounded-2xl border ${cat.border} ${cat.bg} overflow-hidden`}>
                  {cat.terms.map((t, i) => (
                    <Row
                      key={t.en}
                      he={t.he}
                      en={t.en}
                      border={i < cat.terms.length - 1 ? `border-b ${cat.border}` : ''}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Custom items */}
            {customItems.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 mb-2 pr-1">
                  מחלות מותאמות אישית
                </h3>
                <div className="rounded-2xl border border-purple-400/30 bg-purple-400/5 overflow-hidden">
                  {customItems.map((item, i) => (
                    <Row
                      key={item.id}
                      he={item.he}
                      en={item.en}
                      isCustom
                      id={item.id}
                      border={i < customItems.length - 1 ? 'border-b border-purple-400/20' : ''}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Add custom item form — general view only */}
        {view === 'general' && <div className="rounded-2xl border border-dashed border-gray-300 dark:border-emt-border p-3 space-y-2">
          <p className="text-xs font-bold text-gray-500 dark:text-emt-muted flex items-center gap-1">
            <Plus size={13} />
            הוסף מחלה מותאמת אישית
          </p>
          <input
            type="text"
            placeholder="שם בעברית..."
            value={newHe}
            onChange={(e) => setNewHe(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-emt-border
                       bg-white dark:bg-emt-gray text-gray-900 dark:text-emt-light
                       px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/40
                       placeholder-gray-400 dark:placeholder-emt-muted"
          />
          <input
            type="text"
            placeholder="Name in English..."
            value={newEn}
            onChange={(e) => setNewEn(e.target.value)}
            dir="ltr"
            className="w-full rounded-lg border border-gray-200 dark:border-emt-border
                       bg-white dark:bg-emt-gray text-gray-900 dark:text-emt-light
                       px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/40
                       placeholder-gray-400 dark:placeholder-emt-muted"
          />
          <button
            onClick={handleAdd}
            disabled={!newHe.trim() || !newEn.trim()}
            className="w-full py-2 rounded-lg bg-purple-500 text-white font-bold text-sm
                       active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          >
            הוסף
          </button>
        </div>}
      </div>
    </div>
  );
}
