import { useEffect, useRef, useState, useCallback } from 'react';
import { useMetronomeStore } from '../../../store/metronomeStore';
import { speakHebrew, warmUpVoices } from '../../../utils/tts';
import { CYCLE_SEC, PREWARN_SEC, AMIO_BY_SHOCK, VOICE } from '../cprProtocol';

const AMIO_STEPS = Object.keys(AMIO_BY_SHOCK).map(Number).sort((a, b) => a - b);

/** The next amiodarone dose by protocol order, or null once every dose was given */
export function nextAmioDose(amioCount: number) {
  const shock = AMIO_STEPS[amioCount];
  return shock !== undefined ? { afterShock: shock, ...AMIO_BY_SHOCK[shock] } : null;
}

export interface CoachReminder { key: string; text: string; }

function vibrate(pattern: number | number[]) {
  try { if ('vibrate' in navigator) navigator.vibrate(pattern); } catch { /* unsupported */ }
}

/**
 * The CPR coach's clock: compressor swap every 2 minutes, a pre-warning, epinephrine timing,
 * drug reminders and Wake Lock. Everything is computed from Date.now() — not from tick counting —
 * so it stays accurate after the tab was in the background.
 */
export function useCprCoach() {
  const {
    isPlaying, cycleStartTime, rhythm, shockLogs, lastEpiTime, epiCount, epiIntervalSec, amioCount,
    completeCycle,
  } = useMetronomeStore();

  const [now, setNow] = useState(() => Date.now());
  const [isCycleFlashing, setIsCycleFlashing] = useState(false);
  const [rhythmPrompt, setRhythmPrompt] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const prewarnedFor = useRef<number | null>(null);
  const epiAnnouncedFor = useRef<number | null>(null);
  const spokenReminders = useRef<Set<string>>(new Set());

  useEffect(() => { warmUpVoices(); }, []);

  // ── 1-second clock: compressor swap + pre-warning ──
  useEffect(() => {
    if (!isPlaying) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const start = useMetronomeStore.getState().cycleStartTime;
      if (start === null) return;
      const elapsedSec = (t - start) / 1000;

      if (elapsedSec >= CYCLE_SEC) {
        const cycles = Math.floor(elapsedSec / CYCLE_SEC);
        // keep the cadence from the start of CPR; cycles that passed in the background are logged too
        for (let i = 1; i <= cycles; i++) completeCycle(start + i * CYCLE_SEC * 1000);
        setRhythmPrompt(true);
        speakHebrew(VOICE.cycle);
        vibrate([300, 150, 300, 150, 300]);
        setIsCycleFlashing(true);
        setTimeout(() => setIsCycleFlashing(false), 1600);
        return;
      }

      if (elapsedSec >= CYCLE_SEC - PREWARN_SEC && prewarnedFor.current !== start) {
        prewarnedFor.current = start;
        speakHebrew(VOICE.prewarn);
        vibrate(150);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [isPlaying, completeCycle]);

  // ── next epinephrine dose is due ──
  const epiDue = lastEpiTime !== null && now - lastEpiTime >= epiIntervalSec * 1000;
  useEffect(() => {
    if (!isPlaying || !epiDue || lastEpiTime === null || epiAnnouncedFor.current === lastEpiTime) return;
    epiAnnouncedFor.current = lastEpiTime;
    speakHebrew(VOICE.epiDue);
    vibrate([200, 100, 200]);
  }, [epiDue, isPlaying, lastEpiTime]);

  // ── drug reminder by rhythm and shock count ──
  let reminder: CoachReminder | null = null;
  if (rhythm === 'shockable') {
    const next = nextAmioDose(amioCount);
    if (next && shockLogs.length >= next.afterShock) {
      reminder = { key: `amio-${next.afterShock}`, text: VOICE.amio(next.dose, next.withEpi) };
    }
  } else if (rhythm === 'nonShockable' && epiCount === 0) {
    reminder = { key: 'epi-now', text: VOICE.epiNow };
  }
  if (reminder && dismissed.includes(reminder.key)) reminder = null;

  const reminderKey = reminder?.key;
  const reminderText = reminder?.text;
  useEffect(() => {
    if (!isPlaying || !reminderKey || !reminderText || spokenReminders.current.has(reminderKey)) return;
    spokenReminders.current.add(reminderKey);
    speakHebrew(reminderText);
    vibrate([200, 100, 200]);
  }, [reminderKey, reminderText, isPlaying]);

  // ── Wake Lock while CPR is running ──
  useEffect(() => {
    if (!isPlaying) return;
    let lock: WakeLockSentinel | null = null;
    const acquire = async () => {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          lock = await navigator.wakeLock.request('screen');
        }
      } catch { /* permission denied or unsupported */ }
    };
    const onVisibility = () => { if (document.visibilityState === 'visible') acquire(); };
    acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      lock?.release().catch(() => {});
    };
  }, [isPlaying]);

  const dismissReminder = useCallback((key: string) => setDismissed((d) => [...d, key]), []);
  const dismissRhythmPrompt = useCallback(() => setRhythmPrompt(false), []);

  const cycleElapsedSec = cycleStartTime !== null ? Math.min(CYCLE_SEC, Math.max(0, (now - cycleStartTime) / 1000)) : 0;

  return {
    now,
    cycleElapsedSec,
    cycleRemainingSec: Math.max(0, Math.ceil(CYCLE_SEC - cycleElapsedSec)),
    epiSinceSec: lastEpiTime !== null ? Math.floor((now - lastEpiTime) / 1000) : null,
    epiRemainingSec: lastEpiTime !== null ? Math.max(0, Math.ceil(epiIntervalSec - (now - lastEpiTime) / 1000)) : null,
    epiDue,
    isCycleFlashing,
    rhythmPrompt,
    dismissRhythmPrompt,
    reminder,
    dismissReminder,
  };
}
