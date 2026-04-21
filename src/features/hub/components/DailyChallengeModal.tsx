import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Trophy, Zap, Brain, CheckCircle, XCircle, RefreshCw, Users, Clock, Medal } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackEvent } from '../../../utils/analytics';
import HapticButton from '../../../components/HapticButton';
import { supabase } from '../../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'bls' | 'als';
type ViewState = 'select' | 'loading' | 'question' | 'answered' | 'error';

interface Question {
  question: string;
  options: string[];
  correct_index: number;
  clinical_explanation: string;
}

interface DayCache {
  date: string;
  question: Question;
  answered_index: number | null;
  time_taken?: number;
  leaderboard_saved?: boolean;
}

interface GlobalStats {
  total: number;
  correct: number;
  answer_counts: number[];
}

interface LeaderboardEntry {
  display_name: string;
  time_taken: number;
  rank: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

function getToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const CACHE_KEYS: Record<Category, string> = {
  bls: 'daily_challenge_bls_v4',
  als: 'daily_challenge_als_v4',
};

const CATEGORY_LABELS: Record<Category, string> = {
  bls: 'BLS',
  als: 'ALS',
};

const CATEGORY_FULL: Record<Category, string> = {
  bls: 'החייאה בסיסית',
  als: 'החייאה מתקדמת',
};

function buildPrompt(type: 'BLS' | 'ALS'): string {
  return (
    `You are a Senior Medical Examiner and AHA/PHTLS course faculty member. Generate the Daily Challenge question for ${type} in Hebrew.\n\n` +
    `MISSION: Create a DECEPTIVELY DIFFICULT clinical scenario for ${type}. The scenario must involve a real-world edge case — a subtle vital sign pattern, a contraindicated drug combination, a time-critical protocol deviation, or a physiological cascade that reverses expected treatment logic. Phrase the question to trap even experienced providers.\n\n` +
    'OPTIONS: Exactly 4 answer options. Each option must be a complete, detailed clinical action sentence of 20-30 Hebrew words. Format: "[Verb] [specific drug/dose/route/rate] [clinical rationale or timing]".\n' +
    'DISTRACTOR RULES: At least TWO options must sound clinically correct based on outdated/deprecated protocols (pre-2020). One option must be clearly inferior but still plausible to a junior provider. Exactly ONE option follows current AHA/PHTLS 2026 guidelines precisely. All distractors must be highly plausible — no obviously wrong answers.\n\n' +
    'CLINICAL EXPLANATION: Write exactly 3-4 concise sentences: (1) State the specific AHA 2026 / PHTLS guideline or chapter that applies. (2) Explain the physiological mechanism making the correct answer superior. (3) Dissect why the most tempting wrong answer fails and the patient harm it causes. (4) End with one clinical pearl that separates elite providers from average ones.\n\n' +
    'ACCURACY: Every drug dose, energy setting, and time threshold must match AHA 2026, PHTLS 9th Edition, or current Israeli MDA protocols exactly.\n\n' +
    'Output ONLY valid JSON: { "question": string, "options": string[], "correct_index": number, "clinical_explanation": string }'
  );
}

const PROMPTS: Record<Category, string> = {
  bls: buildPrompt('BLS'),
  als: buildPrompt('ALS'),
};

// ─── Session ID ───────────────────────────────────────────────────────────────

function getSessionId(): string {
  const key = 'medic_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

// ─── Local cache helpers ──────────────────────────────────────────────────────

function loadCache(cat: Category): DayCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEYS[cat]);
    if (!raw) return null;
    const parsed: DayCache = JSON.parse(raw);
    return parsed.date === getToday() ? parsed : null;
  } catch {
    return null;
  }
}

