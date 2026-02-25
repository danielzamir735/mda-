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

  const handleDigit = (d: string) => {
    if (input.length >= 3) return;
    setInput(prev => prev + d);
  };

  const handleBackspace = () => setInput(prev => prev.slice(0, -1));

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
      className="fixed inset-0 z-50 flex items-end justify-center
                 bg-black/70 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm mb-4 mx-3 rounded-3xl
                   bg-emt-gray border border-emt-border
                   shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-emt-border flex items-center justify-center
                       text-emt-light/60 hover:text-emt-light hover:bg-emt-border/80
                       active:scale-90 transition-all"
            aria-label="סגור"
          >
            <X size={18} />
          </button>
          <p className="text-emt-light/70 text-sm font-medium">{unit}</p>
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
