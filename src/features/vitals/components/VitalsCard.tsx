import { useState } from 'react';
import { Play } from 'lucide-react';
import { useVitalsTimer } from '../hooks/useVitalsTimer';
import NumericKeypad from './NumericKeypad';

interface Props {
  label: string;
  duration: number;
  multiplier: number;
}

export default function VitalsCard({ label, duration, multiplier }: Props) {
  const { state, timeLeft, start, reset } = useVitalsTimer(duration);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const handleDigit = (d: string) => {
    if (input.length >= 3) return;
    setInput(prev => prev + d);
    setResult(null);
  };

  const handleBackspace = () => {
    setInput(prev => prev.slice(0, -1));
    setResult(null);
  };

  const handleCalculate = () => {
    const n = parseInt(input, 10);
    if (!isNaN(n)) setResult(n * multiplier);
  };

  const handleReset = () => {
    setInput('');
    setResult(null);
    reset();
  };

  if (state === 'idle') {
    return (
      <button
        onClick={start}
        className="bg-emt-gray border border-emt-border rounded-2xl p-4 flex flex-col items-center justify-center gap-3 w-full aspect-square active:scale-95 transition-transform hover:border-emt-red/60"
      >
        <div className="w-14 h-14 rounded-full bg-emt-red flex items-center justify-center shrink-0">
          <Play size={28} className="text-white" fill="white" />
        </div>
        <span className="text-emt-light text-center font-semibold text-sm leading-snug">
          {label}
        </span>
      </button>
    );
  }

  if (state === 'running') {
    return (
      <div className="bg-emt-gray border border-emt-red/70 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 w-full aspect-square">
        <p className="text-emt-light/60 text-xs">{label}</p>
        <span className="text-emt-red font-mono font-bold tabular-nums leading-none"
          style={{ fontSize: 'clamp(3rem, 12vw, 5rem)' }}>
          {timeLeft}
        </span>
        <p className="text-emt-light/40 text-xs">שניות</p>
      </div>
    );
  }

  return (
    <div className="bg-emt-gray border border-emt-green/60 rounded-2xl p-3 flex flex-col items-center gap-2 w-full">
      <p className="text-emt-light/60 text-xs">{label}</p>
      <NumericKeypad
        multiplier={multiplier}
        input={input}
        result={result}
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        onCalculate={handleCalculate}
        onReset={handleReset}
      />
    </div>
  );
}
