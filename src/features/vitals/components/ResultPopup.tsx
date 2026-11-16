import { useTranslation } from '../../../i18n';

interface Props {
  result: number | null;
  unit: string;
  onClose: () => void;
}

export default function ResultPopup({ result, unit, onClose }: Props) {
  const t = useTranslation();
  if (result === null) return null;

  return (
    <div
      // theme-ok: modal backdrop dims the page in both modes
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-line rounded-3xl shadow-2xl p-8
                   flex flex-col items-center gap-4 w-full max-w-xs
                   animate-fade-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Raw number — no medical assessment */}
        <p
          className="font-mono font-black text-fg tabular-nums leading-none"
          style={{ fontSize: 'clamp(6rem, 28vw, 10rem)' }}
        >
          {result}
        </p>

        {/* Unit label */}
        <p className="text-fg-muted text-lg font-semibold -mt-2">{unit}</p>

        {/* Close */}
        <button
          onClick={onClose}
          className="mt-2 w-full py-4 rounded-2xl
                     bg-surface-3 border border-line
                     text-fg font-bold text-lg
                     active:scale-95 transition-transform duration-150"
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
}
