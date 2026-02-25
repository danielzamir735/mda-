import { RotateCcw } from 'lucide-react';

interface Props {
  result: number | null;
  unit: string;
  onClose: () => void;
}

export default function ResultPopup({ result, unit, onClose }: Props) {
  if (result === null) return null;

  // Map internal unit strings to Hebrew display labels
  const hebrewUnit = unit === 'BPM' || unit === 'פעימות בדקה'
    ? 'פעימות בדקה'
    : 'נשימות בדקה';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-emt-dark">
      {/* Massive result number */}
      <p
        className="font-black text-white tabular-nums leading-none"
        style={{ fontSize: 'clamp(7rem, 32vw, 12rem)' }}
      >
        {result}
      </p>

      {/* Hebrew unit label */}
      <p className="text-emt-light/70 text-2xl font-semibold mt-4 tracking-wide">
        {hebrewUnit}
      </p>

      {/* Reset / return button */}
      <button
        onClick={onClose}
        className="mt-12 flex items-center gap-2 px-8 py-4 rounded-2xl
                   bg-emt-border border border-white/20
                   text-emt-light font-bold text-lg
                   active:scale-95 transition-transform duration-150"
      >
        <RotateCcw size={20} />
        חזור / הפעל שוב
      </button>
    </div>
  );
}
