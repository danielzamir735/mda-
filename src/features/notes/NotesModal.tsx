import { useState, useEffect, useRef } from 'react';
import { X, Plus, ChevronRight, Trash2, Folder, FolderPlus, Pencil, Check } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { useNotesStore } from '../../store/notesStore';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GENERAL_ID = '__general__'; // sentinel for the uncategorized bucket

export default function NotesModal({ isOpen, onClose }: Props) {
  const t = useTranslation();
  const {
    notes, folders,
    addNote, updateNote, deleteNote, moveNote,
    addFolder, renameFolder, deleteFolder,
  } = useNotesStore();

  const [view, setView] = useState<'folders' | 'notes'>('folders');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null); // null = כללי
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [folderPrompt, setFolderPrompt] = useState<null | { mode: 'create' } | { mode: 'rename'; id: string }>(null);
  const [folderDraft, setFolderDraft] = useState('');
  const [movePickerOpen, setMovePickerOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // ── Back-button cascade: note edit → folder notes → folders → close ──
  //
  // Only ONE popstate listener ever runs the cascade — the one inside
  // useModalBackHandler, driven by a ref so it always reads the current
  // view/editingId. The two effects below exist purely to keep a matching
  // history entry pushed per nav layer, and must NOT register their own
  // independent popstate listeners: a single 'popstate' dispatch invokes
  // same-event listeners in registration order, and an earlier listener's
  // synchronous state change can make React run a later effect's cleanup
  // (which would call removeEventListener) before the browser even reaches
  // that later listener in its dispatch loop — so it silently never fires.
  //
  // Two refs coordinate the two directions of travel between the cascade
  // and the per-layer effects:
  //  - consumedRef: set by the cascade right before it changes state in
  //    response to a genuine back-gesture, naming which layer's entry the
  //    browser just consumed on its own. That layer's cleanup sees its name
  //    here and must NOT pop again — the real navigation already did it.
  //  - suppressNextRef: set by a layer's cleanup right before it pops its
  //    own entry synthetically (the layer was left programmatically, e.g. an
  //    on-screen back button — the entry is still sitting there unconsumed).
  //    That synthetic pop() fires its own popstate; the cascade must treat
  //    it as bookkeeping, not a second user gesture, or it cascades one
  //    level further than the user asked for.
  const consumedRef = useRef<'edit' | 'notes' | null>(null);
  const suppressNextRef = useRef(false);

  useModalBackHandler(
    isOpen,
    () => {
      if (suppressNextRef.current) { suppressNextRef.current = false; return; }
      if (editingId !== null) { consumedRef.current = 'edit'; setEditingId(null); return; }
      if (view === 'notes') { consumedRef.current = 'notes'; setView('folders'); setActiveFolderId(null); return; }
      onClose();
    },
  );

  // Extra history entry for the folder-notes layer
  useEffect(() => {
    if (!isOpen || view !== 'notes') return;
    window.history.pushState({ notesFolder: true }, '');
    return () => {
      if (consumedRef.current === 'notes') { consumedRef.current = null; return; }
      suppressNextRef.current = true;
      window.history.back();
    };
  }, [isOpen, view]);

  // Extra history entry for the note-edit layer
  useEffect(() => {
    if (!isOpen || editingId === null) return;
    window.history.pushState({ noteEdit: true }, '');
    return () => {
      if (consumedRef.current === 'edit') { consumedRef.current = null; return; }
      suppressNextRef.current = true;
      window.history.back();
    };
  }, [isOpen, editingId]);

  if (!isOpen) return null;

  const folderOf = (n: { folderId?: string | null }) => n.folderId ?? null;
  const notesInFolder = (fid: string | null) => notes.filter((n) => folderOf(n) === fid);
  const activeFolderName = activeFolderId === null
    ? 'כללי'
    : folders.find((f) => f.id === activeFolderId)?.name ?? 'כללי';

  const openFolder = (fid: string | null) => {
    setActiveFolderId(fid);
    setView('notes');
  };

  const openNote = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    setTitle(note.title);
    setContent(note.content);
    setEditingId(id);
  };

  const createNote = () => {
    const id = addNote(activeFolderId);
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

  const handleSaveAndClose = () => {
    if (editingId) updateNote(editingId, title, content);
    setJustSaved(true);
    setTimeout(() => { setEditingId(null); setJustSaved(false); }, 550);
  };

  const submitFolderPrompt = () => {
    const name = folderDraft.trim();
    if (!folderPrompt) return;
    if (folderPrompt.mode === 'create') {
      if (name) addFolder(name);
    } else {
      renameFolder(folderPrompt.id, name);
    }
    setFolderPrompt(null);
    setFolderDraft('');
  };

  const editingNote = editingId ? notes.find((n) => n.id === editingId) : null;

  const renderFolderPrompt = () => (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => setFolderPrompt(null)}
    >
      <div
        className="bg-white dark:bg-emt-gray w-full max-w-xs rounded-2xl border border-gray-200 dark:border-emt-border p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-gray-900 dark:text-emt-light font-bold text-base mb-3">
          {folderPrompt?.mode === 'create' ? 'קבוצה חדשה' : 'שינוי שם קבוצה'}
        </p>
        <input
          className="w-full bg-gray-50 dark:bg-emt-dark border border-gray-200 dark:border-emt-border rounded-xl px-3 py-2.5
                     text-gray-900 dark:text-emt-light text-sm focus:outline-none focus:border-blue-400"
          placeholder="שם הקבוצה"
          value={folderDraft}
          onChange={(e) => setFolderDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitFolderPrompt(); }}
          dir="rtl"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setFolderPrompt(null)}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-emt-border text-gray-500 dark:text-emt-muted font-bold text-sm active:scale-95 transition-transform"
          >
            ביטול
          </button>
          <button
            onClick={submitFolderPrompt}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm active:scale-95 transition-transform"
          >
            {folderPrompt?.mode === 'create' ? 'צור' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  );

  /* ═══════════════ Note edit view ═══════════════ */
  if (editingId !== null) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-emt-dark">
        <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
          <button
            onClick={() => setEditingId(null)}
            className="flex items-center gap-1 text-blue-400 font-bold text-sm active:opacity-70"
          >
            <ChevronRight size={20} />
            {activeFolderName}
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

        {/* Folder chip — tap to move */}
        <button
          onClick={() => setMovePickerOpen(true)}
          className="shrink-0 self-start mx-4 mt-2.5 flex items-center gap-1.5 rounded-full
                     bg-blue-500/10 border border-blue-400/30 text-blue-400 text-xs font-bold px-3 py-1.5 active:scale-95 transition-transform"
        >
          <Folder size={13} />
          {editingNote?.folderId
            ? folders.find((f) => f.id === editingNote.folderId)?.name ?? 'כללי'
            : 'כללי'}
        </button>

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

        {/* Explicit save action — visibly confirms the save, then returns to the list */}
        <div className="shrink-0 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] border-t border-gray-200 dark:border-emt-border">
          <button
            onClick={handleSaveAndClose}
            disabled={justSaved}
            className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 ${
              justSaved ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {justSaved ? (<><Check size={18} /> נשמר</>) : 'שמור'}
          </button>
        </div>

        {/* Move-to-folder picker */}
        {movePickerOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setMovePickerOpen(false)}
          >
            <div
              className="bg-white dark:bg-emt-gray w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-emt-border p-4 pb-[max(env(safe-area-inset-bottom),1rem)] max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-gray-900 dark:text-emt-light font-bold text-base mb-3">העברה לקבוצה</p>
              <div className="flex flex-col gap-1.5">
                {[{ id: null as string | null, name: 'כללי' }, ...folders.map((f) => ({ id: f.id as string | null, name: f.name }))].map((f) => {
                  const selected = (editingNote?.folderId ?? null) === f.id;
                  return (
                    <button
                      key={f.id ?? GENERAL_ID}
                      onClick={() => { if (editingId) moveNote(editingId, f.id); setMovePickerOpen(false); }}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-right border transition-colors ${
                        selected
                          ? 'border-blue-400/50 bg-blue-400/10'
                          : 'border-gray-200 dark:border-emt-border bg-gray-50 dark:bg-emt-dark'
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-emt-light flex items-center gap-2">
                        <Folder size={14} className="text-blue-400" />
                        {f.name}
                      </span>
                      {selected && <Check size={15} className="text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════ Folder-notes view ═══════════════ */
  if (view === 'notes') {
    const sorted = [...notesInFolder(activeFolderId)].sort((a, b) => b.updatedAt - a.updatedAt);
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-emt-dark">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
          <button
            onClick={() => { setView('folders'); setActiveFolderId(null); }}
            className="flex items-center gap-1 text-blue-400 font-bold text-sm active:opacity-70"
          >
            <ChevronRight size={20} />
            {t('notes')}
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-gray-900 dark:text-emt-light font-bold text-lg truncate">{activeFolderName}</h2>
            {activeFolderId !== null && (
              <button
                onClick={() => { setFolderDraft(activeFolderName); setFolderPrompt({ mode: 'rename', id: activeFolderId }); }}
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border text-gray-500 dark:text-emt-muted active:scale-90 transition-transform"
                aria-label="שנה שם קבוצה"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
        </div>

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

        {folderPrompt && renderFolderPrompt()}
      </div>
    );
  }

  /* ═══════════════ Folders view (default) ═══════════════ */
  const generalCount = notesInFolder(null).length;
  const folderList = [...folders].sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-emt-dark">
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

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="grid grid-cols-2 gap-3">
          {/* כללי bucket — always present */}
          <button
            onClick={() => openFolder(null)}
            className="flex flex-col items-start justify-between p-4 rounded-2xl border border-blue-400/25
                       bg-blue-400/5 dark:bg-blue-400/10 text-right active:scale-95 transition-transform min-h-[104px]"
          >
            <Folder size={22} className="text-blue-400" />
            <div className="w-full">
              <p className="text-gray-900 dark:text-emt-light font-bold text-sm leading-tight">כללי</p>
              <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">{generalCount} פתקים</p>
            </div>
          </button>

          {folderList.map((f) => {
            const count = notesInFolder(f.id).length;
            return (
              <div
                key={f.id}
                className="relative flex flex-col items-start justify-between p-4 rounded-2xl border border-gray-200 dark:border-emt-border
                           bg-gray-100 dark:bg-emt-gray min-h-[104px]"
              >
                <button
                  onClick={() => openFolder(f.id)}
                  className="absolute inset-0 rounded-2xl active:scale-95 transition-transform"
                  aria-label={f.name}
                />
                <Folder size={22} className="text-amber-400 pointer-events-none" />
                <div className="w-full pointer-events-none">
                  <p className="text-gray-900 dark:text-emt-light font-bold text-sm leading-tight line-clamp-2">{f.name}</p>
                  <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">{count} פתקים</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`למחוק את הקבוצה "${f.name}"? הפתקים שבתוכה יעברו ל"כללי".`)) deleteFolder(f.id);
                  }}
                  className="absolute top-2 left-2 w-7 h-7 flex items-center justify-center rounded-full
                             bg-white/70 dark:bg-black/40 text-red-400 active:scale-90 transition-transform"
                  aria-label="מחק קבוצה"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-6 left-6">
        <button
          onClick={() => { setFolderDraft(''); setFolderPrompt({ mode: 'create' }); }}
          className="h-14 px-5 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-900/40
                     flex items-center gap-2 active:scale-90 transition-transform font-bold text-sm"
        >
          <FolderPlus size={20} />
          קבוצה חדשה
        </button>
      </div>

      {folderPrompt && renderFolderPrompt()}
    </div>
  );
}
