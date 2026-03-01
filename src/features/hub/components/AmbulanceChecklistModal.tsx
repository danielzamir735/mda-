import { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronRight, RotateCcw, Search } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useChecklistStore } from '../../../store/checklistStore';
import { AMBULANCE_CHECKLIST } from '../data/ambulanceChecklistData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AmbulanceChecklistModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);

  const { checkedItems, toggleItem, clearChecklist } = useChecklistStore();

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    () => Object.fromEntries(AMBULANCE_CHECKLIST.map((c) => [c.id, true])),
  );
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const isSearching = searchQuery.trim().length > 0;
  const filtered = isSearching
    ? AMBULANCE_CHECKLIST
        .map((cat) => ({ ...cat, items: cat.items.filter((item) => item.name.includes(searchQuery.trim())) }))
        .filter((cat) => cat.items.length > 0)
    : AMBULANCE_CHECKLIST;

  const totalItems = AMBULANCE_CHECKLIST.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedCount = AMBULANCE_CHECKLIST.reduce(
    (acc, cat) => acc + cat.items.filter((item) => checkedItems[item.id]).length,
    0,
  );
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;
  const isComplete = checkedCount === totalItems;

  const toggleCategory = (id: string) =>
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-emt-border">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-emt-gray border border-emt-border
                     flex items-center justify-center
                     active:scale-90 transition-transform text-emt-muted hover:text-emt-light"
          aria-label="חזור"
        >
          <ChevronRight size={20} />
        </button>

        <h2 className="text-emt-light font-bold text-xl">בדיקת אמבולנס</h2>

        <button
          onClick={clearChecklist}
          disabled={checkedCount === 0}
          className="w-10 h-10 rounded-full bg-emt-gray border border-emt-border
                     flex items-center justify-center
                     active:scale-90 transition-transform
                     disabled:opacity-30 disabled:cursor-not-allowed
                     text-emt-muted hover:text-emt-red"
          aria-label="אפס הכל"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="shrink-0 px-4 py-3 border-b border-emt-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-emt-muted">
            {checkedCount} / {totalItems} פריטים
          </span>
          {isComplete && (
            <span className="text-sm font-bold text-emt-green">הרכב מוכן ✓</span>
          )}
        </div>
        <div className="h-2 rounded-full bg-emt-gray overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isComplete ? 'bg-emt-green' : 'bg-emt-yellow'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="shrink-0 px-4 py-2 border-b border-emt-border">
        <div className="relative">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-emt-muted pointer-events-none"
          />
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

      {/* Accordion List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-center text-emt-muted text-sm py-12">לא נמצאו תוצאות</p>
        )}
        {filtered.map((category) => {
          const expanded = isSearching || expandedCategories[category.id];
          const categoryChecked = category.items.filter((item) => checkedItems[item.id]).length;
          const categoryTotal = category.items.length;
          const categoryComplete = categoryChecked === categoryTotal;

          return (
            <div key={category.id} className="border-b border-emt-border">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-4 py-4
                           active:bg-emt-gray/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expanded ? (
                    <ChevronUp size={16} className="text-emt-muted" />
                  ) : (
                    <ChevronDown size={16} className="text-emt-muted" />
                  )}
                  <span
                    className={`font-bold text-base ${
                      categoryComplete ? 'text-emt-green' : 'text-emt-light'
                    }`}
                  >
                    {category.name}
                  </span>
                </div>
                <span
                  className={`text-sm font-mono ${
                    categoryComplete ? 'text-emt-green' : 'text-emt-muted'
                  }`}
                >
                  {categoryChecked}/{categoryTotal}
                </span>
              </button>

              {/* Category Items */}
              {expanded && (
                <div className="pb-2">
                  {category.items.map((item) => {
                    const checked = !!checkedItems[item.id];
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className="w-full flex items-center gap-3 px-6 py-3
                                   active:bg-emt-gray/30 transition-colors"
                      >
                        {/* Checkbox */}
                        <div
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            checked
                              ? 'bg-emt-green border-emt-green'
                              : 'bg-transparent border-emt-border'
                          }`}
                        >
                          {checked && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <polyline
                                points="2,6 5,9 10,3"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>

                        {/* Item Name */}
                        <span
                          className={`flex-1 text-right text-sm ${
                            checked ? 'text-emt-muted line-through' : 'text-emt-light'
                          }`}
                        >
                          {item.name}
                        </span>

                        {/* Required Amount Badge */}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                            checked
                              ? 'text-emt-muted border-emt-border'
                              : 'text-emt-yellow border-emt-yellow/30'
                          }`}
                        >
                          {item.requiredAmount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
