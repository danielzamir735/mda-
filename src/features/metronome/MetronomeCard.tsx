import { Minus, Plus, Play, VolumeX, Volume2 } from 'lucide-react';
import { useMetronomeStore, BPM_VALUES } from '../../store/metronomeStore';
import { useMetronome } from './hooks/useMetronome';
import { useTranslation } from '../../hooks/useTranslation';

export default function MetronomeCard() {
  useMetronome();
  const { bpm, isPlaying, isAudioMuted, lastCPRTime, lastCPRShocks, setBpm, start, toggleAudio, endCPR } =
    useMetronomeStore();
  const t = useTranslation();

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
          : 'bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border',
      ].join(' ')}
      style={isPlaying ? {
        boxShadow: '0 0 28px rgba(245,158,11,0.20), 0 2px 12px rgba(0,0,0,0.6)',
      } : {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <p className="text-gray-900 dark:text-emt-light font-black text-lg tracking-wide text-center w-full">
        {t('metronome')}
      </p>

      <div className="flex flex-col items-center flex-1 justify-center gap-0">
        <span
          className={`font-mono font-black tabular-nums leading-none transition-colors duration-300 ${
            isPlaying ? 'text-emt-yellow' : 'text-gray-900 dark:text-emt-light'
          }`}
          style={{ fontSize: 'clamp(2.8rem, 11vw, 5rem)' }}
        >
          {bpm}
        </span>
        <p className="text-gray-400 dark:text-emt-muted text-xs font-medium">BPM</p>
        {!isPlaying && lastCPRTime && (
          <div className="mt-1.5 text-center">
            <p className="text-sm text-gray-400/80 dark:text-gray-500">
              סשן אחרון{' '}
              <span className="text-lg font-medium text-blue-400/90 tabular-nums">{lastCPRTime}</span>
              {lastCPRShocks > 0 && (
                <span className="mr-1 text-yellow-400 font-bold"> · ⚡{lastCPRShocks}</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* BPM slider */}
      <div className="w-full flex items-center gap-2 px-1">
        <button
          onClick={() => stepBpm(-1)}
          disabled={!canDecrease}
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center
                     bg-gray-200 dark:bg-emt-border/30 border border-gray-300 dark:border-emt-border
                     text-gray-500 dark:text-emt-muted active:scale-90 transition-transform
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
                       bg-gray-200 dark:bg-emt-border accent-emt-yellow"
            aria-label="קצב לדקה"
          />
          <div className="flex justify-between text-gray-400 dark:text-emt-muted text-xs px-0.5">
            <span>{BPM_VALUES[0]}</span>
            <span>{BPM_VALUES[BPM_VALUES.length - 1]}</span>
          </div>
        </div>

        <button
          onClick={() => stepBpm(1)}
          disabled={!canIncrease}
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center
                     bg-gray-200 dark:bg-emt-border/30 border border-gray-300 dark:border-emt-border
                     text-gray-500 dark:text-emt-muted active:scale-90 transition-transform
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
          aria-label="הגדל BPM"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Action buttons */}
      {!isPlaying ? (
        /* Start CPR */
        <button
          onClick={start}
          className="w-14 h-14 rounded-full flex items-center justify-center
                     active:scale-90 transition-all duration-150"
          style={{
            backgroundColor: '#22C55E',
            boxShadow: '0 4px 16px rgba(34,197,94,0.35)',
          }}
          aria-label="הפעל"
        >
          <Play size={24} fill="white" className="text-white" />
        </button>
      ) : (
        <div className="w-full flex flex-col items-center gap-2">
          {/* Audio toggle */}
          <button
            onClick={toggleAudio}
            className="w-full py-2 rounded-2xl flex items-center justify-center gap-2
                       font-bold text-sm active:scale-95 transition-all duration-150"
            style={{
              backgroundColor: isAudioMuted ? 'rgba(100,100,120,0.25)' : 'rgba(245,158,11,0.18)',
              border: isAudioMuted ? '1px solid rgba(150,150,180,0.4)' : '1px solid rgba(245,158,11,0.5)',
              color: isAudioMuted ? '#aaa' : '#f5c842',
            }}
            aria-label={isAudioMuted ? 'הפעל מטרונום' : 'הפסק מטרונום'}
          >
            {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            {isAudioMuted ? 'הפעל מטרונום' : 'הפסק מטרונום'}
          </button>

          {/* End CPR */}
          <button
            onClick={endCPR}
            className="w-full py-2.5 rounded-2xl flex items-center justify-center gap-2
                       font-black text-base active:scale-95 transition-all duration-150"
            style={{
              backgroundColor: '#EF233C',
              boxShadow: '0 4px 16px rgba(239,35,60,0.45)',
              color: 'white',
            }}
            aria-label="סיים החייאה"
          >
            סיים החייאה
          </button>
        </div>
      )}
    </div>
  );
}
