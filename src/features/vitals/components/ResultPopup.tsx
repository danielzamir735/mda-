interface Props {
  result: number | null;
  unit: string;
  onClose: () => void;
}

export default function ResultPopup({ result, unit, onClose }: Props) {
  if (result === null) return null;

  const hebrewUnit = unit === 'BPM' || unit === 'פעימות בדקה'
    ? 'פעימות בדקה'
    : 'נשימות בדקה';

  const isHeart = hebrewUnit === 'פעימות בדקה';
  const rangeLabel = isHeart
    ? (result < 60 ? 'ברדיקרדיה' : result > 100 ? 'טכיקרדיה' : 'תקין')
    : (result < 12 ? 'ברדיפנאה' : result > 20 ? 'טכיפנאה' : 'תקין');
  const rangeColor = (rangeLabel === 'תקין')
    ? 'text-green-600'
    : 'text-red-600';

  return (
    /* Backdrop — click outside the card to close */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/40 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl p-8
                   flex flex-col items-center gap-3
                   w-full max-w-xs
                   animate-fade-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Massive result number */}
        <p
          className="font-black text-slate-900 tabular-nums leading-none"
          style={{ fontSize: 'clamp(6rem, 28vw, 10rem)' }}
        >
          {result}
        </p>

        {/* Unit */}
        <p className="text-slate-500 text-lg font-semibold">{hebrewUnit}</p>

        {/* Range status badge */}
        <span className={`text-sm font-bold px-3 py-1 rounded-full bg-slate-100 ${rangeColor}`}>
          {rangeLabel}
        </span>

        {/* Close / go back */}
        <button
          onClick={onClose}
          className="mt-3 w-full py-4 rounded-2xl
                     bg-slate-100 border border-slate-200
                     text-slate-700 font-bold text-lg
                     active:scale-95 transition-transform duration-150"
        >
          סגור
        </button>
      </div>
    </div>
  );
}
