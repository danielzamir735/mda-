import { useState } from 'react';
import { Play, VolumeX, Volume2, Plus, Minus, MapPinned } from 'lucide-react';
import { useMetronomeStore, BPM_VALUES } from '../../store/metronomeStore';
import { useMetronome } from './hooks/useMetronome';
import { useTranslation, useLanguage } from '../../i18n';
import { trackEvent, trackInteraction } from '../../utils/analytics';
import AddressFinderModal from '../hub/components/AddressFinderModal';

// Home screen slot: while CPR is not running, the metronome takes the top half
// and the quick address finder the bottom half. During CPR the full metronome
// card comes back, with the audio and end-CPR controls.
export default function MetronomeCard() {
  useMetronome();
  const isPlaying = useMetronomeStore(s => s.isPlaying);
  if (isPlaying) return <FullMetronomeCard />;
  return (
    <div className="flex flex-col gap-1.5 h-full w-full">
      <CompactMetronomeCard />
      <AddressFinderTile />
    </div>
  );
}

function CompactMetronomeCard() {
  const { bpm, lastCPRTime, lastCPRShocks, setBpm, start } = useMetronomeStore();
  const t = useTranslation();
  // 100 → 110 → 120 → 100; the CPR screen has its own tempo picker as well
  const nextBpm = () => BPM_VALUES[(BPM_VALUES.indexOf(bpm) + 1) % BPM_VALUES.length];

  return (
    <div
      className="flex-1 min-h-0 flex flex-col items-center justify-center gap-1 rounded-3xl p-2 w-full bg-surface border border-line"
      style={{ boxShadow: '0 2px 8px rgb(0 0 0 / 0.08)' }}
    >
      <p className="text-fg font-black text-lg tracking-wide text-center w-full leading-tight">
        {t('metronome')}
      </p>
      <div className="flex items-center justify-center gap-3 w-full">
        <button
          onClick={() => setBpm(nextBpm())}
          className="flex flex-col items-center active:scale-95 transition-transform"
          aria-label={t('homeBpmCycle', { bpm })}
        >
          <span
            className="font-mono font-black tabular-nums leading-none text-fg"
            style={{ fontSize: 'clamp(2rem, 9vw, 2.75rem)' }}
          >
            {bpm}
          </span>
          <span className="text-fg-subtle text-[0.65rem] font-medium leading-tight">BPM · {t('homeBpmTapHint')}</span>
        </button>
        <button
          // i18n-ok: analytics event label, kept stable across languages
          onClick={() => { trackInteraction('מטרונום CPR', 'main_tools'); trackEvent('metronome_start', { bpm_value: bpm }); start(); }}
          className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center active:scale-90 transition-all duration-150"
          style={{ backgroundColor: '#22C55E', boxShadow: '0 4px 16px rgba(34,197,94,0.35)' }}
          aria-label={t('start')}
        >
          {/* theme-ok: white icon on the green button */}
          <Play size={24} fill="white" className="text-white" />
        </button>
      </div>
      {lastCPRTime && (
        <p className="text-xs text-fg-subtle text-center leading-tight">
          {t('lastSession')}{' '}
          <span className="font-medium text-blue-700 dark:text-blue-400/90 tabular-nums">{lastCPRTime}</span>
          {lastCPRShocks > 0 && (
            <span className="ms-1 text-amber-800 dark:text-yellow-400 font-bold"> · ⚡{lastCPRShocks}</span>
          )}
        </p>
      )}
    </div>
  );
}

