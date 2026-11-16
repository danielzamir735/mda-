import { useState, useEffect, useMemo } from 'react';
import { X, BookOpen, Brain } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import FlashcardTrainer, { type FlashcardItem } from '../../../components/FlashcardTrainer';
import { trackInteraction, trackEvent } from '../../../utils/analytics';
import { useTranslation, useLanguage, type TranslationKey } from '../../../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const HEADERS: TranslationKey[] = ['calcVitalsColVital', 'calcAdult', 'calcChild', 'calcInfant'];

const ROWS: { label: TranslationKey; adult: string; child: string; infant: string }[] = [
  { label: 'calcVitalsRr', adult: '12–20',  child: '18–30',  infant: '24–40'  },
  { label: 'calcVitalsHr', adult: '60–100', child: '60–140', infant: '100–190'},
  { label: 'calcVitalsSbp', adult: '90–140', child: '90–110', infant: '60–90'  },
  { label: 'calcVitalsDbp', adult: '60–90',  child: '50–80',  infant: '40–60'  },
  { label: 'calcVitalsPp', adult: '30–60',  child: '30–60',  infant: '30–60'  },
  { label: 'calcVitalsGlucose', adult: '60–110', child: '60–110', infant: '60–110' },
];


export default function VitalsReferenceModal({ isOpen, onClose }: Props) {
  const [trainerOpen, setTrainerOpen] = useState(false);
  const t = useTranslation();
  const { dir } = useLanguage();
  const FLASHCARD_DATA: FlashcardItem[] = useMemo(() => ROWS.flatMap((row) => [
    { front: t('calcVitalsCardFront', { label: t(row.label), group: t('calcAdult') }), back: row.adult },
    { front: t('calcVitalsCardFront', { label: t(row.label), group: t('calcChild') }), back: row.child },
    { front: t('calcVitalsCardFront', { label: t(row.label), group: t('calcInfant') }), back: row.infant },
  ]), [t]);
  useModalBackHandler(isOpen, onClose);

  useEffect(() => {
    if (isOpen) trackInteraction('טבלת מדדים', 'reference'); // i18n-ok: analytics label, kept stable
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] flex flex-col bg-page">
        {/* Header */}
        <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="flex items-center gap-2">
            <BookOpen size={22} className="text-blue-400" />
            <h2 className="text-fg font-bold text-xl">{t('calcVitalsTitle')}</h2>
          </div>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* ── Flashcard Trainer Trigger ── */}
          <button
            onClick={() => { setTrainerOpen(true); trackEvent('open_flashcard_trainer', { tool: 'vitals_reference' }); }}
            className="w-full mb-4 rounded-2xl border border-purple-400/30 bg-purple-500/8 dark:bg-purple-500/10
                       backdrop-blur-sm px-4 py-3.5 flex items-center gap-3
                       active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
              <Brain size={20} className="text-purple-400" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-purple-700 dark:text-purple-200 font-bold text-base leading-tight">{t('calcVitalsTrainer')}</span>
              <span className="text-purple-600/70 dark:text-purple-300/50 text-xs mt-0.5">{t('calcVitalsTrainerSub', { n: FLASHCARD_DATA.length })}</span>
            </div>
            <div className="ms-auto text-purple-400/60 text-lg">{dir === 'rtl' ? '←' : '→'}</div>
          </button>

          {/* Table */}
          <div className="w-full rounded-2xl border border-line overflow-hidden">

            {/* Column headers */}
            <div className="grid grid-cols-4 bg-blue-600 dark:bg-blue-900 border-b-2 border-blue-700 dark:border-blue-800">
              {HEADERS.map((h) => (
                <div key={h} className="px-3 py-4 text-base font-black text-white text-center bg-blue-600 dark:bg-blue-900">
                  {t(h)}
                </div>
              ))}
            </div>

            {/* Data rows */}
            {ROWS.map((row, i) => (
              <div
                key={row.label}
                className={[
                  'grid grid-cols-4 items-stretch',
                  i % 2 === 0
                    ? 'bg-surface'
                    : 'bg-blue-50 dark:bg-blue-950/40',
                  i < ROWS.length - 1 ? 'border-b border-line' : '',
                ].join(' ')}
              >
                {/* Vital name cell */}
                <div className="px-4 py-4 text-base font-black text-blue-700 dark:text-blue-300 text-start flex items-center border-e border-line bg-blue-50/60 dark:bg-blue-950/30">
                  {t(row.label)}
                </div>

                {/* Value cells */}
                {[row.adult, row.child, row.infant].map((val, j) => (
                  <div
                    key={j}
                    className={[
                      'px-3 py-4 text-lg tabular-nums font-semibold text-center flex items-center justify-center',
                      'text-fg',
                      j < 2 ? 'border-e border-line' : '',
                    ].join(' ')}
                  >
                    {val}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p className="text-xs text-fg-subtle text-center mt-4 leading-relaxed">
            {t('calcVitalsDisclaimer')}
          </p>
        </div>
      </div>

      {/* Flashcard Trainer overlay */}
      {trainerOpen && (
        <FlashcardTrainer
          data={FLASHCARD_DATA}
          onClose={() => setTrainerOpen(false)}
        />
      )}
    </>
  );
}
