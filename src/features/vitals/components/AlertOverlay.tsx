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
      {/* Flat, high-contrast panel — no blur, no glow */}
      <div
        className="bg-emt-dark border-2 border-emt-red rounded-2xl px-8 py-5
                   animate-pulse-once"
      >
        <p
          className="text-emt-red font-black text-center leading-tight"
          style={{ fontSize: 'clamp(1.6rem, 6vw, 2.8rem)' }}
        >
          האם סדיר ונימוש?
        </p>
      </div>
    </div>
  );
}
