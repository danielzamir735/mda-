import { Delete } from 'lucide-react';

interface Props {
  multiplier: number;
  input: string;
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onResult: (value: number) => void;
}

// Standard phone layout: 1-2-3 on top (LTR)
const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export default function NumericKeypad({
  multiplier, input, onDigit, onBackspace, onResult,
}: Props) {
  const displayInput = input || '?';

  const handleCalculate = () => {
    const n = parseInt(input, 10);
    if (!isNaN(n) && input.length > 0) {
      onResult(n * multiplier);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full" dir="ltr">
      {/* Display */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-center">
        <p className="text-slate-400 text-sm mb-0.5">
          {multiplier} ×
        </p>
        <p
          className="text-slate-900 font-mono font-bold tabular-nums leading-none"
          style={{ fontSize: 'clamp(2.5rem, 10vw, 4rem)' }}
        >
          {displayInput}
        </p>
      </div>

      {/* Digit grid */}
      <div className="grid grid-cols-3 gap-2">
        {DIGITS.map(d => (
          <button
            key={d}
            onClick={() => onDigit(d)}
            className="bg-slate-100 hover:bg-slate-200 active:scale-90
                       text-slate-800 text-2xl font-semibold rounded-2xl py-4
                       transition-all duration-100 border border-slate-200"
          >
            {d}
          </button>
        ))}

        {/* Bottom row: backspace | 0 | = */}
        <button
          onClick={onBackspace}
          className="bg-slate-100 hover:bg-slate-200 active:scale-90
                     text-slate-600 rounded-2xl py-4
                     flex items-center justify-center
                     transition-all duration-100 border border-slate-200"
        >
          <Delete size={22} />
        </button>

        <button
          onClick={() => onDigit('0')}
          className="bg-slate-100 hover:bg-slate-200 active:scale-90
                     text-slate-800 text-2xl font-semibold rounded-2xl py-4
                     transition-all duration-100 border border-slate-200"
        >
          0
        </button>

        <button
          onClick={handleCalculate}
          className="bg-emt-green hover:bg-green-700 active:scale-90
                     text-white text-2xl font-black rounded-2xl py-4
                     transition-all duration-100 shadow-md shadow-green-600/25"
        >
          =
        </button>
      </div>
    </div>
  );
}
