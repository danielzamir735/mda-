import { useState } from 'react';
import { X } from 'lucide-react';
import NumericKeypad from './NumericKeypad';

interface Props {
  isOpen: boolean;
  multiplier: number;
  unit: string;
  onClose: () => void;
  onResult: (value: number) => void;
}

export default function CalculatorModal({
  isOpen, multiplier, unit, onClose, onResult,
}: Props) {
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const label = unit === 'BPM' ? 'BPM' : 'נשימות';

  const handleDigit = (d: string) => {
    if (input.length >= 3) return;
    setInput((prev) => prev + d);
  };

  const handleBackspace = () => setInput((prev) => prev.slice(0, -1));

  const handleResult = (value: number) => {
    setInput('');
    onResult(value);
    onClose();
  };

  const handleClose = () => {
    setInput('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/70 backdrop-blur-sm px-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl
                   bg-white/[0.08] backdrop-blur-xl
                   border border-white/20
                   shadow-[0_16px_48px_rgba(0,0,0,0.6)]
                   overflow-hidden animate-fade-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — label centered, close button right */}
        <div className="relative flex items-center justify-center px-5 pt-5 pb-3">
          <button
            onClick={handleClose}
            className="absolute right-5 w-9 h-9 rounded-full bg-white/10
                       flex items-center justify-center
                       text-emt-light/60 hover:text-emt-light hover:bg-white/20
                       active:scale-90 transition-all"
            aria-label="סגור"
          >
            <X size={18} />
          </button>
          <p className="text-emt-light font-bold text-lg tracking-wide">{label}</p>
        </div>

        {/* Keypad */}
        <div className="px-4 pb-6">
          <NumericKeypad
            multiplier={multiplier}
            input={input}
            onDigit={handleDigit}
            onBackspace={handleBackspace}
            onResult={handleResult}
          />
        </div>
      </div>
    </div>
  );
}
