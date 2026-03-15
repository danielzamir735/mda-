import { Play, VolumeX, Volume2, Plus, Minus } from 'lucide-react';
import { useMetronomeStore, BPM_VALUES, type BpmValue } from '../../store/metronomeStore';
import { useMetronome } from './hooks/useMetronome';
import { useTranslation } from '../../hooks/useTranslation';

// ── slider styles injected once ───────────────────────────────────────────────
const CARD_CSS = `
  .bpm-card-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
  }
  .bpm-card-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2.5px solid white;
    box-shadow: 0 1px 6px rgba(0,0,0,0.35);
    cursor: pointer;
    transition: box-shadow 150ms, transform 150ms;
  }
  .bpm-card-slider:active::-webkit-slider-thumb {
    transform: scale(1.15);
    box-shadow: 0 2px 12px rgba(0,0,0,0.45);
  }
  .bpm-card-slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2.5px solid white;
    box-shadow: 0 1px 6px rgba(0,0,0,0.35);
    cursor: pointer;
  }
  /* inactive (blue) */
  .bpm-card-slider.inactive::-webkit-slider-thumb { background: #3b82f6; }
  .bpm-card-slider.inactive::-moz-range-thumb     { background: #3b82f6; }
  /* active (amber) */
  .bpm-card-slider.active-play::-webkit-slider-thumb { background: #F5A623; }
  .bpm-card-slider.active-play::-moz-range-thumb     { background: #F5A623; }
`;
if (typeof document !== 'undefined' && !document.getElementById('bpm-card-slider-css')) {
  const tag = document.createElement('style');
  tag.id = 'bpm-card-slider-css';
  tag.textContent = CARD_CSS;
  document.head.appendChild(tag);
}

export default function MetronomeCard() {
  useMetronome();
  const { bpm, isPlaying, isAudioMuted, lastCPRTime, lastCPRShocks, setBpm, start, toggleAudio, endCPR } =
    useMetronomeStore();
  const t = useTranslation();


  return (
    <div
      className={[
        'flex flex-col items-center gap-2',
        'rounded-3xl p-2 h-full w-full',
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
              {t('lastSession')}{' '}
              <span className="text-lg font-medium text-blue-400/90 tabular-nums">{lastCPRTime}</span>
              {lastCPRShocks > 0 && (
                <span className="mr-1 text-yellow-400 font-bold"> · ⚡{lastCPRShocks}</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* BPM selector — +/- buttons with track */}
      <div className="w-full flex items-center gap-3 px-2">
        <button
          onClick={() => { const i = BPM_VALUES.indexOf(bpm); if (i > 0) setBpm(BPM_VALUES[i - 1]); }}
          disabled={BPM_VALUES.indexOf(bpm) === 0}
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center
                     bg-gray-200 dark:bg-emt-border/30 border border-gray-300 dark:border-emt-border
                     text-gray-500 dark:text-emt-muted active:scale-90 transition-transform
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
          aria-label="הפחת BPM"
        ><Minus size={16} /></button>

        {/* slider wrapper — horizontal padding prevents thumb clipping at extremes */}
        <div className="flex-1 flex flex-col items-stretch gap-1 px-1">
          <input
            type="range"
            min={100}
            max={120}
            step={10}
            value={bpm}
            onChange={e => setBpm(Number(e.target.value) as BpmValue)}
            className={`bpm-card-slider w-full ${isPlaying ? 'active-play' : 'inactive'}`}
            style={{
              background: isPlaying ? '#F5A623' : '#3b82f6',
            }}
            aria-label="BPM"
          />
          {/* tick labels */}
          <div className="flex justify-between text-[0.58rem] font-bold text-gray-400 dark:text-slate-600 tracking-wide select-none" style={{ direction: 'ltr' }}>
            <span>100</span>
            <span>110</span>
            <span>120</span>
          </div>
        </div>

        <button
          onClick={() => { const i = BPM_VALUES.indexOf(bpm); if (i < BPM_VALUES.length - 1) setBpm(BPM_VALUES[i + 1]); }}
          disabled={BPM_VALUES.indexOf(bpm) === BPM_VALUES.length - 1}
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center
                     bg-gray-200 dark:bg-emt-border/30 border border-gray-300 dark:border-emt-border
                     text-gray-500 dark:text-emt-muted active:scale-90 transition-transform
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
          aria-label="הגדל BPM"
        ><Plus size={16} /></button>
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
          aria-label={t('start')}
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
            aria-label={isAudioMuted ? t('startMetronome') : t('stopMetronome')}
          >
            {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            {isAudioMuted ? t('startMetronome') : t('stopMetronome')}
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
            aria-label={t('endCPR')}
          >
            {t('endCPR')}
          </button>
        </div>
      )}
    </div>
  );
}
