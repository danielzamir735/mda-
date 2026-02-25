import { Play, Square } from 'lucide-react';
import { useMetronomeStore } from '../../store/metronomeStore';
import { useMetronome } from './hooks/useMetronome';

export default function MetronomeCard() {
  useMetronome(); // drives audio ticks

  const { bpm, isPlaying, setBpm, toggle } = useMetronomeStore();

  return (
    <div
      className="flex flex-col items-center justify-between gap-3
                 rounded-3xl border border-emt-border p-4 h-full w-full
                 transition-all duration-300"
      style={{
        background: isPlaying
          ? 'linear-gradient(135deg, #0f0f1a 0%, #1E1E1E 100%)'
          : 'linear-gradient(135deg, #141414 0%, #1E1E1E 100%)',
        borderColor: isPlaying ? 'rgba(253,216,53,0.45)' : '#2C2C2C',
      }}
    >
      <p className="text-emt-light/50 text-xs tracking-widest uppercase self-start">
        מטרונום
      </p>

      {/* BPM display */}
      <div className="flex flex-col items-center gap-0">
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

      {/* Slider */}
      <div className="w-full px-1">
        <input
          type="range"
          min={40}
          max={200}
          step={1}
          value={bpm}
          onChange={e => setBpm(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                     bg-emt-border accent-emt-yellow"
          aria-label="קצב לדקה"
        />
        <div className="flex justify-between text-emt-light/20 text-xs mt-1 px-0.5">
          <span>40</span>
          <span>200</span>
        </div>
      </div>

      {/* Play / Stop */}
      <button
        onClick={toggle}
        className="w-14 h-14 rounded-full flex items-center justify-center
                   shadow-lg active:scale-90 transition-all duration-150"
        style={{
          backgroundColor: isPlaying ? '#E53935' : '#43A047',
          boxShadow: isPlaying
            ? '0 0 20px rgba(229,57,53,0.4)'
            : '0 0 20px rgba(67,160,71,0.35)',
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
