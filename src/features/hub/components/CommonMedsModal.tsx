import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X, Pill, Search, Brain, Volume2,
  HeartPulse, Droplets, Wind, Syringe, Flame, Tablets, Activity,
  type LucideIcon,
} from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import FlashcardTrainer, { type FlashcardItem } from '../../../components/FlashcardTrainer';
import { readFlashcardStats } from '../../../utils/flashcardStats';
import { trackInteraction, trackEvent } from '../../../utils/analytics';
import { MED_CATEGORIES, TOTAL_MEDS, type CommonMed, type MedCategory } from '../data/commonMedsData';

const STATS_KEY = 'flashcardStats_commonMeds_v1';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  cardiovascular: HeartPulse,
  'blood-thinners': Droplets,
  respiratory: Wind,
  diabetes: Syringe,
  'neuro-psych': Brain,
  gastro: Flame,
  analgesics: Tablets,
  thyroid: Activity,
};

// טקסט להקראה: מסירים הערות בעברית שבסוגריים, ולוכסנים הופכים להפסקות
function ttsText(en: string): string {
  return en
    .replace(/\([^)]*[֐-׿][^)]*\)/g, '')
    .replace(/\s*\/\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildFlashcards(cat: MedCategory): FlashcardItem[] {
  return cat.groups.flatMap((g) =>
    g.meds.map((m) => ({
      front: m.en,
      back: `${m.he}\n${g.title ? `${g.title} · ` : ''}${cat.title}`,
    }))
  );
}

const ALL_FLASHCARDS: FlashcardItem[] = MED_CATEGORIES.flatMap(buildFlashcards);

interface MedRowProps {
  med: CommonMed;
  divider: string;
  color: string;
  isSpeaking: boolean;
  onSpeak: (med: CommonMed) => void;
}

function MedRow({ med, divider, color, isSpeaking, onSpeak }: MedRowProps) {
  return (
    <div className={`px-4 py-3 flex items-center gap-3 ${divider}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug text-right" dir="ltr">
          {med.en}
        </p>
        <p className="text-xs text-gray-500 dark:text-emt-muted leading-relaxed mt-0.5">{med.he}</p>
      </div>
      <button
        onClick={() => onSpeak(med)}
        aria-label={`השמע הגייה: ${med.en}`}
        className={`shrink-0 w-9 h-9 rounded-full border flex items-center justify-center
                    active:scale-90 transition-all
                    ${isSpeaking
                      ? `${color} border-current bg-current/10 animate-pulse`
                      : 'text-gray-400 dark:text-emt-muted border-gray-200 dark:border-emt-border hover:text-gray-700 dark:hover:text-emt-light'}`}
      >
        <Volume2 size={16} />
      </button>
    </div>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommonMedsModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [trainer, setTrainer] = useState<{ data: FlashcardItem[]; label: string } | null>(null);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [stats, setStats] = useState(() => readFlashcardStats(STATS_KEY));

  const handleClose = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setQuery('');
    onClose();
  }, [onClose]);

  useModalBackHandler(isOpen, handleClose);

  useEffect(() => {
    if (isOpen) trackInteraction('תרופות נפוצות', 'reference');
  }, [isOpen]);

  const speak = useCallback((med: CommonMed) => {
    if (!('speechSynthesis' in window)) {
      alert('מנוע דיבור אינו נתמך במכשיר זה');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(ttsText(med.en));
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingKey(null);
    utterance.onerror = () => setSpeakingKey(null);
    setSpeakingKey(med.en);
    window.speechSynthesis.speak(utterance);
    trackEvent('med_tts_play', { med: med.en });
  }, []);

  const openTrainer = useCallback((data: FlashcardItem[], label: string) => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setTrainer({ data, label });
    trackEvent('open_flashcard_trainer', { tool: 'common_meds', deck: label });
  }, []);

  const closeTrainer = useCallback(() => {
    setTrainer(null);
    setStats(readFlashcardStats(STATS_KEY));
  }, []);

  const q = query.trim().toLowerCase();
  const filteredCategories = useMemo(() => {
    if (!q) return MED_CATEGORIES;
    return MED_CATEGORIES
      .map((cat) => {
        // התאמה לשם הקטגוריה — מציגים את הקטגוריה כולה
        if (cat.title.toLowerCase().includes(q) || cat.titleEn.toLowerCase().includes(q)) return cat;
        const groups = cat.groups
          .map((g) => {
            if (g.title?.toLowerCase().includes(q)) return g;
            return { ...g, meds: g.meds.filter((m) => m.en.toLowerCase().includes(q) || m.he.includes(q)) };
          })
          .filter((g) => g.meds.length > 0);
        return { ...cat, groups };
      })
      .filter((cat) => cat.groups.length > 0);
  }, [q]);

  if (!isOpen) return null;

  const totalAnswers = stats.remembered + stats.forgotten;
  const successRate = totalAnswers > 0 ? Math.round((stats.remembered / totalAnswers) * 100) : null;

  return (
    <>
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <Pill size={22} className="text-emerald-400" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">תרופות נפוצות</h2>
        </div>
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
          aria-label="סגור"
        >
          <X size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-emt-muted pointer-events-none" />
          <input
            type="text"
            placeholder="חפש לפי שם תרופה או קטגוריה..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-emt-border
                       bg-white dark:bg-emt-gray text-gray-900 dark:text-emt-light
                       placeholder-gray-400 dark:placeholder-emt-muted
                       pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">

        {/* Flashcard trainer trigger */}
        <button
          onClick={() => openTrainer(ALL_FLASHCARDS, 'all')}
          className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/8 dark:bg-emerald-500/10
                     backdrop-blur-sm px-4 py-3.5 flex items-center gap-3
                     active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Brain size={20} className="text-emerald-400" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-emerald-600 dark:text-emerald-200 font-bold text-base leading-tight">התחל אימון שינון</span>
            <span className="text-emerald-600/60 dark:text-emerald-300/50 text-xs mt-0.5">
              {TOTAL_MEDS} כרטיסיות
              {stats.sessions > 0 && ` · ${stats.sessions} אימונים הושלמו`}
              {successRate !== null && ` · ${successRate}% הצלחה`}
            </span>
          </div>
          <div className="mr-auto text-emerald-400/40 text-lg">←</div>
        </button>

        {filteredCategories.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-emt-muted py-8 text-sm">לא נמצאו תוצאות</p>
        ) : (
          filteredCategories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] ?? Pill;
            const medCount = cat.groups.reduce((s, g) => s + g.meds.length, 0);
            return (
              <div key={cat.id}>
                {/* Category header */}
                <div className="flex items-start gap-3 mb-2 pr-1">
                  <div className={`w-10 h-10 rounded-xl border ${cat.border} ${cat.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={19} className={cat.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm font-black ${cat.color}`}>{cat.title}</h3>
                      <span className="text-[10px] font-mono text-gray-400 dark:text-emt-muted" dir="ltr">{cat.titleEn}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-emt-muted leading-relaxed mt-0.5">{cat.description}</p>
                  </div>
                  <button
                    onClick={() => openTrainer(buildFlashcards(cat), cat.id)}
                    aria-label={`אימון שינון: ${cat.title}`}
                    className={`shrink-0 w-9 h-9 rounded-xl border ${cat.border} ${cat.bg} flex items-center justify-center
                               active:scale-90 transition-transform ${cat.color}`}
                  >
                    <Brain size={16} />
                  </button>
                </div>

                {/* Representative image (optional) */}
                {cat.image && (
                  <img
                    src={cat.image}
                    alt={cat.title}
                    loading="lazy"
                    className="w-full h-28 object-cover rounded-2xl mb-2 border border-gray-200 dark:border-emt-border"
                  />
                )}

                {/* Groups */}
                <div className={`rounded-2xl border ${cat.border} ${cat.bg} overflow-hidden`}>
                  {cat.groups.map((group, gi) => (
                    <div key={group.title ?? gi}>
                      {group.title && (
                        <div className={`px-4 pt-3 pb-1.5 ${gi > 0 ? cat.divider.replace('border-b', 'border-t') : ''}`}>
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${cat.color}`}>
                            {group.title}
                          </span>
                        </div>
                      )}
                      {group.image && (
                        <img
                          src={group.image}
                          alt={group.title ?? cat.title}
                          loading="lazy"
                          className="w-full h-24 object-cover"
                        />
                      )}
                      {group.meds.map((m, i) => (
                        <MedRow
                          key={m.en}
                          med={m}
                          color={cat.color}
                          isSpeaking={speakingKey === m.en}
                          onSpeak={speak}
                          divider={gi < cat.groups.length - 1 || i < group.meds.length - 1 ? cat.divider : ''}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-gray-400 dark:text-emt-muted mt-1 pr-1">{medCount} תרופות</p>
              </div>
            );
          })
        )}
      </div>
    </div>

    {trainer && (
      <FlashcardTrainer data={trainer.data} statsKey={STATS_KEY} onClose={closeTrainer} />
    )}
    </>
  );
}
