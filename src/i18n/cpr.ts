import { defineDict } from './types';

// Session 2 - CPR overlay, metronome, shock calculator, after-call screen.
export default defineDict({
  he: {
    cprTime: 'זמן בהחייאה',
    endCPR: 'סיים החייאה',
    cprSummary: 'סיכום החייאה',
    duration: 'משך',
    shocksLabel: 'שוקים',
    noShocksRecorded: 'לא נרשמו שוקים חשמליים',
    saveToCPRHistory: 'שמור בהיסטוריית מדדים',
    deleteClose: 'מחק / סגור',
    startMetronome: 'הפעל מטרונום',
    stopMetronome: 'הפסק מטרונום',
    lastSession: 'סשן אחרון',
    recordShock: 'תעד מתן שוק חשמלי',
  },
  en: {
    cprTime: 'CPR Time',
    endCPR: 'End CPR',
    cprSummary: 'CPR Summary',
    duration: 'Duration',
    shocksLabel: 'Shocks',
    noShocksRecorded: 'No shocks recorded',
    saveToCPRHistory: 'Save to Vitals History',
    deleteClose: 'Discard / Close',
    startMetronome: 'Start Metronome',
    stopMetronome: 'Stop Metronome',
    lastSession: 'Last session',
    recordShock: 'Record Electric Shock',
  },
});
