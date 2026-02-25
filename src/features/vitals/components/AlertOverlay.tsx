interface Props {
  visible: boolean;
}

export default function AlertOverlay({ visible }: Props) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center pointer-events-none pb-28"
      aria-live="assertive"
    >
      {/* High-contrast dark panel so it's visible above the bright UI */}
      <div
        className="bg-slate-900 border-2 border-red-500 rounded-2xl px-8 py-5
                   shadow-2xl animate-pulse-once"
      >
        <p
          className="text-red-400 font-black text-center leading-tight"
          style={{ fontSize: 'clamp(1.6rem, 6vw, 2.8rem)' }}
        >
          האם סדיר ונימוש?
        </p>
      </div>
    </div>
  );
}
