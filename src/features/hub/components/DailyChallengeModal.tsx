import { useState, useEffect, useCallback } from 'react';
import { X, Trophy, RefreshCw, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';

interface Question {
  level: 'BLS' | 'ALS';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

type AnswerState = number | null;

function getGeminiModel() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not defined');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

const PROMPT = `
Generate exactly 2 multiple-choice medical questions in Hebrew for Israeli paramedic/EMT training.
One question must be BLS level (basic life support), one must be ALS level (advanced life support).
Each question must have exactly 4 answer options (A, B, C, D).

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation, just JSON):
[
  {
    "level": "BLS",
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correctIndex": 0,
    "explanation": "..."
  },
  {
    "level": "ALS",
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correctIndex": 2,
    "explanation": "..."
  }
]

Rules:
- All text must be in Hebrew
- Questions must be clinically accurate and relevant to Israeli EMS protocols
- Vary difficulty: BLS = first responder level, ALS = paramedic level
- explanation should be 1-2 sentences explaining why the correct answer is right
- correctIndex is 0-based (0 = first option)
- Do not use the same question twice
`;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function DailyChallengeModal({ isOpen, onClose }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [answers, setAnswers] = useState<[AnswerState, AnswerState]>([null, null]);
  const [revealed, setRevealed] = useState<[boolean, boolean]>([false, false]);

  useModalBackHandler(isOpen, onClose);

  const fetchQuestions = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    setAnswers([null, null]);
    setRevealed([false, false]);
    try {
      const model = getGeminiModel();
      const result = await model.generateContent(PROMPT);
      const text = result.response.text().trim();
      // Strip possible markdown code fences
      const json = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      const parsed: Question[] = JSON.parse(json);
      if (!Array.isArray(parsed) || parsed.length < 2) {
        throw new Error('Invalid response format from AI');
      }
      setQuestions(parsed.slice(0, 2));
      setStatus('ready');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setErrorMsg(msg);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (isOpen && status === 'idle') {
      fetchQuestions();
    }
  }, [isOpen, status, fetchQuestions]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setQuestions([]);
      setAnswers([null, null]);
      setRevealed([false, false]);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAnswer = (qIdx: 0 | 1, optIdx: number) => {
    if (revealed[qIdx]) return;
    setAnswers(prev => {
      const next: [AnswerState, AnswerState] = [...prev] as [AnswerState, AnswerState];
      next[qIdx] = optIdx;
      return next;
    });
    setRevealed(prev => {
      const next: [boolean, boolean] = [...prev] as [boolean, boolean];
      next[qIdx] = true;
      return next;
    });
  };

  const levelColor: Record<string, string> = {
    BLS: 'text-sky-400',
    ALS: 'text-amber-400',
  };
  const levelBorder: Record<string, string> = {
    BLS: 'border-sky-400/40',
    ALS: 'border-amber-400/40',
  };
  const levelBg: Record<string, string> = {
    BLS: 'bg-sky-400/10',
    ALS: 'bg-amber-400/10',
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark overflow-hidden">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-yellow-400/20 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center">
            <Trophy size={20} className="text-yellow-400" />
          </div>
          <div>
            <h2 className="text-gray-900 dark:text-emt-light font-bold text-lg leading-tight">האתגר היומי</h2>
            <p className="text-gray-500 dark:text-emt-muted text-xs">BLS + ALS · שאלות יומיות</p>
          </div>
        </div>
        <HapticButton
          onClick={onClose}
          pressScale={0.88}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border flex items-center justify-center text-gray-500 dark:text-emt-muted"
          aria-label="סגור"
        >
          <X size={20} />
        </HapticButton>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

        {/* Loading */}
        {status === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
            <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
              <Loader2 size={32} className="text-yellow-400 animate-spin" />
            </div>
            <p className="text-gray-500 dark:text-emt-muted text-sm">טוען שאלות יומיות...</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <div>
              <p className="text-gray-900 dark:text-emt-light font-bold text-base mb-1">שגיאה בטעינת השאלות</p>
              <p className="text-gray-500 dark:text-emt-muted text-sm leading-relaxed">{errorMsg}</p>
            </div>
            <HapticButton
              onClick={fetchQuestions}
              pressScale={0.94}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 font-bold text-sm"
            >
              <RefreshCw size={16} />
              נסה שנית
            </HapticButton>
          </div>
        )}

        {/* Questions */}
        {status === 'ready' && questions.map((q, qIdx) => {
          const isRevealed = revealed[qIdx as 0 | 1];
          const selectedIdx = answers[qIdx as 0 | 1];
          const isCorrect = selectedIdx === q.correctIndex;

          return (
            <div
              key={qIdx}
              className={`rounded-2xl border ${levelBorder[q.level]} ${levelBg[q.level]} p-4 flex flex-col gap-3`}
            >
              {/* Level badge + question */}
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${levelBorder[q.level]} ${levelBg[q.level]} ${levelColor[q.level]}`}>
                  {q.level}
                </span>
                {isRevealed && (
                  isCorrect
                    ? <span className="text-xs font-bold text-emerald-400">תשובה נכונה!</span>
                    : <span className="text-xs font-bold text-red-400">תשובה שגויה</span>
                )}
              </div>
              <p className="text-gray-900 dark:text-emt-light font-semibold text-base leading-snug text-right">
                {q.question}
              </p>

              {/* Options */}
              <div className="flex flex-col gap-2">
                {q.options.map((opt, optIdx) => {
                  let btnClass = 'w-full text-right px-4 py-3 rounded-xl border text-sm font-medium transition-all ';
                  if (!isRevealed) {
                    btnClass += 'border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray text-gray-800 dark:text-emt-light active:scale-98';
                  } else if (optIdx === q.correctIndex) {
                    btnClass += 'border-emerald-400/50 bg-emerald-400/10 text-emerald-400';
                  } else if (optIdx === selectedIdx) {
                    btnClass += 'border-red-400/50 bg-red-400/10 text-red-400';
                  } else {
                    btnClass += 'border-gray-200/30 dark:border-emt-border/30 bg-white/30 dark:bg-emt-gray/30 text-gray-400 dark:text-emt-muted opacity-60';
                  }

                  return (
                    <HapticButton
                      key={optIdx}
                      onClick={() => handleAnswer(qIdx as 0 | 1, optIdx)}
                      disabled={isRevealed}
                      pressScale={isRevealed ? 1 : 0.97}
                      className={btnClass}
                    >
                      <span className="flex items-center gap-2 justify-end">
                        {isRevealed && optIdx === q.correctIndex && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
                        {isRevealed && optIdx === selectedIdx && optIdx !== q.correctIndex && <XCircle size={16} className="text-red-400 shrink-0" />}
                        {opt}
                      </span>
                    </HapticButton>
                  );
                })}
              </div>

              {/* Explanation */}
              {isRevealed && (
                <div className="mt-1 p-3 rounded-xl bg-white/50 dark:bg-emt-gray/50 border border-gray-200/50 dark:border-emt-border/50">
                  <p className="text-gray-600 dark:text-emt-muted text-xs leading-relaxed text-right">
                    💡 {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Refresh button once both answered */}
        {status === 'ready' && revealed[0] && revealed[1] && (
          <HapticButton
            onClick={fetchQuestions}
            pressScale={0.94}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 font-bold text-base mt-2"
          >
            <RefreshCw size={18} />
            אתגר חדש
          </HapticButton>
        )}
      </div>
    </div>
  );
}
