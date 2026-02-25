interface Props {
  result: number | null;
  unit: string;
  onClose: () => void;
}

export default function ResultPopup({ result, unit, onClose }: Props) {
  if (result === null) return null;

  const hebrewUnit =
    unit === 'BPM' || unit === 'פעימות בדקה' ? 'פעימות בדקה' : 'נשימות בדקה';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/70 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <div
        className="bg-[#111114] border border-emt-border rounded-3xl shadow-2xl p-8
                   flex flex-col items-center gap-4 w-full max-w-xs
                   animate-fade-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Raw number — no medical assessment */}
        <p
          className="font-mono font-black text-emt-light tabular-nums leading-none"
          style={{ fontSize: 'clamp(6rem, 28vw, 10rem)' }}
        >
          {result}
        </p>

        {/* Unit label */}
        <p className="text-emt-muted text-lg font-semibold -mt-2">{hebrewUnit}</p>

        {/* Close */}
        <button
          onClick={onClose}
          className="mt-2 w-full py-4 rounded-2xl
                     bg-emt-border/30 border border-emt-border
                     text-emt-light font-bold text-lg
                     active:scale-95 transition-transform duration-150"
        >
          סגור
        </button>
      </div>
    </div>
  );
}
