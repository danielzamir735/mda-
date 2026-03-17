import { Play, VolumeX, Volume2 } from 'lucide-react';
import { useMetronomeStore, type BpmValue } from '../../store/metronomeStore';
import { useMetronome } from './hooks/useMetronome';
import { useTranslation } from '../../hooks/useTranslation';

const CPR_TEMPOS: BpmValue[] = [100, 110, 120];

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

      {/* BPM selector — 3 discrete tempo buttons */}
      <div className="w-full flex justify-between gap-2 px-1">
        {CPR_TEMPOS.map(tempo => {
          const active = bpm === tempo;
          return (
            <button
              key={tempo}
              onClick={() => setBpm(tempo)}
              className="flex-1 py-3 rounded-2xl font-black text-base tracking-wide
                         active:scale-95 transition-all duration-150"
              style={active ? {
                backgroundColor: '#3b82f6',
                color: 'white',
                boxShadow: '0 2px 10px rgba(59,130,246,0.45)',
              } : {
                backgroundColor: 'rgba(100,100,120,0.18)',
                color: '#9ca3af',
                border: '1px solid rgba(150,150,180,0.25)',
              }}
              aria-label={`${tempo} BPM`}
              aria-pressed={active}
            >
              {tempo}
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