function saveCache(
  cat: Category,
  question: Question,
  answered_index: number | null,
  time_taken?: number,
  leaderboard_saved?: boolean,
) {
  const existing = loadCache(cat);
  localStorage.setItem(
    CACHE_KEYS[cat],
    JSON.stringify({
      date: getToday(),
      question,
      answered_index,
      time_taken,
      leaderboard_saved: leaderboard_saved ?? existing?.leaderboard_saved ?? false,
    }),
  );
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

async function generateQuestion(cat: Category): Promise<Question> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY missing');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(PROMPTS[cat]);
  const raw = result.response.text().trim();
  const clean = raw.replace(/^```(?:json)?/m, '').replace(/```$/m, '').trim();
  const parsed = JSON.parse(clean) as Question;
  if (
    typeof parsed.question !== 'string' ||
    !Array.isArray(parsed.options) ||
    parsed.options.length !== 4 ||
    typeof parsed.correct_index !== 'number' ||
    typeof parsed.clinical_explanation !== 'string'
  ) throw new Error('Invalid question format from AI');
  return parsed;
}

// ─── Supabase — daily_questions ───────────────────────────────────────────────

function parseQuestionContent(c: Question): Question {
  return {
    question: c.question,
    options: Array.isArray(c.options) ? c.options : JSON.parse(c.options as unknown as string),
    correct_index: c.correct_index,
    clinical_explanation: c.clinical_explanation,
  };
}

async function fetchOrCreateQuestion(cat: Category): Promise<Question> {
  const today = getToday();

  const { data: existing, error: fetchError } = await supabase
    .from('daily_questions')
    .select('*')
    .eq('question_date', today)
    .eq('question_type', cat)
    .maybeSingle();

  if (fetchError) console.error('[DailyChallenge] DB fetch error:', fetchError.message);

  if (existing?.content) return parseQuestionContent(existing.content as Question);

  const generated = await generateQuestion(cat);

  const { data: inserted, error: insertError } = await supabase
    .from('daily_questions')
    .insert({ question_date: today, question_type: cat, content: generated })
    .select()
    .single();

  if (!insertError && inserted?.content) return parseQuestionContent(inserted.content as Question);

  // Race condition: another client won the INSERT — fetch the canonical row
  const { data: canonical } = await supabase
    .from('daily_questions')
    .select('*')
    .eq('question_date', today)
    .eq('question_type', cat)
    .maybeSingle();

  if (canonical?.content) return parseQuestionContent(canonical.content as Question);

  return generated;
}

// ─── Supabase — daily_responses ──────────────────────────────────────────────

async function saveResponse(category: Category, is_correct: boolean, time_taken: number, answer_index: number): Promise<void> {
  const { error } = await supabase.from('daily_responses').insert({
    session_id: getSessionId(),
    question_type: category,
    question_date: getToday(),
    is_correct,
    time_taken,
    answer_index: Number(answer_index),
  });
  if (error) console.error('[DailySync] INSERT error:', error.message);
}

async function fetchGlobalStats(category: Category, retries = 2): Promise<{ stats: GlobalStats; offline: boolean }> {
  const today = getToday();
  for (let attempt = 0; attempt <= retries; attempt++) {
    const { data, error } = await supabase
      .from('daily_responses')
      .select('is_correct, answer_index')
      .eq('question_type', category)
      .eq('question_date', today);

    if (!error) {
      const rows = data ?? [];
      if (rows.length === 0) return { stats: { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] }, offline: false };
      const answer_counts = [0, 0, 0, 0];
      rows.forEach((r) => {
        const ai = Number(r.answer_index);
        if (Number.isInteger(ai) && ai >= 0 && ai <= 3) answer_counts[ai]++;
      });
      return { stats: { total: rows.length, correct: rows.filter((r) => r.is_correct).length, answer_counts }, offline: false };
    }

    console.error(`[DailySync] fetchGlobalStats error (attempt ${attempt + 1}):`, error.message);
    if (attempt < retries) await new Promise((r) => setTimeout(r, 2000));
  }
  return { stats: { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] }, offline: true };
}

// ─── Supabase — daily_leaderboard ────────────────────────────────────────────

async function saveLeaderboardEntry(category: Category, display_name: string, time_taken: number): Promise<void> {
  const { error } = await supabase.from('daily_leaderboard').insert({
    question_date: getToday(),
    question_type: category,
    display_name: display_name.trim(),
    time_taken,
    session_id: getSessionId(),
  });
  if (error) console.error('[Leaderboard] INSERT error:', error.message);
}

