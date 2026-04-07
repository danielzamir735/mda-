import { useSettingsStore } from '../store/settingsStore';

const dict = {
  he: {
    // existing
    heartRate: 'דופק',
    breathing: 'נשימות',
    bpmUnit: 'פעימות בדקה',
    breathUnit: 'נשימות בדקה',
    seconds: 'שניות',
    lastMeasurement: 'מדידה אחרונה',
    cancel: 'בטל',
    metronome: 'מטרונום',
    utilities: 'כלי עזר',
    camera: 'מצלמה',
    addVitals: 'הוספת מדדים',
    notes: 'פתקים',
    photos: 'תמונות',
    vitalsHistory: 'היסטוריית מדדים',
    hub: 'כלים',
    close: 'סגור',

    // hospitals
    hospitalCentral: 'מרכזיה',
    hospitalER: 'מיון',
    navigateToER: 'ניווט למיון',
    hospitalsTitle: 'בתי חולים בפריסה ארצית',
    searchHospital: 'חיפוש לפי שם או עיר...',
    clearSearch: 'נקה חיפוש',
    noHospitalsFound: 'לא נמצאו בתי חולים',

    // CPR / metronome
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
    start: 'הפעל',
    lastSession: 'סשן אחרון',
    recordShock: 'תעד מתן שוק חשמלי',

    // notes
    newNote: 'פתק חדש',
    noNotesYet: 'אין עדיין פתקים',
    tapPlusToCreate: 'לחץ על + כדי ליצור פתק חדש',
    untitled: 'ללא כותרת',
    empty: 'ריק',
    titlePlaceholder: 'כותרת...',
    writeHere: 'כתוב כאן...',
    deleteNote: 'מחק פתק',

    // oxygen calculator
    oxygenCalculator: 'מחשבון חמצן',
    tankPressure: 'לחץ בבלון',
    tankVolume: 'נפח הבלון (ליטר)',
    flowRate: 'קצב זרימה (LPM)',
    estimatedOxygenTime: 'זמן חמצן משוער',
    minutes: 'דקות',
    fillAllFields: 'מלא את כל השדות לחישוב',
    reset: 'אפס',

    // vitals (add / edit / history)
    editVitals: 'עריכת מדדים',
    bloodPressure: 'לחץ דם',
    saturation: 'סטורציה %',
    temperature: 'חום °C',
    bloodSugar: 'סוכר (mg/dL)',
    fastTest: 'בדיקת FAST',
    fastExpand: 'הרחבה / מדדים נוספים',
    fastMotorStrength: 'כוח גס',
    fastFacialDroop: 'חיוך / צניחת פנים',
    fastSymptomTime: 'שעת הופעת הסימנים',
    normal: 'תקין',
    abnormal: 'לא תקין',
    notesLabel: 'הערות',
    additionalNotesPlaceholder: 'הערות נוספות...',
    clear: 'נקה',
    save: 'שמירה',
    savedConfirm: 'נשמר ✓',
    clearData: 'נקה נתונים',
    hrPlaceholder: 'פ/דקה',
    breathPlaceholder: 'נ/דקה',

    // vitals history
    noSavedVitals: 'אין מדדים שמורים',
    sessionDuration: 'משך סשן',
    electricShocks: 'שוקים חשמליים',
    cprLabel: 'החייאה',
    shockLog: 'יומן שוקים',
    sugarLabel: 'סוכר',
    saturationLabel: 'סטורציה',
    temperatureLabel: 'חום',
    shockTime: 'שעה',
    fromStart: 'מהתחלה',
    gap: 'פער',
    edit: 'ערוך',
    delete: 'מחק',
    collapse: 'כווץ',
    expand: 'הרחב',

    // bag standards
    bagStandardsTitle: 'תקנים לתיקי כונן',
    items: 'פריטים',
    clearMarkings: 'נקה סימונים',
    back: 'חזור',

    // language bridge
    languageBridge: 'גשר שפה',
  },
  en: {
    // existing
    heartRate: 'Heart Rate',
    breathing: 'Breathing',
    bpmUnit: 'BPM',
    breathUnit: 'Breaths/min',
    seconds: 'sec',
    lastMeasurement: 'Last result',
    cancel: 'Cancel',
    metronome: 'Metronome',
    utilities: 'Tools',
    camera: 'Camera',
    addVitals: 'Add Vitals',
    notes: 'Notes',
    photos: 'Photos',
    vitalsHistory: 'Vitals History',
    hub: 'Hub',
    close: 'Close',

    // hospitals
    hospitalCentral: 'Main Phone',
    hospitalER: 'ER',
    navigateToER: 'Navigate to ER',
    hospitalsTitle: 'Hospitals Nationwide',
    searchHospital: 'Search by name or city...',
    clearSearch: 'Clear search',
    noHospitalsFound: 'No hospitals found',

    // CPR / metronome
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
    start: 'Start',
    lastSession: 'Last session',
    recordShock: 'Record Electric Shock',

    // notes
    newNote: 'New note',
    noNotesYet: 'No notes yet',
    tapPlusToCreate: 'Tap + to create a new note',
    untitled: 'Untitled',
    empty: 'Empty',
    titlePlaceholder: 'Title...',
    writeHere: 'Write here...',
    deleteNote: 'Delete note',

    // oxygen calculator
    oxygenCalculator: 'Oxygen Calculator',
    tankPressure: 'Tank Pressure',
    tankVolume: 'Tank Volume (L)',
    flowRate: 'Flow Rate (LPM)',
    estimatedOxygenTime: 'Estimated O₂ Time',
    minutes: 'min',
    fillAllFields: 'Fill all fields to calculate',
    reset: 'Reset',

    // vitals (add / edit / history)
    editVitals: 'Edit Vitals',
    bloodPressure: 'Blood Pressure',
    saturation: 'Saturation %',
    temperature: 'Temp °C',
    bloodSugar: 'Blood Sugar (mg/dL)',
    fastTest: 'FAST Test',
    fastExpand: 'Expand / More Details',
    fastMotorStrength: 'Motor Strength',
    fastFacialDroop: 'Facial Droop',
    fastSymptomTime: 'Symptom Onset Time',
    normal: 'Normal',
    abnormal: 'Abnormal',
    notesLabel: 'Notes',
    additionalNotesPlaceholder: 'Additional notes...',
    clear: 'Clear',
    save: 'Save',
    savedConfirm: 'Saved ✓',
    clearData: 'Clear data',
    hrPlaceholder: 'bpm',
    breathPlaceholder: 'bpm',

    // vitals history
    noSavedVitals: 'No saved vitals',
    sessionDuration: 'Session Duration',
    electricShocks: 'Electric Shocks',
    cprLabel: 'CPR',
    shockLog: 'Shock Log',
    sugarLabel: 'Sugar',
    saturationLabel: 'Saturation',
    temperatureLabel: 'Temp',
    shockTime: 'Time',
    fromStart: 'From Start',
    gap: 'Gap',
    edit: 'Edit',
    delete: 'Delete',
    collapse: 'Collapse',
    expand: 'Expand',

    // bag standards
    bagStandardsTitle: 'Bag Standards',
    items: 'items',
    clearMarkings: 'Clear',
    back: 'Back',

    // language bridge
    languageBridge: 'Language Bridge',
  },
} as const;

type TranslationKey = keyof typeof dict['he'];

export function useTranslation() {
  const language = useSettingsStore((s) => s.language);
  const lang: keyof typeof dict = language === 'en' ? 'en' : 'he';
  return (key: TranslationKey): string => dict[lang][key];
}
