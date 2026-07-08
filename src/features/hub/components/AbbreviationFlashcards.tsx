import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, CheckCircle, XCircle, RotateCcw, Volume2 } from 'lucide-react';
import HapticButton from '../../../components/HapticButton';
import { ALL_ABBREVIATIONS, type MedicalAbbreviation } from '../data/medicalAbbreviations';
import { useAbbreviationSrsStore, MAX_BOX, type TermProgress } from '../../../store/abbreviationSrsStore';
import { speakEnglish } from '../../../utils/tts';
import { trackEvent } from '../../../utils/analytics';

interface Props {
  onClose: () => void;
}

// כרטיס ש"לא זכרתי" חוזר לחפיסה כעבור מספר כרטיסים — חזרה מרווחת בתוך האימון עצמו
const REINSERT_OFFSET = 3;

// בניית חפיסה עם הטיה לפי קופסת Leitner: מושגים ש"לא זכרתי" (קופסה נמוכה)
// מקבלים מפתח מיון קטן יותר בממוצע ולכן צצים מוקדם ובתדירות גבוהה יותר.
function buildDeck(progress: Record<string, TermProgress>): MedicalAbbreviation[] {
  return ALL_ABBREVIATIONS
    .map((item) => ({ item, key: Math.random() * ((progress[item.id]?.box ?? 0) + 1) }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.item);
}

const CONFETTI_COLORS = ['#EF233C', '#22C55E', '#3B82F6', '#F59E0B', '#A855F7', '#EC4899', '#14B8A6'];

function ConfettiParticle({ x, color, delay, size }: { x: number; color: string; delay: number; size: number }) {
  return (
    <motion.div
      className="absolute top-0 rounded-sm pointer-events-none"
      style={{ left: `${x}%`, backgroundColor: color, width: size, height: size }}
      initial={{ y: -20, opacity: 1, rotate: 0, x: 0 }}
      animate={{ y: '110vh', opacity: [1, 1, 0], rotate: 720, x: (Math.random() - 0.5) * 80 }}
      transition={{ duration: 2.2 + Math.random() * 1.2, delay, ease: 'linear' }}
    />
  );
}

export default function AbbreviationFlashcards({ onClose }: Props) {
  const { progress, markRemembered, markForgotten } = useAbbreviationSrsStore();
  const totalCards = ALL_ABBREVIATIONS.length;

  const [deck, setDeck] = useState<MedicalAbbreviation[]>(() => buildDeck(progress));
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [remembered, setRemembered] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);

  const confettiParticles = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        x: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 1.8,
        size: 6 + Math.random() * 8,
      })),
    [],
  );

  const currentCard = deck[0];
  const currentBox = currentCard ? (progress[currentCard.id]?.box ?? 0) : 0;
  const progressPercent = (remembered / totalCards) * 100;

  const advance = useCallback(
    (didRemember: boolean) => {
      if (!currentCard) return;
      if (didRemember) {
        markRemembered(currentCard.id);
        const newDeck = deck.slice(1);
        const newRemembered = remembered + 1;
        setRemembered(newRemembered);
        if (newDeck.length === 0) {
          trackEvent('medical_terms_flashcards_completed');
          setCompleted(true);
        } else {
          setDeck(newDeck);
          setIsFlipped(false);
          setCardKey((k) => k + 1);
        }
      } else {
        markForgotten(currentCard.id);
        setSessionWrong((w) => w + 1);
        // מחזירים את הכרטיס כמה מקומות אחורה — יופיע שוב בקרוב במקום בסוף החפיסה
        const rest = deck.slice(1);
        const insertAt = Math.min(REINSERT_OFFSET, rest.length);
        setDeck([...rest.slice(0, insertAt), currentCard, ...rest.slice(insertAt)]);
        setIsFlipped(false);
        setCardKey((k) => k + 1);
      }
    },
    [deck, remembered, currentCard, markRemembered, markForgotten],
  );

  const restart = useCallback(() => {
    setDeck(buildDeck(useAbbreviationSrsStore.getState().progress));
    setRemembered(0);
    setSessionWrong(0);
    setCompleted(false);
    setIsFlipped(false);
    setCardKey((k) => k + 1);
  }, []);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentCard) speakEnglish(currentCard.speech);
  };

  return (
    <div dir="rtl" className="fixed inset-0 z-[80] flex flex-col">
      {/* Blurred dark backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-2xl" />

      <div className="relative flex flex-col flex-1 ios-safe-header safe-area-bottom overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
              <Brain size={18} className="text-sky-300" />
            </div>
            <h2 className="text-white font-bold text-xl tracking-tight">שינון מושגים רפואיים</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/60 hover:text-white active:scale-90 transition-transform"
            aria-label="סגור"
          >
            <X size={20} />
          </button>
        </div>

        {!completed && currentCard ? (
          <>
            {/* ── Progress bar ── */}
            <div className="px-4 pt-2 pb-4">
              <div className="flex justify-between text-xs text-white/50 mb-1.5">
                <span>זכרתי {remembered} מתוך {totalCards}</span>
                <span>{deck.length} נותרו בחפיסה</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-l from-green-400 to-sky-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* ── Flip Card ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={cardKey}
                  initial={{ opacity: 0, scale: 0.92, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -18 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="w-full max-w-sm cursor-pointer select-none"
                  style={{ perspective: '1200px' }}
                  onClick={() => setIsFlipped((f) => !f)}
                >
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.55, type: 'spring', stiffness: 250, damping: 28 }}
                    style={{ transformStyle: 'preserve-3d', position: 'relative', height: '250px' }}
                  >
                    {/* Front face — הקיצור באנגלית */}
                    <div
                      style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                      className="absolute inset-0 rounded-3xl bg-white/8 backdrop-blur-xl border border-white/15 flex flex-col items-center justify-center p-7 shadow-2xl"
                    >
                      <p className="text-white/35 text-[10px] font-semibold uppercase tracking-[0.2em] mb-4">
                        מה המשמעות?
                      </p>
                      <p className="text-white font-black text-5xl text-center leading-snug font-mono" dir="ltr">
                        {currentCard.abbr}
                      </p>
                      <button
                        onClick={handleSpeak}
                        className="mt-5 flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-300 text-sm font-semibold active:scale-90 transition-transform"
                        aria-label="השמע הגייה"
                      >
                        <Volume2 size={16} />
                        השמע
                      </button>
                      <p className="text-white/25 text-xs mt-4">הקש לחשיפת התשובה ↓</p>
                    </div>

                    {/* Back face — המשמעות וההגייה */}
                    <div
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                      className="absolute inset-0 rounded-3xl bg-sky-950/70 backdrop-blur-xl border border-sky-400/25 flex flex-col items-center justify-center p-7 shadow-2xl"
                    >
                      <p className="text-sky-300/70 text-[10px] font-semibold uppercase tracking-[0.2em] mb-3">
                        תשובה
                      </p>
                      <p className="text-white font-black text-2xl text-center leading-relaxed">
                        {currentCard.he}
                      </p>
                      <p className="text-sky-200/80 text-base text-center mt-3">
                        הגייה: {currentCard.phonetic}
                      </p>
                      {/* רמת שליטה (קופסת Leitner) */}
                      <div className="flex items-center gap-1.5 mt-5" aria-label={`רמת שליטה ${currentBox} מתוך ${MAX_BOX}`}>
                        {Array.from({ length: MAX_BOX }, (_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${i < currentBox ? 'bg-green-400' : 'bg-white/15'}`}
                          />
                        ))}
                        <span className="text-white/35 text-[10px] mr-1.5">רמת שליטה</span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              <motion.p
                key={isFlipped ? 'flipped' : 'not-flipped'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/30 text-sm mt-5 text-center"
              >
                {isFlipped ? 'האם זכרת?' : 'הקש על הכרטיס לחשיפת התשובה'}
              </motion.p>
            </div>

            {/* ── Action Buttons ── */}
            <div className="px-4 pb-8 pt-4 flex gap-3">
              <HapticButton
                onClick={() => advance(false)}
                hapticPattern={30}
                pressScale={0.95}
                className="flex-1 h-16 rounded-2xl bg-red-500/15 border border-red-500/35 flex flex-col items-center justify-center gap-1 transition-colors hover:bg-red-500/25"
              >
                <XCircle size={22} className="text-red-400" />
                <span className="text-red-300 font-semibold text-sm">לא זכרתי</span>
              </HapticButton>

              <HapticButton
                onClick={() => advance(true)}
                hapticPattern={[8, 40, 8]}
                pressScale={0.95}
                className="flex-1 h-16 rounded-2xl bg-green-500/15 border border-green-500/35 flex flex-col items-center justify-center gap-1 transition-colors hover:bg-green-500/25"
              >
                <CheckCircle size={22} className="text-green-400" />
                <span className="text-green-300 font-semibold text-sm">זכרתי!</span>
              </HapticButton>
            </div>
          </>
        ) : (
          /* ── Success Screen ── */
          <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-6">
            {confettiParticles.map((p, i) => (
              <ConfettiParticle key={i} {...p} />
            ))}

            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.1 }}
              className="flex flex-col items-center gap-5 text-center z-10"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                className="w-28 h-28 rounded-full bg-green-500/20 border-2 border-green-400/40 flex items-center justify-center shadow-[0_0_60px_rgba(34,197,94,0.3)]"
              >
                <CheckCircle size={52} className="text-green-400" />
              </motion.div>

              <div>
                <h3 className="text-white font-black text-4xl mb-2">כל הכבוד!</h3>
                <p className="text-white/55 text-lg">
                  עברת את כל {totalCards} המושגים בהצלחה
                </p>
                {sessionWrong > 0 && (
                  <p className="text-white/40 text-sm mt-2">
                    {sessionWrong} טעויות באימון — המושגים האלו יופיעו יותר בפעם הבאה
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <HapticButton
                  onClick={restart}
                  hapticPattern={8}
                  pressScale={0.95}
                  className="px-6 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold flex items-center gap-2 text-base"
                >
                  <RotateCcw size={18} />
                  שוב
                </HapticButton>

                <HapticButton
                  onClick={onClose}
                  hapticPattern={[8, 50, 8]}
                  pressScale={0.95}
                  className="px-8 py-3.5 rounded-2xl bg-green-500 text-white font-bold text-base shadow-lg shadow-green-500/30"
                >
                  סיום
                </HapticButton>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
