import { useState } from 'react';
import { X, Plus, Trash2, Brain, BookOpen, Sparkles, ChevronRight, Pencil, Folder, FolderPlus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';
import FlashcardTrainer from '../../../components/FlashcardTrainer';
import { useConceptsStore, type Concept } from '../../../store/conceptsStore';
import { trackEvent } from '../../../utils/analytics';
import { useTranslation, useLanguage } from '../../../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type View = 'list' | 'category' | 'add' | 'edit' | 'newCategory';

const CATEGORY_COLORS = [
  { key: 'purple', textClass: 'text-purple-700 dark:text-purple-300', bgClass: 'bg-purple-500/15', borderClass: 'border-purple-400/30', dotClass: 'bg-purple-400' },
  { key: 'blue', textClass: 'text-blue-700 dark:text-blue-300', bgClass: 'bg-blue-500/15', borderClass: 'border-blue-400/30', dotClass: 'bg-blue-400' },
  { key: 'emerald', textClass: 'text-emerald-700 dark:text-emerald-300', bgClass: 'bg-emerald-500/15', borderClass: 'border-emerald-400/30', dotClass: 'bg-emerald-400' },
  { key: 'amber', textClass: 'text-amber-800 dark:text-amber-300', bgClass: 'bg-amber-500/15', borderClass: 'border-amber-400/30', dotClass: 'bg-amber-400' },
  { key: 'rose', textClass: 'text-rose-700 dark:text-rose-300', bgClass: 'bg-rose-500/15', borderClass: 'border-rose-400/30', dotClass: 'bg-rose-400' },
  { key: 'cyan', textClass: 'text-cyan-700 dark:text-cyan-300', bgClass: 'bg-cyan-500/15', borderClass: 'border-cyan-400/30', dotClass: 'bg-cyan-400' },
  { key: 'indigo', textClass: 'text-indigo-700 dark:text-indigo-300', bgClass: 'bg-indigo-500/15', borderClass: 'border-indigo-400/30', dotClass: 'bg-indigo-400' },
  { key: 'orange', textClass: 'text-orange-700 dark:text-orange-300', bgClass: 'bg-orange-500/15', borderClass: 'border-orange-400/30', dotClass: 'bg-orange-400' },
];

function getCategoryStyle(colorKey: string) {
  return CATEGORY_COLORS.find((c) => c.key === colorKey) ?? CATEGORY_COLORS[0];
}

export default function ConceptsModal({ isOpen, onClose }: Props) {
  const {
    concepts, addConcept, deleteConcept, updateConcept, setConceptCategory,
    categories, addCategory, renameCategory, deleteCategory,
  } = useConceptsStore();
  const t = useTranslation();
  const { dir } = useLanguage();

  const [view, setView] = useState<View>('list');
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDeleteConfirm, setEditDeleteConfirm] = useState(false);
  const [categoryPickerForId, setCategoryPickerForId] = useState<string | null>(null);

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [categoryColorInput, setCategoryColorInput] = useState(CATEGORY_COLORS[0].key);
  const [isRenamingCategory, setIsRenamingCategory] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [categoryDeleteConfirm, setCategoryDeleteConfirm] = useState(false);

  const isFormView = view === 'add' || view === 'edit' || view === 'newCategory';

  // A single hook covering every non-list view — 'category', 'add', 'edit' and
  // 'newCategory' all swap into each other without the boolean passed to
  // useModalBackHandler ever toggling. Splitting these into separate hooks
  // (one per view) caused a race: swapping directly between two sibling views
  // unmounts one hook (which fires an async history.back()) while mounting
  // another (which pushes a new entry) in the same tick, and the delayed
  // popstate from the first then gets misattributed to the second, snapping
  // the view back to 'list'. Hardware back/swipe from any nested view now
  // always resets to the list; the in-app chevron buttons still navigate
  // step by step via direct onClick handlers.
  useModalBackHandler(isOpen, onClose);
  useModalBackHandler(isOpen && view !== 'list', goHome);

  function goHome() {
    setView('list');
    setActiveCategoryId(null);
    setCategoryDeleteConfirm(false);
    setIsRenamingCategory(false);
    clearFormFields();
  }

  function clearFormFields() {
    setTerm('');
    setDefinition('');
    setEditingId(null);
    setEditDeleteConfirm(false);
    setFormCategoryId(null);
  }

  function goBackFromForm() {
    setView(view === 'newCategory' ? 'list' : activeCategoryId ? 'category' : 'list');
    clearFormFields();
  }

  const openAdd = (categoryId: string | null) => {
    clearFormFields();
    setFormCategoryId(categoryId);
    setView('add');
  };

  const handleAdd = () => {
    if (!term.trim() || !definition.trim()) return;
    addConcept(term, definition, formCategoryId);
    trackEvent('concept_added');
    setView(activeCategoryId ? 'category' : 'list');
    clearFormFields();
  };

  const handleSaveEdit = () => {
    if (!term.trim() || !definition.trim() || !editingId) return;
    updateConcept(editingId, term, definition, formCategoryId);
    setView(activeCategoryId ? 'category' : 'list');
    clearFormFields();
  };

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      deleteConcept(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const handleEditDelete = () => {
    if (editDeleteConfirm) {
      if (editingId) deleteConcept(editingId);
      setView(activeCategoryId ? 'category' : 'list');
      clearFormFields();
    } else {
      setEditDeleteConfirm(true);
      setTimeout(() => setEditDeleteConfirm(false), 3000);
    }
  };

  const openEdit = (concept: Concept) => {
    setEditingId(concept.id);
    setTerm(concept.term);
    setDefinition(concept.definition);
    setFormCategoryId(concept.categoryId ?? null);
    setEditDeleteConfirm(false);
    setView('edit');
  };

  const handleCreateCategory = () => {
    if (!categoryNameInput.trim()) return;
    const id = addCategory(categoryNameInput, categoryColorInput);
    trackEvent('concept_category_created');
    setCategoryNameInput('');
    setCategoryColorInput(CATEGORY_COLORS[0].key);
    setActiveCategoryId(id);
    setView('category');
  };

  const handleDeleteCategory = () => {
    if (!activeCategoryId) return;
    if (categoryDeleteConfirm) {
      deleteCategory(activeCategoryId);
      goHome();
    } else {
      setCategoryDeleteConfirm(true);
      setTimeout(() => setCategoryDeleteConfirm(false), 3000);
    }
  };

  const startRenameCategory = () => {
    if (!activeCategory) return;
    setRenameInput(activeCategory.name);
    setIsRenamingCategory(true);
  };

  const confirmRenameCategory = () => {
    if (activeCategoryId && renameInput.trim()) renameCategory(activeCategoryId, renameInput);
    setIsRenamingCategory(false);
  };

  const activeCategory = categories.find((c) => c.id === activeCategoryId) ?? null;
  const uncategorizedConcepts = concepts.filter((c) => !c.categoryId);
  const categoryConcepts = activeCategoryId ? concepts.filter((c) => c.categoryId === activeCategoryId) : [];
  const flashcardSource = view === 'category' ? categoryConcepts : concepts;
  const flashcardData = flashcardSource.map((c) => ({ front: c.term, back: c.definition }));
  const canSave = view === 'newCategory' ? categoryNameInput.trim().length > 0 : term.trim().length > 0 && definition.trim().length > 0;

  if (!isOpen) return null;

  if (showFlashcards && flashcardSource.length > 0) {
    return <FlashcardTrainer data={flashcardData} onClose={() => setShowFlashcards(false)} />;
  }

  const renderConceptCard = (concept: Concept, index: number) => (
    <motion.div
      key={concept.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="relative rounded-2xl bg-surface border border-line overflow-visible"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p dir="auto" className="text-fg font-black text-[15px] leading-snug">{concept.term}</p>
            <p dir="auto" className="text-fg-muted text-[13px] leading-relaxed mt-1.5 whitespace-pre-wrap">{concept.definition}</p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <HapticButton
              onClick={() => setCategoryPickerForId(categoryPickerForId === concept.id ? null : concept.id)}
              hapticPattern={10}
              pressScale={0.9}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-fg/[0.08] border border-fg/15 text-fg-muted"
              aria-label={t('learnAssignCategory')}
            >
              <Folder size={14} />
            </HapticButton>
            <HapticButton
              onClick={() => openEdit(concept)}
              aria-label={t('learnEditConcept')}
              hapticPattern={10}
              pressScale={0.9}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-500/15 border border-purple-400/30 text-purple-700 dark:text-purple-300/70"
            >
              <Pencil size={14} />
            </HapticButton>
            <HapticButton
              onClick={() => handleDelete(concept.id)}
              aria-label={t('learnDeleteConcept')}
              hapticPattern={deleteConfirmId === concept.id ? 30 : 10}
              pressScale={0.9}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                deleteConfirmId === concept.id
                  ? 'bg-red-500/30 border border-red-400/60 text-red-700 dark:text-red-300'
                  : 'bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400/60'
              }`}
            >
              <Trash2 size={15} />
            </HapticButton>
          </div>
        </div>
        {deleteConfirmId === concept.id && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-red-700 dark:text-red-400/80 text-xs font-semibold mt-2 text-end"
          >
            {t('learnTapAgainDelete')}
          </motion.p>
        )}
      </div>

      {categoryPickerForId === concept.id && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setCategoryPickerForId(null)} />
          <div className="absolute z-20 end-3 top-14 w-48 rounded-2xl bg-surface border border-line shadow-2xl overflow-hidden">
            <button
              onClick={() => { setConceptCategory(concept.id, null); setCategoryPickerForId(null); }}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-bold text-fg-muted hover:bg-fg/5 transition-colors"
            >
              {t('learnNoCategory')}
              {!concept.categoryId && <Check size={14} className="text-fg" />}
            </button>
            {categories.map((cat) => {
              const style = getCategoryStyle(cat.color);
              return (
                <button
                  key={cat.id}
                  onClick={() => { setConceptCategory(concept.id, cat.id); setCategoryPickerForId(null); }}
                  className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-bold text-fg hover:bg-fg/5 transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${style.dotClass}`} />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  {concept.categoryId === cat.id && <Check size={14} className="text-fg shrink-0" />}
                </button>
              );
            })}
            {categories.length === 0 && (
              <p className="px-3.5 py-2.5 text-[11px] text-fg-subtle">{t('learnNoCategoriesYet')}</p>
            )}
          </div>
        </>
      )}
    </motion.div>
  );

  return (
    <div className="fixed inset-0 z-[75] flex flex-col bg-page" dir={dir}>
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {(isFormView || view === 'category') ? (
            <HapticButton
              onClick={isFormView ? goBackFromForm : goHome}
              hapticPattern={8}
              pressScale={0.9}
              aria-label={t('learnBack')}
              className="w-9 h-9 rounded-xl bg-fg/[0.08] border border-fg/15 flex items-center justify-center text-fg-muted shrink-0"
            >
              <ChevronRight size={18} className="ltr:rotate-180" />
            </HapticButton>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-purple-700 dark:text-purple-300" />
            </div>
          )}

          {view === 'category' && isRenamingCategory ? (
            <input
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              autoFocus
              dir="auto"
              onKeyDown={(e) => { if (e.key === 'Enter') confirmRenameCategory(); }}
              className="min-w-0 flex-1 bg-fg/[0.08] border border-fg/15 rounded-xl px-3 py-1.5 text-fg font-black text-lg focus:outline-none focus:border-purple-400/60"
            />
          ) : (
            <h2 className="text-fg font-black text-xl truncate">
              {view === 'add' ? t('learnConceptNew')
                : view === 'edit' ? t('learnConceptEdit')
                : view === 'newCategory' ? t('learnCategoryNew')
                : view === 'category' ? (activeCategory?.name ?? '')
                : t('learnConceptsTitle')}
            </h2>
          )}
        </div>

        {isFormView ? (
          <div className="flex items-center gap-2 shrink-0">
            {view === 'edit' && (
              <HapticButton
                onClick={handleEditDelete}
                hapticPattern={editDeleteConfirm ? 30 : 10}
                pressScale={0.9}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm transition-colors ${
                  editDeleteConfirm
                    ? 'bg-red-500/30 border border-red-400/60 text-red-700 dark:text-red-300'
                    : 'bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400/70'
                }`}
              >
                <Trash2 size={14} />
                {editDeleteConfirm ? t('learnSure') : t('delete')}
              </HapticButton>
            )}
            <HapticButton
              onClick={view === 'add' ? handleAdd : view === 'edit' ? handleSaveEdit : handleCreateCategory}
              hapticPattern={[10, 40, 10]}
              pressScale={0.96}
              disabled={!canSave}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/30 border border-purple-400/50 text-purple-800 dark:text-purple-100 font-black text-sm disabled:opacity-35 transition-opacity"
            >
              {t('learnSaveCheck')}
            </HapticButton>
          </div>
        ) : view === 'category' ? (
          <div className="flex items-center gap-2 shrink-0">
            {isRenamingCategory ? (
              <HapticButton
                onClick={confirmRenameCategory}
                aria-label={t('learnConfirmRename')}
                hapticPattern={10}
                pressScale={0.9}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-500/25 border border-purple-400/40 text-purple-700 dark:text-purple-200"
              >
                <Check size={16} />
              </HapticButton>
            ) : (
              <HapticButton
                onClick={startRenameCategory}
                aria-label={t('learnRenameCategory')}
                hapticPattern={10}
                pressScale={0.9}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-fg/[0.08] border border-fg/15 text-fg-muted"
              >
                <Pencil size={14} />
              </HapticButton>
            )}
            <HapticButton
              onClick={handleDeleteCategory}
              hapticPattern={categoryDeleteConfirm ? 30 : 10}
              pressScale={0.9}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm transition-colors ${
                categoryDeleteConfirm
                  ? 'bg-red-500/30 border border-red-400/60 text-red-700 dark:text-red-300'
                  : 'bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400/70'
              }`}
            >
              <Trash2 size={14} />
              {categoryDeleteConfirm ? t('learnSure') : t('delete')}
            </HapticButton>
          </div>
        ) : (
          <HapticButton
            onClick={onClose}
            hapticPattern={8}
            pressScale={0.9}
            className="w-10 h-10 rounded-full bg-fg/10 border border-fg/15 flex items-center justify-center text-fg/60 shrink-0"
            aria-label={t('close')}
          >
            <X size={20} />
          </HapticButton>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div
            key="list"
            className="flex-1 flex flex-col overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="shrink-0 px-4 pt-4 pb-3 flex gap-3">
              <HapticButton
                onClick={() => openAdd(null)}
                hapticPattern={10}
                pressScale={0.96}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-purple-500/20 border border-purple-400/35 py-3 text-purple-700 dark:text-purple-200 font-bold text-sm"
              >
                <Plus size={16} />
                {t('learnAddConcept')}
              </HapticButton>
              {concepts.length > 0 && (
                <HapticButton
                  onClick={() => { trackEvent('concepts_flashcard_started'); setShowFlashcards(true); }}
                  hapticPattern={10}
                  pressScale={0.96}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-500/20 border border-blue-400/35 py-3 text-blue-700 dark:text-blue-200 font-bold text-sm"
                >
                  <Brain size={16} />
                  {t('learnFlashcardsBtn')}
                </HapticButton>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-safe pb-4">
              {concepts.length === 0 && categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-5 py-20 px-6">
                  <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center">
                    <BookOpen size={32} className="text-purple-700 dark:text-purple-400/50" />
                  </div>
                  <div className="text-center">
                    <p className="text-fg font-bold text-base">{t('learnEmptyTitle')}</p>
                    <p className="text-fg-muted text-sm mt-1 leading-relaxed">
                      {t('learnEmptyDesc')}
                    </p>
                  </div>
                  <HapticButton
                    onClick={() => openAdd(null)}
                    hapticPattern={10}
                    pressScale={0.96}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-500/25 border border-purple-400/40 text-purple-700 dark:text-purple-200 font-bold text-sm"
                  >
                    <Plus size={16} />
                    {t('learnAddFirstConcept')}
                  </HapticButton>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-fg-muted text-xs font-bold uppercase tracking-wide mb-2">{t('learnCategories')}</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {categories.map((cat) => {
                        const style = getCategoryStyle(cat.color);
                        const count = concepts.filter((c) => c.categoryId === cat.id).length;
                        return (
                          <HapticButton
                            key={cat.id}
                            onClick={() => { setActiveCategoryId(cat.id); setView('category'); }}
                            hapticPattern={10}
                            pressScale={0.96}
                            className={`flex items-center gap-2.5 rounded-2xl border p-3 text-start ${style.bgClass} ${style.borderClass}`}
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${style.bgClass} ${style.borderClass}`}>
                              <Folder size={16} className={style.textClass} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`font-black text-[13px] truncate ${style.textClass}`}>{cat.name}</p>
                              <p className="text-fg-muted text-[11px] font-semibold">{t(count === 1 ? 'learnNotesOne' : 'learnNotesMany', { n: count })}</p>
                            </div>
                          </HapticButton>
                        );
                      })}
                      <HapticButton
                        onClick={() => setView('newCategory')}
                        hapticPattern={10}
                        pressScale={0.96}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-fg/20 p-3 text-fg-muted"
                      >
                        <FolderPlus size={16} />
                        <span className="font-bold text-[13px]">{t('learnCategoryNew')}</span>
                      </HapticButton>
                    </div>
                  </div>

                  {uncategorizedConcepts.length > 0 && (
                    <div>
                      <p className="text-fg-muted text-xs font-bold uppercase tracking-wide mb-2">
                        {categories.length > 0 ? t('learnUncategorized') : t(uncategorizedConcepts.length === 1 ? 'learnSavedOne' : 'learnSavedMany', { n: uncategorizedConcepts.length })}
                      </p>
                      <div className="flex flex-col gap-3">
                        {uncategorizedConcepts.map((concept, index) => renderConceptCard(concept, index))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {view === 'category' && (
          <motion.div
            key="category"
            className="flex-1 flex flex-col overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="shrink-0 px-4 pt-4 pb-3 flex gap-3">
              <HapticButton
                onClick={() => openAdd(activeCategoryId)}
                hapticPattern={10}
                pressScale={0.96}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-purple-500/20 border border-purple-400/35 py-3 text-purple-700 dark:text-purple-200 font-bold text-sm"
              >
                <Plus size={16} />
                {t('learnAddNoteToCategory')}
              </HapticButton>
              {categoryConcepts.length > 0 && (
                <HapticButton
                  onClick={() => { trackEvent('concepts_flashcard_started'); setShowFlashcards(true); }}
                  hapticPattern={10}
                  pressScale={0.96}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-500/20 border border-blue-400/35 py-3 text-blue-700 dark:text-blue-200 font-bold text-sm"
                >
                  <Brain size={16} />
                  {t('learnFlashcardsBtn')}
                </HapticButton>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-safe pb-4">
              {categoryConcepts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-5 py-20 px-6">
                  <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center">
                    <Folder size={32} className="text-purple-700 dark:text-purple-400/50" />
                  </div>
                  <div className="text-center">
                    <p className="text-fg font-bold text-base">{t('learnCategoryEmptyTitle')}</p>
                    <p className="text-fg-muted text-sm mt-1 leading-relaxed">
                      {t('learnCategoryEmptyDesc')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {categoryConcepts.map((concept, index) => renderConceptCard(concept, index))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {isFormView && (
          <motion.div
            key={view}
            className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'newCategory' ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-fg-muted text-xs font-bold uppercase tracking-wide">{t('learnCategoryName')}</label>
                  <input
                    value={categoryNameInput}
                    onChange={(e) => setCategoryNameInput(e.target.value)}
                    placeholder={t('learnCategoryNamePh')}
                    className="w-full rounded-2xl border border-line bg-surface-2 px-4 py-3.5 text-fg placeholder:text-fg-subtle text-[15px] font-semibold focus:outline-none focus:border-purple-400/60 transition-colors"
                    dir="auto"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-fg-muted text-xs font-bold uppercase tracking-wide">{t('learnColor')}</label>
                  <div className="flex flex-wrap gap-2.5">
                    {CATEGORY_COLORS.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setCategoryColorInput(c.key)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${c.bgClass} ${categoryColorInput === c.key ? 'border-fg' : 'border-transparent'}`}
                        aria-label={c.key}
                      >
                        <span className={`w-4 h-4 rounded-full ${c.dotClass}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-fg-muted text-xs font-bold uppercase tracking-wide">{t('learnConceptName')}</label>
                  <input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder={t('learnConceptNamePh')}
                    className="w-full rounded-2xl border border-line bg-surface-2 px-4 py-3.5 text-fg placeholder:text-fg-subtle text-[15px] font-semibold focus:outline-none focus:border-purple-400/60 transition-colors"
                    dir="auto"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                  />
                </div>

                {categories.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <label className="text-fg-muted text-xs font-bold uppercase tracking-wide">{t('learnCategory')}</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setFormCategoryId(null)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                          formCategoryId === null ? 'bg-fg/15 border-fg/30 text-fg' : 'bg-fg/5 border-fg/10 text-fg-muted'
                        }`}
                      >
                        {t('learnNoCategory')}
                      </button>
                      {categories.map((cat) => {
                        const style = getCategoryStyle(cat.color);
                        const active = formCategoryId === cat.id;
                        return (
                          <button
                            type="button"
                            key={cat.id}
                            onClick={() => setFormCategoryId(cat.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                              active ? `${style.bgClass} ${style.borderClass} ${style.textClass}` : 'bg-fg/5 border-fg/10 text-fg-muted'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${style.dotClass}`} />
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-fg-muted text-xs font-bold uppercase tracking-wide">{t('learnDefinition')}</label>
                  <textarea
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    placeholder={t('learnDefinitionPh')}
                    className="flex-1 w-full rounded-2xl border border-line bg-surface-2 px-4 py-3.5 text-fg placeholder:text-fg-subtle text-[14px] leading-relaxed focus:outline-none focus:border-purple-400/60 resize-none transition-colors"
                    style={{ minHeight: '140px' }}
                    dir="auto"
                  />
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
