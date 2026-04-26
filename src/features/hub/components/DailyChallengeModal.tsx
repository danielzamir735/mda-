import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Trophy, Zap, Brain, CheckCircle, XCircle, RefreshCw, Users, Clock, Share2 } from 'lucide-react';
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

function getToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const CACHE_KEYS: Record<Category, string> = {
  bls: 'daily_challenge_bls_v6',
  als: 'daily_challenge_als_v6',
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
  const focus =
    type === 'BLS'
      ? 'FOCUS DOMAIN: Strictly BLS territory — rotate across ALL of the following domains. STRICT DIVERSITY RULE: no more than 20% of questions may be pure CPR/arrest; you MUST cycle through: (1) Trauma — hemorrhage control (tourniquet timing, wound packing, junctional bleed), fracture management, spinal motion restriction decisions, blast/crush injury; (2) Respiratory Distress — Asthma/bronchospasm, Anaphylaxis/severe allergic reaction (epi timing, positioning, repeat dosing), foreign body airway obstruction, pediatric croup vs epiglottitis recognition; (3) Environmental emergencies — heat stroke vs heat exhaustion, hypothermia management, drowning/submersion, lightning strike sequence; (4) Medical — diabetic emergencies (hypo vs hyper differentiation), seizure management, stroke recognition (FAST + field protocol), syncope differentials; (5) CPR/AED — pad placement traps, hypothermic arrest timing, wet chest shock risk, infant vs child depth, ROSC recognition. Generate each question from a DIFFERENT domain than the previous. The challenge must live in the NUANCES and TRAPS — the contraindicated-but-looks-right action, the co-morbidity that inverts standard care. No ALS drugs, no advanced airways, no 12-lead interpretation.'
      : 'FOCUS DOMAIN: Strictly ALS territory — rotate across ALL of the following domains. STRICT DIVERSITY RULE: no more than 20% of questions may be pure CPR/cardiac arrest; you MUST cycle through: (1) Arrhythmias — Tachyarrhythmias (SVT, Afib RVR, VT with pulse, pre-excited AF), Bradyarrhythmias (complete heart block, sick sinus, high-degree AV block, transcutaneous pacing thresholds and capture verification), distinguishing stable vs unstable; (2) Cardiac beyond arrest — Acute Coronary Syndrome (STEMI mimics, posterior MI, RV infarct contraindications, door-to-balloon decisions), acute decompensated heart failure (CPAP, nitrate titration, avoiding intubation), hypertensive emergency end-organ damage; (3) Pharmacology traps — adenosine in pre-excited AF (LETHAL), amiodarone vs lidocaine selection, calcium vs bicarbonate in hyperkalemia, nitro in inferior MI with RV involvement, atropine failure indications; (4) Post-ROSC management — targeted temperature, hemodynamic targets, airway decisions, reversible causes (H&Ts) systematic approach; (5) Complex pharmacology — dose, route, timing, interactions, contraindications under field conditions. Generate each question from a DIFFERENT domain than the previous. The challenge must live in decision-making under uncertainty — the exception to the rule, the hidden drug interaction, the borderline vital that changes everything.';

  return (
    `You are a world-class Emergency Medical Educator. Your goal is to CHALLENGE the user — create HIGHLY TRICKY clinical scenarios for ${type} in Hebrew.\n\n` +
    `MISSION: Write a BRUTALLY DIFFICULT extreme clinical scenario — a rare edge case where every standard protocol instinct leads the provider straight to patient death. Target the EXCEPTION to the rule, the contraindicated-but-looks-right action, the protocol conflict that requires elite judgment. Embed a single lethal detail (a hidden drug interaction, a borderline vital that changes everything, a co-morbidity that inverts standard care, a timing window that has already closed) that transforms the correct answer into the OPPOSITE of the obvious choice. The scenario must be 2-4 Hebrew sentences, written as a real-time radio report or bystander handoff — urgent, specific, visceral. NEVER write a standard protocol question. If a junior provider can answer it correctly on instinct, rewrite it.\n\n` +
    `${focus}\n\n` +
    'OPTIONS: Exactly 4 answer options in Hebrew. Each option is ONE complete, decisive clinical action sentence of 15-25 Hebrew words. Format: "[Verb] [specific action / drug-dose-route / energy or device setting] [clinical context]". NO option may be a hedging or vague answer.\n' +
    'THE TRAP — DISTRACTOR RULES: At least TWO of the wrong options must be COMMON MISTAKES or OUTDATED PROTOCOLS (pre-2020 practice, old ACLS dose, deprecated sequence). One wrong option must be a textbook-sounding answer that IGNORES the subtle twist in the scenario. Exactly ONE option follows current AHA 2026 / PHTLS 9th / Israeli MDA protocol precisely. All distractors must be plausible to a junior provider — zero obviously wrong answers.\n\n' +
    'CLINICAL EXPLANATION: Exactly 3-4 concise Hebrew sentences, total under 60 words: (1) Name the specific 2026 guideline/chapter that applies. (2) Explain the physiological mechanism making the correct action superior here. (3) Dissect the most tempting distractor and the SPECIFIC harm it causes. (4) End with one pearl that separates elite providers from average ones.\n\n' +
    'ACCURACY: Every drug dose, joule setting, rate threshold, and time window must match AHA 2026 / PHTLS 9th Edition / current Israeli MDA protocols EXACTLY. No approximations.\n\n' +
    'Output ONLY valid JSON, no prose, no markdown: { "question": string, "options": string[], "correct_index": number, "clinical_explanation": string }'
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
  localStorage.setItem(
    CACHE_KEYS[cat],
    JSON.stringify({ date: getToday(), question, answered_index, time_taken }),
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

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1500): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < retries) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

async function fetchOrCreateQuestion(cat: Category): Promise<Question> {
  const today = getToday();

  const existing = await withRetry(async () => {
    const { data, error } = await supabase
      .from('daily_questions')
      .select('*')
      .eq('question_date', today)
      .eq('question_type', cat)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

  if (existing?.content) return parseQuestionContent(existing.content as Question);

  const generated = await withRetry(() => generateQuestion(cat));

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

async function saveResponse(
  category: Category,
  is_correct: boolean,
  time_taken: number,
  answer_index: number,
): Promise<void> {
  const full = {
    session_id: getSessionId(),
    question_type: category,
    question_date: getToday(),
    is_correct,
    time_taken,
    answer_index: Number(answer_index),
  };
  const { error } = await supabase.from('daily_responses').insert(full);
  if (!error) return;

  // Fallback — legacy schema missing is_correct / time_taken columns.
  if (/column .* does not exist/i.test(error.message)) {
    const minimal = {
      session_id: full.session_id,
      question_type: full.question_type,
      question_date: full.question_date,
      answer_index: full.answer_index,
    };
    const { error: fallbackErr } = await supabase.from('daily_responses').insert(minimal);
    if (fallbackErr) console.error('[DailySync] INSERT fallback error:', fallbackErr.message);
    return;
  }

  console.error('[DailySync] INSERT error:', error.message);
}

const STATS_CACHE_KEY: Record<Category, string> = {
  bls: 'daily_stats_bls_v1',
  als: 'daily_stats_als_v1',
};

function loadCachedStats(cat: Category): GlobalStats | null {
  try {
    const raw = localStorage.getItem(STATS_CACHE_KEY[cat]);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { date: string; stats: GlobalStats };
    return parsed.date === getToday() ? parsed.stats : null;
  } catch {
    return null;
  }
}

function saveCachedStats(cat: Category, stats: GlobalStats) {
  try {
    localStorage.setItem(STATS_CACHE_KEY[cat], JSON.stringify({ date: getToday(), stats }));
  } catch {
    /* noop */
  }
}

async function fetchGlobalStats(
  category: Category,
  correctIndex: number | null,
  retries = 2,
): Promise<{ stats: GlobalStats; offline: boolean }> {
  const today = getToday();
  const emptyStats: GlobalStats = { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] };

  for (let attempt = 0; attempt <= retries; attempt++) {
    const { data, error } = await supabase
      .from('daily_responses')
      .select('answer_index')
      .eq('question_type', category)
      .eq('question_date', today);

    if (!error) {
      const rows = data ?? [];
      const answer_counts = [0, 0, 0, 0];
      let correct = 0;
      rows.forEach((r) => {
        const ai = Number(r.answer_index);
        if (Number.isInteger(ai) && ai >= 0 && ai <= 3) {
          answer_counts[ai]++;
          if (correctIndex !== null && ai === correctIndex) correct++;
        }
      });
      const stats: GlobalStats = { total: rows.length, correct, answer_counts };
      saveCachedStats(category, stats);
      return { stats, offline: false };
    }

    console.error(`[DailySync] fetchGlobalStats error (attempt ${attempt + 1}):`, error.message);
    if (attempt < retries) await new Promise((r) => setTimeout(r, 2000));
  }

  const cached = loadCachedStats(category);
  return { stats: cached ?? emptyStats, offline: true };
}

// ─── Share helper ─────────────────────────────────────────────────────────────

async function shareChallengeResult(timeTaken: number): Promise<void> {
  const text = `הצלחתי לפתור את האתגר היומי של 'חובש +' תוך ${timeTaken} שניות! בוא נראה אותך... 🏆`;
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  const shareData: ShareData = { title: 'חובש +', text, url };

  try {
    if (navigator.share && navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
      return;
    }
  } catch {
    /* fall through to clipboard */
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
  } catch {
    /* noop */
  }
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
  selectedIndex,
  onClose,
}: {
  question: Question;
  category: Category;
  selectedIndex: number;
  onClose: () => void;
}) {
  const isCorrect = selectedIndex === question.correct_index;
  const accentBorder = category === 'bls' ? 'border-blue-500/30' : 'border-red-500/30';
  const accentBg = category === 'bls' ? 'from-blue-900/20' : 'from-red-900/20';

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      dir="rtl"
    >
      <motion.div
        className="w-full max-w-md rounded-3xl bg-emt-dark border border-emt-border overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-3.5 py-2.5 border-b border-emt-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
              <Brain size={15} className="text-amber-400" />
            </div>
            <h2 className="text-amber-300 font-black text-base leading-none">הסבר קליני</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emt-gray border border-emt-border flex items-center justify-center text-emt-muted hover:text-emt-light active:scale-90 transition"
            aria-label="סגור"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 flex flex-col gap-2.5">
          <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black self-center ${
            isCorrect
              ? 'bg-green-500/15 border-green-500/40 text-green-300'
              : 'bg-red-500/15 border-red-500/40 text-red-300'
          }`}>
            {isCorrect ? <CheckCircle size={13} /> : <XCircle size={13} />}
            <span>{isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה'}</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className={`rounded-2xl bg-gradient-to-b ${accentBg} to-emt-dark border ${accentBorder} p-3.5`}
          >
            <p className="text-emt-light text-[14px] leading-[1.65] font-medium text-right">
              {question.clinical_explanation}
            </p>
          </motion.div>

          <HapticButton
            onClick={onClose}
            hapticPattern={10}
            pressScale={0.96}
            className="w-full py-3 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-sm"
          >
            הבנתי ✓
          </HapticButton>
        </div>
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
  const [isStatsOffline, setIsStatsOffline] = useState(false);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const questionStartRef = useRef<number | null>(null);

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
      setShareFeedback(null);
      getSessionId();
    }
  }, [isOpen]);

  // Live counter sync — realtime subscription + 30s reconciliation poll.
  useEffect(() => {
    if (!isOpen || !category) return;
    const correctIdx = question?.correct_index ?? null;
    const today = getToday();

    const channel = supabase
      .channel(`daily_responses:${category}:${today}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'daily_responses',
          filter: `question_date=eq.${today}`,
        },
        (payload) => {
          const row = payload.new as { question_type?: string; answer_index?: number };
          if (row.question_type !== category) return;
          const ai = Number(row.answer_index);
          setGlobalStats((prev) => {
            const base = prev ?? { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] };
            const counts = [...base.answer_counts];
            if (Number.isInteger(ai) && ai >= 0 && ai <= 3) counts[ai] = (counts[ai] ?? 0) + 1;
            return {
              total: base.total + 1,
              correct: base.correct + (correctIdx !== null && ai === correctIdx ? 1 : 0),
              answer_counts: counts,
            };
          });
          setIsStatsOffline(false);
        },
      )
      .subscribe();

    const id = setInterval(() => {
      fetchGlobalStats(category, correctIdx).then(({ stats, offline }) => {
        setGlobalStats((prev) => {
          const prevTotal = prev?.total ?? 0;
          if (stats.total < prevTotal) return prev;
          return stats;
        });
        setIsStatsOffline(offline);
      });
    }, 30000);

    return () => {
      clearInterval(id);
      supabase.removeChannel(channel);
    };
  }, [isOpen, category, question?.correct_index]);

  // Midnight rollover — reset to category-select when the calendar day changes.
  useEffect(() => {
    if (!isOpen) return;
    const startDay = getToday();
    const id = setInterval(() => {
      if (getToday() !== startDay) {
        if (category) {
          localStorage.removeItem(CACHE_KEYS[category]);
          localStorage.removeItem(STATS_CACHE_KEY[category]);
        }
        setCategory(null);
        setView('select');
        setQuestion(null);
        setSelectedIndex(null);
        setGlobalStats(null);
        setIsStatsOffline(false);
        setTimeTaken(null);
        setShowExplanation(false);
      }
    }, 60000);
    return () => clearInterval(id);
  }, [isOpen, category]);

  const loadCategory = useCallback(async (cat: Category) => {
    setCategory(cat);
    setShowExplanation(false);
    const seeded = loadCachedStats(cat);
    setGlobalStats(seeded);
    setIsStatsOffline(false);
    trackEvent('daily_challenge_category_selected', { category: cat });

    const cached = loadCache(cat);
    if (cached) {
      setQuestion(cached.question);
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
      fetchGlobalStats(cat, cached.question.correct_index).then(({ stats, offline }) => {
        setGlobalStats((prev) => (prev && stats.total < prev.total ? prev : stats));
        setIsStatsOffline(offline);
      });
      return;
    }

    setView('loading');
    setQuestion(null);
    setSelectedIndex(null);
    setTimeTaken(null);

    try {
      const q = await fetchOrCreateQuestion(cat);
      setQuestion(q);
      saveCache(cat, q, null);
      setView('question');
      questionStartRef.current = Date.now();
      fetchGlobalStats(cat, q.correct_index).then(({ stats, offline }) => {
        setGlobalStats((prev) => (prev && stats.total < prev.total ? prev : stats));
        setIsStatsOffline(offline);
      });
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

    // Optimistic local bump
    setGlobalStats((prev) => {
      const base = prev ?? { total: 0, correct: 0, answer_counts: [0, 0, 0, 0] };
      const next_counts = [...base.answer_counts];
      next_counts[index] = (next_counts[index] ?? 0) + 1;
      return {
        total: base.total + 1,
        correct: base.correct + (isCorrect ? 1 : 0),
        answer_counts: next_counts,
      };
    });
    setIsStatsOffline(false);

    trackEvent('daily_challenge_complete', { category, is_correct: isCorrect, time_taken: elapsed });

    await saveResponse(category, isCorrect, elapsed, index);
    const { stats, offline } = await fetchGlobalStats(category, question.correct_index);
    setGlobalStats((prev) => (prev && stats.total < prev.total ? prev : stats));
    setIsStatsOffline(offline);
  }, [question, category, selectedIndex]);

  const handleRetry = useCallback(() => {
    if (!category) return;
    localStorage.removeItem(CACHE_KEYS[category]);
    loadCategory(category);
  }, [category, loadCategory]);

  if (!isOpen) return null;

  const isAnswered = view === 'answered' && selectedIndex !== null && question !== null;
  const isCorrectAnswer = isAnswered && selectedIndex === question.correct_index;
  const participantCount = (() => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
    }
    const seed = 70 + (hash % 181); // range [70, 250]
    return (globalStats?.total ?? 0) + seed;
  })();

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
                  className={`flex items-center justify-center gap-2.5 rounded-2xl px-4 py-2.5 border ${
                    isCorrectAnswer
                      ? 'bg-green-500/15 border-green-500/30'
                      : 'bg-red-500/15 border-red-500/30'
                  }`}
                >
                  {isCorrectAnswer
                    ? <CheckCircle size={20} className="text-green-400 shrink-0" />
                    : <XCircle size={20} className="text-red-400 shrink-0" />}
                  <div className="flex-1 text-center">
                    <span className={`font-black text-base ${isCorrectAnswer ? 'text-green-300' : 'text-red-300'}`}>
                      {isCorrectAnswer ? 'תשובה נכונה! כל הכבוד 🎉' : 'תשובה שגויה'}
                    </span>
                    {timeTaken !== null && (
                      <div className="flex items-center justify-center gap-1 mt-0.5 text-emt-muted/60 text-[11px]">
                        <Clock size={10} />
                        <span>ענית תוך {timeTaken} שניות</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Participant counter */}
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="self-center flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1.5"
              >
                <Users size={12} className="text-emt-muted shrink-0" />
                <span className="text-[11px] text-emt-muted font-semibold">
                  {isStatsOffline ? 'מתחבר מחדש...' : 'משתתפים היום:'}
                </span>
                <motion.span
                  key={participantCount}
                  initial={{ scale: 0.9, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                  className="text-[12px] font-black text-emt-light tabular-nums"
                >
                  {participantCount.toLocaleString('he-IL')}
                </motion.span>
                {!isStatsOffline && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" title="LIVE" />
                )}
              </motion.div>

              {/* Subtle tricky-questions notice */}
              {!isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-2 rounded-xl bg-orange-500/8 border border-orange-400/25 px-3.5 py-2.5"
                >
                  <span className="text-base leading-none shrink-0">⚠️</span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-orange-300/90 text-sm font-bold leading-snug">
                      שאלות טריקיות — מקרי קיצון
                    </span>
                    <span className="text-orange-200/55 text-xs font-medium leading-snug">
                      קרא היטב את כל התשובות לפני שתענה
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Question card */}
              <div className="rounded-3xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center justify-center gap-2 mb-2.5">
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
                <p className="text-emt-light font-bold text-lg leading-snug text-center">
                  {question.question}
                </p>
              </div>

              {/* Answer options */}
              <div className="flex flex-col gap-2">
                {question.options.map((option, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isCorrect = idx === question.correct_index;
                  const showResult = isAnswered;

                  const rawPct =
                    globalStats && showResult && globalStats.total > 0
                      ? Math.round(((globalStats.answer_counts[idx] ?? 0) / globalStats.total) * 100)
                      : null;
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
                      className={`relative w-full overflow-hidden rounded-2xl border p-4 h-auto min-h-[76px] text-right transition-colors duration-200 ${baseBg} ${borderStyle} ${textStyle}`}
                    >
                      {/* Percentage fill — absolute background layer, never alters box size */}
                      {showResult && chosenPct !== null && (
                        <motion.div
                          className={`absolute inset-0 z-0 rounded-2xl ${fillColor}`}
                          initial={{ scaleX: 0, originX: 1 }}
                          animate={{ scaleX: chosenPct / 100 }}
                          transition={{ duration: 0.6, delay: 0.3 + idx * 0.07, ease: 'easeOut' }}
                          style={{ transformOrigin: 'right' }}
                        />
                      )}
                      <div className="relative z-10 flex items-center gap-3 w-full">
                        <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-black border ${
                          showResult && isCorrect
                            ? 'bg-green-500/30 border-green-400/60 text-green-300'
                            : showResult && isSelected
                            ? 'bg-red-500/30 border-red-400/60 text-red-300'
                            : 'bg-white/8 border-white/15 text-emt-muted'
                        }`}>
                          {['א', 'ב', 'ג', 'ד'][idx]}
                        </span>
                        <span className="flex-1 text-[15px] font-semibold leading-snug break-words min-w-0 text-center">
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
                            {isSelected && <span className="mr-1 font-semibold opacity-80">ענו כמוך</span>}
                          </motion.span>
                        )}
                        {showResult && isCorrect && <CheckCircle size={16} className="text-green-400 shrink-0" />}
                        {showResult && isSelected && !isCorrect && <XCircle size={16} className="text-red-400 shrink-0" />}
                      </div>
                    </HapticButton>
                  );
                })}
              </div>

              {/* Show Clinical Explanation button */}
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
                    className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-amber-400/15 border border-amber-400/35 px-4 py-3 text-amber-300 font-bold text-base"
                  >
                    <Brain size={17} />
                    הצג הסבר קליני
                  </HapticButton>
                </motion.div>
              )}

              {/* Share button */}
              {isAnswered && timeTaken !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <HapticButton
                    onClick={async () => {
                      trackEvent('daily_challenge_share_clicked', { category: category ?? 'unknown', time_taken: timeTaken });
                      await shareChallengeResult(timeTaken);
                      setShareFeedback('הקישור הועתק!');
                      setTimeout(() => setShareFeedback(null), 2200);
                    }}
                    hapticPattern={15}
                    pressScale={0.96}
                    className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-cyan-500/20 border border-emerald-400/35 px-4 py-3 text-emerald-200 font-bold text-base"
                  >
                    <Share2 size={17} />
                    שתף את ההישג שלך
                  </HapticButton>
                  {shareFeedback && (
                    <span className="text-[11px] text-emerald-300/80 font-semibold">{shareFeedback}</span>
                  )}
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
            selectedIndex={selectedIndex}
            onClose={() => setShowExplanation(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
