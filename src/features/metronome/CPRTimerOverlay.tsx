import { useEffect, useState, useCallback } from 'react';
import { Square, Zap, Volume2, VolumeX, Save, Trash2, RotateCcw, Syringe, HeartPulse, ListChecks, X, Share2, Check, HeartHandshake, ChevronLeft, Activity } from 'lucide-react';
import { useMetronomeStore, type BpmValue, type Rhythm } from '../../store/metronomeStore';
import type { ShockLog, CprEvent } from '../../store/vitalsLogStore';
import { useTranslation, translate } from '../../i18n';
import { useCprCoach, nextAmioDose } from './hooks/useCprCoach';
import { CYCLE_SEC, EPI_INTERVAL_OPTIONS, H_AND_T, RHYTHM_LABEL_KEYS, disclaimer } from './cprProtocol';

// ── global keyframes (injected once) ─────────────────────────────────────────
const CSS = `
  @keyframes cpr-modal-in {
    from { opacity: 0; transform: scale(0.94) translateY(14px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);    }
  }
  @keyframes cpr-cycle-flash {
    0%, 50%, 100% { opacity: 0; }
    25%, 75%      { opacity: 0.7; }
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
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const ss = (totalSeconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function clock(ts: number): string {
  const d = new Date(ts);
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
}

const EVENT_COLOR: Record<CprEvent['kind'], string> = {
  start: '#94a3b8',
  end: '#94a3b8',
  cycle: '#60a5fa',
  shock: '#f59e0b',
  epi: '#f472b6',
  amio: '#a78bfa',
  rhythm: '#22d3ee',
  rosc: '#22c55e',
  ht: '#2dd4bf',
};

/** Text report for copy / share */
function buildReport(startAt: number, elapsedMs: number, shocks: ShockLog[], events: CprEvent[]): string {
  const d = new Date(startAt);
  const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  const count = (k: CprEvent['kind']) => events.filter((e) => e.kind === k).length;
  // cycle-end labels may be in either language (the language can change mid-CPR)
  const cycleEndPrefixes = (['he', 'en'] as const).map((l) => translate('cprEvCycleEndPrefix', undefined, l));
  const cycles = events.filter((e) => e.kind === 'cycle' && cycleEndPrefixes.some((p) => e.label.startsWith(p))).length;
  const lines = [
    translate('cprReportTitle'),
    translate('cprReportDate', { date, start: clock(startAt) }),
    translate('cprReportDuration', { duration: formatElapsed(elapsedMs) }),
    translate('cprReportCounts', { cycles, shocks: shocks.length, epi: count('epi'), amio: count('amio') }),
  ];
  if (count('rosc') > 0) lines.push(translate('cprReportRosc'));
  lines.push('', `${translate('cprTimeline')}:`, ...events.map((e) => `${clock(e.at)} (+${formatElapsed(e.at - startAt)}) — ${e.label}`));
  lines.push('', disclaimer());
  return lines.join('\n');
}

export function CprTimeline({ events, startAt }: { events: CprEvent[]; startAt: number }) {
  if (events.length === 0) return null;
  return (
    <ol className="flex flex-col">
      {events.map((e, i) => (
        <li key={i} className="flex items-start gap-2.5 py-1.5 border-t first:border-t-0 border-line text-xs">
          <span className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: EVENT_COLOR[e.kind] }} />
          <span className="font-mono tabular-nums text-fg shrink-0" dir="ltr">{clock(e.at)}</span>
          <span className="font-mono tabular-nums text-fg-subtle shrink-0" dir="ltr">+{formatElapsed(e.at - startAt)}</span>
          <span className="text-fg/80 leading-snug">{e.label}</span>
        </li>
      ))}
    </ol>
  );
}

// ── summary shock table ───────────────────────────────────────────────────────

function ShockTable({ logs, t }: { logs: ShockLog[]; t: (k: Parameters<ReturnType<typeof useTranslation>>[0]) => string }) {
  if (logs.length === 0) {
    return (
      <p className="text-fg-muted text-sm text-center py-3">
        {t('noShocksRecorded')}
      </p>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-line">
      <div
        className="grid text-[0.62rem] font-black text-fg-muted uppercase tracking-wider bg-surface-2 px-3 py-2"
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
          className="grid px-3 py-2.5 text-xs font-mono border-t border-line"
          style={{
            gridTemplateColumns: '1.5rem 1fr 1fr 1fr',
            backgroundColor: i % 2 === 0 ? 'rgba(245,158,11,0.06)' : 'transparent',
          }}
        >
          <span className="font-black text-amber-400">{i + 1}</span>
          <span className="text-fg">{shock.time}</span>
          <span className="text-fg-muted">{shock.elapsed}</span>
          <span className="text-fg-subtle">{shock.gap !== '—' ? `+${shock.gap}` : '—'}</span>
        </div>
      ))}
    </div>
  );
}

// ── summary modal ─────────────────────────────────────────────────────────────

interface SummaryProps {
  startAt: number;
  elapsedMs: number;
  shocks: ShockLog[];
  events: CprEvent[];
  onSave: () => void;
  onDiscard: () => void;
  onOpenAfterCall?: () => void;
}

function SummaryModal({ startAt, elapsedMs, shocks, events, onSave, onDiscard, onOpenAfterCall }: SummaryProps) {
  const t = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = buildReport(startAt, elapsedMs, shocks, events);
    if (navigator.share) {
      try { await navigator.share({ title: t('cprSummary'), text }); return; } catch { /* cancelled — fall back to copy */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div
      className="absolute inset-0 z-30 bg-page flex flex-col items-center p-5 pt-10 gap-4 overflow-y-auto"
      style={{ animation: 'cpr-modal-in 330ms cubic-bezier(0.34,1.46,0.64,1) both' }}
    >
      {/* card */}
      <div className="w-full max-w-sm bg-surface rounded-3xl border border-line overflow-hidden shrink-0">
        {/* card header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-line">
          <Zap size={16} className="text-amber-400" fill="currentColor" />
          <h2 className="font-black text-lg text-fg">{t('cprSummary')}</h2>
        </div>

        {/* stats */}
        <div
          className="grid grid-cols-2 border-b border-line"
          style={{ direction: 'ltr' }}
        >
          <div className="flex flex-col items-center py-5 border-r border-line">
            <p className="text-fg-muted text-[0.62rem] font-black uppercase tracking-wider mb-1">
              {t('duration')}
            </p>
            <p className="font-mono font-black text-fg tabular-nums text-4xl leading-none">
              {formatElapsed(elapsedMs)}
            </p>
          </div>
          <div className="flex flex-col items-center py-5">
            <p className="text-fg-muted text-[0.62rem] font-black uppercase tracking-wider mb-1">
              {t('shocksLabel')}
            </p>
            <p
              className="font-black text-4xl leading-none"
              style={{ color: shocks.length > 0 ? '#fb923c' : 'rgb(var(--fg-subtle))' }}
            >
              {shocks.length}
            </p>
          </div>
        </div>

        {/* shock table */}
        {shocks.length > 0 && (
          <div className="p-4 border-b border-line">
            <ShockTable logs={shocks} t={t} />
          </div>
        )}

        {/* timeline */}
        {events.length > 0 && (
          <div className="p-4">
            <p className="text-fg-muted text-[0.62rem] font-black uppercase tracking-wider mb-2">{t('cprTimeline')}</p>
            <CprTimeline events={events} startAt={startAt} />
          </div>
        )}
      </div>

      {/* action buttons */}
      <div className="w-full max-w-sm flex flex-col gap-3 shrink-0">
        <button
          onClick={handleShare}
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-base active:scale-95 transition-transform border border-sky-400/40 bg-sky-500/10 text-sky-700 dark:text-sky-300"
        >
          {copied ? <Check size={18} /> : <Share2 size={18} />}
          {copied ? t('cprReportCopied') : t('cprCopyShareReport')}
        </button>

        <button
          onClick={onSave}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 font-black text-base active:scale-95 transition-transform bg-green-500 text-white"
          style={{ boxShadow: '0 4px 24px rgba(34,197,94,0.45)' }}
        >
          <Save size={18} />
          {t('saveToCPRHistory')}
        </button>

        <button
          onClick={onDiscard}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-base active:scale-95 transition-transform border border-line bg-surface-2 text-fg/80"
        >
          <Trash2 size={18} />
          {t('deleteClose')}
        </button>

        {/* gentle offer — after-call screen */}
        {onOpenAfterCall && (
          <button
            onClick={onOpenAfterCall}
            className="w-full mt-1 rounded-2xl px-4 py-3.5 flex items-center gap-3 text-start active:scale-[0.98] transition-transform border border-violet-300/40 bg-violet-500/5 dark:bg-violet-500/10"
          >
            <HeartHandshake size={22} className="text-violet-500 dark:text-violet-300 shrink-0" />
            <span className="flex-1 flex flex-col">
              <span className="text-fg font-bold text-sm">{t('cprHardCallTitle')}</span>
              <span className="text-gray-500 dark:text-violet-200/60 text-xs">{t('cprHardCallSub')}</span>
            </span>
            <ChevronLeft size={18} className="text-violet-400 shrink-0 ltr:rotate-180" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── rhythm picker sheet ───────────────────────────────────────────────────────

function RhythmSheet({ title, current, onPick, onSkip }: {
  title: string; current: Rhythm | null; onPick: (r: Rhythm) => void; onSkip: () => void;
}) {
  const t = useTranslation();
  return (
    // theme-ok: dimming scrim behind the sheet, same in both modes
    <div className="absolute inset-0 z-40 flex items-end bg-black/50" onClick={onSkip}>
      <div
        className="w-full rounded-t-3xl bg-surface border-t border-line px-5 pt-5 pb-8 flex flex-col gap-3"
        style={{ animation: 'cpr-modal-in 260ms ease-out both' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center font-black text-lg text-fg">{title}</p>
        {(['shockable', 'nonShockable'] as Rhythm[]).map((r) => (
          <button
            key={r}
            onClick={() => onPick(r)}
            className="w-full py-4 rounded-2xl font-black text-lg active:scale-95 transition-transform border-2"
            style={r === 'shockable'
              // theme-ok: dark text on a solid amber button reads in both modes
              ? { borderColor: '#f59e0b', backgroundColor: current === r ? '#f59e0b' : 'rgba(245,158,11,0.10)', color: current === r ? '#1a0800' : '#d97706' }
              // theme-ok: dark text on a solid sky button reads in both modes
              : { borderColor: '#38bdf8', backgroundColor: current === r ? '#38bdf8' : 'rgba(56,189,248,0.10)', color: current === r ? '#082f49' : '#0284c7' }}
          >
            {t(RHYTHM_LABEL_KEYS[r])}
          </button>
        ))}
        <button onClick={onSkip} className="py-2 text-sm font-bold text-fg-muted">
          {current ? t('cprNoChange') : t('cprSkip')}
        </button>
      </div>
    </div>
  );
}

// ── H's & T's sheet ───────────────────────────────────────────────────────────

function HtSheet({ status, onToggle, onClose }: { status: Record<string, boolean>; onToggle: (id: string) => void; onClose: () => void }) {
  const t = useTranslation();
  return (
    // theme-ok: dimming scrim behind the sheet, same in both modes
    <div className="absolute inset-0 z-40 flex items-end bg-black/50" onClick={onClose}>
      <div
        className="w-full max-h-[85%] overflow-y-auto rounded-t-3xl bg-surface border-t border-line px-4 pt-4 pb-8"
        style={{ animation: 'cpr-modal-in 260ms ease-out both' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-black text-lg text-fg">{t('cprHtTitle')}</p>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center" aria-label={t('close')}>
            <X size={18} className="text-fg-muted" />
          </button>
        </div>
        <p className="text-xs text-fg-muted mb-3">{t('cprHtHint')}</p>
        <div className="grid grid-cols-2 gap-3">
          {(['H', 'T'] as const).map((g) => (
            <div key={g} className="flex flex-col gap-2">
              <p className="text-center font-black text-sm" style={{ color: g === 'H' ? '#38bdf8' : '#f472b6' }}>{g === 'H' ? "H's" : "T's"}</p>
              {H_AND_T.filter((h) => h.group === g).map((h) => {
                const done = !!status[h.id];
                return (
                  <button
                    key={h.id}
                    onClick={() => onToggle(h.id)}
                    aria-pressed={done}
                    className="w-full min-h-[3.25rem] rounded-xl px-2.5 py-2 flex items-center gap-2 text-start text-sm font-bold active:scale-95 transition-all border"
                    style={done
                      ? { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.55)', color: '#16a34a' }
                      : { backgroundColor: 'transparent', borderColor: 'rgba(148,163,184,0.35)' }}
                  >
                    <span
                      className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: done ? '#22c55e' : 'rgba(148,163,184,0.6)', backgroundColor: done ? '#22c55e' : 'transparent' }}
                    >
                      {done && <Check size={13} className="text-white" strokeWidth={3} />}{/* theme-ok: white tick on solid green box */}
                    </span>
                    <span className={done ? '' : 'text-fg'}>{t(h.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

interface OverlayProps {
  onOpenAfterCall?: () => void;
}

export default function CPRTimerOverlay({ onOpenAfterCall }: OverlayProps) {
  const t = useTranslation();
  const {
    cprStartTime, shockLogs, isAudioMuted, bpm, rhythm, cycleCount, epiCount, epiIntervalSec, amioCount, htStatus, events,
    incrementShock, endCPR, discardCPR, toggleAudio, setBpm, setRhythm, resetCycle, giveEpi, giveAmio, markRosc, toggleHT, setEpiInterval,
  } = useMetronomeStore();
  const coach = useCprCoach();

  const shockCount = shockLogs.length;
  const [elapsed, setElapsed]         = useState(0);
  const [isFlashing, setIsFlashing]   = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showRhythm, setShowRhythm]   = useState(() => rhythm === null);
  const [showHT, setShowHT]           = useState(false);

  const [snapElapsed, setSnapElapsed] = useState(0);
  const [snapShocks,  setSnapShocks]  = useState<ShockLog[]>([]);
  const [snapEvents,  setSnapEvents]  = useState<CprEvent[]>([]);
  const [snapEnd,     setSnapEnd]     = useState(0);

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
    const end = Date.now();
    setSnapEnd(end);
    setSnapElapsed(cprStartTime ? end - cprStartTime : elapsed);
    setSnapShocks([...shockLogs]);
    setSnapEvents([...events, { at: end, kind: 'end', label: translate('cprEvEnd') }]);
    setShowSummary(true);
  }, [elapsed, shockLogs, events, cprStartTime, isAudioMuted, toggleAudio]);

  const handleSave    = useCallback(() => { setShowSummary(false); endCPR(snapEnd); }, [endCPR, snapEnd]);
  const handleDiscard = useCallback(() => { setShowSummary(false); discardCPR(); }, [discardCPR]);

  // When summary is shown, render only the modal on a clean background
  if (showSummary) {
    return (
      <div className="fixed inset-0 z-[60] bg-page select-none overflow-hidden">
        <SummaryModal
          startAt={cprStartTime ?? snapEnd - snapElapsed}
          elapsedMs={snapElapsed}
          shocks={snapShocks}
          events={snapEvents}
          onSave={handleSave}
          onDiscard={handleDiscard}
          onOpenAfterCall={onOpenAfterCall}
        />
      </div>
    );
  }

  const cycleProgress = coach.cycleElapsedSec / CYCLE_SEC;
  const nearSwap = coach.cycleRemainingSec <= 10;
  const nextAmio = nextAmioDose(amioCount);

  return (
    <div className="fixed inset-0 z-[60] bg-page text-fg flex flex-col select-none overflow-hidden">

      {/* ── electric flash ── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          backgroundColor: '#ffe566',
          opacity: isFlashing ? 0.62 : 0,
          transition: isFlashing ? 'opacity 0ms' : 'opacity 420ms ease-out',
        }}
      />
      {/* ── compressor-swap flash ── */}
      {coach.isCycleFlashing && (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ backgroundColor: '#3b82f6', animation: 'cpr-cycle-flash 800ms ease-in-out 2' }}
        />
      )}

      <div className="relative z-20 flex-1 overflow-y-auto flex flex-col">

        {/* ── top: timer + end button ── */}
        <div className="flex flex-col items-center pt-8 pb-3 px-5 gap-1.5">
          <p className="text-fg-muted font-bold tracking-[0.2em] text-xs uppercase">
            {t('cprTime')}
          </p>
          <span
            className="font-mono font-black tabular-nums leading-none"
            style={{
              fontSize: 'clamp(4rem, 20vw, 7.5rem)',
              textShadow: '0 0 48px rgba(255,80,80,0.55)',
            }}
          >
            {formatElapsed(elapsed)}
          </span>

          <button
            onClick={handleEndCPR}
            className="mt-1 flex items-center gap-2 px-7 py-2.5 rounded-2xl font-black text-base bg-[#EF233C] text-white active:scale-95 transition-transform"
            style={{ boxShadow: '0 4px 24px rgba(239,35,60,0.55)' }}
            aria-label={t('endCPR')}
          >
            <Square size={15} fill="currentColor" />
            {t('endCPR')}
          </button>
        </div>

        {/* ── cycle strip ── */}
        <div className="mx-5 rounded-2xl border border-blue-400/30 bg-blue-500/5 dark:bg-blue-500/10 px-4 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2 whitespace-nowrap min-w-0">
              <span className="font-black text-blue-600 dark:text-blue-300 text-base">{t('cprCycleN', { n: cycleCount + 1 })}</span>
              <span className="text-xs text-fg-muted">{t('cprSwapIn')}</span>
              <span
                className={`font-mono font-black tabular-nums text-lg ${nearSwap ? 'text-red-500' : 'text-fg'}`}
                dir="ltr"
              >
                {formatElapsed(coach.cycleRemainingSec * 1000)}
              </span>
            </div>
            <button
              onClick={resetCycle}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 border border-blue-400/40 text-blue-600 dark:text-blue-300 active:scale-95 transition-transform"
              aria-label={t('cprResetCycle')}
            >
              <RotateCcw size={13} />
              {t('cprResetCycle')}
            </button>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-blue-400/15 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-linear"
              style={{ width: `${cycleProgress * 100}%`, backgroundColor: nearSwap ? '#ef4444' : '#3b82f6' }}
            />
          </div>
        </div>

        {/* ── rhythm chip ── */}
        <div className="flex justify-center mt-2.5 px-5">
          <button
            onClick={() => setShowRhythm(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border active:scale-95 transition-transform"
            style={rhythm === 'shockable'
              ? { borderColor: 'rgba(245,158,11,0.6)', color: '#d97706', backgroundColor: 'rgba(245,158,11,0.10)' }
              : rhythm === 'nonShockable'
              ? { borderColor: 'rgba(56,189,248,0.6)', color: '#0284c7', backgroundColor: 'rgba(56,189,248,0.10)' }
              : { borderColor: 'rgba(148,163,184,0.5)', color: 'rgb(var(--fg-muted))' }}
          >
            <Activity size={13} />
            {rhythm ? t(RHYTHM_LABEL_KEYS[rhythm]) : t('cprPickRhythm')}
          </button>
        </div>

        {/* ── drug reminder banner ── */}
        {coach.reminder && (
          <div className="mx-5 mt-2.5 rounded-2xl border-2 border-pink-500/60 bg-pink-500/10 px-4 py-3 flex items-center gap-3"
               style={{ animation: 'cpr-modal-in 260ms ease-out both' }}>
            <Syringe size={20} className="text-pink-500 shrink-0" />
            <p className="flex-1 font-black text-base text-pink-700 dark:text-pink-200">{coach.reminder.text}</p>
            <button onClick={() => coach.dismissReminder(coach.reminder!.key)} className="w-8 h-8 rounded-full bg-pink-500/15 flex items-center justify-center shrink-0" aria-label={t('cprDismissReminder')}>
              <X size={15} className="text-pink-500" />
            </button>
          </div>
        )}

        {/* ── center: shock button + counters ── */}
        <div className="flex flex-col items-center justify-center px-5 py-4 flex-1">
          <button
            onClick={handleShock}
            className="rounded-full flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform duration-100"
            style={{
              width: 150,
              height: 150,
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
            {/* theme-ok: dark icon on the amber shock button */}
            <Zap fill="#1a0800" color="#1a0800" size={40} />
            <span className="font-black text-[#1a0800] text-sm leading-tight text-center px-4">
              {t('recordShock')}
            </span>
          </button>

          {shockCount > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {shockLogs.map((_, i) => {
                const isLatest = i === shockCount - 1;
                return (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 flex items-center justify-center font-black text-sm"
                    style={{
                      borderColor: isLatest ? '#ffe14d' : '#f59e0b',
                      backgroundColor: isLatest ? '#f59e0b' : 'transparent',
                      color: isLatest ? '#1a0800' : '#f59e0b', // theme-ok: dark on solid amber
                    }}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── coach actions ── */}
        <div className="grid grid-cols-2 gap-2 px-5">
          {/* epinephrine */}
          <div
            className="col-span-2 rounded-2xl border-2 px-3 py-2.5 flex items-center gap-3"
            style={{
              borderColor: coach.epiDue ? '#ec4899' : 'rgba(236,72,153,0.35)',
              backgroundColor: coach.epiDue ? 'rgba(236,72,153,0.14)' : 'rgba(236,72,153,0.05)',
            }}
          >
            <button
              onClick={giveEpi}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-sm bg-pink-600 text-white active:scale-95 transition-transform shrink-0"
            >
              <Syringe size={16} />
              {t('cprGaveEpi')}
            </button>
            <div className="flex-1 min-w-0 flex flex-col">
              {coach.epiSinceSec === null ? (
                <span className="text-xs text-fg-muted">{t('cprNotGivenYet')}</span>
              ) : coach.epiDue ? (
                <span className="text-sm font-black text-pink-600 dark:text-pink-300">{t('cprEpiDueDose', { n: epiCount + 1 })}</span>
              ) : (
                <span className="text-xs text-fg-muted">
                  {t('cprEpiNextIn', { n: epiCount })}{' '}
                  <span className="font-mono font-black tabular-nums" dir="ltr">{formatElapsed((coach.epiRemainingSec ?? 0) * 1000)}</span>
                </span>
              )}
              <div className="flex gap-1 mt-1">
                {EPI_INTERVAL_OPTIONS.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setEpiInterval(sec)}
                    aria-pressed={epiIntervalSec === sec}
                    className="px-2 py-0.5 rounded-md text-[0.68rem] font-bold border"
                    style={epiIntervalSec === sec
                      ? { backgroundColor: '#db2777', borderColor: '#db2777', color: '#fff' } // theme-ok: white on solid pink
                      : { borderColor: 'rgba(236,72,153,0.35)', color: '#db2777' }}
                  >
                    {t('cprMinShort', { n: sec / 60 })}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* amiodarone — shockable only */}
          {rhythm === 'shockable' && (
            <button
              onClick={() => nextAmio && giveAmio(nextAmio.dose)}
              disabled={!nextAmio}
              className="col-span-2 py-2.5 rounded-2xl font-black text-sm border-2 border-violet-400/50 bg-violet-500/10 text-violet-700 dark:text-violet-200 active:scale-95 transition-transform disabled:opacity-50"
            >
              {nextAmio ? t('cprGaveDose', { dose: nextAmio.dose }) : t('cprAmioGiven', { n: amioCount })}
            </button>
          )}

          <button
            onClick={markRosc}
            className="py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 border-2 border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300 active:scale-95 transition-transform"
          >
            <HeartPulse size={16} />
            ROSC
          </button>
          <button
            onClick={() => setShowHT(true)}
            className="py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 border-2 border-teal-500/50 bg-teal-500/10 text-teal-700 dark:text-teal-300 active:scale-95 transition-transform"
          >
            <ListChecks size={16} />
            H's &amp; T's
            {Object.values(htStatus).filter(Boolean).length > 0 && (
              <span className="text-xs font-bold opacity-70">({Object.values(htStatus).filter(Boolean).length}/{H_AND_T.length})</span>
            )}
          </button>
        </div>

        {/* ── BPM + metronome ── */}
        <div className="flex items-center gap-2 px-5 mt-3">
          {([100, 110, 120] as BpmValue[]).map(tempo => {
            const active = bpm === tempo;
            return (
              <button
                key={tempo}
                onClick={() => setBpm(tempo)}
                className="flex-1 py-2.5 rounded-xl font-black text-sm active:scale-95 transition-all duration-150"
                style={active ? {
                  backgroundColor: '#f59e0b',
                  color: '#1a0800', // theme-ok: dark on solid amber
                  boxShadow: '0 2px 12px rgba(245,158,11,0.55)',
                } : {
                  backgroundColor: 'rgba(245,158,11,0.10)',
                  color: 'rgb(var(--fg-muted))',
                  border: '1px solid rgba(245,158,11,0.25)',
                }}
                aria-label={`${tempo} BPM`}
                aria-pressed={active}
              >
                {tempo}
              </button>
            );
          })}
          <button
            onClick={toggleAudio}
            className="flex items-center justify-center w-12 h-11 rounded-xl active:scale-95 transition-all shrink-0"
            style={{
              backgroundColor: isAudioMuted ? 'rgba(80,80,100,0.3)' : 'rgba(245,158,11,0.13)',
              border: isAudioMuted ? '2px solid rgba(130,130,160,0.38)' : '2px solid rgba(245,158,11,0.48)',
              color: isAudioMuted ? 'rgb(var(--fg-muted))' : '#d4a20f',
            }}
            aria-label={isAudioMuted ? t('startMetronome') : t('stopMetronome')}
          >
            {isAudioMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        <div className="h-6 shrink-0" />
      </div>

      {/* rhythm check at the start and at the end of each cycle */}
      {(showRhythm || coach.rhythmPrompt) && (
        <RhythmSheet
          title={rhythm === null && cycleCount === 0 ? t('cprWhatRhythm') : t('cprRhythmCheck')}
          current={rhythm}
          onPick={(r) => { if (r !== rhythm) setRhythm(r); setShowRhythm(false); coach.dismissRhythmPrompt(); }}
          onSkip={() => { setShowRhythm(false); coach.dismissRhythmPrompt(); }}
        />
      )}
      {showHT && <HtSheet status={htStatus} onToggle={toggleHT} onClose={() => setShowHT(false)} />}
    </div>
  );
}
