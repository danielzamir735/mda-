import { useState, useMemo } from 'react';
import {
  ChevronDown, ChevronUp, ChevronRight, RotateCcw, Search,
  Settings, Eye, EyeOff, Trash2, Plus, Check, X,
} from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useChecklistStore } from '../../../store/checklistStore';
import { AMBULANCE_CHECKLIST } from '../data/ambulanceChecklistData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AmbulanceChecklistModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);

  const {
    checkedItems, hiddenItems, customItems,
    toggleItem, clearChecklist, toggleItemVisibility,
    addCustomItem, removeCustomItem,
  } = useChecklistStore();

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    () => Object.fromEntries(AMBULANCE_CHECKLIST.map((c) => [c.id, true])),
  );
  const [searchQuery, setSearchQuery] = useState('');
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

  if (!isOpen) return null;

  // Display set: customize mode shows everything; normal mode filters hidden & empty categories
  const isSearching = !isCustomizeMode && searchQuery.trim().length > 0;
  const displayCategories = isCustomizeMode
    ? mergedCategories
    : mergedCategories
        .map((cat) => ({ ...cat, items: cat.items.filter((item) => !hiddenItems[item.id]) }))
        .filter((cat) => cat.items.length > 0)
        .map((cat) => ({
          ...cat,
          items: isSearching ? cat.items.filter((i) => i.name.includes(searchQuery.trim())) : cat.items,
        }))
        .filter((cat) => !isSearching || cat.items.length > 0);

  // Progress counts only visible (non-hidden) items
  const allVisible = mergedCategories.flatMap((cat) => cat.items.filter((i) => !hiddenItems[i.id]));
  const totalItems = allVisible.length;
  const checkedCount = allVisible.filter((i) => checkedItems[i.id]).length;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;
  const isComplete = totalItems > 0 && checkedCount === totalItems;

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
    <div className="fixed inset-0 z-[60] flex flex-col bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-emt-border">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-emt-gray border border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-emt-muted hover:text-emt-light"
          aria-label="חזור"
        >
          <ChevronRight size={20} />
        </button>

        <h2 className="text-emt-light font-bold text-xl">בדיקת אמבולנס</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => (isCustomizeMode ? exitCustomize() : setIsCustomizeMode(true))}
            className={`w-10 h-10 rounded-full border flex items-center justify-center active:scale-90 transition-all ${
              isCustomizeMode
                ? 'bg-emt-yellow/10 border-emt-yellow text-emt-yellow'
                : 'bg-emt-gray border-emt-border text-emt-muted hover:text-emt-light'
            }`}
            aria-label="התאמה אישית"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={clearChecklist}
            disabled={checkedCount === 0}
            className="w-10 h-10 rounded-full bg-emt-gray border border-emt-border
                       flex items-center justify-center active:scale-90 transition-transform
                       disabled:opacity-30 disabled:cursor-not-allowed
                       text-emt-muted hover:text-emt-red"
            aria-label="אפס הכל"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="shrink-0 px-4 py-3 border-b border-emt-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-emt-muted">{checkedCount} / {totalItems} פריטים</span>
          {isCustomizeMode
            ? <span className="text-sm font-bold text-emt-yellow">מצב עריכה</span>
            : isComplete && <span className="text-sm font-bold text-emt-green">הרכב מוכן ✓</span>
          }
        </div>
        <div className="h-2 rounded-full bg-emt-gray overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${isComplete ? 'bg-emt-green' : 'bg-emt-yellow'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Search — hidden in customize mode */}
      {!isCustomizeMode && (
        <div className="shrink-0 px-4 py-2 border-b border-emt-border">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emt-muted pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש פריט..."
              className="w-full bg-emt-gray border border-emt-border rounded-xl py-2.5 pr-9 pl-3
                         text-emt-light text-sm placeholder:text-emt-muted
                         focus:outline-none focus:border-emt-red transition-colors"
            />
          </div>
        </div>
      )}

      {/* Accordion List */}
      <div className="flex-1 overflow-y-auto">
        {displayCategories.length === 0 && (
          <p className="text-center text-emt-muted text-sm py-12">לא נמצאו תוצאות</p>
        )}

        {displayCategories.map((category) => {
          const expanded = isSearching || isCustomizeMode || expandedCategories[category.id];
          const catChecked = category.items.filter((i) => checkedItems[i.id]).length;
          const catTotal = category.items.length;
          const catComplete = catTotal > 0 && catChecked === catTotal;

          return (
            <div key={category.id} className="border-b border-emt-border">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-4 py-4 active:bg-emt-gray/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expanded
                    ? <ChevronUp size={16} className="text-emt-muted" />
                    : <ChevronDown size={16} className="text-emt-muted" />
                  }
                  <span className={`font-bold text-base ${catComplete && !isCustomizeMode ? 'text-emt-green' : 'text-emt-light'}`}>
                    {category.name}
                  </span>
                </div>
                {!isCustomizeMode && (
                  <span className={`text-sm font-mono ${catComplete ? 'text-emt-green' : 'text-emt-muted'}`}>
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
                            <button
                              onClick={() => removeCustomItem(item.id)}
                              className="w-8 h-8 rounded-full bg-emt-red/10 border border-emt-red/30
                                         flex items-center justify-center shrink-0
                                         active:scale-90 transition-transform text-emt-red"
                              aria-label="מחק פריט"
                            >
                              <Trash2 size={15} />
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleItemVisibility(item.id)}
                              className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 active:scale-90 transition-all ${
                                isHidden
                                  ? 'bg-emt-border/20 border-emt-border text-emt-muted'
                                  : 'bg-emt-green/10 border-emt-green/30 text-emt-green'
                              }`}
                              aria-label={isHidden ? 'הצג פריט' : 'הסתר פריט'}
                            >
                              {isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          )}
                          <span className="flex-1 text-right text-sm text-emt-light">{item.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full border text-emt-yellow border-emt-yellow/30 shrink-0">
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
                        className="w-full flex items-center gap-3 px-6 py-3 active:bg-emt-gray/30 transition-colors"
                      >
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          checked ? 'bg-emt-green border-emt-green' : 'bg-transparent border-emt-border'
                        }`}>
                          {checked && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span className={`flex-1 text-right text-sm ${checked ? 'text-emt-muted line-through' : 'text-emt-light'}`}>
                          {item.name}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                          checked ? 'text-emt-muted border-emt-border' : 'text-emt-yellow border-emt-yellow/30'
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
                          aria-label="שמור"
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
                          placeholder="שם הפריט..."
                          dir="rtl"
                          className="flex-1 bg-emt-gray border border-emt-border rounded-lg py-2 px-3
                                     text-sm text-emt-light text-right placeholder:text-emt-muted
                                     focus:outline-none focus:border-emt-yellow transition-colors"
                        />
                        <button
                          onClick={() => { setAddingToCategory(null); setNewItemName(''); }}
                          className="w-8 h-8 rounded-full bg-emt-gray border border-emt-border
                                     flex items-center justify-center shrink-0
                                     active:scale-90 transition-transform text-emt-muted"
                          aria-label="ביטול"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingToCategory(category.id); setNewItemName(''); }}
                        className="w-full flex items-center justify-end gap-1.5 px-6 py-2.5
                                   text-emt-muted hover:text-emt-yellow active:opacity-70
                                   transition-colors text-sm"
                      >
                        <span>+ הוסף פריט</span>
                        <Plus size={14} />
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
