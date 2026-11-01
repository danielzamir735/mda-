import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useVitalsLogStore, type ShockLog, type CprEvent, type CprEventKind } from './vitalsLogStore';
import { EPI_INTERVAL_SEC, EPI_DOSE, H_AND_T, RHYTHM_LABELS } from '../features/metronome/cprProtocol';

export const BPM_VALUES = [100, 110, 120] as const;
export type BpmValue = typeof BPM_VALUES[number];

export type Rhythm = 'shockable' | 'nonShockable';

interface MetronomeStore {
  bpm: BpmValue;
  isPlaying: boolean;
  isAudioMuted: boolean;
  cprStartTime: number | null;
  lastShockTimestamp: number | null;
  lastCPRTime: string;
  lastCPRShocks: number;
  shockLogs: ShockLog[];
  // ── CPR coach ──
  rhythm: Rhythm | null;
  cycleStartTime: number | null;
  cycleCount: number;          // completed 2-minute cycles
  lastEpiTime: number | null;
  epiCount: number;
  epiIntervalSec: number;
  amioCount: number;
  htStatus: Record<string, boolean>;
  events: CprEvent[];
  setBpm: (bpm: BpmValue) => void;
  start: () => void;
  toggleAudio: () => void;
  incrementShock: () => void;
  setRhythm: (r: Rhythm) => void;
  /** nextStart — start of the next cycle (keeps the 2-minute cadence even after the tab was in the background) */
  completeCycle: (nextStart?: number) => void;
  resetCycle: () => void;
  giveEpi: () => void;
  giveAmio: (dose: string) => void;
  markRosc: () => void;
  toggleHT: (id: string) => void;
  setEpiInterval: (sec: number) => void;
  /** endAt — when the team pressed "end" (the summary may be saved later) */
  endCPR: (endAt?: number) => void;
  discardCPR: () => void;
  /** @deprecated use start() / endCPR() */
  toggle: () => void;
  stop: () => void;
}

