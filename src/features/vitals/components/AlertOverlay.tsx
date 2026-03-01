import { useState, useEffect } from 'react';

interface Props {
  visible: boolean;
}

export default function AlertOverlay({ visible }: Props) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShown(false);
      return;
    }
    setShown(true);
    const timer = setTimeout(() => setShown(false), 5000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!shown) return null;

  return (
    <div
      className="fixed inset-x-0 top-8 z-40 flex justify-center pointer-events-none"
      aria-live="assertive"
    >
      <p
        className="text-emt-red font-black text-center leading-tight animate-slide-up"
        style={{ fontSize: 'clamp(1.8rem, 7vw, 3rem)' }}
      >
        האם סדיר ונימוש?
      </p>
    </div>
  );
}
