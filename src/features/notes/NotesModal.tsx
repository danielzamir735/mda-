import { useState, useEffect } from 'react';
import { X, Plus, ChevronRight, Trash2 } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { useNotesStore } from '../../store/notesStore';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotesModal({ isOpen, onClose }: Props) {
  const t = useTranslation();
  const { notes, addNote, updateNote, deleteNote } = useNotesStore();
  const [editingId, setEditingId] = useState<string | null>(null);

  // Back button closes the whole modal from list view, or exits edit view from note view.
  useModalBackHandler(isOpen, editingId !== null ? () => setEditingId(null) : onClose);

  // Push an extra history entry each time a note is opened so back goes list → not app-exit.
  useEffect(() => {
    if (!isOpen || editingId === null) return;
    let usedBack = false;
    window.history.pushState({ noteEdit: true }, '');
    const handlePop = () => { usedBack = true; setEditingId(null); };
    window.addEventListener('popstate', handlePop);
    return () => {
      window.removeEventListener('popstate', handlePop);
      if (!usedBack) window.history.back();
    };
  }, [isOpen, editingId]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const openNote = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    setTitle(note.title);
    setContent(note.content);
    setEditingId(id);
  };

  const createNote = () => {
    const id = addNote();
    setTitle('');
    setContent('');
    setEditingId(id);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (editingId) updateNote(editingId, val, content);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    if (editingId) updateNote(editingId, title, val);
  };

  const handleDelete = () => {
    if (editingId) deleteNote(editingId);
    setEditingId(null);
  };

  const goBack = () => setEditingId(null);

  /* ── Edit view ── */
  if (editingId !== null) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-emt-dark">
        <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-blue-400 font-bold text-sm active:opacity-70"
          >
            <ChevronRight size={20} />
            {t('notes')}
          </button>
          <button
            onClick={handleDelete}
            className="w-9 h-9 flex items-center justify-center rounded-full
                       bg-red-600/20 border border-red-500/30 text-red-400 active:scale-90 transition-transform"
            aria-label={t('deleteNote')}
          >
            <Trash2 size={16} />
          </button>
        </div>

        <input
          className="shrink-0 bg-transparent text-gray-900 dark:text-emt-light font-bold text-xl px-4 py-3
                     border-b border-gray-200 dark:border-emt-border focus:outline-none placeholder:text-gray-400 dark:placeholder:text-emt-muted"
          placeholder={t('titlePlaceholder')}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          dir="rtl"
        />

        <textarea
          className="flex-1 bg-gray-50 dark:bg-[#09090B] text-gray-900 dark:text-emt-light text-base leading-relaxed
                     p-4 resize-none focus:outline-none placeholder:text-gray-300 dark:placeholder:text-emt-border"
          placeholder={t('writeHere')}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          dir="rtl"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
      </div>
    );
  }

  /* ── List view ── */
  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">{t('notes')}</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
          aria-label={t('close')}
        >
          <X size={20} />
        </button>
      </div>

      {/* Notes grid */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500 dark:text-emt-muted">
            <p className="text-sm">{t('noNotesYet')}</p>
            <p className="text-xs opacity-60">{t('tapPlusToCreate')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sorted.map((note) => (
              <button
                key={note.id}
                onClick={() => openNote(note.id)}
                className="flex flex-col items-start p-3 rounded-2xl border border-gray-200 dark:border-emt-border
                           bg-gray-100 dark:bg-emt-gray text-right active:scale-95 transition-transform min-h-[100px]"
              >
                <p className="text-gray-900 dark:text-emt-light font-bold text-sm leading-tight mb-1.5 line-clamp-2 w-full">
                  {note.title || t('untitled')}
                </p>
                <p className="text-gray-500 dark:text-emt-muted text-xs leading-relaxed line-clamp-3 w-full">
                  {note.content || t('empty')}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="absolute bottom-6 left-6">
        <button
          onClick={createNote}
          className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-900/40
                     flex items-center justify-center active:scale-90 transition-transform"
          aria-label={t('newNote')}
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
}
