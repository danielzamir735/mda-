import { Minus, Plus, Play, Square } from 'lucide-react';
import { useMetronomeStore } from '../../store/metronomeStore';
import { useMetronome } from './hooks/useMetronome';

const MIN_BPM = 100;
const MAX_BPM = 120;

export default function MetronomeCard() {
  useMetronome(); // drives audio ticks

  const { bpm, isPlaying, setBpm, toggle } = useMetronomeStore();

  const adjustBpm = (delta: number) => {
    setBpm(Math.min(MAX_BPM, Math.max(MIN_BPM, bpm + delta)));
  };

  return (
    <div
      className={[
        'flex flex-col items-center gap-2',
        'rounded-3xl border p-3 h-full w-full',
        'transition-all duration-300',
        isPlaying ? 'bg-amber-50' : 'bg-emt-gray',
      ].join(' ')}
      style={{
        borderColor: isPlaying ? '#FCD34D' : '#E2E8F0',
        borderWidth: isPlaying ? '2px' : '1px',
        boxShadow: '0 2px 12px rgba(15,23,42,0.08)',
      }}
    >
      {/* Title */}
      <p className="text-emt-light font-black text-lg tracking-wide text-center w-full">
        מטרונום
      </p>

      {/* BPM display */}
      <div className="flex flex-col items-center gap-0 flex-1 justify-center">
        <span
          className="font-mono font-black tabular-nums leading-none transition-colors duration-300"
          style={{
            fontSize: 'clamp(2.8rem, 11vw, 5rem)',
            color: isPlaying ? '#D97706' : '#0F172A',
          }}
        >
          {bpm}
        </span>
        <p className="text-emt-muted text-xs font-medium">BPM</p>
      </div>

      {/* Slider with +/- touch buttons */}
      <div className="w-full flex items-center gap-2 px-1">
        <button
          onClick={() => adjustBpm(-1)}
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center
                     bg-slate-100 border border-slate-200
                     text-slate-600 active:scale-90 transition-transform hover:bg-slate-200"
          aria-label="הפחת BPM"
        >
          <Minus size={16} />
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            step={1}
            value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                       bg-slate-200 accent-emt-yellow"
            aria-label="קצב לדקה"
          />
          <div className="flex justify-between text-emt-muted text-xs px-0.5">
            <span>{MIN_BPM}</span>
            <span>{MAX_BPM}</span>
          </div>
        </div>

        <button
          onClick={() => adjustBpm(1)}
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center
                     bg-slate-100 border border-slate-200
                     text-slate-600 active:scale-90 transition-transform hover:bg-slate-200"
          aria-label="הגדל BPM"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Play / Stop */}
      <button
        onClick={toggle}
        className="w-14 h-14 rounded-full flex items-center justify-center
                   active:scale-90 transition-all duration-150"
        style={{
          backgroundColor: isPlaying ? '#DC2626' : '#16A34A',
          boxShadow: isPlaying
            ? '0 4px 16px rgba(220,38,38,0.35)'
            : '0 4px 16px rgba(22,163,74,0.35)',
        }}
        aria-label={isPlaying ? 'עצור' : 'הפעל'}
      >
        {isPlaying
          ? <Square size={22} fill="white" className="text-white" />
          : <Play size={24} fill="white" className="text-white" />
        }
      </button>
    </div>
  );
}
