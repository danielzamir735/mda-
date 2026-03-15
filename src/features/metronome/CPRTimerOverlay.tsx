import { useEffect, useState, useCallback } from 'react';
import { Square, Zap, Volume2, VolumeX, Save, Trash2 } from 'lucide-react';
import { useMetronomeStore, type BpmValue } from '../../store/metronomeStore';
import type { ShockLog } from '../../store/vitalsLogStore';
import { useTranslation } from '../../hooks/useTranslation';

// ── global keyframes + slider styles (injected once) ─────────────────────────
const CSS = `
  @keyframes cpr-modal-in {
    from { opacity: 0; transform: scale(0.94) translateY(14px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);    }
  }
  .bpm-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 8px;
    border-radius: 4px;
    outline: none;
    cursor: pointer;
    background: rgba(100,116,139,0.55);
  }
  .bpm-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #f5c842;
    border: 2.5px solid #1a0800;
    box-shadow: 0 0 12px rgba(245,200,66,0.7);
    cursor: pointer;
    transition: box-shadow 150ms;
  }
  .bpm-slider:active::-webkit-slider-thumb {
    box-shadow: 0 0 22px rgba(245,200,66,0.95);
    transform: scale(1.12);
  }
  .bpm-slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #f5c842;
    border: 2.5px solid #1a0800;
    box-shadow: 0 0 12px rgba(245,200,66,0.7);
    cursor: pointer;
  }
`;
if (typeof document !== 'undefined' && !document.getElementById('cpr-anim')) {
  const tag = document.createElement('style');
  tag.id = 'cpr-anim';
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

// ── helpers ──────────────────────────────────────────────────────────────────

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mm = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const ss = (totalSeconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

// ── summary shock table ───────────────────────────────────────────────────────

function ShockTable({ logs, t }: { logs: ShockLog[]; t: (k: Parameters<ReturnType<typeof useTranslation>>[0]) => string }) {
  if (logs.length === 0) {
    return (
      <p className="text-gray-500 dark:text-slate-500 text-sm text-center py-3">
        {t('noShocksRecorded')}
      </p>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700/50">
      <div
        className="grid text-[0.62rem] font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider bg-gray-100 dark:bg-slate-800/90 px-3 py-2"
        style={{ gridTemplateColumns: '1.5rem 1fr 1fr 1fr' }}
      >
        <span>#</span>
        <span>{t('shockTime')}</span>
        <span>{t('fromStart')}</span>
        <span>{t('gap')}</span>
      </div>
      {logs.map((shock, i) => (
        <div
          key={i}
          className="grid px-3 py-2.5 text-xs font-mono border-t border-gray-200 dark:border-slate-800/50"
          style={{
            gridTemplateColumns: '1.5rem 1fr 1fr 1fr',
            backgroundColor: i % 2 === 0 ? 'rgba(245,158,11,0.06)' : 'transparent',
          }}
        >
          <span className="font-black text-amber-400">{i + 1}</span>
          <span className="text-gray-900 dark:text-white">{shock.time}</span>
          <span className="text-gray-600 dark:text-slate-300">{shock.elapsed}</span>
          <span className="text-gray-400 dark:text-slate-500">{shock.gap !== '—' ? `+${shock.gap}` : '—'}</span>
        </div>
      ))}
    </div>
  );
}

// ── summary modal ─────────────────────────────────────────────────────────────

interface SummaryProps {
  elapsedMs: number;
  shocks: ShockLog[];
  onSave: () => void;
  onDiscard: () => void;
}

function SummaryModal({ elapsedMs, shocks, onSave, onDiscard }: SummaryProps) {
  const t = useTranslation();
  return (
    <div
      className="absolute inset-0 z-30 bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-5 gap-4 overflow-y-auto"
      style={{ animation: 'cpr-modal-in 330ms cubic-bezier(0.34,1.46,0.64,1) both' }}
    >
      {/* card */}
      <div className="w-full max-w-sm bg-gray-50 dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-700/50 overflow-hidden">
        {/* card header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200 dark:border-slate-800">
          <Zap size={16} className="text-amber-400" fill="currentColor" />
          <h2 className="font-black text-lg text-gray-900 dark:text-white">{t('cprSummary')}</h2>
        </div>

        {/* stats */}
        <div
          className="grid grid-cols-2 border-b border-gray-200 dark:border-slate-800"
          style={{ direction: 'ltr' }}
        >
          <div className="flex flex-col items-center py-5 border-r border-gray-200 dark:border-slate-800">
            <p className="text-gray-500 dark:text-slate-500 text-[0.62rem] font-black uppercase tracking-wider mb-1">
              {t('duration')}
            </p>
            <p className="font-mono font-black text-gray-900 dark:text-white tabular-nums text-4xl leading-none">
              {formatElapsed(elapsedMs)}
            </p>
          </div>
          <div className="flex flex-col items-center py-5">
            <p className="text-gray-500 dark:text-slate-500 text-[0.62rem] font-black uppercase tracking-wider mb-1">
              {t('shocksLabel')}
            </p>
            <p
              className="font-black text-4xl leading-none"
              style={{ color: shocks.length > 0 ? '#fb923c' : '#6b7280' }}
            >
              {shocks.length}
            </p>
          </div>
        </div>

        {/* shock table */}
        {shocks.length > 0 && (
          <div className="p-4">
            <ShockTable logs={shocks} t={t} />
          </div>
        )}
      </div>

      {/* action buttons */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        <button
          onClick={onSave}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 font-black text-base active:scale-95 transition-transform"
          style={{
            backgroundColor: '#22C55E',
            boxShadow: '0 4px 24px rgba(34,197,94,0.45)',
            color: 'white',
          }}
        >
          <Save size={18} />
          {t('saveToCPRHistory')}
        </button>

        <button
          onClick={onDiscard}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-base active:scale-95 transition-transform border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300"
        >
          <Trash2 size={18} />
          {t('deleteClose')}
        </button>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function CPRTimerOverlay() {
  const t = useTranslation();
  const {
    cprStartTime, shockLogs, isAudioMuted, bpm,
    incrementShock, endCPR, discardCPR, toggleAudio, setBpm,
  } = useMetronomeStore();

  const shockCount = shockLogs.length;
  const [elapsed, setElapsed]         = useState(0);
  const [isFlashing, setIsFlashing]   = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const [snapElapsed, setSnapElapsed] = useState(0);
  const [snapShocks,  setSnapShocks]  = useState<ShockLog[]>([]);

  useEffect(() => {
    if (!cprStartTime) { setElapsed(0); return; }
    setElapsed(Date.now() - cprStartTime);
    const id = setInterval(() => setElapsed(Date.now() - cprStartTime), 1000);
    return () => clearInterval(id);
  }, [cprStartTime]);

  const handleShock = useCallback(() => {
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 450);
    incrementShock();
  }, [incrementShock]);

  const handleEndCPR = useCallback(() => {
    if (!isAudioMuted) toggleAudio(); // stop metronome immediately
    setSnapElapsed(elapsed);
    setSnapShocks([...shockLogs]);
    setShowSummary(true);
  }, [elapsed, shockLogs, isAudioMuted, toggleAudio]);

  const handleSave    = useCallback(() => { setShowSummary(false); endCPR();    }, [endCPR]);
  const handleDiscard = useCallback(() => { setShowSummary(false); discardCPR(); }, [discardCPR]);

  // When summary is shown, render only the modal on a clean background
  if (showSummary) {
    return (
      <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-950 select-none overflow-hidden">
        <SummaryModal
          elapsedMs={snapElapsed}
          shocks={snapShocks}
          onSave={handleSave}
          onDiscard={handleDiscard}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 text-white flex flex-col select-none overflow-hidden">

      {/* ── electric flash ── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          backgroundColor: '#ffe566',
          opacity: isFlashing ? 0.62 : 0,
          transition: isFlashing ? 'opacity 0ms' : 'opacity 420ms ease-out',
        }}
      />

      {/* ── top: timer + end button ── */}
      <div className="relative z-20 flex flex-col items-center pt-10 pb-5 px-6 gap-2">
        <p className="text-slate-500 font-bold tracking-[0.2em] text-xs uppercase">
          {t('cprTime')}
        </p>
        <span
          className="font-mono font-black tabular-nums leading-none"
          style={{
            fontSize: 'clamp(5.5rem, 26vw, 9.5rem)',
            textShadow: '0 0 48px rgba(255,80,80,0.55)',
          }}
        >
          {formatElapsed(elapsed)}
        </span>

        <button
          onClick={handleEndCPR}
          className="mt-2 flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-base active:scale-95 transition-transform"
          style={{ backgroundColor: '#EF233C', boxShadow: '0 4px 24px rgba(239,35,60,0.55)' }}
          aria-label={t('endCPR')}
        >
          <Square size={15} fill="white" />
          {t('endCPR')}
        </button>
      </div>

      {/* divider */}
      <div className="h-px bg-slate-800 mx-6 shrink-0" />

      {/* ── center: shock button + linear shock counters ── */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6">

        {/* main shock button */}
        <button
          onClick={handleShock}
          className="rounded-full flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform duration-100"
          style={{
            width: 200,
            height: 200,
            background: 'radial-gradient(circle at 38% 32%, #ffe14d, #f59e0b 58%, #92400e)',
            boxShadow: isFlashing
              ? '0 0 100px rgba(255,225,0,0.95), 0 0 200px rgba(255,200,0,0.55)'
              : shockCount > 0
              ? '0 0 48px rgba(245,158,11,0.65), 0 8px 40px rgba(0,0,0,0.7)'
              : '0 0 24px rgba(245,158,11,0.35), 0 8px 40px rgba(0,0,0,0.7)',
            transition: 'box-shadow 300ms',
          }}
          aria-label={t('recordShock')}
        >
          <Zap fill="#1a0800" color="#1a0800" size={50} />
          <span className="font-black text-[#1a0800] text-sm leading-tight text-center px-5">
            {t('recordShock')}
          </span>
        </button>

        {/* BPM controller — circular ± buttons + visual slider */}
        <div className="flex flex-col items-center gap-1.5 mt-5">
          {/* current BPM label */}
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono font-black text-3xl leading-none" style={{ color: '#f5c842' }}>
              {bpm}
            </span>
            <span className="text-slate-400 text-sm font-semibold">BPM</span>
          </div>

          {/* track row */}
          <div className="flex items-center gap-3">
            {/* − button */}
            <button
              onClick={() => bpm > 100 && setBpm((bpm - 10) as BpmValue)}
              disabled={bpm === 100}
              className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xl active:scale-90 transition-all"
              style={{
                backgroundColor: 'rgba(245,158,11,0.15)',
                border: '2px solid rgba(245,158,11,0.4)',
                color: bpm === 100 ? '#4b5563' : '#f5c842',
              }}
              aria-label="BPM down"
            >
              −
            </button>

            {/* range slider */}
            <input
              type="range"
              min={100}
              max={120}
              step={10}
              value={bpm}
              onChange={e => setBpm(Number(e.target.value) as BpmValue)}
              className="bpm-slider"
              style={{
                width: 130,
                background: `linear-gradient(to right,
                  #f59e0b 0%,
                  #f59e0b ${(bpm - 100) / 20 * 100}%,
                  rgba(100,116,139,0.6) ${(bpm - 100) / 20 * 100}%,
                  rgba(100,116,139,0.6) 100%)`,
              }}
              aria-label="BPM"
            />

            {/* + button */}
            <button
              onClick={() => bpm < 120 && setBpm((bpm + 10) as BpmValue)}
              disabled={bpm === 120}
              className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xl active:scale-90 transition-all"
              style={{
                backgroundColor: 'rgba(245,158,11,0.15)',
                border: '2px solid rgba(245,158,11,0.4)',
                color: bpm === 120 ? '#4b5563' : '#f5c842',
              }}
              aria-label="BPM up"
            >
              +
            </button>
          </div>

          {/* tick labels */}
          <div
            className="flex justify-between text-[0.6rem] font-black text-slate-600 tracking-wide"
            style={{ width: 186 }}
          >
            <span>100</span>
            <span>110</span>
            <span>120</span>
          </div>
        </div>

        {/* linear shock counter badges */}
        {shockCount > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            {shockLogs.map((_, i) => {
              const isLatest = i === shockCount - 1;
              return (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-base"
                  style={{
                    borderColor: isLatest ? '#ffe14d' : '#f59e0b',
                    backgroundColor: isLatest ? '#f59e0b' : 'transparent',
                    color: isLatest ? '#1a0800' : '#f59e0b',
                  }}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── bottom: metronome toggle ── */}
      <div className="relative z-20 flex flex-col items-center gap-3 pb-14 px-6">

        {/* Metronome toggle */}
        <button
          onClick={toggleAudio}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-xl active:scale-95 transition-all"
          style={{
            backgroundColor: isAudioMuted ? 'rgba(80,80,100,0.3)' : 'rgba(245,158,11,0.13)',
            border: isAudioMuted
              ? '2px solid rgba(130,130,160,0.38)'
              : '2px solid rgba(245,158,11,0.48)',
            color: isAudioMuted ? '#6b7280' : '#f5c842',
            boxShadow: isAudioMuted ? 'none' : '0 0 18px rgba(245,158,11,0.14)',
          }}
          aria-label={isAudioMuted ? t('startMetronome') : t('stopMetronome')}
        >
          {isAudioMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
          {isAudioMuted ? t('startMetronome') : t('stopMetronome')}
        </button>
      </div>
    </div>
  );
}
