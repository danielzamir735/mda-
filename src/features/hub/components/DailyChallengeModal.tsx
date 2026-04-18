import { useState, useEffect, useCallback } from 'react';
import { X, Trophy, Zap, Brain, CheckCircle, XCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackEvent } from '../../../utils/analytics';
import HapticButton from '../../../components/HapticButton';

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'bls' | 'als';
type ViewState = 'select' | 'loading' | 'question' | 'answered' | 'error';

interface Question {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface DayCache {
  date: string;
  question: Question;
  answered_index: number | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);

const CACHE_KEYS: Record<Category, string> = {
  bls: 'daily_challenge_bls',
  als: 'daily_challenge_als',
};

const CATEGORY_LABELS: Record<Category, string> = {
  bls: 'BLS',
  als: 'ALS',
};

const CATEGORY_FULL: Record<Category, string> = {
  bls: 'החייאה בסיסית',
  als: 'החייאה מתקדמת',
};

const PROMPTS: Record<Category, string> = {
  bls:
    'אתה מומחה להכשרת חובשים בישראל. צור שאלת בחינה עם בחירה מרובה בעברית על BLS (Basic Life Support) — שרשרת ההישרדות, CPR, AED, חסימת דרכי אוויר, החייאת ילדים/תינוקות.\n' +
    'החזר *אך ורק* JSON תקני ללא פורמט markdown, ללא ```json, בדיוק כך:\n' +
    '{"question":"...","options":["...","...","...","..."],"correct_index":0,"explanation":"..."}\n' +
    'correct_index הוא אינדקס (0-3) של התשובה הנכונה. explanation: שורה-שתיים בעברית.',
  als:
    'אתה מומחה להכשרת פרמדיקים בישראל. צור שאלת בחינה עם בחירה מרובה בעברית על ALS (Advanced Life Support) — ACLS, קצבים לב, מינוני תרופות (אדרנלין, אמיודרון, אטרופין), RSI, ניהול דרכי אוויר מתקדם, ST elevation.\n' +
    'החזר *אך ורק* JSON תקני ללא פורמט markdown, ללא ```json, בדיוק כך:\n' +
    '{"question":"...","options":["...","...","...","..."],"correct_index":0,"explanation":"..."}\n' +
    'correct_index הוא אינדקס (0-3) של התשובה הנכונה. explanation: שורה-שתיים בעברית.',
};

// ─── Cache helpers ────────────────────────────────────────────────────────────

function loadCache(cat: Category): DayCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEYS[cat]);
    if (!raw) return null;
    const parsed: DayCache = JSON.parse(raw);
    return parsed.date === TODAY ? parsed : null;
  } catch {
    return null;
  }
}

function saveCache(cat: Category, question: Question, answered_index: number | null) {
  const cache: DayCache = { date: TODAY, question, answered_index };
  localStorage.setItem(CACHE_KEYS[cat], JSON.stringify(cache));
}

// ─── Gemini helper ────────────────────────────────────────────────────────────

function getModel() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not defined in .env.local');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

