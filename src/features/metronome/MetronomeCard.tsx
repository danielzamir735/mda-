import { Play, VolumeX, Volume2, Plus, Minus } from 'lucide-react';
import { useMetronomeStore, BPM_VALUES } from '../../store/metronomeStore';
import { useMetronome } from './hooks/useMetronome';
import { useTranslation, useLanguage } from '../../i18n';
import { trackEvent, trackInteraction } from '../../utils/analytics';

export default function MetronomeCard() {
  useMetronome();
  const { bpm, isPlaying, isAudioMuted, lastCPRTime, lastCPRShocks, setBpm, start, toggleAudio, endCPR } =
    useMetronomeStore();
  const t = useTranslation();
  const { dir } = useLanguage();
  // The track fills from the reading-start edge: right in Hebrew, left in English.
  const startSide = dir === 'rtl' ? 'right' : 'left';
  const fillTo = dir === 'rtl' ? 'to left' : 'to right';
  const dotShift = dir === 'rtl' ? '50%' : '-50%';

  return (
    <div
      className={[
        'flex flex-col items-center gap-2',
        'rounded-3xl p-2 h-full w-full',
        'transition-all duration-300',
        isPlaying
          ? 'bg-amber-50 dark:bg-amber-950/30 border-2 border-emt-yellow'
          : 'bg-surface border border-line',
      ].join(' ')}
      style={isPlaying ? {
        boxShadow: '0 0 28px rgba(245,158,11,0.20), 0 2px 12px rgb(0 0 0 / 0.25)',
      } : {
        boxShadow: '0 2px 8px rgb(0 0 0 / 0.08)',
      }}
    >
      <p className="text-fg font-black text-lg tracking-wide text-center w-full">
        {t('metronome')}
      </p>

      <div className="flex flex-col items-center flex-1 justify-center gap-0">
        <span
          className={`font-mono font-black tabular-nums leading-none transition-colors duration-300 ${
            isPlaying ? 'text-amber-800 dark:text-emt-yellow' : 'text-fg'
          }`}
          style={{ fontSize: 'clamp(2.8rem, 11vw, 5rem)' }}
        >
          {bpm}
        </span>
        <p className="text-fg-subtle text-xs font-medium">BPM</p>
        {!isPlaying && lastCPRTime && (
          <div className="mt-1.5 text-center">
            <p className="text-sm text-fg-subtle">
              {t('lastSession')}{' '}
              <span className="text-lg font-medium text-blue-700 dark:text-blue-400/90 tabular-nums">{lastCPRTime}</span>
              {lastCPRShocks > 0 && (
                <span className="ms-1 text-amber-800 dark:text-yellow-400 font-bold"> · ⚡{lastCPRShocks}</span>
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
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center
                     bg-surface-3 border border-line-strong
                     text-fg-muted active:scale-90 transition-transform
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
          aria-label={t('homeBpmDecrease')}
        ><Minus size={16} /></button>

        {/* Track wrapper */}
        <div className="flex-1 relative" style={{ height: 36 }}>
          <div className="absolute" style={{ left: 12, right: 12, top: 0, bottom: 0 }}>
            {/* Inactive track — full width */}
            <div
              className="absolute inset-x-0 rounded-full"
              style={{
                height: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: isPlaying ? 'rgba(245,158,11,0.18)' : 'rgba(100,116,139,0.3)',
              }}
            />
            {/* Active fill — from right edge to current thumb */}
            <div
              className="absolute rounded-full transition-all duration-150"
              style={{
                height: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                [startSide]: 0,
                width: `${(BPM_VALUES.indexOf(bpm) / (BPM_VALUES.length - 1)) * 100}%`,
                background: isPlaying
                  ? `linear-gradient(${fillTo}, #F5A623, #facc15)`
                  : `linear-gradient(${fillTo}, #3b82f6, #38bdf8)`,
                boxShadow: isPlaying
                  ? '0 0 8px rgba(245,166,35,0.55)'
                  : '0 0 8px rgba(59,130,246,0.5)',
              }}
            />
            {/* Step dots */}
            {BPM_VALUES.map((val, i) => (
              <button
                key={val}
                onClick={() => setBpm(val)}
                className="absolute transition-all duration-150 active:scale-90"
                style={{
                  [startSide]: `${(i / (BPM_VALUES.length - 1)) * 100}%`,
                  transform: `translate(${dotShift}, -50%)`,
                  top: '50%',
                  width: bpm === val ? 22 : 10,
                  height: bpm === val ? 22 : 10,
                  borderRadius: '50%',
                  // theme-ok: the selected knob is white in both modes
                  backgroundColor: bpm === val ? 'white' : (isPlaying ? 'rgba(245,158,11,0.3)' : 'rgba(100,116,139,0.35)'),
                  border: bpm === val ? 'none' : '1.5px solid transparent',
                  boxShadow: bpm === val
                    ? (isPlaying
                        ? '0 0 0 3px rgba(245,166,35,0.45), 0 2px 8px rgb(0 0 0 / 0.35)'
                        : '0 0 0 3px rgba(59,130,246,0.4), 0 2px 8px rgb(0 0 0 / 0.35)')
                    : 'none',
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
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center
                     bg-surface-3 border border-line-strong
                     text-fg-muted active:scale-90 transition-transform
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
          aria-label={t('homeBpmIncrease')}
        ><Plus size={16} /></button>
      </div>

      {/* Action buttons */}
      {!isPlaying ? (
        /* Start CPR */
        <button
          // i18n-ok: analytics event label, kept stable across languages
          onClick={() => { trackInteraction('מטרונום CPR', 'main_tools'); trackEvent('metronome_start', { bpm_value: bpm }); start(); }}
          className="w-14 h-14 rounded-full flex items-center justify-center
                     active:scale-90 transition-all duration-150"
          style={{
            backgroundColor: '#22C55E',
            boxShadow: '0 4px 16px rgba(34,197,94,0.35)',
          }}
          aria-label={t('start')}
        >
          {/* theme-ok: white icon on the green button */}
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
              color: isAudioMuted ? 'rgb(var(--fg-muted))' : '#d97706',
            }}
            aria-label={isAudioMuted ? t('startMetronome') : t('stopMetronome')}
          >
            {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            {isAudioMuted ? t('startMetronome') : t('stopMetronome')}
          </button>

          {/* End CPR */}
          <button
            // i18n-ok: analytics event label, kept stable across languages
            onClick={() => { trackInteraction('מטרונום CPR', 'main_tools'); trackEvent('metronome_stop', { bpm_value: bpm }); endCPR(); }}
            className="w-full py-2.5 rounded-2xl flex items-center justify-center gap-2
                       font-black text-base active:scale-95 transition-all duration-150"
            style={{
              backgroundColor: '#EF233C',
              boxShadow: '0 4px 16px rgba(239,35,60,0.45)',
              color: 'white', // theme-ok: white text on the red button
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