async function fetchLeaderboard(category: Category): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('daily_leaderboard')
    .select('display_name, time_taken')
    .eq('question_date', getToday())
    .eq('question_type', category)
    .order('time_taken', { ascending: true })
    .limit(10);

  if (error) {
    console.error('[Leaderboard] FETCH error:', error.message);
    return [];
  }
  return (data ?? []).map((row, i) => ({ display_name: row.display_name, time_taken: row.time_taken, rank: i + 1 }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryBadge({ cat, active, onClick }: { cat: Category; active: boolean; onClick: () => void }) {
  const cfg = {
    bls: {
      active: 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400/60 text-white shadow-xl shadow-blue-500/40',
      idle: 'bg-blue-500/10 border-blue-500/25 text-blue-300',
      icon: '🫀',
    },
    als: {
      active: 'bg-gradient-to-br from-red-500 to-red-600 border-red-400/60 text-white shadow-xl shadow-red-500/40',
      idle: 'bg-red-500/10 border-red-500/25 text-red-300',
      icon: '⚡',
    },
  }[cat];

  return (
    <HapticButton
      onClick={onClick}
      hapticPattern={10}
      pressScale={0.94}
      className={`flex-1 py-4 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-1 ${active ? cfg.active : cfg.idle}`}
    >
      <span className="text-2xl leading-none">{cfg.icon}</span>
      <span className="text-xl font-black leading-none mt-1">{CATEGORY_LABELS[cat]}</span>
      <span className={`text-[11px] font-semibold ${active ? 'text-white/75' : 'opacity-55'}`}>
        {CATEGORY_FULL[cat]}
      </span>
      {active && <span className="mt-1 w-1.5 h-1.5 rounded-full bg-white/70" />}
    </HapticButton>
  );
}

// Clinical Explanation — centered pop-up modal with blurred backdrop
function ExplanationModal({
  question,
  category,
  stats,
  selectedIndex,
  onClose,
}: {
  question: Question;
  category: Category;
  stats: GlobalStats | null;
  selectedIndex: number;
  onClose: () => void;
}) {
  const isCorrect = selectedIndex === question.correct_index;
  const totalWithBaseline = (stats?.total ?? 0) + 110;
  const pct = stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;
  const accentBorder = category === 'bls' ? 'border-blue-500/30' : 'border-red-500/30';
  const accentBg = category === 'bls' ? 'from-blue-900/20' : 'from-red-900/20';
  const accentBar = category === 'bls' ? 'bg-blue-400' : 'bg-red-400';

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      dir="rtl"
    >
      <motion.div
        className="w-full max-w-lg rounded-3xl bg-emt-dark border border-emt-border overflow-hidden flex flex-col"
        style={{ maxHeight: '85vh' }}
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-emt-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
              <Brain size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-amber-300 font-black text-lg leading-none">הסבר קליני</h2>
              <p className="text-emt-muted text-[11px] mt-0.5">ניתוח מקרה מעמיק</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black ${
              isCorrect
                ? 'bg-green-500/15 border-green-500/40 text-green-300'
                : 'bg-red-500/15 border-red-500/40 text-red-300'
            }`}>
              {isCorrect ? <CheckCircle size={13} /> : <XCircle size={13} />}
              <span>{isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה'}</span>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-emt-gray border border-emt-border flex items-center justify-center text-emt-muted hover:text-emt-light transition-colors active:scale-90"
              aria-label="סגור"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-3xl bg-gradient-to-b ${accentBg} to-emt-dark border ${accentBorder} p-5`}
          >
            <p className="text-emt-light text-base leading-[1.8] font-medium text-right">
              {question.clinical_explanation}
            </p>
          </motion.div>

          {pct !== null && stats && stats.total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col items-center gap-3"
            >
              <div className="flex items-center gap-2 text-emt-muted text-xs font-semibold">
                <Users size={13} />
                <span>סטטיסטיקה גלובלית היום</span>
              </div>
              <p className={`text-lg font-black text-center ${isCorrect ? 'text-green-300' : 'text-emt-muted'}`}>
                {isCorrect
                  ? `אתה בין ${pct}% שענו נכון היום!`
                  : `${pct}% מהמשתמשים ענו נכון היום`}
              </p>
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${accentBar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.35, ease: 'easeOut' }}
                />
              </div>
              <p className="text-emt-muted/50 text-xs">{totalWithBaseline} משתתפים עד כה</p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-emt-border">
          <HapticButton
            onClick={onClose}
            hapticPattern={10}
            pressScale={0.96}
            className="w-full py-3.5 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-base"
          >
            הבנתי ✓
          </HapticButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Leaderboard sub-component ────────────────────────────────────────────────

function LeaderboardSection({
  category,
  timeTaken,
  alreadySaved,
  onSave,
}: {
  category: Category;
  timeTaken: number;
  alreadySaved: boolean;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLeaderboard(category).then((data) => { setEntries(data); setLoading(false); });
  }, [category, alreadySaved]);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    await saveLeaderboardEntry(category, trimmed, timeTaken);
    onSave(trimmed);
    const updated = await fetchLeaderboard(category);
    setEntries(updated);
    setSaving(false);
  };

  const rankColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];
  const rankIcons = ['🥇', '🥈', '🥉'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-3xl bg-white/5 border border-white/10 p-4 flex flex-col gap-3"
      dir="rtl"
    >
      <div className="flex items-center gap-2">
        <Trophy size={16} className="text-amber-400" />
        <span className="text-emt-light font-black text-sm">דירוג המהירים — היום</span>
      </div>

      {!alreadySaved && (
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="כל הכבוד! הכנס שם לדירוג המהירים"
            maxLength={24}
            className="flex-1 rounded-xl bg-white/8 border border-white/15 px-3 py-2.5 text-emt-light text-sm placeholder:text-emt-muted/50 outline-none focus:border-amber-400/50 text-right"
          />
          <HapticButton
            onClick={handleSubmit}
            disabled={!name.trim() || saving}
            hapticPattern={20}
            pressScale={0.95}
            className="px-4 py-2.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-sm disabled:opacity-40"
          >
            {saving ? '...' : 'שמור'}
          </HapticButton>
        </div>
      )}

      {alreadySaved && (
        <div className="flex items-center gap-1.5 text-green-400/80 text-xs font-semibold">
          <CheckCircle size={13} />
          <span>הוספת לדירוג! ענית תוך {timeTaken} שניות</span>
        </div>
      )}

      {loading ? (
        <div className="text-emt-muted/50 text-xs text-center py-2">טוען דירוג...</div>
      ) : entries.length === 0 ? (
        <div className="text-emt-muted/50 text-xs text-center py-2">היה הראשון בדירוג היום!</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {entries.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${entry.rank <= 3 ? 'bg-white/5' : ''}`}
            >
              <span className="text-base leading-none w-6 text-center">
                {entry.rank <= 3 ? rankIcons[entry.rank - 1] : <Medal size={14} className={rankColors[2]} />}
              </span>
              <span className={`flex-1 font-semibold text-sm ${entry.rank <= 3 ? rankColors[entry.rank - 1] : 'text-emt-muted'}`}>
                {entry.display_name}
              </span>
              <div className="flex items-center gap-1 text-emt-muted/60 text-xs">
                <Clock size={11} />
                <span>{entry.time_taken}s</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function DailyChallengeModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);

  const [category, setCategory] = useState<Category | null>(null);
  const [view, setView] = useState<ViewState>('select');
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [isStatsOffline, setIsStatsOffline] = useState(false);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [leaderboardSaved, setLeaderboardSaved] = useState(false);

  const questionStartRef = useRef<number | null>(null);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      trackEvent('daily_challenge_modal_opened');
      setCategory(null);
      setView('select');
      setQuestion(null);
      setSelectedIndex(null);
      setGlobalStats(null);
      setIsStatsOffline(false);
      setTimeTaken(null);
      setShowExplanation(false);
      setLeaderboardSaved(false);
      getSessionId();
    }
    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, [isOpen]);

  // Live counter sync every 10s while modal is open
  useEffect(() => {
    if (!isOpen || !category) return;
    const id = setInterval(() => {
      fetchGlobalStats(category).then(({ stats, offline }) => {
        setGlobalStats(stats);
        setIsStatsOffline(offline);
      });
    }, 10000);
    return () => clearInterval(id);
  }, [isOpen, category]);

  const loadCategory = useCallback(async (cat: Category) => {
    setCategory(cat);
    setGlobalStats(null);
    setShowExplanation(false);
    trackEvent('daily_challenge_category_selected', { category: cat });

    const cached = loadCache(cat);
    if (cached) {
      setQuestion(cached.question);
      setLeaderboardSaved(cached.leaderboard_saved ?? false);
      if (cached.answered_index !== null) {
        setSelectedIndex(cached.answered_index);
        setTimeTaken(cached.time_taken ?? null);
        setView('answered');
      } else {
        setSelectedIndex(null);
        setTimeTaken(null);
        setView('question');
        questionStartRef.current = Date.now();
      }
      fetchGlobalStats(cat).then(({ stats, offline }) => { setGlobalStats(stats); setIsStatsOffline(offline); });
      return;
    }

    setView('loading');
    setQuestion(null);
    setSelectedIndex(null);
    setTimeTaken(null);
    setLeaderboardSaved(false);

    try {
      const q = await fetchOrCreateQuestion(cat);
      setQuestion(q);
      saveCache(cat, q, null);
      setView('question');
      questionStartRef.current = Date.now();
      fetchGlobalStats(cat).then(({ stats, offline }) => { setGlobalStats(stats); setIsStatsOffline(offline); });
    } catch (err) {
      console.error('[DailyChallengeModal] load error:', err);
      setView('error');
    }
  }, []);

  const handleAnswer = useCallback(async (index: number) => {
    if (!question || !category || selectedIndex !== null) return;

    const elapsed = questionStartRef.current
      ? Math.round((Date.now() - questionStartRef.current) / 1000)
      : 0;
    const isCorrect = index === question.correct_index;

    setSelectedIndex(index);
    setTimeTaken(elapsed);
    setView('answered');
    saveCache(category, question, index, elapsed, false);

    trackEvent('daily_challenge_complete', { category, is_correct: isCorrect, time_taken: elapsed });

    overlayTimerRef.current = setTimeout(() => setShowExplanation(true), 900);

    await saveResponse(category, isCorrect, elapsed, index);
    const { stats, offline } = await fetchGlobalStats(category);
    setGlobalStats(stats);
    setIsStatsOffline(offline);
  }, [question, category, selectedIndex]);

  const handleLeaderboardSave = useCallback((name: string) => {
    if (!category || !question) return;
    setLeaderboardSaved(true);
    saveCache(category, question, selectedIndex, timeTaken ?? 0, true);
    trackEvent('daily_challenge_leaderboard_saved', { category, name });
  }, [category, question, selectedIndex, timeTaken]);

  const handleRetry = useCallback(() => {
    if (!category) return;
    localStorage.removeItem(CACHE_KEYS[category]);
    loadCategory(category);
  }, [category, loadCategory]);

  if (!isOpen) return null;

  const isAnswered = view === 'answered' && selectedIndex !== null && question !== null;
  const isCorrectAnswer = isAnswered && selectedIndex === question.correct_index;
  const participantCount = (globalStats?.total ?? 0) + 110;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-emt-dark overflow-hidden">

      {/* ── Header ── */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-emt-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
            <Trophy size={18} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-emt-light font-black text-lg leading-none">אתגר יומי</h2>
            <p className="text-emt-muted text-[11px] mt-0.5">
              {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-emt-gray border border-emt-border flex items-center justify-center active:scale-90 transition-transform text-emt-muted hover:text-emt-light"
          aria-label="סגור"
        >
          <X size={20} />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-4">

        {/* Category selector */}
        <div dir="rtl" className="flex gap-3">
          <CategoryBadge cat="bls" active={category === 'bls'} onClick={() => loadCategory('bls')} />
          <CategoryBadge cat="als" active={category === 'als'} onClick={() => loadCategory('als')} />
        </div>

        <AnimatePresence mode="wait">

          {/* ── Select prompt ── */}
          {view === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col items-center justify-center gap-4 py-16"
            >
              <div className="w-20 h-20 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                <Brain size={36} className="text-amber-400/70" />
              </div>
              <p className="text-emt-muted text-center text-base font-semibold px-8">
                בחר קטגוריה כדי לחדד את החושים
              </p>
              <div className="flex items-center gap-1.5 text-amber-400/60 text-xs">
                <Zap size={12} />
                <span>שאלת edge-case חדשה כל יום</span>
              </div>
            </motion.div>
          )}

          {/* ── Loading ── */}
          {view === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center gap-4 py-16"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-amber-400/20 border-t-amber-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain size={22} className="text-amber-400/70" />
                </div>
              </div>
              <p className="text-emt-muted text-sm font-semibold">טוען שאלה יומית...</p>
              <p className="text-emt-muted/50 text-xs">
                {category ? `${CATEGORY_LABELS[category]} — ${CATEGORY_FULL[category]}` : ''}
              </p>
            </motion.div>
          )}

          {/* ── Question / Answered ── */}
          {(view === 'question' || view === 'answered') && question && (
            <motion.div
              key={`question-${category}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-4"
              dir="rtl"
            >
              {/* Result banner */}
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`flex items-center justify-center gap-2.5 rounded-2xl px-4 py-3 border ${
                    isCorrectAnswer
                      ? 'bg-green-500/15 border-green-500/30'
                      : 'bg-red-500/15 border-red-500/30'
                  }`}
                >
                  {isCorrectAnswer
                    ? <CheckCircle size={22} className="text-green-400 shrink-0" />
                    : <XCircle size={22} className="text-red-400 shrink-0" />}
                  <div className="flex-1 text-center">
                    <span className={`font-black text-lg ${isCorrectAnswer ? 'text-green-300' : 'text-red-300'}`}>
                      {isCorrectAnswer ? 'תשובה נכונה! כל הכבוד 🎉' : 'תשובה שגויה'}
                    </span>
                    {timeTaken !== null && (
                      <div className="flex items-center justify-center gap-1 mt-0.5 text-emt-muted/60 text-xs">
                        <Clock size={10} />
                        <span>ענית תוך {timeTaken} שניות</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Question card */}
              <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wide ${
                    category === 'bls' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {category ? CATEGORY_LABELS[category] : ''}
                  </div>
                  {isAnswered && (
                    <div className="flex items-center gap-1 text-amber-400/60 text-xs">
                      <Trophy size={11} />
                      <span>ענית היום</span>
                    </div>
                  )}
                </div>
                <p className="text-emt-light font-bold text-xl leading-snug text-center">
                  {question.question}
                </p>
              </div>

              {/* Participant counter */}
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full self-center border ${
                  isStatsOffline ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/10'
                }`}
              >
                <Users size={12} className={isStatsOffline ? 'text-amber-400/60' : 'text-emt-muted/70'} />
                {isStatsOffline ? (
                  <span className="text-[11px] text-amber-400/70 font-semibold animate-pulse">מתחבר מחדש...</span>
                ) : (
                  <span className="text-[11px] text-emt-muted font-semibold">
                    מספר משתתפים באתגר היומי:{' '}
                    <span className="text-emt-light font-black">
                      {participantCount}
                    </span>
                    {globalStats === null && <span className="animate-pulse"> ...</span>}
                  </span>
                )}
              </motion.div>

              {/* Answer options */}
              <div className="flex flex-col gap-2.5">
                {question.options.map((option, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isCorrect = idx === question.correct_index;
                  const showResult = isAnswered;

                  const rawPct =
                    globalStats && showResult && globalStats.total > 0
                      ? Math.round(((globalStats.answer_counts[idx] ?? 0) / globalStats.total) * 100)
                      : null;
                  // Don't display 0% — hide bars/labels until there's real data
                  const chosenPct = rawPct !== null && rawPct > 0 ? rawPct : null;

                  let borderStyle = 'border-emt-border';
                  let textStyle = 'text-emt-light hover:bg-white/8 active:scale-[0.98]';
                  let baseBg = 'bg-emt-gray';
                  if (showResult) {
                    if (isCorrect) { borderStyle = 'border-green-400/50'; textStyle = 'text-green-200'; baseBg = 'bg-green-500/10'; }
                    else if (isSelected) { borderStyle = 'border-red-400/50'; textStyle = 'text-red-200'; baseBg = 'bg-red-500/10'; }
                    else { borderStyle = 'border-emt-border/50'; textStyle = 'text-emt-muted'; baseBg = 'bg-emt-gray/50'; }
                  }

                  const fillColor = isCorrect ? 'bg-green-500/25' : isSelected ? 'bg-red-500/25' : 'bg-white/8';

                  return (
                    <HapticButton
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={isAnswered}
                      hapticPattern={isAnswered ? 0 : 10}
                      pressScale={isAnswered ? 1 : 0.97}
                      className={`relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 text-right transition-all duration-200 ${baseBg} ${borderStyle} ${textStyle}`}
                    >
                      {showResult && chosenPct !== null && (
                        <motion.div
                          className={`absolute inset-y-0 right-0 rounded-2xl ${fillColor}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${chosenPct}%` }}
                          transition={{ duration: 0.6, delay: 0.3 + idx * 0.07, ease: 'easeOut' }}
                        />
                      )}
                      <div className="relative z-10 flex items-center gap-3 w-full">
                        <span className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-black border ${
                          showResult && isCorrect
                            ? 'bg-green-500/30 border-green-400/60 text-green-300'
                            : showResult && isSelected
                            ? 'bg-red-500/30 border-red-400/60 text-red-300'
                            : 'bg-white/8 border-white/15 text-emt-muted'
                        }`}>
                          {['א', 'ב', 'ג', 'ד'][idx]}
                        </span>
                        <span className="flex-1 text-base font-semibold leading-snug break-words min-w-0 text-center">
                          {option}
                        </span>
                        {showResult && chosenPct !== null && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.25 + idx * 0.07 }}
                            className={`text-sm font-black shrink-0 tabular-nums ${
                              isCorrect ? 'text-green-300' : isSelected ? 'text-red-300' : 'text-emt-muted/70'
                            }`}
                          >
                            {chosenPct}%
                          </motion.span>
                        )}
                        {showResult && isCorrect && <CheckCircle size={16} className="text-green-400 shrink-0" />}
                        {showResult && isSelected && !isCorrect && <XCircle size={16} className="text-red-400 shrink-0" />}
                      </div>
                    </HapticButton>
                  );
                })}
              </div>

              {/* Leaderboard — shown after correct answer */}
              {isAnswered && isCorrectAnswer && timeTaken !== null && category && (
                <LeaderboardSection
                  category={category}
                  timeTaken={timeTaken}
                  alreadySaved={leaderboardSaved}
                  onSave={handleLeaderboardSave}
                />
              )}

              {/* Re-open explanation button */}
              {isAnswered && !showExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <HapticButton
                    onClick={() => setShowExplanation(true)}
                    hapticPattern={10}
                    pressScale={0.96}
                    className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-amber-400/10 border border-amber-400/25 px-4 py-3.5 text-amber-300 font-bold text-base"
                  >
                    <Brain size={18} />
                    הצג הסבר קליני
                  </HapticButton>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Error ── */}
          {view === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-12 px-4"
              dir="rtl"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <XCircle size={28} className="text-red-400" />
              </div>
              <p className="text-emt-muted text-center text-sm font-semibold">
                לא ניתן לטעון את השאלה. בדוק חיבור לאינטרנט ונסה שוב.
              </p>
              <HapticButton
                onClick={handleRetry}
                hapticPattern={10}
                pressScale={0.95}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold text-sm"
              >
                <RefreshCw size={15} />
                נסה שוב
              </HapticButton>
            </motion.div>
          )}

        </AnimatePresence>

        <p className="text-center text-[10px] text-emt-muted/40 px-4 leading-relaxed pb-2">
          השאלות מיוצרות על ידי AI למטרות לימוד בלבד. אינן תחליף להכשרה מקצועית מוסמכת.
        </p>
      </div>

      {/* ── Clinical Explanation Modal ── */}
      <AnimatePresence>
        {showExplanation && isAnswered && question && category && (
          <ExplanationModal
            question={question}
            category={category}
            stats={globalStats}
            selectedIndex={selectedIndex}
            onClose={() => setShowExplanation(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
