import { Delete } from 'lucide-react';

interface Props {
  multiplier: number;
  input: string;
  result: number | null;
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onCalculate: () => void;
  onReset: () => void;
}

const DIGITS = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];

export default function NumericKeypad({
  multiplier, input, result, onDigit, onBackspace, onCalculate, onReset,
}: Props) {
  const displayInput = input || '?';
  const displayResult = result !== null ? result : '—';

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="bg-emt-dark rounded-xl px-3 py-2 text-center">
        <p className="text-emt-light font-mono text-xl tracking-wide">
          {multiplier} × {displayInput} = {displayResult}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {DIGITS.map(d => (
          <button
            key={d}
            onClick={() => onDigit(d)}
            className="bg-emt-border active:scale-95 text-emt-light text-lg font-semibold rounded-lg py-3 transition-transform"
          >
            {d}
          </button>
        ))}

        <button
          onClick={onBackspace}
          className="bg-emt-border active:scale-95 text-emt-light rounded-lg py-3 flex items-center justify-center transition-transform"
        >
          <Delete size={18} />
        </button>

        <button
          onClick={() => onDigit('0')}
          className="bg-emt-border active:scale-95 text-emt-light text-lg font-semibold rounded-lg py-3 transition-transform"
        >
          0
        </button>

        <button
          onClick={onCalculate}
          className="bg-emt-green active:scale-95 text-white text-lg font-bold rounded-lg py-3 transition-transform"
        >
          =
        </button>
      </div>

      <button
        onClick={onReset}
        tabIndex={-1}
        className="text-emt-light/30 hover:text-emt-light/60 text-xs mt-0.5 transition-colors"
      >
        אפס
      </button>
    </div>
  );
}
