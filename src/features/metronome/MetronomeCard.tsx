import { Minus, Plus, Play, Square } from 'lucide-react';
import { useMetronomeStore, BPM_VALUES } from '../../store/metronomeStore';
import { useMetronome } from './hooks/useMetronome';

export default function MetronomeCard() {
  useMetronome();
  const { bpm, isPlaying, setBpm, toggle } = useMetronomeStore();

  const idx = BPM_VALUES.indexOf(bpm);
  const canDecrease = idx > 0;
  const canIncrease = idx < BPM_VALUES.length - 1;

  const stepBpm = (direction: 1 | -1) => {
    const next = BPM_VALUES[idx + direction];
    if (next !== undefined) setBpm(next);
  };

  return (
    <div
      className={[
        'flex flex-col items-center gap-2',
        'rounded-3xl p-3 h-full w-full',
        'transition-all duration-300',
        isPlaying
          ? 'bg-[#130F00] border-2 border-emt-yellow'
          : 'bg-emt-gray border border-emt-border',
      ].join(' ')}
      style={isPlaying ? {
        boxShadow: '0 0 28px rgba(245,158,11,0.20), 0 2px 12px rgba(0,0,0,0.6)',
      } : {
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
      }}
    >
      <p className="text-emt-light font-black text-lg tracking-wide text-center w-full">
        מטרונום
      </p>

      <div className="flex flex-col items-center flex-1 justify-center gap-0">
        <span
          className="font-mono font-black tabular-nums leading-none transition-colors duration-300"
          style={{
            fontSize: 'clamp(2.8rem, 11vw, 5rem)',
            color: isPlaying ? '#F59E0B' : '#F4F4F5',
          }}
        >
          {bpm}
        </span>
        <p className="text-emt-muted text-xs font-medium">BPM</p>
      </div>

      {/* Slider row */}
      <div className="w-full flex items-center gap-2 px-1">
        <button
          onClick={() => stepBpm(-1)}
          disabled={!canDecrease}
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center
                     bg-emt-border/30 border border-emt-border
                     text-emt-muted active:scale-90 transition-transform
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
          aria-label="הפחת BPM"
        >
          <Minus size={16} />
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <input
            type="range"
            min={BPM_VALUES[0]}
            max={BPM_VALUES[BPM_VALUES.length - 1]}
            step={10}
            value={bpm}
            onChange={e => setBpm(Number(e.target.value) as typeof BPM_VALUES[number])}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                       bg-emt-border accent-emt-yellow"
            aria-label="קצב לדקה"
          />
          <div className="flex justify-between text-emt-muted text-xs px-0.5">
            <span>{BPM_VALUES[0]}</span>
            <span>{BPM_VALUES[BPM_VALUES.length - 1]}</span>
          </div>
        </div>

        <button
          onClick={() => stepBpm(1)}
          disabled={!canIncrease}
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center
                     bg-emt-border/30 border border-emt-border
                     text-emt-muted active:scale-90 transition-transform
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
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
          backgroundColor: isPlaying ? '#EF233C' : '#22C55E',
          boxShadow: isPlaying
            ? '0 4px 16px rgba(239,35,60,0.35)'
            : '0 4px 16px rgba(34,197,94,0.35)',
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
