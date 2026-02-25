interface Props {
  visible: boolean;
}

export default function AlertOverlay({ visible }: Props) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
      aria-live="assertive"
    >
      <div className="bg-black/60 backdrop-blur-sm rounded-3xl px-10 py-8 flex items-center justify-center animate-pulse-once">
        <p
          className="text-emt-red font-black text-center leading-tight"
          style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}
        >
          האם סדיר ונימוש?
        </p>
      </div>
    </div>
  );
}
