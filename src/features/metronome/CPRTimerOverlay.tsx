import { useEffect, useState, useCallback } from 'react';
import { Square, Zap, Volume2, VolumeX, Save, Trash2 } from 'lucide-react';
import { useMetronomeStore } from '../../store/metronomeStore';
import type { ShockLog } from '../../store/vitalsLogStore';

// ── global keyframes (injected once) ─────────────────────────────────────────
const CSS = `
  @keyframes cpr-modal-in {
    from { opacity: 0; transform: scale(0.94) translateY(14px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);    }
  }
  @keyframes shock-pulse {
    0%   { transform: scale(1);    opacity: 0.9; }
    65%  { transform: scale(1.8);  opacity: 0;   }
    100% { transform: scale(1.8);  opacity: 0;   }
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

// ── radial layout constants ───────────────────────────────────────────────────
const CONTAINER = 316;   // outer relative div (px)
const BUTTON    = 200;   // circular shock button diameter
const IND_R     = 145;   // radial distance from center to indicator centre
const IND_SIZE  = 30;    // indicator circle diameter
const CENTER    = CONTAINER / 2;

// ── summary shock table ───────────────────────────────────────────────────────

function ShockTable({ logs }: { logs: ShockLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="text-slate-500 text-sm text-center py-3">
        לא נרשמו שוקים חשמליים
      </p>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700/50">
      {/* header */}
      <div
        className="grid text-[0.62rem] font-black text-slate-400 uppercase tracking-wider bg-slate-800/90 px-3 py-2"
        style={{ gridTemplateColumns: '1.5rem 1fr 1fr 1fr' }}
      >
        <span>#</span>
        <span>שעה</span>
        <span>מהתחלה</span>
        <span>פער</span>
      </div>
      {/* rows */}
      {logs.map((shock, i) => (
        <div
          key={i}
          className="grid px-3 py-2.5 text-xs font-mono border-t border-slate-800/50"
          style={{
            gridTemplateColumns: '1.5rem 1fr 1fr 1fr',
            backgroundColor: i % 2 === 0 ? 'rgba(245,158,11,0.06)' : 'transparent',
          }}
        >
          <span className="font-black text-amber-400">{i + 1}</span>
          <span className="text-white">{shock.time}</span>
          <span className="text-slate-300">{shock.elapsed}</span>
          <span className="text-slate-500">{shock.gap !== '—' ? `+${shock.gap}` : '—'}</span>
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
  return (
    <div
      className="absolute inset-0 z-30 bg-slate-950/97 flex flex-col items-center justify-center p-5 gap-4 overflow-y-auto"
      style={{ animation: 'cpr-modal-in 330ms cubic-bezier(0.34,1.46,0.64,1) both' }}
    >
      {/* card */}
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700/50 overflow-hidden">
        {/* card header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
          <Zap size={16} className="text-amber-400" fill="currentColor" />
          <h2 className="font-black text-lg text-white">סיכום החייאה</h2>
        </div>

        {/* stats */}
        <div
          className="grid grid-cols-2 border-b border-slate-800"
          style={{ direction: 'ltr' }}
        >
          <div className="flex flex-col items-center py-5 border-r border-slate-800">
            <p className="text-slate-500 text-[0.62rem] font-black uppercase tracking-wider mb-1">
              משך
            </p>
            <p className="font-mono font-black text-white tabular-nums text-4xl leading-none">
              {formatElapsed(elapsedMs)}
            </p>
          </div>
          <div className="flex flex-col items-center py-5">
            <p className="text-slate-500 text-[0.62rem] font-black uppercase tracking-wider mb-1">
              שוקים
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
            <ShockTable logs={shocks} />
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
          שמור בהיסטוריית מדדים
        </button>

        <button
          onClick={onDiscard}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-base active:scale-95 transition-transform border border-slate-700 bg-slate-800 text-slate-300"
        >
          <Trash2 size={18} />
          מחק / סגור
        </button>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function CPRTimerOverlay() {
  const {
    cprStartTime, shockLogs, isAudioMuted,
    incrementShock, endCPR, discardCPR, toggleAudio,
  } = useMetronomeStore();

  const shockCount = shockLogs.length;
  const [elapsed, setElapsed]         = useState(0);
  const [isFlashing, setIsFlashing]   = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Snapshot captured at the moment "End CPR" is pressed
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
    setSnapElapsed(elapsed);
    setSnapShocks([...shockLogs]);
    setShowSummary(true);
  }, [elapsed, shockLogs]);

  const handleSave    = useCallback(() => { setShowSummary(false); endCPR();    }, [endCPR]);
  const handleDiscard = useCallback(() => { setShowSummary(false); discardCPR(); }, [discardCPR]);

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

      {/* ── summary modal ── */}
      {showSummary && (
        <SummaryModal
          elapsedMs={snapElapsed}
          shocks={snapShocks}
          onSave={handleSave}
          onDiscard={handleDiscard}
        />
      )}

      {/* ── top: timer + end button ── */}
      <div className="relative z-20 flex flex-col items-center pt-10 pb-5 px-6 gap-2">
        <p className="text-slate-500 font-bold tracking-[0.2em] text-xs uppercase">
          זמן בהחייאה
        </p>
        <span
          className="font-mono font-black tabular-nums leading-none"
          style={{
            fontSize: 'clamp(5.5rem, 26vw, 9.5rem)',
            textShadow: '0 0 48px rgba(255,80,80,0.55)',
          }}
        >
          {formatElapsed(showSummary ? snapElapsed : elapsed)}
        </span>

        <button
          onClick={handleEndCPR}
          className="mt-2 flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-base active:scale-95 transition-transform"
          style={{ backgroundColor: '#EF233C', boxShadow: '0 4px 24px rgba(239,35,60,0.55)' }}
          aria-label="סיים החייאה"
        >
          <Square size={15} fill="white" />
          סיים החייאה
        </button>
      </div>

      {/* divider */}
      <div className="h-px bg-slate-800 mx-6 shrink-0" />

      {/* ── center: shock button + radial indicators ── */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center">
        <div className="relative" style={{ width: CONTAINER, height: CONTAINER }}>

          {/* main shock button */}
          <button
            onClick={handleShock}
            className="absolute rounded-full flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform duration-100"
            style={{
              width: BUTTON,
              height: BUTTON,
              left: (CONTAINER - BUTTON) / 2,
              top:  (CONTAINER - BUTTON) / 2,
              background: 'radial-gradient(circle at 38% 32%, #ffe14d, #f59e0b 58%, #92400e)',
              boxShadow: isFlashing
                ? '0 0 100px rgba(255,225,0,0.95), 0 0 200px rgba(255,200,0,0.55)'
                : shockCount > 0
                ? '0 0 48px rgba(245,158,11,0.65), 0 8px 40px rgba(0,0,0,0.7)'
                : '0 0 24px rgba(245,158,11,0.35), 0 8px 40px rgba(0,0,0,0.7)',
              transition: 'box-shadow 300ms',
            }}
            aria-label="שוק חשמלי"
          >
            <Zap fill="#1a0800" color="#1a0800" size={62} />
            <span className="font-black text-[#1a0800] text-lg leading-none">שוק חשמלי</span>
          </button>

          {/* radial shock circles */}
          {shockLogs.slice(0, 12).map((_, i) => {
            const n     = Math.min(shockLogs.length, 12);
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            const x     = CENTER + IND_R * Math.cos(angle) - IND_SIZE / 2;
            const y     = CENTER + IND_R * Math.sin(angle) - IND_SIZE / 2;
            const isLatest = i === shockCount - 1;

            return (
              <div
                key={i}
                className="absolute rounded-full flex items-center justify-center font-black pointer-events-none"
                style={{
                  width:  IND_SIZE,
                  height: IND_SIZE,
                  left:   x,
                  top:    y,
                  fontSize: 10,
                  backgroundColor: isLatest ? '#f59e0b' : 'rgba(245,158,11,0.22)',
                  border: isLatest
                    ? '2px solid #ffe14d'
                    : '1.5px solid rgba(245,158,11,0.45)',
                  color: isLatest ? '#1a0800' : '#f59e0b',
                  boxShadow: isLatest
                    ? '0 0 14px rgba(245,158,11,0.75)'
                    : '0 0 6px rgba(245,158,11,0.18)',
                }}
              >
                {/* pulse ring — only on latest */}
                {isLatest && (
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: '2px solid #f59e0b',
                      animation: 'shock-pulse 1.4s ease-out infinite',
                    }}
                  />
                )}
                {i + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── bottom: metronome toggle ── */}
      <div className="relative z-20 flex items-center justify-center pb-14 px-6">
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
          aria-label={isAudioMuted ? 'הפעל מטרונום' : 'הפסק מטרונום'}
        >
          {isAudioMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
          {isAudioMuted ? 'הפעל מטרונום' : 'הפסק מטרונום'}
        </button>
      </div>
    </div>
  );
}
