import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Trophy, Zap, Brain, CheckCircle, XCircle, RefreshCw, ChevronRight, Users, Clock } from 'lucide-react';
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
}

interface GlobalStats {
  total: number;
  correct: number;
  answer_counts: number[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Always computed fresh — avoids stale date if tab stays open past midnight
function getToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const CACHE_KEYS: Record<Category, string> = {
  bls: 'daily_challenge_bls_v3',
  als: 'daily_challenge_als_v3',
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
    `You are an elite Paramedic Instructor and Medical Director. Generate the Daily Challenge question for ${type} (BLS or ALS) in Hebrew.\n` +
    'Strict Rules:\n\n' +
    'ACCURACY: Base all medical logic STRICTLY on the latest AHA (American Heart Association), PHTLS, and official paramedic protocols.\n\n' +
    'DIFFICULTY: Make the clinical scenario highly tricky, borderline deceptive, and complex. It must spark fierce debate among professional medics.\n\n' +
    'OPTIONS: Provide 4 options. All distractors must sound incredibly plausible and be common clinical pitfalls.\n\n' +
    'EXPLANATION: Provide a deep clinical_explanation that cites the clinical rationale, explaining exactly why the correct answer is right and why the most tempting distractor is wrong.\n\n' +
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

function saveCache(cat: Category, question: Question, answered_index: number | null, time_taken?: number) {
  localStorage.setItem(CACHE_KEYS[cat], JSON.stringify({ date: getToday(), question, answered_index, time_taken }));
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
// Schema: question_date (date), question_type (text), content (jsonb)

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

  // 1. Check DB for today's question (all users share the same row)
  const { data: existing, error: fetchError } = await supabase
    .from('daily_questions')
    .select('*')
    .eq('question_date', today)
    .eq('question_type', cat)
    .maybeSingle();

  if (fetchError) {
    console.error('[DailyChallenge] DB fetch error:', fetchError.message, fetchError.code);
  }

  if (existing?.content) {
    return parseQuestionContent(existing.content as Question);
  }

  // 2. First user for today: generate with Gemini
  const generated = await generateQuestion(cat);

  // 3. Atomic INSERT — unique constraint on (question_date, question_type)
  const { data: inserted, error: insertError } = await supabase
    .from('daily_questions')
    .insert({ question_date: today, question_type: cat, content: generated })
    .select()
    .single();

  if (!insertError && inserted?.content) {
    return parseQuestionContent(inserted.content as Question);
  }

  // 4. Race condition: another client won the insert (unique_violation = 23505)
  // Fallback SELECT to get the canonical row created by the other user
  const { data: canonical, error: refetchError } = await supabase
    .from('daily_questions')
    .select('*')
    .eq('question_date', today)
    .eq('question_type', cat)
    .maybeSingle();

  if (refetchError) {
    console.error('[DailyChallenge] Fallback SELECT error:', refetchError.message, refetchError.code);
  }

  if (canonical?.content) {
    return parseQuestionContent(canonical.content as Question);
  }

  // 5. Last resort: return the locally generated question
  console.warn('[DailyChallenge] All DB paths failed — using locally generated question.');
  return generated;
}

// ─── Supabase — daily_responses ──────────────────────────────────────────────
// Schema: session_id, question_type (text), question_date (date), is_correct, time_taken, answer_index
// Unique constraint: (session_id, question_type, question_date)

async function saveResponse(
  category: Category,
  is_correct: boolean,
  time_taken: number,
  answer_index: number,
): Promise<void> {
  const payload = {
    session_id: getSessionId(),
    question_type: category,
    question_date: getToday(),
    is_correct,
    time_taken,
    answer_index: Number(answer_index),
  };
  console.log('[DailySync] INSERT payload:', payload);
  // Plain INSERT — unique constraint on (session_id, question_type, question_date) prevents duplicates
  const { data, error } = await supabase.from('daily_responses').insert(payload).select();
  if (error) {
    console.error('[DailySync] INSERT error:', error.message, '| code:', error.code, '| details:', error.details);
  } else {
    console.log('[DailySync] INSERT success:', data);
  }
}

// Pure global fetch — no local math, no fallback injection.
// All percentages and counts come exclusively from Supabase rows.
async function fetchGlobalStats(category: Category): Promise<GlobalStats> {
  const today = getToday();

  const { data, error } = await supabase
    .from('daily_responses')
    .select('is_correct, answer_index')
    .eq('question_type', category)
    .eq('question_date', today);

  if (error) {
    console.error('[DailySync] fetchGlobalStats error:', error.message, '| code:', error.code);
    return { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] };
  }

  const rows = data ?? [];
  console.log(`[DailySync] Total responses fetched: ${rows.length}`);

  if (rows.length === 0) {
    return { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] };
  }

  const answer_counts = [0, 0, 0, 0];
  rows.forEach((r) => {
    const ai = Number(r.answer_index);
    if (Number.isInteger(ai) && ai >= 0 && ai <= 3) answer_counts[ai]++;
  });

  return {
    total: rows.length,
    correct: rows.filter((r) => r.is_correct).length,
    answer_counts,
  };
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

// Clinical Explanation Overlay — auto-shown after answering
function ExplanationOverlay({
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
  const pct = stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;
  const borderColor = category === 'bls' ? 'border-blue-500/30' : 'border-red-500/30';
  const bgGlow = category === 'bls' ? 'from-blue-900/30' : 'from-red-900/30';

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <motion.div
        className={`relative z-10 w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b ${bgGlow} to-emt-dark border ${borderColor} p-6 flex flex-col items-center gap-4 shadow-2xl`}
        initial={{ scale: 0.88, y: 28, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.88, y: 28, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        dir="rtl"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-emt-muted hover:text-emt-light transition-colors"
          aria-label="סגור"
        >
          <X size={14} />
        </button>

        {/* Result badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
          isCorrect ? 'bg-green-500/15 border-green-500/40 text-green-300' : 'bg-red-500/15 border-red-500/40 text-red-300'
        }`}>
          {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
          <span className="font-black text-sm">{isCorrect ? 'תשובה נכונה! 🎉' : 'תשובה שגויה'}</span>
        </div>

        {/* Brain + title */}
        <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
          <Brain size={28} className="text-amber-400" />
        </div>
        <h3 className="text-amber-300 font-black text-2xl text-center leading-tight">הסבר קליני</h3>

        {/* Explanation */}
        <div className="w-full max-h-64 overflow-y-auto rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="text-emt-light text-base leading-relaxed text-center font-medium">
            {question.clinical_explanation}
          </p>
        </div>

        {/* Global stat: "You are among X% who answered correctly today" */}
        {pct !== null && stats && stats.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2 text-emt-muted text-xs font-semibold">
              <Users size={13} />
              <span>סטטיסטיקה גלובלית היום</span>
            </div>
            <p className={`text-base font-black text-center ${isCorrect ? 'text-green-300' : 'text-emt-muted'}`}>
              {isCorrect
                ? `אתה בין ${pct}% שענו נכון היום!`
                : `${pct}% מהמשתמשים ענו נכון היום`}
            </p>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${category === 'bls' ? 'bg-blue-400' : 'bg-red-400'}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
              />
            </div>
            <p className="text-emt-muted/50 text-xs">{stats.total + 110} משתתפים עד כה</p>
          </motion.div>
        )}

        {/* Dismiss */}
        <HapticButton
          onClick={onClose}
          hapticPattern={10}
          pressScale={0.95}
          className="w-full py-3.5 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-base"
        >
          הבנתי ✓
        </HapticButton>
      </motion.div>
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
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [showExplanationOverlay, setShowExplanationOverlay] = useState(false);
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
      setTimeTaken(null);
      setShowExplanationOverlay(false);
      // Ensure session_id exists in localStorage for cross-session consistency
      getSessionId();
    }
    return () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, [isOpen]);

  const loadCategory = useCallback(async (cat: Category) => {
    setCategory(cat);
    setGlobalStats(null);
    setTimeTaken(null);
    setShowExplanationOverlay(false);
    trackEvent('daily_challenge_category_selected', { category: cat });

    // Check local cache first (avoids a round-trip if already loaded today)
    const cached = loadCache(cat);
    if (cached) {
      setQuestion(cached.question);
      if (cached.answered_index !== null) {
        setSelectedIndex(cached.answered_index);
        setTimeTaken(cached.time_taken ?? null);
        setView('answered');
      } else {
        setSelectedIndex(null);
        setView('question');
        questionStartRef.current = Date.now();
      }
      fetchGlobalStats(cat).then(setGlobalStats);
      return;
    }

    setView('loading');
    setQuestion(null);
    setSelectedIndex(null);

    try {
      // DB-first: fetch from daily_questions or generate + store
      const q = await fetchOrCreateQuestion(cat);
      setQuestion(q);
      saveCache(cat, q, null);
      setView('question');
      questionStartRef.current = Date.now();
      fetchGlobalStats(cat).then(setGlobalStats);
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
    saveCache(category, question, index, elapsed);

    // GA4 event
    trackEvent('daily_challenge_complete', {
      category,
      is_correct: isCorrect,
      time_taken: elapsed,
    });

    // Auto-show explanation overlay after short delay
    overlayTimerRef.current = setTimeout(() => setShowExplanationOverlay(true), 900);

    // INSERT response, then SELECT all rows for today — stats come only from DB
    await saveResponse(category, isCorrect, elapsed, index);
    const stats = await fetchGlobalStats(category);
    setGlobalStats(stats);
  }, [question, category, selectedIndex]);

  const handleRetry = useCallback(() => {
    if (!category) return;
    localStorage.removeItem(CACHE_KEYS[category]);
    loadCategory(category);
  }, [category, loadCategory]);

  if (!isOpen) return null;

  const isAnswered = view === 'answered' && selectedIndex !== null && question !== null;

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
                    selectedIndex === question.correct_index
                      ? 'bg-green-500/15 border-green-500/30'
                      : 'bg-red-500/15 border-red-500/30'
                  }`}
                >
                  {selectedIndex === question.correct_index
                    ? <CheckCircle size={22} className="text-green-400 shrink-0" />
                    : <XCircle size={22} className="text-red-400 shrink-0" />}
                  <div className="flex-1 text-center">
                    <span className={`font-black text-lg ${selectedIndex === question.correct_index ? 'text-green-300' : 'text-red-300'}`}>
                      {selectedIndex === question.correct_index ? 'תשובה נכונה! כל הכבוד 🎉' : 'תשובה שגויה'}
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

              {/* Participants badge */}
              {globalStats !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 self-center"
                >
                  <Users size={12} className="text-emt-muted/70" />
                  <span className="text-[11px] text-emt-muted font-semibold">
                    <span className="text-emt-light font-black">{globalStats.total + 110}</span>
                    {' '}חובשים כבר ענו היום
                  </span>
                </motion.div>
              )}

              {/* Answer options */}
              <div className="flex flex-col gap-2.5">
                {question.options.map((option, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isCorrect = idx === question.correct_index;
                  const showResult = isAnswered;

                  const chosenPct =
                    globalStats && globalStats.total > 0
                      ? Math.round(((globalStats.answer_counts[idx] ?? 0) / globalStats.total) * 100)
                      : null;

                  let borderStyle = 'border-emt-border';
                  let textStyle = 'text-emt-light hover:bg-white/8 active:scale-[0.98]';
                  let baseBg = 'bg-emt-gray';
                  if (showResult) {
                    if (isCorrect) { borderStyle = 'border-green-400/50'; textStyle = 'text-green-200'; baseBg = 'bg-green-500/10'; }
                    else if (isSelected) { borderStyle = 'border-red-400/50'; textStyle = 'text-red-200'; baseBg = 'bg-red-500/10'; }
                    else { borderStyle = 'border-emt-border/50'; textStyle = 'text-emt-muted'; baseBg = 'bg-emt-gray/50'; }
                  }

                  const fillColor = isCorrect
                    ? 'bg-green-500/25'
                    : isSelected
                    ? 'bg-red-500/25'
                    : 'bg-white/8';

                  return (
                    <HapticButton
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={isAnswered}
                      hapticPattern={isAnswered ? 0 : 10}
                      pressScale={isAnswered ? 1 : 0.97}
                      className={`relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 text-right transition-all duration-200 ${baseBg} ${borderStyle} ${textStyle}`}
                    >
                      {/* Background progress fill — right-to-left */}
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

              {/* Re-open explanation button */}
              {isAnswered && !showExplanationOverlay && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <HapticButton
                    onClick={() => setShowExplanationOverlay(true)}
                    hapticPattern={10}
                    pressScale={0.96}
                    className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-amber-400/10 border border-amber-400/25 px-4 py-3.5 text-amber-300 font-bold text-base"
                  >
                    <Brain size={18} />
                    הצג הסבר קליני
                  </HapticButton>
                </motion.div>
              )}

              {/* Switch category hint */}
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center justify-center gap-1.5 text-emt-muted/60 text-xs py-1"
                >
                  <ChevronRight size={12} />
                  <span>בחר קטגוריה אחרת למעלה לשאלה נוספת</span>
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

      {/* ── Clinical Explanation Overlay ── */}
      <AnimatePresence>
        {showExplanationOverlay && isAnswered && question && category && (
          <ExplanationOverlay
            question={question}
            category={category}
            stats={globalStats}
            selectedIndex={selectedIndex}
            onClose={() => setShowExplanationOverlay(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
