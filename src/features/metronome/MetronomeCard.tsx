import { Play, VolumeX, Volume2 } from 'lucide-react';
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

      {/* BPM selector */}
      <div className="w-full flex items-center gap-2 px-1">
        {BPM_VALUES.map((val) => {
          const isActive = bpm === val;
          return (
            <button
              key={val}
              onClick={() => setBpm(val)}
              aria-label={`${val} BPM`}
              aria-pressed={isActive}
              className="flex-1 py-4 rounded-2xl flex flex-col items-center justify-center gap-0.5
                         active:scale-95 transition-all duration-150 select-none"
              style={isActive ? {
                backgroundColor: '#F5A623',
                boxShadow: '0 0 18px rgba(245,166,35,0.55)',
                border: '2px solid #FFD580',
              } : {
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '2px solid rgba(255,255,255,0.14)',
              }}
            >
              <span
                className="font-black tabular-nums leading-none"
                style={{
                  fontSize: '1.75rem',
                  color: isActive ? '#1A1200' : '#cbd5e1',
                }}
              >
                {val}
              </span>
              <span
                className="font-bold uppercase tracking-widest"
                style={{
                  fontSize: '0.6rem',
                  color: isActive ? '#4a3000' : '#64748b',
                }}
              >
                BPM
              </span>
            </button>
          );
        })}
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
