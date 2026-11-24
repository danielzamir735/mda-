import { useState } from 'react';
import { X } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { LEGAL_CONTACT_EMAIL, LEGAL_DOCS, type LegalDocId } from './legalContent';
import { useTranslation, useLanguage, translate, type TranslationKey } from '../../i18n';

// The documents themselves stay Hebrew (legalContent.ts); only the frame is translated.
const TAB_LABEL: Record<LegalDocId, TranslationKey> = {
  terms: 'obTabTerms',
  privacy: 'obTabPrivacy',
  accessibility: 'obTabAccessibility',
};

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
  const t = useTranslation();
  const { isEn } = useLanguage();
  const [activeId, setActiveId] = useState<LegalDocId>(initialDoc);

  const doc = LEGAL_DOCS.find((d) => d.id === activeId) ?? LEGAL_DOCS[0];

  return (
    // Above LegalDisclaimerModal (z-[100]) so the documents can be read before accepting.
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('obLegalDocsTitle')}
      className="fixed inset-0 z-[110] flex flex-col bg-page"
    >
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <h2 className="text-fg font-bold text-xl">{t('obLegalDocsTitle')}</h2>
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

      {/* Tabs */}
      <div role="tablist" className="shrink-0 flex gap-2 px-4 py-3 border-b border-line">
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
                  ? 'border-fg/50 bg-surface-3 text-fg'
                  : 'border-line bg-surface text-fg-muted',
              ].join(' ')}
            >
              {t(TAB_LABEL[d.id])}
            </button>
          );
        })}
      </div>

      {/* Document */}
      <div key={doc.id} className="flex-1 overflow-y-auto p-4 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        {isEn && (
          <p dir="ltr" className="max-w-2xl mx-auto mb-4 rounded-xl border border-line bg-surface-2 px-3 py-2 text-fg-muted text-xs text-start">
            {t('obLegalHebrewOnly')}
          </p>
        )}
        <article dir="rtl" lang="he" className="max-w-2xl mx-auto text-right text-fg/85 text-sm leading-relaxed">
          <h3 className="text-fg font-black text-xl">{doc.title}</h3>
          <p className="text-fg-muted text-xs mt-1">{translate('obLegalUpdated', { date: doc.updated }, 'he')}</p>

          {doc.sections.map((section) => (
            <section key={section.heading} className="mt-6">
              <h4 className="text-fg font-bold text-base mb-2">{section.heading}</h4>
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

          <p className="mt-8 pt-4 border-t border-line">
            {translate('obLegalContact', undefined, 'he')}{' '}
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
