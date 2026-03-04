import { useState, useEffect } from 'react';
import { X, Plus, ChevronRight, Trash2 } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { useNotesStore } from '../../store/notesStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotesModal({ isOpen, onClose }: Props) {
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
      <div className="fixed inset-0 z-50 flex flex-col bg-emt-dark">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-emt-border">
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-blue-400 font-bold text-sm active:opacity-70"
          >
            <ChevronRight size={20} />
            פתקים
          </button>
          <button
            onClick={handleDelete}
            className="w-9 h-9 flex items-center justify-center rounded-full
                       bg-red-600/20 border border-red-500/30 text-red-400 active:scale-90 transition-transform"
            aria-label="מחק פתק"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <input
          className="shrink-0 bg-transparent text-emt-light font-bold text-xl px-4 py-3
                     border-b border-emt-border focus:outline-none placeholder:text-emt-muted"
          placeholder="כותרת..."
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          dir="rtl"
        />

        <textarea
          className="flex-1 bg-[#09090B] text-emt-light text-base leading-relaxed
                     p-4 resize-none focus:outline-none placeholder:text-emt-border"
          placeholder="כתוב כאן..."
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
    <div className="fixed inset-0 z-50 flex flex-col bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-emt-border">
        <h2 className="text-emt-light font-bold text-xl">פתקים</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-emt-gray border border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-emt-muted hover:text-emt-light"
          aria-label="סגור"
        >
          <X size={20} />
        </button>
      </div>

      {/* Notes grid */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-emt-muted">
            <p className="text-sm">אין עדיין פתקים</p>
            <p className="text-xs opacity-60">לחץ על + כדי ליצור פתק חדש</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sorted.map((note) => (
              <button
                key={note.id}
                onClick={() => openNote(note.id)}
                className="flex flex-col items-start p-3 rounded-2xl border border-emt-border
                           bg-emt-gray text-right active:scale-95 transition-transform min-h-[100px]"
              >
                <p className="text-emt-light font-bold text-sm leading-tight mb-1.5 line-clamp-2 w-full">
                  {note.title || 'ללא כותרת'}
                </p>
                <p className="text-emt-muted text-xs leading-relaxed line-clamp-3 w-full">
                  {note.content || 'ריק'}
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
          aria-label="פתק חדש"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
}
