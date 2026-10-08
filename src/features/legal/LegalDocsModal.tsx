import { useState } from 'react';
import { X } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { LEGAL_CONTACT_EMAIL, LEGAL_DOCS, type LegalDocId } from './legalContent';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: LegalDocId;
}

export default function LegalDocsModal({ isOpen, onClose, initialDoc = 'privacy' }: Props) {
  // Kept in this always-mounted wrapper: the hook must see isOpen flip on an
  // existing component, not run as a mount effect (StrictMode would replay it).
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;
  // Mounted only while open, so each opening starts on the requested document.
  return <LegalDocsView onClose={onClose} initialDoc={initialDoc} />;
}

function LegalDocsView({ onClose, initialDoc }: { onClose: () => void; initialDoc: LegalDocId }) {
  const [activeId, setActiveId] = useState<LegalDocId>(initialDoc);

  const doc = LEGAL_DOCS.find((d) => d.id === activeId) ?? LEGAL_DOCS[0];

  return (
    // Above LegalDisclaimerModal (z-[100]) so the documents can be read before accepting.
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="מסמכים משפטיים"
      className="fixed inset-0 z-[110] flex flex-col bg-gray-50 dark:bg-emt-dark"
    >
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מסמכים משפטיים</h2>
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

      {/* Tabs */}
      <div role="tablist" className="shrink-0 flex gap-2 px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        {LEGAL_DOCS.map((d) => {
          const active = d.id === doc.id;
          return (
            <button
              key={d.id}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveId(d.id)}
              className={[
                'flex-1 px-2 py-2.5 rounded-xl border text-sm font-bold transition-colors',
                active
                  ? 'border-gray-400 dark:border-emt-light/60 bg-gray-200 dark:bg-emt-light/10 text-gray-900 dark:text-emt-light'
                  : 'border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray text-gray-600 dark:text-emt-muted',
              ].join(' ')}
            >
              {d.title}
            </button>
          );
        })}
      </div>

      {/* Document */}
      <div key={doc.id} className="flex-1 overflow-y-auto p-4 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        <article className="max-w-2xl mx-auto text-right text-gray-700 dark:text-emt-light text-sm leading-relaxed">
          <h3 className="text-gray-900 dark:text-emt-light font-black text-xl">{doc.title}</h3>
          <p className="text-gray-500 dark:text-emt-muted text-xs mt-1">עדכון אחרון: {doc.updated}</p>

          {doc.sections.map((section) => (
            <section key={section.heading} className="mt-6">
              <h4 className="text-gray-900 dark:text-emt-light font-bold text-base mb-2">{section.heading}</h4>
              <div className="space-y-3">
                {section.body.map((block, i) =>
                  typeof block === 'string' ? (
                    <p key={i}>{block}</p>
                  ) : (
                    <ul key={i} className="list-disc pr-5 space-y-1.5">
                      {block.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          ))}

          <p className="mt-8 pt-4 border-t border-gray-200 dark:border-emt-border">
            לפניות בכל נושא:{' '}
            <a
              href={`mailto:${LEGAL_CONTACT_EMAIL}`}
              className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2"
            >
              {LEGAL_CONTACT_EMAIL}
            </a>
          </p>
        </article>
      </div>
    </div>
  );
}