async function fetchQuestion(cat: Category): Promise<Question> {
  const model = getModel();
  const result = await model.generateContent(PROMPTS[cat]);
  const raw = result.response.text().trim();
  const clean = raw.replace(/^```(?:json)?/m, '').replace(/```$/m, '').trim();
  const parsed = JSON.parse(clean) as Question;
  if (
    typeof parsed.question !== 'string' ||
    !Array.isArray(parsed.options) ||
    parsed.options.length !== 4 ||
    typeof parsed.correct_index !== 'number' ||
    typeof parsed.explanation !== 'string'
  ) {
    throw new Error('Invalid question format from AI');
  }
  return parsed;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryBadge({ cat, active, onClick }: { cat: Category; active: boolean; onClick: () => void }) {
  const colors = {
    bls: active
      ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30'
      : 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    als: active
      ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/30'
      : 'bg-red-500/10 border-red-500/30 text-red-300',
  };

  return (
    <HapticButton
      onClick={onClick}
      hapticPattern={10}
      pressScale={0.94}
      className={`flex-1 py-3 rounded-2xl border font-black text-lg transition-all duration-200 ${colors[cat]}`}
    >
      <span className="block text-lg font-black">{CATEGORY_LABELS[cat]}</span>
      <span className={`block text-[11px] font-semibold mt-0.5 ${active ? 'text-white/80' : 'opacity-60'}`}>
        {CATEGORY_FULL[cat]}
      </span>
    </HapticButton>
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

  useEffect(() => {
    if (isOpen) {
      trackEvent('daily_challenge_modal_opened');
      setCategory(null);
      setView('select');
      setQuestion(null);
      setSelectedIndex(null);
    }
  }, [isOpen]);

  const loadCategory = useCallback(async (cat: Category) => {
    setCategory(cat);
    trackEvent('daily_challenge_category_selected', { category: cat });

    const cached = loadCache(cat);
    if (cached) {
      setQuestion(cached.question);
      if (cached.answered_index !== null) {
        setSelectedIndex(cached.answered_index);
        setView('answered');
      } else {
        setView('question');
      }
      return;
    }

    setView('loading');
    setQuestion(null);
    setSelectedIndex(null);

    try {
      const q = await fetchQuestion(cat);
      setQuestion(q);
      saveCache(cat, q, null);
      setView('question');
    } catch (err) {
      console.error('[DailyChallengeModal] fetch error:', err);
      setView('error');
    }
  }, []);

  const handleAnswer = useCallback((index: number) => {
    if (!question || !category || selectedIndex !== null) return;

    const isCorrect = index === question.correct_index;
    setSelectedIndex(index);
    setView('answered');
    saveCache(category, question, index);

    trackEvent('daily_challenge_answered', {
      category,
      is_correct: isCorrect,
    });
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

        {/* Category selector — always visible */}
        <div dir="rtl" className="flex gap-3">
          <CategoryBadge
            cat="bls"
            active={category === 'bls'}
            onClick={() => loadCategory('bls')}
          />
          <CategoryBadge
            cat="als"
            active={category === 'als'}
            onClick={() => loadCategory('als')}
          />
        </div>

        <AnimatePresence mode="wait">

          {/* ── No category selected yet ── */}
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
                בחר קטגוריה כדי לקבל את שאלת היום שלך
              </p>
              <div className="flex items-center gap-1.5 text-amber-400/60 text-xs">
                <Zap size={12} />
                <span>שאלה חדשה כל יום</span>
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
              <p className="text-emt-muted text-sm font-semibold">מכין את שאלת היום...</p>
              <p className="text-emt-muted/50 text-xs">
                {category ? `${CATEGORY_LABELS[category]} — ${CATEGORY_FULL[category]}` : ''}
              </p>
            </motion.div>
          )}

          {/* ── Question or Answered ── */}
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
              {/* Already answered banner */}
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 border ${
                    selectedIndex === question.correct_index
                      ? 'bg-green-500/15 border-green-500/30'
                      : 'bg-red-500/15 border-red-500/30'
                  }`}
                >
                  {selectedIndex === question.correct_index ? (
                    <CheckCircle size={22} className="text-green-400 shrink-0" />
                  ) : (
                    <XCircle size={22} className="text-red-400 shrink-0" />
                  )}
                  <span className={`font-black text-base ${selectedIndex === question.correct_index ? 'text-green-300' : 'text-red-300'}`}>
                    {selectedIndex === question.correct_index ? 'תשובה נכונה! כל הכבוד 🎉' : 'תשובה שגויה'}
                  </span>
                </motion.div>
              )}

              {/* Question card */}
              <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide ${
                    category === 'bls' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {category ? CATEGORY_LABELS[category] : ''}
                  </div>
                  {isAnswered && (
                    <div className="flex items-center gap-1 text-amber-400/60 text-[11px]">
                      <Trophy size={11} />
                      <span>ענית היום</span>
                    </div>
                  )}
                </div>
                <p className="text-emt-light font-bold text-lg leading-snug">
                  {question.question}
                </p>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2.5">
                {question.options.map((option, idx) => {
                  const isSelected = selectedIndex === idx;
                  const isCorrect = idx === question.correct_index;
                  const showResult = isAnswered;

                  let style =
                    'bg-emt-gray border-emt-border text-emt-light hover:bg-white/8 active:scale-[0.98]';

                  if (showResult) {
                    if (isCorrect) {
                      style = 'bg-green-500/15 border-green-400/50 text-green-200';
                    } else if (isSelected && !isCorrect) {
                      style = 'bg-red-500/15 border-red-400/50 text-red-200';
                    } else {
                      style = 'bg-emt-gray/50 border-emt-border/50 text-emt-muted';
                    }
                  }

                  return (
                    <HapticButton
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={isAnswered}
                      hapticPattern={isAnswered ? 0 : 10}
                      pressScale={isAnswered ? 1 : 0.97}
                      className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-right transition-all duration-200 ${style}`}
                    >
                      <span className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-black border ${
                        showResult && isCorrect
                          ? 'bg-green-500/30 border-green-400/60 text-green-300'
                          : showResult && isSelected && !isCorrect
                          ? 'bg-red-500/30 border-red-400/60 text-red-300'
                          : 'bg-white/8 border-white/15 text-emt-muted'
                      }`}>
                        {['א', 'ב', 'ג', 'ד'][idx]}
                      </span>
                      <span className="flex-1 text-sm font-semibold leading-snug">{option}</span>
                      {showResult && isCorrect && <CheckCircle size={16} className="text-green-400 shrink-0" />}
                      {showResult && isSelected && !isCorrect && <XCircle size={16} className="text-red-400 shrink-0" />}
                    </HapticButton>
                  );
                })}
              </div>

              {/* Explanation (shown after answering) */}
              <AnimatePresence>
                {isAnswered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-2xl bg-amber-400/8 border border-amber-400/25 p-4 flex gap-3">
                      <Brain size={18} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-300 font-bold text-sm mb-1">הסבר</p>
                        <p className="text-emt-muted text-sm leading-relaxed">{question.explanation}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Switch category hint */}
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
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

        {/* Disclaimer */}
        <p className="text-center text-[10px] text-emt-muted/40 px-4 leading-relaxed pb-2">
          השאלות מיוצרות על ידי AI למטרות לימוד בלבד. אינן תחליף להכשרה מקצועית מוסמכת.
        </p>
      </div>
    </div>
  );
}
