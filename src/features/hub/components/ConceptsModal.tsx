import { useState } from 'react';
import { X, Plus, Trash2, Brain, BookOpen, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';
import FlashcardTrainer from '../../../components/FlashcardTrainer';
import { useConceptsStore } from '../../../store/conceptsStore';
import { trackEvent } from '../../../utils/analytics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type View = 'list' | 'add';

export default function ConceptsModal({ isOpen, onClose }: Props) {
  const { concepts, addConcept, deleteConcept } = useConceptsStore();
  const [view, setView] = useState<View>('list');
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useModalBackHandler(isOpen, onClose);
  useModalBackHandler(isOpen && view === 'add', () => setView('list'));

  const handleAdd = () => {
    if (!term.trim() || !definition.trim()) return;
    addConcept(term, definition);
    trackEvent('concept_added');
    setTerm('');
    setDefinition('');
    setView('list');
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

  const flashcardData = concepts.map((c) => ({ front: c.term, back: c.definition }));

  if (!isOpen) return null;

  if (showFlashcards && concepts.length > 0) {
    return <FlashcardTrainer data={flashcardData} onClose={() => setShowFlashcards(false)} />;
  }

  return (
    <div
      className="fixed inset-0 z-[75] flex flex-col bg-emt-dark"
      dir="rtl"
      role="dialog" aria-modal="true"
    >
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-emt-border">
        <div className="flex items-center gap-2.5">
          {view === 'add' ? (
            <HapticButton
              onClick={() => { setView('list'); setTerm(''); setDefinition(''); }}
              hapticPattern={8}
              pressScale={0.9}
              className="w-9 h-9 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center text-emt-muted"
            >
              <ChevronRight size={18} />
            </HapticButton>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
              <Sparkles size={18} className="text-purple-300" />
            </div>
          )}
          <h2 className="text-white font-black text-xl">
            {view === 'add' ? 'מושג חדש' : 'מושגים שלמדתי'}
          </h2>
        </div>
        <HapticButton
          onClick={onClose}
          hapticPattern={8}
          pressScale={0.9}
          className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/60"
          aria-label="סגור"
        >
          <X size={20} />
        </HapticButton>
      </div>

      {/* List view */}
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
            {/* Action buttons */}
            <div className="shrink-0 px-4 pt-4 pb-3 flex gap-3">
              <HapticButton
                onClick={() => setView('add')}
                hapticPattern={10}
                pressScale={0.96}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-purple-500/20 border border-purple-400/35 py-3 text-purple-200 font-bold text-sm"
              >
                <Plus size={16} />
                הוסף מושג
              </HapticButton>
              {concepts.length > 0 && (
                <HapticButton
                  onClick={() => { trackEvent('concepts_flashcard_started'); setShowFlashcards(true); }}
                  hapticPattern={10}
                  pressScale={0.96}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-500/20 border border-blue-400/35 py-3 text-blue-200 font-bold text-sm"
                >
                  <Brain size={16} />
                  כרטיסיות שינון
                </HapticButton>
              )}
            </div>

            {/* Concepts count */}
            {concepts.length > 0 && (
              <div className="shrink-0 px-4 pb-2">
                <p className="text-emt-muted text-xs font-semibold">
                  {concepts.length} {concepts.length === 1 ? 'מושג' : 'מושגים'} נשמרו
                </p>
              </div>
            )}

            {/* Concepts list */}
            <div className="flex-1 overflow-y-auto px-4 pb-safe pb-4">
              {concepts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-5 py-20 px-6">
                  <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center">
                    <BookOpen size={32} className="text-purple-400/50" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-base">עדיין לא הוספת מושגים</p>
                    <p className="text-emt-muted text-sm mt-1 leading-relaxed">
                      כשתלמד מושג חדש — תרופה, קיצור, מחלה — הוסף אותו כאן ותוכל לחזור אליו ולהתאמן עליו.
                    </p>
                  </div>
                  <HapticButton
                    onClick={() => setView('add')}
                    hapticPattern={10}
                    pressScale={0.96}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-500/25 border border-purple-400/40 text-purple-200 font-bold text-sm"
                  >
                    <Plus size={16} />
                    הוסף מושג ראשון
                  </HapticButton>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {concepts.map((concept, index) => (
                    <motion.div
                      key={concept.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.25 }}
                      className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-black text-[15px] leading-snug">{concept.term}</p>
                            <p className="text-emt-muted text-[13px] leading-relaxed mt-1.5 whitespace-pre-wrap">{concept.definition}</p>
                          </div>
                          <HapticButton
                            onClick={() => handleDelete(concept.id)}
                            hapticPattern={deleteConfirmId === concept.id ? 30 : 10}
                            pressScale={0.9}
                            className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                              deleteConfirmId === concept.id
                                ? 'bg-red-500/30 border border-red-400/60 text-red-300'
                                : 'bg-red-500/10 border border-red-500/20 text-red-400/60'
                            }`}
                          >
                            <Trash2 size={15} />
                          </HapticButton>
                        </div>
                        {deleteConfirmId === concept.id && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-red-400/80 text-xs font-semibold mt-2 text-left"
                          >
                            לחץ שוב למחיקה
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Add view */}
        {view === 'add' && (
          <motion.div
            key="add"
            className="flex-1 flex flex-col p-4 gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-emt-muted text-xs font-bold uppercase tracking-wide">שם המושג</label>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="לדוגמה: ברדיקרדיה, חסם AV, MAP, Digoxin..."
                className="w-full rounded-2xl border border-white/15 px-4 py-3.5 text-white placeholder:text-white/30 text-[15px] font-semibold focus:outline-none focus:border-purple-400/60 transition-colors"
                style={{ background: '#1a1f2e', WebkitTextFillColor: 'white' }}
                dir="rtl"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              />
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-emt-muted text-xs font-bold uppercase tracking-wide">הגדרה ופירוש</label>
              <textarea
                value={definition}
                onChange={(e) => setDefinition(e.target.value)}
                placeholder="כתוב כאן את הפירוש, המנגנון, תופעות לוואי, מה לזכור בשטח — כל מה שחשוב לך..."
                className="flex-1 w-full rounded-2xl border border-white/15 px-4 py-3.5 text-white placeholder:text-white/30 text-[14px] leading-relaxed focus:outline-none focus:border-purple-400/60 resize-none transition-colors"
                style={{ background: '#1a1f2e', minHeight: '140px', WebkitTextFillColor: 'white' }}
                dir="rtl"
              />
            </div>

            <div className="shrink-0 flex gap-3">
              <HapticButton
                onClick={() => { setView('list'); setTerm(''); setDefinition(''); }}
                hapticPattern={8}
                pressScale={0.96}
                className="flex-1 py-3.5 rounded-2xl bg-white/8 border border-white/15 text-emt-light font-bold text-sm"
              >
                ביטול
              </HapticButton>
              <HapticButton
                onClick={handleAdd}
                hapticPattern={[10, 40, 10]}
                pressScale={0.96}
                disabled={!term.trim() || !definition.trim()}
                className="flex-1 py-3.5 rounded-2xl bg-purple-500/30 border border-purple-400/50 text-purple-100 font-black text-sm disabled:opacity-35 transition-opacity"
              >
                שמור מושג ✓
              </HapticButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