function elapsedToMMSS(startTime: number | null): string {
  if (!startTime) return '';
  const ms = Date.now() - startTime;
  const mm = Math.floor(ms / 60000).toString().padStart(2, '0');
  const ss = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function msToMMSS(ms: number): string {
  const mm = Math.floor(ms / 60000).toString().padStart(2, '0');
  const ss = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

const ev = (kind: CprEventKind, label: string, at = Date.now()): CprEvent => ({ at, kind, label });

function freshSession(now: number) {
  return {
    isPlaying: true,
    isAudioMuted: false,
    cprStartTime: now,
    shockLogs: [] as ShockLog[],
    lastShockTimestamp: null,
    rhythm: null,
    cycleStartTime: now,
    cycleCount: 0,
    lastEpiTime: null,
    epiCount: 0,
    amioCount: 0,
    htStatus: {},
    events: [ev('start', 'תחילת החייאה', now)],
  };
}

const clearedSession = {
  isPlaying: false,
  isAudioMuted: false,
  cprStartTime: null,
  lastShockTimestamp: null,
  shockLogs: [] as ShockLog[],
  rhythm: null,
  cycleStartTime: null,
  cycleCount: 0,
  lastEpiTime: null,
  epiCount: 0,
  amioCount: 0,
  htStatus: {},
  events: [] as CprEvent[],
};

export const useMetronomeStore = create<MetronomeStore>()(
  persist(
    (set, get) => ({
      bpm: 110,
      isPlaying: false,
      isAudioMuted: false,
      cprStartTime: null,
      lastShockTimestamp: null,
      lastCPRTime: '',
      lastCPRShocks: 0,
      shockLogs: [],
      rhythm: null,
      cycleStartTime: null,
      cycleCount: 0,
      lastEpiTime: null,
      epiCount: 0,
      epiIntervalSec: EPI_INTERVAL_SEC.default,
      amioCount: 0,
      htStatus: {},
      events: [],
      setBpm: (bpm) => set({ bpm }),
      start: () => set(freshSession(Date.now())),
      toggleAudio: () =>
        set((state) => ({ isAudioMuted: !state.isAudioMuted })),
      incrementShock: () => {
        const state = get();
        const now = Date.now();
        const date = new Date(now);
        const time = [date.getHours(), date.getMinutes(), date.getSeconds()]
          .map((n) => String(n).padStart(2, '0'))
          .join(':');
        const elapsed = elapsedToMMSS(state.cprStartTime);
        const gap = state.lastShockTimestamp !== null
          ? msToMMSS(now - state.lastShockTimestamp)
          : '—';
        const shock: ShockLog = { time, elapsed, gap };
        set((prev) => ({
          shockLogs: [...prev.shockLogs, shock],
          lastShockTimestamp: now,
          events: [...prev.events, ev('shock', `שוק ${prev.shockLogs.length + 1}`, now)],
        }));
      },
      setRhythm: (r) =>
        set((prev) => ({ rhythm: r, events: [...prev.events, ev('rhythm', `קצב: ${RHYTHM_LABELS[r]}`)] })),
      completeCycle: (nextStart) =>
        set((prev) => {
          const at = nextStart ?? Date.now();
          return {
            cycleCount: prev.cycleCount + 1,
            cycleStartTime: at,
            events: [...prev.events, ev('cycle', `סוף מחזור ${prev.cycleCount + 1} · החלפת מעסה ובדיקת קצב`, at)],
          };
        }),
      resetCycle: () =>
        set((prev) => ({ cycleStartTime: Date.now(), events: [...prev.events, ev('cycle', `איפוס ידני של מחזור ${prev.cycleCount + 1}`)] })),
      giveEpi: () =>
        set((prev) => {
          const now = Date.now();
          return {
            lastEpiTime: now,
            epiCount: prev.epiCount + 1,
            events: [...prev.events, ev('epi', `${EPI_DOSE} (מנה ${prev.epiCount + 1})`, now)],
          };
        }),
      giveAmio: (dose) =>
        set((prev) => ({ amioCount: prev.amioCount + 1, events: [...prev.events, ev('amio', dose)] })),
      markRosc: () =>
        set((prev) => ({ events: [...prev.events, ev('rosc', 'ROSC — חזרת דופק')] })),
      toggleHT: (id) =>
        set((prev) => {
          const on = !prev.htStatus[id];
          const label = H_AND_T.find((h) => h.id === id)?.label ?? id;
          return {
            htStatus: { ...prev.htStatus, [id]: on },
            events: [...prev.events, ev('ht', on ? `נשלל/טופל: ${label}` : `בוטל סימון: ${label}`)],
          };
        }),
      setEpiInterval: (sec) => set({ epiIntervalSec: sec }),
      endCPR: (endAt) => {
        const state = get();
        const end = endAt ?? Date.now();
        const duration = state.cprStartTime ? msToMMSS(end - state.cprStartTime) : '';
        if (state.cprStartTime) {
          useVitalsLogStore.getState().addLog({
            type: 'cpr',
            bloodPressure: '',
            heartRate: '',
            breathing: '',
            bloodSugar: '',
            saturation: '',
            temperature: '',
            fastTest: '',
            notes: '',
            cprDuration: duration,
            cprShocks: state.shockLogs.length,
            cprShockLogs: state.shockLogs,
            cprStartAt: state.cprStartTime,
            cprEvents: [...state.events, ev('end', 'סיום החייאה', end)],
          });
        }
        set({
          ...clearedSession,
          lastCPRTime: duration,
          lastCPRShocks: state.shockLogs.length,
        });
      },
      discardCPR: () => set(clearedSession),
      toggle: () => {
        const state = get();
        if (state.isPlaying) {
          get().endCPR();
        } else {
          set(freshSession(Date.now()));
        }
      },
      stop: () => get().endCPR(),
    }),
    {
      name: 'metronome-store',
      // Persist the in-progress session too (not just the last-completed
      // summary) — a crash + reload, or the browser reclaiming the tab,
      // must not silently discard a live CPR timer/shock log.
      partialize: (state) => ({
        lastCPRTime: state.lastCPRTime,
        lastCPRShocks: state.lastCPRShocks,
        isPlaying: state.isPlaying,
        cprStartTime: state.cprStartTime,
        lastShockTimestamp: state.lastShockTimestamp,
        shockLogs: state.shockLogs,
        rhythm: state.rhythm,
        cycleStartTime: state.cycleStartTime,
        cycleCount: state.cycleCount,
        lastEpiTime: state.lastEpiTime,
        epiCount: state.epiCount,
        epiIntervalSec: state.epiIntervalSec,
        amioCount: state.amioCount,
        htStatus: state.htStatus,
        events: state.events,
      }),
    },
  ),
);
