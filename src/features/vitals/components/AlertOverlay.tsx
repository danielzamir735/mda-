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
    const timer = setTimeout(() => setShown(false), 7000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!shown) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
      aria-live="assertive"
    >
      <div
        className="bg-[#0F0609]/95 border-2 border-emt-red rounded-3xl
                   px-10 py-7 shadow-2xl animate-slide-up"
        style={{ boxShadow: '0 0 40px rgba(239,35,60,0.3)' }}
      >
        <p
          className="text-emt-red font-black text-center leading-tight"
          style={{ fontSize: 'clamp(1.8rem, 7vw, 3rem)' }}
        >
          האם סדיר ונימוש?
        </p>
      </div>
    </div>
  );
}
