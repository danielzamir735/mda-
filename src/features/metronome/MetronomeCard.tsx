import { Play, VolumeX, Volume2, Plus, Minus } from 'lucide-react';
import { useMetronomeStore, BPM_VALUES } from '../../store/metronomeStore';
import { useMetronome } from './hooks/useMetronome';
import { useTranslation } from '../../hooks/useTranslation';

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

      {/* BPM selector — +/- buttons with bounded custom track */}
      <div className="w-full flex items-center gap-2 px-1">
        <button
          onClick={() => { const i = BPM_VALUES.indexOf(bpm); if (i > 0) setBpm(BPM_VALUES[i - 1]); }}
          disabled={BPM_VALUES.indexOf(bpm) === 0}
          className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center
                     bg-gray-200 dark:bg-emt-border/30 border border-gray-300 dark:border-emt-border
                     text-gray-500 dark:text-emt-muted active:scale-90 transition-transform
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
          aria-label="הפחת BPM"
        ><Minus size={15} /></button>

        {/* Outer track wrapper — end-caps sit here */}
        <div className="flex-1 relative" style={{ height: 36 }}>
          {/* Right end-cap (100 BPM side) */}
          <div
            className="absolute right-0 rounded-full"
            style={{
              width: 3, height: 14,
              top: '50%', transform: 'translateY(-50%)',
              backgroundColor: isPlaying ? 'rgba(245,158,11,0.55)' : 'rgba(120,120,140,0.35)',
            }}
          />
          {/* Left end-cap (140 BPM side) */}
          <div
            className="absolute left-0 rounded-full"
            style={{
              width: 3, height: 14,
              top: '50%', transform: 'translateY(-50%)',
              backgroundColor: isPlaying ? 'rgba(245,158,11,0.55)' : 'rgba(120,120,140,0.35)',
            }}
          />

          {/* Inner track area — inset so edge dots stay within outer bounds */}
          <div className="absolute" style={{ left: 12, right: 12, top: 0, bottom: 0 }}>
            {/* Track background */}
            <div
              className="absolute inset-x-0 rounded-full"
              style={{
                height: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: isPlaying ? 'rgba(245,158,11,0.18)' : 'rgba(120,120,140,0.15)',
                border: isPlaying ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(120,120,140,0.2)',
              }}
            />
            {/* Filled portion — anchored at right, grows leftward */}
            <div
              className="absolute right-0 rounded-full transition-all duration-200"
              style={{
                height: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: `${(BPM_VALUES.indexOf(bpm) / (BPM_VALUES.length - 1)) * 100}%`,
                backgroundColor: isPlaying ? '#F5A623' : '#3b82f6',
              }}
            />
            {/* Step dots */}
            {BPM_VALUES.map((val, i) => (
              <button
                key={val}
                onClick={() => setBpm(val)}
                className="absolute transition-all duration-150 active:scale-90"
                style={{
                  right: `${(i / (BPM_VALUES.length - 1)) * 100}%`,
                  transform: 'translate(50%, -50%)',
                  top: '50%',
                  width: bpm === val ? 20 : 12,
                  height: bpm === val ? 20 : 12,
                  borderRadius: '50%',
                  backgroundColor: bpm === val
                    ? (isPlaying ? '#F5A623' : '#3b82f6')
                    : (isPlaying ? 'rgba(245,158,11,0.3)' : 'rgba(120,120,140,0.25)'),
                  border: bpm === val ? '2.5px solid white' : '1.5px solid transparent',
                  boxShadow: bpm === val ? '0 0 10px rgba(0,0,0,0.35)' : 'none',
                  zIndex: bpm === val ? 2 : 1,
                }}
                aria-label={`${val} BPM`}
                aria-pressed={bpm === val}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => { const i = BPM_VALUES.indexOf(bpm); if (i < BPM_VALUES.length - 1) setBpm(BPM_VALUES[i + 1]); }}
          disabled={BPM_VALUES.indexOf(bpm) === BPM_VALUES.length - 1}
          className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center
                     bg-gray-200 dark:bg-emt-border/30 border border-gray-300 dark:border-emt-border
                     text-gray-500 dark:text-emt-muted active:scale-90 transition-transform
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
          aria-label="הגדל BPM"
        ><Plus size={15} /></button>
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
