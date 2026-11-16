import { useState } from 'react';
import { Info } from 'lucide-react';
import LegalDocsModal from '../features/legal/LegalDocsModal';
import type { LegalDocId } from '../features/legal/legalContent';
import { useTranslation, type TranslationKey } from '../i18n';

const DOC_LINKS: { id: LegalDocId; label: TranslationKey }[] = [
  { id: 'terms', label: 'obDocTerms' },
  { id: 'privacy', label: 'obDocPrivacy' },
  { id: 'accessibility', label: 'obDocAccessibility' },
];

interface Props {
  isOpen: boolean;
  onAccept: () => void;
}

export default function LegalDisclaimerModal({ isOpen, onAccept }: Props) {
  const t = useTranslation();
  const [checked, setChecked] = useState(false);
  const [docOpen, setDocOpen] = useState<LegalDocId | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:px-4">
      <div className="bg-surface border border-line rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)] overflow-hidden">

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Icon + Title */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Info size={32} className="text-blue-500" />
            </div>
            <h2 className="text-fg font-black text-xl leading-snug">
              {t('obLegalTitle')}
            </h2>
          </div>

          {/* Disclaimer text */}
          <div className="text-start text-fg/85 text-sm leading-relaxed space-y-3 border border-line rounded-xl p-4 bg-page">
            <p className="font-bold text-fg">{t('obLegalTitle')}</p>
            <p>
              {t('obLegalP1a')}{' '}
              <strong>{t('obLegalP1b')}</strong>{t('obLegalP1c')}
            </p>
            <p>
              {t('obLegalP2a')}{' '}
              <strong>{t('obLegalP2b')}</strong>{t('obLegalP2c')}
            </p>
            <p>
              {t('obLegalP3a')} <strong>{t('obLegalP3b')}</strong> {t('obLegalP3c')}
            </p>
          </div>

          {/* Legal documents — readable before accepting */}
          <div className="text-start text-fg/85 text-sm leading-relaxed">
            <p>{t('obLegalReadDocs')}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              {DOC_LINKS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDocOpen(id)}
                  className="py-2 text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2 active:opacity-70"
                >
                  {t(label)}
                </button>
              ))}
            </div>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-blue-500 cursor-pointer"
            />
            <span className="text-fg text-sm font-semibold leading-relaxed text-start">
              {t('obLegalAccept')}
            </span>
          </label>
        </div>

        {/* Sticky bottom button — always visible, respects iPhone home indicator */}
        <div className="flex-shrink-0 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),1.5rem)] border-t border-line">
          <button
            onClick={onAccept}
            disabled={!checked}
            className="w-full py-3.5 rounded-xl bg-emt-green text-white font-bold text-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {t('continueAction')}
          </button>
        </div>
      </div>

      <LegalDocsModal
        isOpen={docOpen !== null}
        onClose={() => setDocOpen(null)}
        initialDoc={docOpen ?? 'terms'}
      />
    </div>
  );
}
