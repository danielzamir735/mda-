import { useState, useEffect } from 'react';

interface Props {
  visible: boolean;
  text?: string;
}

export default function AlertOverlay({ visible, text = 'האם סדיר ונימוש?' }: Props) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShown(false);
      return;
    }
    setShown(true);
    const timer = setTimeout(() => setShown(false), 2500);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!shown) return null;

  return (
    <div
      className="fixed inset-x-0 top-4 z-40 flex justify-center pointer-events-none"
      aria-live="assertive"
    >
      <p
        className="text-emt-red font-black text-center leading-snug animate-slide-up whitespace-pre-line"
        style={{ fontSize: 'clamp(1.4rem, 5.5vw, 2.4rem)' }}
      >
        {text}
      </p>
    </div>
  );
}
