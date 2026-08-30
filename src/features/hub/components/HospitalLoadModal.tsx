import { useEffect, useState } from 'react';
import { X, Gauge, Building2, Pencil, Check, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';
import { supabase } from '../../../lib/supabase';
import { trackInteraction } from '../../../utils/analytics';
import {
  ER_LOAD_HOSPITALS,
  ER_DEPARTMENTS,
  ER_LOAD_LEVELS,
  type ErDepartment,
  type ErLoadLevel,
} from '../data/erLoadHospitals';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FAVORITES_KEY = 'er_load_favorites_v1';
const RATE_LIMIT_KEY = 'er_load_last_report_v1';
const RATE_LIMIT_MS = 30 * 60 * 1000; // one report per hospital+department per 30 min
const STALE_MS = 3 * 60 * 60 * 1000; // reports older than 3h are shown as stale

function getSessionId(): string {
  const key = 'medic_session_id';
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveFavorites(names: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(names));
}

function loadRateLimits(): Record<string, number> {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveRateLimit(key: string) {
  const all = loadRateLimits();
  all[key] = Date.now();
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(all));
}

interface LatestReport {
  load_level: ErLoadLevel;
  created_at: string;
}

type ReportsMap = Record<string, LatestReport | undefined>; // key: `${hospital}::${department}`

function reportKey(hospital: string, department: ErDepartment) {
  return `${hospital}::${department}`;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'עכשיו';
  if (mins < 60) return `לפני ${mins} דק׳`;
  const hours = Math.floor(mins / 60);
  return `לפני ${hours} ${hours === 1 ? 'שעה' : 'שעות'}`;
}

function formatHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function HospitalLoadModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);

  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSelection, setPickerSelection] = useState<string[]>([]);
  const [reports, setReports] = useState<ReportsMap>({});
  const [loading, setLoading] = useState(false);
  const [reportSheet, setReportSheet] = useState<{ hospital: string; department: ErDepartment } | null>(null);
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'saved' | 'error' | 'rate-limited'>('idle');

  const fetchReports = async (hospitalNames: string[]) => {
    if (hospitalNames.length === 0) { setReports({}); return; }
    setLoading(true);
    const since = new Date(Date.now() - STALE_MS).toISOString();
    const { data, error } = await supabase
      .from('er_load_reports')
      .select('hospital_name, department, load_level, created_at')
      .in('hospital_name', hospitalNames)
      .gte('created_at', since)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) { console.error('[HospitalLoadModal] fetchReports failed:', error.message); return; }
    const map: ReportsMap = {};
    for (const row of data ?? []) {
      const key = reportKey(row.hospital_name, row.department as ErDepartment);
      // rows are ordered newest-first, so the first hit per key is the latest
      if (!map[key]) map[key] = { load_level: row.load_level as ErLoadLevel, created_at: row.created_at as string };
    }
    setReports(map);
  };

  useEffect(() => {
    if (!isOpen) return;
    trackInteraction('עומסים בבתי חולים', 'emergency_info');
    const favs = loadFavorites();
    setFavorites(favs);
    if (favs.length === 0) {
      setPickerSelection([]);
      setPickerOpen(true);
    } else {
      fetchReports(favs);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const openPickerToEdit = () => {
    setPickerSelection(favorites);
    setPickerOpen(true);
  };

  const confirmPicker = () => {
    saveFavorites(pickerSelection);
    setFavorites(pickerSelection);
    setPickerOpen(false);
    fetchReports(pickerSelection);
  };

  const togglePick = (name: string) => {
    setPickerSelection(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const submitReport = async (level: ErLoadLevel) => {
    if (!reportSheet) return;
    const { hospital, department } = reportSheet;
    const key = reportKey(hospital, department);
    const limits = loadRateLimits();
    const last = limits[key];
    if (last && Date.now() - last < RATE_LIMIT_MS) {
      setSubmitState('rate-limited');
      return;
    }
    setSubmitState('saving');
    const { error } = await supabase.from('er_load_reports').insert({
      hospital_name: hospital,
      department,
      load_level: level,
      session_id: getSessionId(),
    });
    if (error) {
      console.error('[HospitalLoadModal] submitReport failed:', error.message);
      setSubmitState('error');
      return;
    }
    saveRateLimit(key);
    setSubmitState('saved');
    setReports(prev => ({ ...prev, [key]: { load_level: level, created_at: new Date().toISOString() } }));
    setTimeout(() => { setReportSheet(null); setSubmitState('idle'); }, 700);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <Gauge size={20} className="text-cyan-400" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">עומסים בבתי חולים</h2>
        </div>
        <div className="flex items-center gap-2">
          {!pickerOpen && (
            <button
              onClick={openPickerToEdit}
              className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 active:scale-90 transition-all"
              aria-label="עריכת בתי חולים מועדפים"
            >
              <Pencil size={16} />
            </button>
          )}
          <HapticButton
            onClick={onClose}
            pressScale={0.88}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                       flex items-center justify-center
                       text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
            aria-label="סגור"
          >
            <X size={20} />
          </HapticButton>
        </div>
      </div>

      {pickerOpen ? (
        // ── Favorites picker ──────────────────────────────────────────────
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <p className="text-gray-500 dark:text-emt-muted text-sm leading-relaxed px-1">
            בחר את בתי החולים שברצונך לעקוב אחרי העומס בהם. ניתן לשנות בכל עת.
          </p>
          <div className="flex flex-col gap-2">
            {ER_LOAD_HOSPITALS.map(({ name, city }) => {
              const picked = pickerSelection.includes(name);
              return (
                <button
                  key={name}
                  onClick={() => togglePick(name)}
                  className={`flex items-center justify-between w-full rounded-2xl border p-4 transition-colors text-right
                    ${picked
                      ? 'border-cyan-400/50 bg-cyan-400/10'
                      : 'border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray'}`}
                >
                  <div>
                    <p className="text-gray-900 dark:text-emt-light font-bold text-sm">{name}</p>
                    <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">{city}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                    ${picked ? 'border-cyan-400 bg-cyan-400' : 'border-gray-300 dark:border-emt-border'}`}>
                    {picked && <Check size={14} className="text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        // ── Dashboard ─────────────────────────────────────────────────────
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {loading && favorites.length > 0 && (
            <p className="text-gray-500 dark:text-emt-muted text-xs text-center">טוען עדכונים…</p>
          )}
          {favorites.length === 0 ? (
            <p className="text-gray-500 dark:text-emt-muted text-sm text-center mt-8">
              לא נבחרו בתי חולים עדיין — לחץ על ✎ למעלה כדי לבחור.
            </p>
          ) : (
            favorites.map(hospital => (
              <div
                key={hospital}
                className="shrink-0 bg-white dark:bg-emt-gray border border-cyan-400/20 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Emphasized hospital header */}
                <div className="flex items-center gap-3 px-4 py-3.5 bg-cyan-500/8 dark:bg-cyan-500/10 border-b border-cyan-400/15">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
                    <Building2 size={18} className="text-cyan-500 dark:text-cyan-400" />
                  </div>
                  <p className="text-gray-900 dark:text-emt-light font-black text-lg leading-tight">{hospital}</p>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-emt-border">
                  {ER_DEPARTMENTS.map(({ key, label }) => {
                    const report = reports[reportKey(hospital, key)];
                    const levelInfo = report ? ER_LOAD_LEVELS.find(l => l.level === report.load_level) : undefined;
                    return (
                      <div key={key} className="flex flex-col gap-2 px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-800 dark:text-emt-light text-sm font-bold">{label}</span>
                          {levelInfo && (
                            <span className={`flex items-center gap-1 text-xs font-bold ${levelInfo.color} ${levelInfo.bg} border ${levelInfo.border} rounded-full px-2 py-0.5`}>
                              <span>{levelInfo.emoji}</span>
                              {levelInfo.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 text-gray-400 dark:text-emt-muted text-[11px]">
                            {report ? (
                              <>
                                <Clock size={11} />
                                עדכון אחרון: {timeAgo(report.created_at)} ({formatHHMM(report.created_at)})
                              </>
                            ) : (
                              'אין דיווח עדכני'
                            )}
                          </span>
                          <button
                            onClick={() => { setReportSheet({ hospital, department: key }); setSubmitState('idle'); }}
                            className="shrink-0 text-xs font-bold text-cyan-500 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-400/30 rounded-full px-3 py-1.5 active:scale-90 transition-all"
                          >
                            דווח
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          <p className="text-gray-400 dark:text-emt-muted text-[11px] text-center leading-relaxed mt-2 px-2">
            מבוסס על דיווחי משתמשים בלבד — מידע כללי, לא רשמי, ואינו מהווה תחליף לבדיקה מול בית החולים.
          </p>
        </div>
      )}

      {/* Sticky bottom action */}
      {pickerOpen ? (
        <div className="shrink-0 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] border-t border-gray-100 dark:border-emt-border">
          <button
            onClick={confirmPicker}
            disabled={pickerSelection.length === 0}
            className="w-full py-3.5 rounded-xl bg-emt-green text-white font-bold text-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            שמור
          </button>
        </div>
      ) : null}

      {/* Report sheet — full-screen, centered, "experience" style */}
      <AnimatePresence>
        {reportSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex flex-col bg-black/80 backdrop-blur-md"
          >
            <div className="ios-safe-header shrink-0 flex justify-end px-4 py-3">
              <button
                onClick={() => setReportSheet(null)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 active:scale-90 transition-all"
                aria-label="סגור"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 -mt-10">
              <div className="text-center">
                <p className="text-white/50 text-sm font-medium mb-1">
                  {ER_DEPARTMENTS.find(d => d.key === reportSheet.department)?.label}
                </p>
                <p className="text-white font-black text-2xl">{reportSheet.hospital}</p>
                <p className="text-white/60 text-sm mt-3">מה רמת העומס כרגע?</p>
              </div>

              <div className="flex items-center justify-center gap-4 sm:gap-6">
                {ER_LOAD_LEVELS.map(({ level, label, emoji, color, bg, border }, i) => (
                  <motion.button
                    key={level}
                    initial={{ opacity: 0, y: 16, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 20 }}
                    whileTap={{ scale: 0.88 }}
                    onClick={() => submitReport(level)}
                    disabled={submitState === 'saving'}
                    className="flex flex-col items-center gap-3 disabled:opacity-50"
                  >
                    <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 ${bg} ${border} flex items-center justify-center text-5xl shadow-lg`}>
                      {emoji}
                    </div>
                    <span className={`text-base font-bold ${color}`}>{label}</span>
                  </motion.button>
                ))}
              </div>

              <div className="min-h-[1.5rem] text-center">
                {submitState === 'saving' && <p className="text-white/60 text-sm">שולח…</p>}
                {submitState === 'saved' && <p className="text-emt-green text-sm font-bold">✓ הדיווח נשמר</p>}
                {submitState === 'error' && <p className="text-emt-red text-sm">השליחה נכשלה — בדוק חיבור ונסה שוב</p>}
                {submitState === 'rate-limited' && (
                  <p className="flex items-center justify-center gap-1.5 text-amber-400 text-sm">
                    <AlertCircle size={14} />
                    כבר דיווחת כאן לאחרונה — נסה שוב בעוד קצת
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
