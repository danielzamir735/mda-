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
        isPlaying ? 'bg-emt-yellow/[0.07]' : 'bg-emt-gray',
      ].join(' ')}
      style={{
        borderColor: isPlaying ? 'rgba(253,216,53,0.50)' : 'rgba(255,255,255,0.12)',
        borderWidth: isPlaying ? '2px' : '1px',
      }}
    >
      {/* Title — top-center, large & bold */}
      <p className="text-emt-light font-black text-lg tracking-wide text-center w-full">
        מטרונום
      </p>

      {/* BPM display */}
      <div className="flex flex-col items-center gap-0 flex-1 justify-center">
        <span
          className="font-mono font-black tabular-nums leading-none transition-colors duration-300"
          style={{
            fontSize: 'clamp(2.8rem, 11vw, 5rem)',
            color: isPlaying ? '#FDD835' : '#F5F5F5',
          }}
        >
          {bpm}
        </span>
        <p className="text-emt-light/30 text-xs">BPM</p>
      </div>

      {/* Slider with +/- touch buttons */}
      <div className="w-full flex items-center gap-2 px-1">
        <button
          onClick={() => adjustBpm(-1)}
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center
                     bg-white/10 border border-white/15
                     text-emt-light active:scale-90 transition-transform"
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
                       bg-emt-border accent-emt-yellow"
            aria-label="קצב לדקה"
          />
          <div className="flex justify-between text-emt-light/20 text-xs px-0.5">
            <span>{MIN_BPM}</span>
            <span>{MAX_BPM}</span>
          </div>
        </div>

        <button
          onClick={() => adjustBpm(1)}
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center
                     bg-white/10 border border-white/15
                     text-emt-light active:scale-90 transition-transform"
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
          backgroundColor: isPlaying ? '#E53935' : '#43A047',
          boxShadow: isPlaying
            ? '0 4px 16px rgba(229,57,53,0.45)'
            : '0 4px 16px rgba(67,160,71,0.40)',
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
