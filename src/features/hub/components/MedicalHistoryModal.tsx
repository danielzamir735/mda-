import { useState, useEffect } from 'react';
import { X, BookHeart, Search, Plus, Trash2, Tablet, BookOpen, ChevronDown, Brain } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackInteraction, trackEvent } from '../../../utils/analytics';
import { MEDICAL_CATEGORIES, TABLET_CATEGORIES } from '../data/medicalTerms';
import { useMedicalHistoryStore } from '../../../store/medicalHistoryStore';
import FlashcardTrainer, { type FlashcardItem } from '../../../components/FlashcardTrainer';
import { useTranslation } from '../../../i18n';

const FLASHCARD_DATA: FlashcardItem[] = MEDICAL_CATEGORIES.flatMap((cat) =>
  cat.terms.map((t) => ({
    front: t.he,
    back: t.description ? `${t.en} — ${t.description}` : t.en,
  }))
);

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MedicalHistoryModal({ isOpen, onClose }: Props) {
  const t = useTranslation();
  useModalBackHandler(isOpen, onClose);
  const [query, setQuery] = useState('');
  const [newHe, setNewHe] = useState('');
  const [newEn, setNewEn] = useState('');
  const [view, setView] = useState<'general' | 'tablet'>('general');
  const [expandedDiseaseId, setExpandedDiseaseId] = useState<string | null>(null);
  const [trainerOpen, setTrainerOpen] = useState(false);
  const { customItems, addItem, removeItem } = useMedicalHistoryStore();

  useEffect(() => {
    if (isOpen) trackInteraction('מחלות רקע נפוצות', 'reference'); // i18n-ok: fixed analytics label
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? [
        ...MEDICAL_CATEGORIES.flatMap((cat) =>
          cat.terms
            .filter((term) => term.he.includes(q) || term.en.toLowerCase().includes(q))
            .map((term) => ({ ...term, isCustom: false, id: undefined as string | undefined }))
        ),
        ...customItems
          .filter((i) => i.he.includes(q) || i.en.toLowerCase().includes(q))
          .map((i) => ({ he: i.he, en: i.en, isCustom: true, id: i.id, description: undefined as string | undefined })),
      ]
    : null;

  const handleAdd = () => {
    const he = newHe.trim();
    const en = newEn.trim();
    if (!he || !en) return;
    addItem(he, en);
    setNewHe('');
    setNewEn('');
    trackEvent('medical_history_add_custom');
  };

  const Row = ({
    he,
    en,
    isCustom,
    id,
    border,
    description,
  }: {
    he: string;
    en: string;
    isCustom?: boolean;
    id?: string;
    border?: string;
    description?: string;
  }) => {
    const isExpanded = !!description && expandedDiseaseId === he;
    return (
      <div className={border ?? ''}>
        {/* Main clickable row */}
        <div
          role={description ? 'button' : undefined}
          onClick={() => {
            if (description) setExpandedDiseaseId(isExpanded ? null : he);
          }}
          className={[
            'flex justify-between items-center px-4 py-3',
            description ? 'cursor-pointer active:bg-fg/5 transition-colors select-none' : '',
          ].join(' ')}
        >
          {/* Hebrew label → RIGHT in RTL */}
          <span className="text-sm font-bold text-fg">{he}</span>
          <div className="flex items-center gap-2">
            {/* English label → LEFT in RTL */}
            <span className="text-sm font-bold text-fg font-mono" dir="ltr">{en}</span>
            {isCustom && id && (
              <button
                onClick={(e) => { e.stopPropagation(); removeItem(id); }}
                className="text-red-700 dark:text-red-400 hover:text-red-600 active:scale-90 transition-all"
                aria-label={t('delete')}
              >
                <Trash2 size={13} />
              </button>
            )}
            {description && (
              <ChevronDown
                size={15}
                className={[
                  'text-fg-subtle transition-transform duration-200 shrink-0',
                  isExpanded ? 'rotate-180' : '',
                ].join(' ')}
              />
            )}
          </div>
        </div>

        {/* Expanded description panel */}
        {isExpanded && (
          <div className="px-4 py-3 bg-surface-2 border-s-2 border-emerald-500">
            <p className="text-sm text-fg-muted leading-relaxed" dir="rtl">{description}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    <div className="fixed inset-0 z-[70] flex flex-col bg-page">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="flex items-center gap-2">
          <BookHeart size={22} className="text-purple-700 dark:text-purple-400" />
          <h2 className="text-fg font-bold text-xl">{t('mhTitle')}</h2>
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

      {/* View Toggle */}
      <div className="shrink-0 flex gap-2 px-4 pt-3">
        <button
          onClick={() => setView('general')}
          className={[
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all',
            view === 'general'
              ? 'bg-purple-500 text-white'
              : 'bg-surface-2 text-fg-muted',
          ].join(' ')}
        >
          <BookOpen size={13} />
          {t('mhGeneral')}
        </button>
        <button
          onClick={() => setView('tablet')}
          className={[
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all',
            view === 'tablet'
              ? 'bg-fg/10 text-fg border border-fg/20'
              : 'bg-surface-2 text-fg-muted',
          ].join(' ')}
        >
          <Tablet size={13} />
          {t('mhTablet')}
        </button>
      </div>

      {/* Search — general view only */}
      {view === 'general' && <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="relative">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
          <input
            type="text"
            placeholder={t('mhSearchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-line
                       bg-surface text-fg
                       placeholder-fg-subtle
                       ps-9 pe-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/40"
          />
        </div>
      </div>}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">

        {/* Flashcard trainer trigger — general view only */}
        {view === 'general' && (
          <button
            onClick={() => { setTrainerOpen(true); trackEvent('open_flashcard_trainer', { tool: 'medical_history' }); }}
            className="w-full rounded-2xl border border-purple-400/30 bg-purple-500/8 dark:bg-purple-500/10
                       backdrop-blur-sm px-4 py-3.5 flex items-center gap-3
                       active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
              <Brain size={20} className="text-purple-700 dark:text-purple-400" />
            </div>
            <div className="flex flex-col items-start text-start">
              <span className="text-purple-800 dark:text-purple-200 font-bold text-base leading-tight">{t('mhTrainerStart')}</span>
              <span className="text-purple-700 dark:text-purple-300/50 text-xs mt-0.5">{t('mhTrainerCount', { n: FLASHCARD_DATA.length })}</span>
            </div>
            <div className="ms-auto text-purple-700 dark:text-purple-400/40 text-lg ltr:rotate-180">←</div>
          </button>
        )}

        {view === 'tablet' ? (
          <>
            <p className="text-xs text-fg-muted ps-1">
              {t('mhTabletHint')}
            </p>
            {TABLET_CATEGORIES.map((cat) => (
              <div key={cat.category}>
                <h3 className="text-xs font-black uppercase tracking-widest text-fg-muted mb-2 ps-1">
                  {cat.category}
                </h3>
                <div className="rounded-2xl border border-line bg-surface overflow-hidden">
                  {cat.items.map((item, i) => (
                    <div
                      key={item.abbr}
                      className={[
                        'flex items-center justify-between px-4 py-3',
                        i < cat.items.length - 1 ? 'border-b border-line' : '',
                      ].join(' ')}
                    >
                      <span className="text-sm font-bold text-fg">{item.he}</span>
                      <div className="flex items-center gap-2 text-left" dir="ltr">
                        <span className="text-xs text-fg-muted">{item.en}</span>
                        <span className="text-xs font-black font-mono bg-fg/10 text-fg px-2 py-0.5 rounded-md whitespace-nowrap">
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
          <div className="rounded-2xl border border-line overflow-hidden">
            {filtered.length === 0 ? (
              <p className="text-center text-fg-subtle py-8 text-sm">{t('noResults')}</p>
            ) : (
              filtered.map((term, i) => (
                <Row
                  key={`${term.en}-${i}`}
                  he={term.he}
                  en={term.en}
                  isCustom={term.isCustom}
                  id={term.id}
                  description={term.description}
                  border={i < filtered.length - 1 ? 'border-b border-line' : ''}
                />
              ))
            )}
          </div>
        ) : (
          <>
            {MEDICAL_CATEGORIES.map((cat) => (
              <div key={cat.title}>
                <h3 className={`text-xs font-black uppercase tracking-widest ${cat.color} brightness-75 dark:brightness-100 mb-2 ps-1`}>
                  {cat.title}
                </h3>
                <div className={`rounded-2xl border ${cat.border} ${cat.bg} overflow-hidden`}>
                  {cat.terms.map((term, i) => (
                    <Row
                      key={term.en}
                      he={term.he}
                      en={term.en}
                      description={term.description}
                      border={i < cat.terms.length - 1 ? `border-b ${cat.border}` : ''}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Custom items */}
            {customItems.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-purple-700 dark:text-purple-400 mb-2 ps-1">
                  {t('mhCustomTitle')}
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
        {view === 'general' && <div className="rounded-2xl border border-dashed border-line-strong p-3 space-y-2">
          <p className="text-xs font-bold text-fg-muted flex items-center gap-1">
            <Plus size={13} />
            {t('mhAddCustom')}
          </p>
          <input
            type="text"
            placeholder={t('mhNameHe')}
            value={newHe}
            onChange={(e) => setNewHe(e.target.value)}
            dir="rtl"
            className="w-full rounded-lg border border-line
                       bg-surface text-fg
                       px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/40
                       placeholder-fg-subtle"
          />
          <input
            type="text"
            placeholder={t('mhNameEn')}
            value={newEn}
            onChange={(e) => setNewEn(e.target.value)}
            dir="ltr"
            className="w-full rounded-lg border border-line
                       bg-surface text-fg
                       px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/40
                       placeholder-fg-subtle"
          />
          <button
            onClick={handleAdd}
            disabled={!newHe.trim() || !newEn.trim()}
            className="w-full py-2 rounded-lg bg-purple-500 text-white font-bold text-sm
                       active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('add')}
          </button>
        </div>}
      </div>
    </div>

    {trainerOpen && (
      <FlashcardTrainer data={FLASHCARD_DATA} onClose={() => setTrainerOpen(false)} />
    )}
    </>
  );
}
