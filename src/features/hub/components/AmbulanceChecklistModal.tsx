import { useState, useMemo, useEffect } from 'react';
import {
  ChevronDown, ChevronUp, ChevronRight, RotateCcw,
  Eye, Trash2, Plus, Check, X,
} from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useChecklistStore } from '../../../store/checklistStore';
import { AMBULANCE_CHECKLIST } from '../data/ambulanceChecklistData';
import { trackInteraction, trackEvent } from '../../../utils/analytics';
import { useTranslation } from '../../../hooks/useTranslation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AmbulanceChecklistModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const t = useTranslation();

  const {
    checkedItems, hiddenItems, customItems,
    toggleItem, clearChecklist, toggleItemVisibility,
    addCustomItem, removeCustomItem,
  } = useChecklistStore();

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    () => Object.fromEntries(AMBULANCE_CHECKLIST.map((c) => [c.id, true])),
  );
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');

  // Merge base items with custom items per category
  const mergedCategories = useMemo(() =>
    AMBULANCE_CHECKLIST.map((cat) => ({
      ...cat,
      items: [
        ...cat.items.map((item) => ({ ...item, isCustom: false as const })),
        ...customItems
          .filter((ci) => ci.category === cat.id)
          .map((ci) => ({ id: ci.id, name: ci.name, requiredAmount: '—', isCustom: true as const })),
      ],
    })),
    [customItems],
  );

  // Progress counts only visible (non-hidden) items
  const allVisible = mergedCategories.flatMap((cat) => cat.items.filter((i) => !hiddenItems[i.id]));
  const totalItems = allVisible.length;
  const checkedCount = allVisible.filter((i) => checkedItems[i.id]).length;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;
  const isComplete = totalItems > 0 && checkedCount === totalItems;

  useEffect(() => {
    if (isOpen) trackInteraction('רשימת ציוד לאמבולנס', 'tools'); // i18n-ok: analytics label, kept stable
  }, [isOpen]);

  useEffect(() => {
    if (isComplete) trackEvent('checklist_complete', { total: totalItems });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  if (!isOpen) return null;

  // Display set: customize mode shows everything; normal mode filters hidden & empty categories
  const displayCategories = isCustomizeMode
    ? mergedCategories
    : mergedCategories
        .map((cat) => ({ ...cat, items: cat.items.filter((item) => !hiddenItems[item.id]) }))
        .filter((cat) => cat.items.length > 0);

  const toggleCategory = (id: string) =>
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSaveItem = (categoryId: string) => {
    const trimmed = newItemName.trim();
    if (trimmed) addCustomItem(categoryId, trimmed);
    setAddingToCategory(null);
    setNewItemName('');
  };

  const exitCustomize = () => {
    setIsCustomizeMode(false);
    setAddingToCategory(null);
    setNewItemName('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-page">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line-strong">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-surface-2 border border-line-strong
                     flex items-center justify-center active:scale-90 transition-transform
                     text-fg-muted hover:text-fg"
          aria-label={t('back')}
        >
          <ChevronRight size={20} className="ltr:rotate-180" />
        </button>

        <h2 className="text-fg font-bold text-xl">{t('refAmbTitle')}</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => (isCustomizeMode ? exitCustomize() : setIsCustomizeMode(true))}
            className={`px-3 py-1.5 rounded-lg border text-sm font-bold active:scale-95 transition-all ${
              isCustomizeMode
                ? 'bg-emt-yellow/10 border-emt-yellow text-amber-800 dark:text-emt-yellow'
                : 'bg-surface-2 border-line-strong text-fg-muted hover:text-fg'
            }`}
          >
            {isCustomizeMode ? t('done') : t('refCustomize')}
          </button>
          <button
            onClick={clearChecklist}
            disabled={checkedCount === 0}
            className="w-10 h-10 rounded-full bg-surface-2 border border-line-strong
                       flex items-center justify-center active:scale-90 transition-transform
                       disabled:opacity-30 disabled:cursor-not-allowed
                       text-fg-muted hover:text-emt-red"
            aria-label={t('refResetAll')}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="shrink-0 px-4 py-3 border-b border-line-strong">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-fg-muted">{checkedCount} / {totalItems} {t('items')}</span>
          {isCustomizeMode
            ? <span className="text-sm font-bold text-amber-800 dark:text-emt-yellow">{t('refEditMode')}</span>
            : isComplete && <span className="text-sm font-bold text-emt-green">{t('refVehicleReady')}</span>
          }
        </div>
        <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${isComplete ? 'bg-emt-green' : 'bg-emt-yellow'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Accordion List */}
      <div className="flex-1 overflow-y-auto">
        {displayCategories.length === 0 && (
          <p className="text-center text-fg-muted text-sm py-12">{t('noResults')}</p>
        )}

        {displayCategories.map((category) => {
          const expanded = isCustomizeMode || expandedCategories[category.id];
          const catChecked = category.items.filter((i) => checkedItems[i.id]).length;
          const catTotal = category.items.length;
          const catComplete = catTotal > 0 && catChecked === catTotal;

          return (
            <div key={category.id} className="border-b border-line-strong">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-4 py-4 active:bg-surface-2 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expanded
                    ? <ChevronUp size={16} className="text-fg-muted" />
                    : <ChevronDown size={16} className="text-fg-muted" />
                  }
                  <span className={`font-bold text-base ${catComplete && !isCustomizeMode ? 'text-emt-green' : 'text-fg'}`}>
                    {category.name}
                  </span>
                </div>
                {!isCustomizeMode && (
                  <span className={`text-sm font-mono ${catComplete ? 'text-emt-green' : 'text-fg-muted'}`}>
                    {catChecked}/{catTotal}
                  </span>
                )}
              </button>

              {/* Category Items */}
              {expanded && (
                <div className="pb-2">
                  {category.items.map((item) => {
                    const isHidden = !!hiddenItems[item.id];
                    const checked = !!checkedItems[item.id];

                    if (isCustomizeMode) {
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 px-6 py-3 transition-opacity ${isHidden ? 'opacity-40' : 'opacity-100'}`}
                        >
                          {item.isCustom ? (
                            /* Custom item — red trash = permanent delete */
                            <button
                              onClick={() => removeCustomItem(item.id)}
                              className="w-8 h-8 rounded-full bg-emt-red/10 border border-emt-red/30
                                         flex items-center justify-center shrink-0
                                         active:scale-90 transition-transform text-emt-red"
                              aria-label={t('refDeleteItem')}
                            >
                              <Trash2 size={15} />
                            </button>
                          ) : isHidden ? (
                            /* Built-in hidden — green eye = restore */
                            <button
                              onClick={() => toggleItemVisibility(item.id)}
                              className="w-8 h-8 rounded-full bg-emt-green/10 border border-emt-green/30
                                         flex items-center justify-center shrink-0
                                         active:scale-90 transition-transform text-emt-green"
                              aria-label={t('refShowItem')}
                            >
                              <Eye size={15} />
                            </button>
                          ) : (
                            /* Built-in visible — red trash = hide */
                            <button
                              onClick={() => toggleItemVisibility(item.id)}
                              className="w-8 h-8 rounded-full bg-emt-red/10 border border-emt-red/30
                                         flex items-center justify-center shrink-0
                                         active:scale-90 transition-transform text-emt-red"
                              aria-label={t('refHideItem')}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                          <span className="flex-1 text-start text-sm text-fg">{item.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full border text-amber-800 dark:text-emt-yellow border-emt-yellow/30 shrink-0">
                            {item.requiredAmount}
                          </span>
                        </div>
                      );
                    }

                    // Normal mode
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className="w-full flex items-center gap-3 px-6 py-3 active:bg-surface-2 transition-colors"
                      >
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          checked ? 'bg-emt-green border-emt-green' : 'bg-transparent border-line-strong'
                        }`}>
                          {checked && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              {/* theme-ok: white tick on the green box */}
                              <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span className={`flex-1 text-start text-sm ${checked ? 'text-fg-muted line-through' : 'text-fg'}`}>
                          {item.name}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                          checked ? 'text-fg-muted border-line-strong' : 'text-amber-800 dark:text-emt-yellow border-emt-yellow/30'
                        }`}>
                          {item.requiredAmount}
                        </span>
                      </button>
                    );
                  })}

                  {/* Add item row — customize mode only */}
                  {isCustomizeMode && (
                    addingToCategory === category.id ? (
                      <div className="flex items-center gap-2 px-4 py-2">
                        <button
                          onClick={() => handleSaveItem(category.id)}
                          className="w-8 h-8 rounded-full bg-emt-green/10 border border-emt-green/40
                                     flex items-center justify-center shrink-0
                                     active:scale-90 transition-transform text-emt-green"
                          aria-label={t('save')}
                        >
                          <Check size={15} />
                        </button>
                        <input
                          autoFocus
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveItem(category.id);
                            if (e.key === 'Escape') { setAddingToCategory(null); setNewItemName(''); }
                          }}
                          placeholder={t('refItemNamePlaceholder')}
                          className="flex-1 bg-surface-2 border border-line-strong rounded-lg py-2 px-3
                                     text-sm text-fg text-start placeholder:text-fg-subtle
                                     focus:outline-none focus:border-emt-yellow transition-colors"
                        />
                        <button
                          onClick={() => { setAddingToCategory(null); setNewItemName(''); }}
                          className="w-8 h-8 rounded-full bg-surface-2 border border-line-strong
                                     flex items-center justify-center shrink-0
                                     active:scale-90 transition-transform text-fg-muted"
                          aria-label={t('cancel')}
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingToCategory(category.id); setNewItemName(''); }}
                        className="mx-4 mb-2 mt-1 flex items-center justify-center gap-2 py-3
                                   rounded-xl border-2 border-dashed border-emt-green/40
                                   bg-emt-green/5 text-emt-green font-bold text-sm
                                   active:bg-emt-green/10 active:opacity-80 transition-colors"
                        style={{ width: 'calc(100% - 2rem)' }}
                      >
                        <Plus size={16} />
                        <span>{t('refAddItem')}</span>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