// Same card as the timers and the metronome: the app's surface, a round mark in the tool's colour, a bold title
function AddressFinderTile() {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        // i18n-ok: analytics event label, kept stable across languages
        onClick={() => { trackInteraction('איתור כתובת מהיר · פתיחה מהבית', 'emergency_info'); setOpen(true); }}
        className="relative overflow-hidden flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-1 rounded-3xl p-2
                   bg-surface border border-line active:scale-[0.97] transition-transform"
        style={{ boxShadow: '0 2px 8px rgb(0 0 0 / 0.08)' }}
      >
        <CityMapSketch />
        <span
          className="relative w-14 h-14 shrink-0 rounded-full flex items-center justify-center
                     bg-surface border-2 border-rose-600/70 dark:border-rose-500/70 text-rose-700 dark:text-rose-400"
        >
          <MapPinned size={26} strokeWidth={2} />
        </span>
        <span className="relative text-fg font-black text-lg tracking-wide text-center w-full leading-tight">
          {t('homeAddressFinder')}
        </span>
        <span className="relative text-fg-subtle text-xs font-medium leading-tight text-center">{t('homeAddressFinderSub')}</span>
      </button>
      {open && <AddressFinderModal isOpen onClose={() => setOpen(false)} />}
    </>
  );
}

// A faint line drawing of city streets and building outlines behind the address tile.
// Drawn in the text colour at low opacity, so it suits both themes, and fades out toward the middle so the title stays clear.
function CityMapSketch() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 w-full h-full text-fg opacity-[0.13]"
      style={{
        WebkitMaskImage: 'radial-gradient(ellipse 62% 55% at 50% 50%, transparent 35%, black 100%)',
        maskImage: 'radial-gradient(ellipse 62% 55% at 50% 50%, transparent 35%, black 100%)',
      }}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* main roads */}
      <path d="M-10 62 C 40 56, 80 70, 120 58 S 190 48, 215 54" strokeWidth="5" />
      <path d="M58 -10 L 70 80 L 62 210" strokeWidth="4" />
      <path d="M-10 150 L 210 128" strokeWidth="3.5" />
      <path d="M150 -10 C 140 50, 160 110, 146 210" strokeWidth="3" />
      {/* side streets */}
      <path d="M0 105 L 66 100 M 74 99 L 148 92 M 154 90 L 205 86" strokeWidth="1.6" />
      <path d="M105 60 L 110 140 M 28 60 L 22 148 M 182 52 L 188 132" strokeWidth="1.6" />
      <path d="M100 145 L 96 205 M 20 155 L 26 205" strokeWidth="1.4" />
      {/* roundabout */}
      <circle cx="68" cy="66" r="9" strokeWidth="2" />
      {/* building outlines */}
      <g strokeWidth="1.1">
        <path d="M6 72 h16 v22 h-16 z M 30 70 h18 v13 h-18 z M 32 87 h14 v10 h-14 z" />
        <path d="M80 72 h18 v20 h-18 z M 116 68 h22 v12 h-22 z M 118 84 h12 v12 h-12 z" />
        <path d="M160 64 h14 v16 h-14 z M 160 70 h14 M 190 62 h14 v20 h-14 z" />
        <path d="M6 112 h12 v28 h-12 z M 32 110 h20 v12 h-20 z M 34 126 h16 v10 h-16 z" />
        <path d="M80 108 h16 v24 h-16 z M 116 104 h24 v10 h-24 z M 120 118 h14 v14 h-14 z" />
        <path d="M158 100 h20 v22 h-20 z M 192 96 h14 v26 h-14 z" />
        <path d="M6 10 h20 v14 h-20 z M 30 8 h20 v30 h-20 z M 76 6 h26 v14 h-26 z M 78 26 h14 v18 h-14 z" />
        <path d="M112 10 h28 v12 h-28 z M 116 28 h16 v16 h-16 z M 162 8 h22 v28 h-22 z" />
        <path d="M34 160 h20 v14 h-20 z M 36 180 h14 v14 h-14 z M 70 156 h18 v28 h-18 z" />
        <path d="M108 148 h26 v14 h-26 z M 112 168 h16 v24 h-16 z M 158 140 h20 v18 h-20 z M 156 166 h28 v12 h-28 z" />
      </g>
      {/* trees in a park */}
      <path d="M8 160 q 4 -6 8 0 t 8 0 M 8 176 q 4 -6 8 0 t 8 0" strokeWidth="1" />
    </svg>
  );
}

function FullMetronomeCard() {
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
