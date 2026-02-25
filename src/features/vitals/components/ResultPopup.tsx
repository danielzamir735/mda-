interface Props {
  result: number | null;
  unit: string;
  onClose: () => void;
}

export default function ResultPopup({ result, unit, onClose }: Props) {
  if (result === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center gap-4 rounded-3xl px-12 py-10
                   bg-white/10 border border-white/20 shadow-2xl
                   animate-fade-scale"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-emt-light/60 text-lg font-medium tracking-widest uppercase">
          תוצאה
        </p>
        <p
          className="font-black text-white tabular-nums leading-none"
          style={{ fontSize: 'clamp(5rem, 22vw, 9rem)' }}
        >
          {result}
        </p>
        <p className="text-emt-light/70 text-2xl font-semibold">{unit}</p>
        <p className="text-emt-light/30 text-sm mt-2">הקש בכל מקום לסגירה</p>
      </div>
    </div>
  );
}
