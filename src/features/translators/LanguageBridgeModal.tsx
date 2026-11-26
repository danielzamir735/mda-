import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Phone, Globe, ChevronRight, UserPlus, Clock, Check,
  Loader2, AlertCircle, AlertTriangle, Search, Plus, Languages, Info, Send,
  HelpCircle, ShieldCheck, Users, Video, Share2,
  Moon, CalendarDays,
} from 'lucide-react';
import ReactGA from 'react-ga4';
import { supabase } from '../../lib/supabase';
import { useTranslation, useLanguage, translate, type TranslationKey } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import WhatsAppIcon from '../../components/WhatsAppIcon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface TimeSlot { start: string; end: string; }

interface AvailabilityEntry {
  day: number;   // 0=Sun … 6=Sat
  start: string; // "HH:MM"
  end: string;
}

type AvailabilityMode = '24_7' | 'no_saturday' | 'custom';

interface Availability {
  type: AvailabilityMode;
  schedule: AvailabilityEntry[];
}

interface Translator {
  id: string;
  full_name: string;
  phone_number: string;
  languages: string[];
  is_24_7: boolean;
  start_time: string | null;
  end_time: string | null;
  time_slots: TimeSlot[] | null;
  emergency_only_contact: boolean;
  availability: Availability | null;
}

interface Language {
  code: string;
  name: string;
  flag: string;
  /** English display name (Hebrew `name` is the default; custom DB languages have Hebrew only). */
  en?: string;
  custom?: boolean;
}

// ─── 52 Languages ─────────────────────────────────────────────────────────────

const STATIC_LANGUAGES: Language[] = [
  { code: 'isl', name: 'שפת סימנים', en: 'Sign language', flag: '🤟' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'ru', name: 'רוסית', en: 'Russian', flag: '🇷🇺' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'ar', name: 'ערבית', en: 'Arabic', flag: '🇸🇦' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'am', name: 'אמהרית', en: 'Amharic', flag: '🇪🇹' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'en', name: 'אנגלית', en: 'English', flag: '🇬🇧' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'fr', name: 'צרפתית', en: 'French', flag: '🇫🇷' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'es', name: 'ספרדית', en: 'Spanish', flag: '🇪🇸' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'ro', name: 'רומנית', en: 'Romanian', flag: '🇷🇴' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'ti', name: 'טיגרינית', en: 'Tigrinya', flag: '🇪🇷' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'ka', name: 'גיאורגית', en: 'Georgian', flag: '🇬🇪' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'yi', name: 'יידיש', en: 'Yiddish', flag: '✡️' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'th', name: 'תאית', en: 'Thai', flag: '🇹🇭' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'zh', name: 'סינית', en: 'Chinese', flag: '🇨🇳' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'uk', name: 'אוקראינית', en: 'Ukrainian', flag: '🇺🇦' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'he', name: 'עברית', en: 'Hebrew', flag: '🇮🇱' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'it', name: 'איטלקית', en: 'Italian', flag: '🇮🇹' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'de', name: 'גרמנית', en: 'German', flag: '🇩🇪' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'pt', name: 'פורטוגזית', en: 'Portuguese', flag: '🇵🇹' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'hi', name: 'הינדי', en: 'Hindi', flag: '🇮🇳' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'tr', name: 'טורקית', en: 'Turkish', flag: '🇹🇷' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'hu', name: 'הונגרית', en: 'Hungarian', flag: '🇭🇺' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'pl', name: 'פולנית', en: 'Polish', flag: '🇵🇱' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'bg', name: 'בולגרית', en: 'Bulgarian', flag: '🇧🇬' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'cs', name: "צ'כית", en: 'Czech', flag: '🇨🇿' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'sr', name: 'סרבית', en: 'Serbian', flag: '🇷🇸' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'hr', name: 'קרואטית', en: 'Croatian', flag: '🇭🇷' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'sq', name: 'אלבנית', en: 'Albanian', flag: '🇦🇱' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'el', name: 'יוונית', en: 'Greek', flag: '🇬🇷' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'nl', name: 'הולנדית', en: 'Dutch', flag: '🇳🇱' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'sv', name: 'שוודית', en: 'Swedish', flag: '🇸🇪' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'no', name: 'נורווגית', en: 'Norwegian', flag: '🇳🇴' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'da', name: 'דנית', en: 'Danish', flag: '🇩🇰' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'fi', name: 'פינית', en: 'Finnish', flag: '🇫🇮' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'ja', name: 'יפנית', en: 'Japanese', flag: '🇯🇵' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'ko', name: 'קוריאנית', en: 'Korean', flag: '🇰🇷' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'vi', name: 'וייטנאמית', en: 'Vietnamese', flag: '🇻🇳' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'id', name: 'אינדונזית', en: 'Indonesian', flag: '🇮🇩' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'tl', name: 'טגלוג', en: 'Tagalog', flag: '🇵🇭' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'sw', name: 'סוואהילי', en: 'Swahili', flag: '🇰🇪' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'so', name: 'סומלית', en: 'Somali', flag: '🇸🇴' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'fa', name: 'פרסית', en: 'Persian', flag: '🇮🇷' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'ur', name: 'אורדו', en: 'Urdu', flag: '🇵🇰' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'bn', name: 'בנגלית', en: 'Bengali', flag: '🇧🇩' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'ta', name: 'טמילית', en: 'Tamil', flag: '🇮🇳' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'ne', name: 'נפאלית', en: 'Nepali', flag: '🇳🇵' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'si', name: 'סינהלית', en: 'Sinhala', flag: '🇱🇰' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'az', name: 'אזרית', en: 'Azerbaijani', flag: '🇦🇿' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'hy', name: 'ארמנית', en: 'Armenian', flag: '🇦🇲' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'kk', name: 'קזחית', en: 'Kazakh', flag: '🇰🇿' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'uz', name: 'אוזבקית', en: 'Uzbek', flag: '🇺🇿' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'ms', name: 'מלאית', en: 'Malay', flag: '🇲🇾' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'ps', name: 'פשטו', en: 'Pashto', flag: '🇦🇫' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'mk', name: 'מקדונית', en: 'Macedonian', flag: '🇲🇰' }, // i18n-ok: Hebrew display name (English in en)
  { code: 'pt-br', name: 'פורטוגזית (ברזיל)', en: 'Portuguese (Brazil)', flag: '🇧🇷' }, // i18n-ok: Hebrew display name (English in en)
];

// ─── Animation Variants ────────────────────────────────────────────────────────

const EASE_OUT = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

const PAGE = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.26, ease: EASE_OUT } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

const INTRO_PAGE = {
  initial: { opacity: 0, scale: 0.96, y: 20 },
  animate: { opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.35, ease: EASE_OUT } },
  exit:    { opacity: 0, scale: 0.92, y: -16, transition: { duration: 0.22 } },
};

// ─── Day labels ────────────────────────────────────────────────────────────────

const dayShort = (day: number) => translate(`lbDayShort${day}` as TranslationKey);
const dayName  = (day: number) => translate(`lbDay${day}` as TranslationKey);

/** Language name in the interface language. */
function langName(l: Language): string {
  return useSettingsStore.getState().language === 'en' && l.en ? l.en : l.name;
}

function matchesLangSearch(l: Language, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return l.name.includes(q.trim()) || (l.en ?? '').toLowerCase().includes(s) || l.code.toLowerCase().includes(s);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isAvailableNow(t: Translator): boolean {
  // New availability format takes priority
  if (t.availability) {
    const { type, schedule } = t.availability;
    if (type === '24_7') return true;
    const now = new Date();
    const dayOfWeek = now.getDay();
    if (type === 'no_saturday') return dayOfWeek !== 6;
    if (type === 'custom') {
      const cur = now.getHours() * 60 + now.getMinutes();
      const todaySlots = schedule.filter(s => s.day === dayOfWeek);
      if (todaySlots.length === 0) return false;
      return todaySlots.some(slot => {
        const [sh, sm] = slot.start.split(':').map(Number);
        const [eh, em] = slot.end.split(':').map(Number);
        const s = sh * 60 + sm, e = eh * 60 + em;
        return s <= e ? cur >= s && cur <= e : cur >= s || cur <= e;
      });
    }
    return false;
  }
  // Legacy format fallback
  if (t.is_24_7) return true;
  const slots: TimeSlot[] =
    (t.time_slots && t.time_slots.length > 0)
      ? t.time_slots
      : (t.start_time && t.end_time ? [{ start: t.start_time, end: t.end_time }] : []);
  if (slots.length === 0) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return slots.some(slot => {
    const [sh, sm] = slot.start.split(':').map(Number);
    const [eh, em] = slot.end.split(':').map(Number);
    const start = sh * 60 + sm, end = eh * 60 + em;
    return start <= end ? cur >= start && cur <= end : cur >= start || cur <= end;
  });
}

function formatTime(t: string | null): string {
  return t ? t.slice(0, 5) : '';
}

// ─── Count-Up Number ───────────────────────────────────────────────────────────

export function CountUpNumber({ value, className, style }: { value: number; className?: string; style?: CSSProperties }) {
  const [display, setDisplay] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (!value) return;
    const duration = 1400;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        // Trigger pulse animation when count-up completes
        setPulseKey(k => k + 1);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <motion.span
      key={pulseKey}
      className={className}
      style={style}
      animate={pulseKey > 0 ? { scale: [1, 1.18, 0.96, 1] } : {}}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
    >
      {display.toLocaleString('he-IL')}
    </motion.span>
  );
}

// ─── Intro Screen ──────────────────────────────────────────────────────────────

function IntroScreen({ onStart, assistCount }: { onStart: () => void; assistCount: number }) {
  const t = useTranslation();
  const handleStart = () => {
    localStorage.setItem('lb_intro_seen', '1');
    onStart();
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 px-8 py-14 min-h-[65vh] text-center">
      {/* Icon cluster */}
      <div className="relative">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] } }}
          className="w-28 h-28 rounded-[2rem] flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
            boxShadow: '0 16px 48px rgba(59,130,246,0.35), 0 4px 12px rgba(59,130,246,0.2)',
          }}
        >
          {/* theme-ok: white on a coloured button / badge */}
          <Languages size={52} className="text-white" />
        </motion.div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { delay: 0.25, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] } }}
          className="absolute -bottom-2 -right-2 w-11 h-11 rounded-[1rem] bg-emerald-500 flex items-center justify-center"
          style={{ boxShadow: '0 4px 16px rgba(34,197,94,0.45)' }}
        >
          {/* theme-ok: white on a coloured button / badge */}
          <Phone size={20} className="text-white" fill="white" />
        </motion.div>
      </div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.3 } }}
        className="flex flex-col gap-4"
      >
        <h2 className="text-2xl font-black text-fg leading-tight">
          {t('lbTitle')}
        </h2>
        <p className="text-[0.9rem] text-fg-muted leading-relaxed max-w-xs mx-auto">
          {t('lbIntroBody')}
        </p>
        {/* How it works steps */}
        <div className="flex flex-col gap-2 max-w-xs mx-auto w-full text-start">
          {[
            { num: '1', text: t('lbStep1') },
            { num: '2', text: t('lbStep2') },
            { num: '3', text: t('lbStep3') },
          ].map(step => (
            <div key={step.num} className="flex items-center gap-3 rounded-2xl px-4 py-2.5"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
              {/* theme-ok: white on a coloured button / badge */}
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)' }}>
                {step.num}
              </span>
              <span className="text-sm font-semibold text-fg/80">{step.text}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.32, duration: 0.3 } }}
        whileTap={{ scale: 0.96 }}
        onClick={handleStart}
        // theme-ok: white on a coloured button / badge
        className="w-full max-w-xs py-4 rounded-2xl text-white font-black text-lg"
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
          boxShadow: '0 8px 32px rgba(59,130,246,0.38)',
        }}
      >
        {t('lbStart')}
      </motion.button>

      {assistCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.45, duration: 0.35 } }}
          className="w-full max-w-xs rounded-2xl px-5 py-4 flex flex-col gap-3"
          style={{
            background: 'rgb(var(--fg) / 0.07)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(52,211,153,0.3)',
            boxShadow: '0 8px 32px rgba(52,211,153,0.12), inset 0 1px 0 rgb(var(--fg) / 0.12)',
          }}
        >
          {/* Live label */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.9)' }} />
            </span>
            <span className="text-[0.6rem] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">{t('lbCommunity')}</span>
          </div>
          {/* Number + Users icon */}
          <div className="flex items-center justify-between">
            <CountUpNumber
              value={assistCount}
              className="text-3xl font-black tabular-nums"
              style={{
                background: 'linear-gradient(135deg, #34d399 0%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            />
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.2)' }}
            >
              <Users size={20} className="text-emerald-700 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-xs text-fg/55 font-semibold leading-relaxed">
            {t('lbEmergencyCalls')}
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Availability display helper ──────────────────────────────────────────────

function AvailabilityBadge({ translator }: { translator: Translator }) {
  const t = useTranslation();
  const avail = translator.availability;
  if (avail) {
    if (avail.type === '24_7') return (
      <div className="flex items-center gap-1 mt-0.5">
        <ShieldCheck size={11} className="text-emerald-700 dark:text-emerald-400" style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.65))' }} />
        <span className="text-[0.65rem] text-emerald-700 dark:text-emerald-400 font-bold">24/7</span>
      </div>
    );
    if (avail.type === 'no_saturday') return (
      <div className="flex items-center gap-1 mt-0.5">
        <Moon size={10} className="text-amber-800 dark:text-amber-400" />
        <span className="text-[0.65rem] text-amber-800 dark:text-amber-400 font-bold">{t('lbEveryDayButSat')}</span>
      </div>
    );
    if (avail.type === 'custom' && avail.schedule.length > 0) return (
      <div className="flex flex-col gap-0.5 mt-0.5">
        {avail.schedule.map((entry, i) => (
          <p key={i} className="text-[0.65rem] text-fg-subtle flex items-center gap-1">
            <Clock size={10} />
            <span className="text-[0.6rem] font-semibold text-fg-muted">{dayShort(entry.day)}</span>
            {formatTime(entry.start)} – {formatTime(entry.end)}
          </p>
        ))}
      </div>
    );
    return null;
  }
  // Legacy fallback
  if (translator.is_24_7) return (
    <div className="flex items-center gap-1 mt-0.5">
      <ShieldCheck size={11} className="text-emerald-700 dark:text-emerald-400" style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.65))' }} />
      <span className="text-[0.65rem] text-emerald-700 dark:text-emerald-400 font-bold">24/7</span>
    </div>
  );
  const slots: TimeSlot[] = (translator.time_slots && translator.time_slots.length > 0)
    ? translator.time_slots
    : (translator.start_time && translator.end_time
        ? [{ start: translator.start_time, end: translator.end_time }]
        : []);
  if (slots.length === 0) return null;
  return (
    <div className="flex flex-col gap-0.5 mt-0.5">
      {slots.map((slot, i) => (
        <p key={i} className="text-[0.65rem] text-fg-subtle flex items-center gap-1">
          <Clock size={10} />
          {formatTime(slot.start)} – {formatTime(slot.end)}
        </p>
      ))}
    </div>
  );
}

// ─── Translator Card ───────────────────────────────────────────────────────────

function TranslatorCard({ translator, available, isEmergency, allLanguages, selectedLangName, isSignLanguage, onContact }: {
  translator: Translator;
  available: boolean;
  isEmergency?: boolean;
  allLanguages: Language[];
  selectedLangName?: string;
  isSignLanguage?: boolean;
  onContact?: () => void;
}) {
  const t = useTranslation();
  const phone = translator.phone_number.replace(/\D/g, '');
  const waNumber = phone.startsWith('0') ? `972${phone.slice(1)}` : phone;
  // The message goes to an Israeli volunteer translator, so it stays Hebrew in both interface languages.
  const waMessage = selectedLangName
    // i18n-ok: message to the volunteer translator
    ? `שלום, הודעה זו נשלחה דרך אפליקציית חובש +. קיים צורך דחוף בסיוע בתרגום לשפה ה-${selectedLangName} עבור מטופל בשטח. האם ניתן לסייע כעת?`
    // i18n-ok: message to the volunteer translator
    : 'שלום, הודעה זו נשלחה דרך אפליקציית חובש +. קיים צורך דחוף בסיוע בתרגום עבור מטופל בשטח. האם ניתן לסייע כעת?';
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all
        ${available
          ? 'bg-surface/70 dark:bg-fg/5 border-line backdrop-blur-md'
          : isEmergency
            ? 'border-orange-500/20'
            : 'bg-surface-2/60 border-line/60 opacity-60'
        }`}
      style={available
        ? { boxShadow: '0 4px 24px rgba(96,165,250,0.08), inset 0 1px 0 rgb(var(--fg) / 0.1)' }
        : isEmergency
          ? { background: 'rgba(249,115,22,0.06)', boxShadow: '0 2px 12px rgba(249,115,22,0.08)' }
          : undefined}
    >
      <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-lg font-black
        ${available
          ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30'
          : isEmergency
            ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-lg shadow-orange-500/25'
            : 'bg-gray-300 dark:bg-gray-700 text-fg-muted'
        }`}
      >
        {translator.full_name.charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-fg truncate">{translator.full_name}</p>
        <p className="text-xs text-fg-muted mt-0.5">
          {translator.languages.map(code => {
            const lang = allLanguages.find(l => l.code === code);
            return lang ? `${lang.flag} ${langName(lang)}` : code;
          }).join(' · ')}
        </p>
        <AvailabilityBadge translator={translator} />
        {isEmergency && (
          <div className="flex items-center gap-1 mt-0.5">
            <AlertCircle size={10} className="text-orange-700 dark:text-orange-400 shrink-0" />
            <span className="text-[0.6rem] text-orange-700 dark:text-orange-400 font-bold">{t('lbEmergencyOnly')}</span>
          </div>
        )}
      </div>

      {/* Dual action buttons */}
      <div className="shrink-0 flex items-center gap-2">
        {isSignLanguage ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => {
              e.stopPropagation();
              ReactGA.event('contact_translator', { method: 'whatsapp_video', language: selectedLangName ?? '' });
              ReactGA.event('video_call_clicked', { language: selectedLangName ?? '' });
              onContact?.();
            }}
            // theme-ok: white on a coloured button / badge
            className="flex items-center justify-center w-10 h-10 rounded-full text-white transition-all active:scale-90"
            style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', boxShadow: '0 4px 16px rgba(37,211,102,0.4)' }}
            aria-label={t('lbVideoCall')}
          >
            <Video size={17} />
          </a>
        ) : (
          <a
            href={`tel:${translator.phone_number}`}
            onClick={e => {
              e.stopPropagation();
              ReactGA.event('contact_translator', { method: 'call', language: selectedLangName ?? '' });
              onContact?.();
            }}
            // theme-ok: white on a coloured button / badge
            className="flex items-center justify-center w-10 h-10 rounded-full text-white transition-all active:scale-90"
            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)', boxShadow: '0 4px 16px rgba(34,197,94,0.4)' }}
            aria-label={t('call')}
          >
            {/* theme-ok: white on a coloured button / badge */}
            <Phone size={17} fill="white" />
          </a>
        )}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => {
            e.stopPropagation();
            ReactGA.event('contact_translator', { method: 'whatsapp', language: selectedLangName ?? '' });
            onContact?.();
          }}
          // theme-ok: white on a coloured button / badge
          className="flex items-center justify-center w-10 h-10 rounded-full text-white transition-all active:scale-90"
          style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', boxShadow: '0 4px 16px rgba(37,211,102,0.4)' }}
          aria-label="WhatsApp"
        >
          <WhatsAppIcon size={17} />
        </a>
      </div>
    </div>
  );
}

// ─── Language Grid Card ────────────────────────────────────────────────────────

function LangCard({ lang, count, onClick }: { lang: Language; count: number; onClick: () => void }) {
  const t = useTranslation();
  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden flex flex-col items-center justify-center gap-2 rounded-2xl py-5 px-2 border
        bg-fg/10 border-fg/20
        active:scale-95 transition-all hover:border-fg/40 hover:bg-fg/15"
      style={{
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgb(var(--fg) / 0.1)',
      }}
    >
      <span className="text-4xl leading-none">{lang.flag}</span>
      <span className="text-sm font-bold text-fg">{langName(lang)}</span>
      {count > 0 ? (
        <span className="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full bg-fg/15 text-fg/80 border border-fg/20">
          {t('lbTranslatorsCount', { n: count })}
        </span>
      ) : (
        <span className="flex items-center gap-1 text-[0.6rem] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-700 dark:text-red-300 border border-red-400/40">
          <AlertTriangle size={9} className="flex-shrink-0" />
          {t('lbHelpStaff')}
        </span>
      )}
    </button>
  );
}

// ─── Language Request Form ─────────────────────────────────────────────────────

function LanguageRequestForm() {
  const t = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSend = async () => {
    const trimmed = name.trim();
    if (!trimmed || status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // i18n-ok: message to the app admin, always Hebrew
        body: JSON.stringify({ message: `קטגוריה: הוספת שפה\nשפה מבוקשת: ${trimmed}` }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      setTimeout(() => { setExpanded(false); setName(''); setStatus('idle'); }, 2200);
    } catch {
      setStatus('error');
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center justify-center gap-2 w-full rounded-2xl py-3 px-4 border border-dashed border-line-strong text-fg-muted text-sm font-semibold transition-all active:scale-95 hover:border-blue-400 hover:text-blue-500"
      >
        <Plus size={15} />
        {t('lbLangMissing')}
      </button>
    );
  }

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-2 rounded-2xl p-4 border border-emerald-400/40 text-center"
        style={{ background: 'rgba(34,197,94,0.1)' }}
      >
        <Check size={20} className="text-emerald-700 dark:text-emerald-400" />
        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{t('lbRequestSent')}</p>
        <p className="text-xs text-emerald-700 dark:text-emerald-400/70">{t('lbRequestSentSub')}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2 rounded-2xl p-3 border border-line bg-surface-2"
    >
      <p className="text-xs font-bold text-fg-muted">{t('lbRequestTitle')}</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={t('lbLangNamePlaceholder')}
          autoFocus
          disabled={status === 'sending'}
          className="flex-1 rounded-xl px-3 py-2 text-sm bg-surface border border-line text-fg placeholder-fg-subtle focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!name.trim() || status === 'sending'}
          // theme-ok: white on a coloured button / badge
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
        >
          {status === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-700 dark:text-red-400">{t('lbSendFailed')}</p>
      )}
    </motion.div>
  );
}

// ─── Registration Form ─────────────────────────────────────────────────────────

// Editing/removing a translator row is authorised by a secret token issued once at
// registration (see supabase_migration_security_hardening.sql) and kept on this device only.
const LB_TOKEN_KEY = 'lb_translator_token';

function getEditToken(id: string): string | null {
  return localStorage.getItem('lb_translator_id') === id ? localStorage.getItem(LB_TOKEN_KEY) : null;
}

function RegisterForm({
  allLanguages,
  onSuccess,
  onModeChange,
  initialPhone,
}: {
  allLanguages: Language[];
  onSuccess: (langs: string[], newId?: string) => void;
  onModeChange?: (mode: 'new' | 'checking' | 'edit') => void;
  initialPhone?: string;
}) {
  const t = useTranslation();
  const [fullName, setFullName]             = useState('');
  const [phone, setPhone]                   = useState('');
  const [phoneConfirm, setPhoneConfirm]     = useState('');
  const [selectedLangs, setSelectedLangs]   = useState<string[]>([]);
  const [formLangSearch, setFormLangSearch] = useState('');
  const [availMode, setAvailMode]   = useState<AvailabilityMode>('24_7');
  const [customDays, setCustomDays] = useState<{ [day: number]: { enabled: boolean; slots: { start: string; end: string }[] } }>({
    0: { enabled: true,  slots: [{ start: '08:00', end: '22:00' }] },
    1: { enabled: true,  slots: [{ start: '08:00', end: '22:00' }] },
    2: { enabled: true,  slots: [{ start: '08:00', end: '22:00' }] },
    3: { enabled: true,  slots: [{ start: '08:00', end: '22:00' }] },
    4: { enabled: true,  slots: [{ start: '08:00', end: '22:00' }] },
    5: { enabled: true,  slots: [{ start: '08:00', end: '20:00' }] },
    6: { enabled: true,  slots: [{ start: '08:00', end: '20:00' }] },
  });
  const [emergencyContact, setEmergencyContact] = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [submitted, setSubmitted]           = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);

  // Identity recognition
  const [mode, setMode]           = useState<'new' | 'checking' | 'edit'>('new');
  const [existingId, setExistingId] = useState<string | null>(null);
  const phoneTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current); }, []);
  useEffect(() => { onModeChange?.(mode); }, [mode]); // eslint-disable-line
  useEffect(() => { if (initialPhone) handlePhoneChange(initialPhone); }, []); // eslint-disable-line

  const phoneMatch    = phone.trim() !== '' && phone.trim() === phoneConfirm.trim();
  const phoneMismatch = phoneConfirm.trim() !== '' && phone.trim() !== phoneConfirm.trim();

  const toggleLang = (code: string) =>
    setSelectedLangs(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);

  const filteredFormLangs = allLanguages.filter(l => matchesLangSearch(l, formLangSearch));

  // ── Phone-based identity lookup ──────────────────────────────────────────────
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    setMode('new');
    setExistingId(null);
    setError(null);
    if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current);

    const digits = val.replace(/\D/g, '');
    if (digits.length < 9) return;

    setMode('checking');
    phoneTimerRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('translators')
        .select('id, full_name, languages, is_24_7, start_time, end_time, time_slots, emergency_only_contact, availability')
        .eq('phone_number', val.trim())
        .maybeSingle();

      if (data && !getEditToken(data.id)) {
        // Knowing the phone number is not proof of ownership
        setMode('new');
        setError(t('lbErrRegisteredElsewhere'));
        return;
      }

      if (data) {
        setExistingId(data.id);
        setFullName(data.full_name);
        setSelectedLangs(data.languages ?? []);
        // Load availability — new format first, then legacy fallback
        const avail = data.availability as Availability | null;
        if (avail) {
          setAvailMode(avail.type);
          if (avail.type === 'custom' && avail.schedule.length > 0) {
            const newDays: { [day: number]: { enabled: boolean; slots: { start: string; end: string }[] } } = {
              0: { enabled: false, slots: [{ start: '08:00', end: '22:00' }] },
              1: { enabled: false, slots: [{ start: '08:00', end: '22:00' }] },
              2: { enabled: false, slots: [{ start: '08:00', end: '22:00' }] },
              3: { enabled: false, slots: [{ start: '08:00', end: '22:00' }] },
              4: { enabled: false, slots: [{ start: '08:00', end: '22:00' }] },
              5: { enabled: false, slots: [{ start: '08:00', end: '20:00' }] },
              6: { enabled: false, slots: [{ start: '08:00', end: '20:00' }] },
            };
            (avail.schedule as AvailabilityEntry[]).forEach(s => {
              if (!newDays[s.day].enabled) {
                newDays[s.day] = { enabled: true, slots: [{ start: s.start, end: s.end }] };
              } else {
                newDays[s.day].slots.push({ start: s.start, end: s.end });
              }
            });
            setCustomDays(newDays);
          }
        } else if (data.is_24_7) {
          setAvailMode('24_7');
        } else {
          setAvailMode('custom');
          const legacySlots = data.time_slots as TimeSlot[] | null;
          const slot = legacySlots?.[0] ?? (data.start_time && data.end_time ? { start: data.start_time, end: data.end_time } : null);
          const s = (slot?.start ?? '08:00').slice(0, 5);
          const e = (slot?.end ?? '22:00').slice(0, 5);
          setCustomDays({
            0: { enabled: true,  slots: [{ start: s, end: e }] },
            1: { enabled: true,  slots: [{ start: s, end: e }] },
            2: { enabled: true,  slots: [{ start: s, end: e }] },
            3: { enabled: true,  slots: [{ start: s, end: e }] },
            4: { enabled: true,  slots: [{ start: s, end: e }] },
            5: { enabled: true,  slots: [{ start: s, end: e }] },
            6: { enabled: false, slots: [{ start: s, end: e }] },
          });
        }
        setEmergencyContact(data.emergency_only_contact ?? false);
        setPhoneConfirm(val.trim()); // auto-confirm since record exists
        setMode('edit');
      } else {
        setMode('new');
      }
    }, 600);
  };

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!fullName.trim())           { setError(t('lbErrName'));          return; }
    if (selectedLangs.length === 0) { setError(t('lbErrLang')); return; }
    if (availMode === 'custom' && Object.values(customDays).every(d => !d.enabled)) {
      setError(t('lbErrDay')); return;
    }
    setLoading(true); setError(null);

    try {
      const builtAvail: Availability = availMode === '24_7'
        ? { type: '24_7', schedule: [] }
        : availMode === 'no_saturday'
          ? { type: 'no_saturday', schedule: [] }
          : { type: 'custom', schedule: Object.entries(customDays).filter(([, d]) => d.enabled).flatMap(([day, d]) => d.slots.map(slot => ({ day: parseInt(day), start: slot.start, end: slot.end }))) };
      const firstSlot = availMode === 'custom' ? Object.values(customDays).find(d => d.enabled)?.slots[0] : undefined;
      const payload = {
        full_name:               fullName.trim(),
        languages:               selectedLangs,
        availability:            builtAvail,
        is_24_7:                 availMode === '24_7',
        start_time:              firstSlot?.start ?? null,
        end_time:                firstSlot?.end ?? null,
        time_slots:              availMode === 'custom' ? Object.values(customDays).filter(d => d.enabled).flatMap(d => d.slots) : [],
        emergency_only_contact:  emergencyContact,
      };
      const { data: updated, error: dbError } = await supabase.rpc('update_translator', {
        p_id:                     existingId!,
        p_edit_token:             getEditToken(existingId!) ?? '',
        p_full_name:              payload.full_name,
        p_languages:              payload.languages,
        p_availability:           payload.availability,
        p_is_24_7:                payload.is_24_7,
        p_start_time:             payload.start_time,
        p_end_time:               payload.end_time,
        p_time_slots:             payload.time_slots,
        p_emergency_only_contact: payload.emergency_only_contact,
      });

      if (dbError || !updated) {
        console.error('[LB] Supabase update error:', dbError);
        setError(dbError ? t('lbErrUpdate', { msg: dbError.message }) : t('lbErrUpdateDevice'));
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('[LB] Unexpected update error:', err);
      setError(t('lbErrUnexpected'));
      setLoading(false);
      return;
    }

    setLoading(false);
    ReactGA.event('translator_update', { languages: selectedLangs.join(',') });
    setSubmitted(true);
    setTimeout(() => onSuccess(selectedLangs), 2000);
  };

  const handleDelete = async () => {
    setLoading(true); setError(null);
    const { data: deleted, error: dbError } = await supabase.rpc('delete_translator', {
      p_id:         existingId!,
      p_edit_token: getEditToken(existingId!) ?? '',
    });
    setLoading(false);
    if (dbError || !deleted) { setError(t('lbErrDelete')); return; }
    localStorage.removeItem(LB_TOKEN_KEY);
    ReactGA.event('translator_delete', {});
    setDeletedSuccess(true);
    setTimeout(() => onSuccess([]), 2000);
  };

  const handleSubmit = async () => {
    if (!fullName.trim())           { setError(t('lbErrName'));          return; }
    if (!phone.trim())              { setError(t('lbErrPhone'));       return; }
    if (!phoneMatch)                { setError(t('lbErrPhoneMismatch')); return; }
    if (selectedLangs.length === 0) { setError(t('lbErrLang')); return; }
    if (availMode === 'custom' && Object.values(customDays).every(d => !d.enabled)) {
      setError(t('lbErrDay')); return;
    }
    setLoading(true); setError(null);

    try {
      const builtAvail: Availability = availMode === '24_7'
        ? { type: '24_7', schedule: [] }
        : availMode === 'no_saturday'
          ? { type: 'no_saturday', schedule: [] }
          : { type: 'custom', schedule: Object.entries(customDays).filter(([, d]) => d.enabled).flatMap(([day, d]) => d.slots.map(slot => ({ day: parseInt(day), start: slot.start, end: slot.end }))) };
      const firstSlot = availMode === 'custom' ? Object.values(customDays).find(d => d.enabled)?.slots[0] : undefined;
      const payload = {
        full_name:               fullName.trim(),
        phone_number:            phone.trim(),
        languages:               selectedLangs,
        availability:            builtAvail,
        is_24_7:                 availMode === '24_7',
        start_time:              firstSlot?.start ?? null,
        end_time:                firstSlot?.end ?? null,
        time_slots:              availMode === 'custom' ? Object.values(customDays).filter(d => d.enabled).flatMap(d => d.slots) : [],
        emergency_only_contact:  emergencyContact,
      };
      const { data: registered, error: rpcError } = await supabase.rpc('register_translator', {
        p_full_name:              payload.full_name,
        p_phone_number:           payload.phone_number,
        p_languages:              payload.languages,
        p_availability:           payload.availability,
        p_is_24_7:                payload.is_24_7,
        p_start_time:             payload.start_time,
        p_end_time:               payload.end_time,
        p_time_slots:             payload.time_slots,
        p_emergency_only_contact: payload.emergency_only_contact,
      });

      let dbError = rpcError;
      let reg = registered as { id: string; edit_token?: string } | null;
      if (rpcError?.code === 'PGRST202') {
        // Security migration not applied yet — plain insert, no edit token issued
        const { data: inserted, error } = await supabase
          .from('translators')
          .insert(payload)
          .select('id')
          .single();
        dbError = error;
        reg = inserted as { id: string } | null;
      }

      if (dbError) {
        console.error('[LB] Supabase insert error:', dbError);
        setError(dbError.code === '23505' ? t('lbErrAlreadyRegistered') : t('lbErrSave', { msg: dbError.message }));
        setLoading(false);
        return;
      }

      const newId = reg?.id;
      if (newId) localStorage.setItem('lb_translator_id', newId);
      if (reg?.edit_token) localStorage.setItem(LB_TOKEN_KEY, reg.edit_token);
      setLoading(false);
      ReactGA.event('translator_registration', { languages: selectedLangs.join(',') });
      setSubmitted(true);
      setTimeout(() => onSuccess(selectedLangs, newId), 2000);
    } catch (err) {
      console.error('[LB] Unexpected insert error:', err);
      setError(t('lbErrUnexpected'));
      setLoading(false);
    }
  };

  // ── Success screens ───────────────────────────────────────────────────────────
  if (deletedSuccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 18 } }}
          className="w-20 h-20 rounded-full bg-fg-subtle flex items-center justify-center"
        >
          {/* theme-ok: white on a coloured button / badge */}
          <Check size={36} className="text-white" strokeWidth={3} />
        </motion.div>
        <p className="text-xl font-black text-fg">{t('lbRemoved')}</p>
        <p className="text-sm text-fg-muted">{t('lbRemovedSub')}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 18 } }}
          className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center"
          style={{ boxShadow: '0 8px 32px rgba(34,197,94,0.45)' }}
        >
          {/* theme-ok: white on a coloured button / badge */}
          <Check size={36} className="text-white" strokeWidth={3} />
        </motion.div>
        <p className="text-xl font-black text-fg">
          {mode === 'edit' ? t('lbUpdated') : t('lbRegistered')}
        </p>
        <p className="text-sm text-fg-muted">
          {mode === 'edit' ? t('lbUpdatedSub') : t('lbRegisteredSub')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5" style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom, 0px) + 2rem))' }}>

      {/* Identity recognition banner */}
      <AnimatePresence>
        {mode === 'edit' && (
          <motion.div
            key="edit-banner"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.25 } }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 border border-blue-400/40"
            style={{ background: 'rgba(59,130,246,0.12)' }}
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/25 flex items-center justify-center shrink-0">
              <UserPlus size={16} className="text-blue-700 dark:text-blue-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-blue-800 dark:text-blue-200">{t('lbAlreadyRegisteredBanner')}</span>
              <span className="text-xs text-blue-700 dark:text-blue-300/70">{t('lbAlreadyRegisteredSub')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-fg/50 uppercase tracking-wide">{t('lbFullName')}</label>
        <input
          type="text" value={fullName} onChange={e => setFullName(e.target.value)}
          placeholder={t('lbFullNamePlaceholder')}
          className="w-full rounded-xl px-4 py-3 text-sm bg-fg/8 border border-fg/15 text-fg placeholder-fg/35 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          style={{ background: 'rgb(var(--fg) / 0.07)' }}
        />
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-fg/50 uppercase tracking-wide">{t('lbPhone')}</label>
        <div className="relative">
          <input
            type="tel" value={phone} onChange={e => handlePhoneChange(e.target.value)}
            placeholder="05X-XXXXXXX" dir="ltr"
            className={`w-full rounded-xl px-4 py-3 pe-10 text-sm border text-fg placeholder-fg/35 focus:outline-none focus:ring-2 transition-all
              ${mode === 'edit'
                ? 'border-blue-400/70 focus:ring-blue-400/40'
                : 'border-fg/15 focus:ring-blue-400/50'
              }`}
            style={{ background: 'rgb(var(--fg) / 0.07)' }}
          />
          {mode === 'checking' && (
            <div className="absolute end-3 top-1/2 -translate-y-1/2">
              <Loader2 size={16} className="animate-spin text-fg/40" />
            </div>
          )}
          {mode === 'edit' && (
            <div className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              {/* theme-ok: white on a coloured button / badge */}
              <Check size={11} className="text-white" strokeWidth={3} />
            </div>
          )}
        </div>
      </div>

      {/* Phone confirm — only for new registrations */}
      {mode !== 'edit' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-fg/50 uppercase tracking-wide">{t('lbPhoneConfirm')}</label>
          <div className="relative">
            <input
              type="tel" value={phoneConfirm} onChange={e => setPhoneConfirm(e.target.value)}
              placeholder="05X-XXXXXXX" dir="ltr"
              className={`w-full rounded-xl px-4 py-3 pe-10 text-sm border text-fg placeholder-fg/35 focus:outline-none focus:ring-2 transition-all
                ${phoneMismatch
                  ? 'border-red-400/70 focus:ring-red-400/40'
                  : phoneMatch
                    ? 'border-emerald-400/70 focus:ring-emerald-400/40'
                    : 'border-fg/15 focus:ring-blue-400/50'
                }`}
              style={{ background: 'rgb(var(--fg) / 0.07)' }}
            />
            {phoneMatch && (
              <div className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                {/* theme-ok: white on a coloured button / badge */}
                <Check size={11} className="text-white" strokeWidth={3} />
              </div>
            )}
          </div>
          {phoneMismatch && (
            <p className="text-xs text-red-700 dark:text-red-400 font-medium flex items-center gap-1">
              <AlertCircle size={12} />
              {t('lbErrPhoneMismatch')}
            </p>
          )}
        </div>
      )}

      {/* Languages */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-fg/50 uppercase tracking-wide">{t('lbMyLangs')}</label>
        <div className="relative">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-fg/40 pointer-events-none" />
          <input
            type="text" value={formLangSearch} onChange={e => setFormLangSearch(e.target.value)}
            placeholder={t('lbSearchLang')}
            className="w-full rounded-xl px-4 py-2.5 ps-9 text-sm border border-fg/15 text-fg placeholder-fg/35 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            style={{ background: 'rgb(var(--fg) / 0.07)' }}
          />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {filteredFormLangs.map(lang => {
            const selected = selectedLangs.includes(lang.code);
            return (
              <button
                key={lang.code} onClick={() => toggleLang(lang.code)}
                className={`flex flex-col items-center gap-1 rounded-xl py-2.5 px-1 border transition-all active:scale-95
                  ${selected
                    ? 'border-blue-400/80 shadow-lg shadow-blue-500/30'
                    : 'border-fg/15'
                  }`}
                style={{ background: selected ? 'rgba(59,130,246,0.35)' : 'rgb(var(--fg) / 0.06)' }}
              >
                <span className="text-xl leading-none">{lang.flag}</span>
                <span className={`text-[0.6rem] font-semibold leading-tight text-center ${selected ? 'text-fg' : 'text-fg/70'}`}>
                  {langName(lang)}
                </span>
              </button>
            );
          })}
          {filteredFormLangs.length === 0 && (
            <p className="col-span-4 text-center text-sm text-fg/40 py-4">{t('lbNoLang')}</p>
          )}
        </div>

        {/* Language Request */}
        <div className="flex flex-col gap-2 mt-1">
          <p className="text-[0.72rem] text-fg/45 text-center leading-relaxed">
            {t('lbMotherTongueMissing')}
          </p>
          <LanguageRequestForm />
        </div>
      </div>

      {/* Availability */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold text-fg/50 uppercase tracking-wide">{t('lbAvailability')}</label>

        {/* Three-mode selector */}
        <div className="flex flex-col gap-2">
          {/* 24/7 */}
          <button
            type="button"
            onClick={() => setAvailMode('24_7')}
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 border-2 transition-all active:scale-[0.98]"
            style={{
              borderColor: availMode === '24_7' ? 'rgba(34,197,94,0.8)' : 'rgb(var(--fg) / 0.12)',
              background: availMode === '24_7' ? 'rgba(34,197,94,0.1)' : 'rgb(var(--fg) / 0.05)',
              boxShadow: availMode === '24_7' ? '0 0 0 3px rgba(34,197,94,0.1), 0 4px 20px rgba(34,197,94,0.18)' : 'none',
            }}
          >
            <ShieldCheck size={22} className={`shrink-0 ${availMode === '24_7' ? 'text-emerald-700 dark:text-emerald-400' : 'text-fg/40'}`} style={availMode === '24_7' ? { filter: 'drop-shadow(0 0 5px rgba(52,211,153,0.55))' } : undefined} />
            <div className="flex flex-col items-start flex-1">
              <span className="text-sm font-black text-fg">{t('lbAvail247')}</span>
              <span className="text-[0.65rem] text-fg/45">{t('lbAvail247Sub')}</span>
            </div>
            {availMode === '24_7' && <Check size={16} className="text-emerald-700 dark:text-emerald-400 shrink-0" />}
          </button>

          {/* 24/7 except Saturday */}
          <button
            type="button"
            onClick={() => setAvailMode('no_saturday')}
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 border-2 transition-all active:scale-[0.98]"
            style={{
              borderColor: availMode === 'no_saturday' ? 'rgba(251,191,36,0.8)' : 'rgb(var(--fg) / 0.12)',
              background: availMode === 'no_saturday' ? 'rgba(251,191,36,0.08)' : 'rgb(var(--fg) / 0.05)',
              boxShadow: availMode === 'no_saturday' ? '0 0 0 3px rgba(251,191,36,0.08), 0 4px 20px rgba(251,191,36,0.15)' : 'none',
            }}
          >
            <Moon size={22} className={`shrink-0 ${availMode === 'no_saturday' ? 'text-amber-800 dark:text-amber-400' : 'text-fg/40'}`} style={availMode === 'no_saturday' ? { filter: 'drop-shadow(0 0 5px rgba(251,191,36,0.5))' } : undefined} />
            <div className="flex flex-col items-start flex-1">
              <span className="text-sm font-black text-fg">{t('lbAvailNoSat')}</span>
              <span className="text-[0.65rem] text-fg/45">{t('lbAvailNoSatSub')}</span>
            </div>
            {availMode === 'no_saturday' && <Check size={16} className="text-amber-800 dark:text-amber-400 shrink-0" />}
          </button>

          {/* Custom schedule */}
          <button
            type="button"
            onClick={() => setAvailMode('custom')}
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 border-2 transition-all active:scale-[0.98]"
            style={{
              borderColor: availMode === 'custom' ? 'rgba(96,165,250,0.8)' : 'rgb(var(--fg) / 0.12)',
              background: availMode === 'custom' ? 'rgba(96,165,250,0.08)' : 'rgb(var(--fg) / 0.05)',
              boxShadow: availMode === 'custom' ? '0 0 0 3px rgba(96,165,250,0.08), 0 4px 20px rgba(59,130,246,0.18)' : 'none',
            }}
          >
            <CalendarDays size={22} className={`shrink-0 ${availMode === 'custom' ? 'text-blue-700 dark:text-blue-400' : 'text-fg/40'}`} />
            <div className="flex flex-col items-start flex-1">
              <span className="text-sm font-black text-fg">{t('lbAvailCustom')}</span>
              <span className="text-[0.65rem] text-fg/45">{t('lbAvailCustomSub')}</span>
            </div>
            {availMode === 'custom' && <Check size={16} className="text-blue-700 dark:text-blue-400 shrink-0" />}
          </button>
        </div>

        {/* Custom schedule panel */}
        <AnimatePresence initial={false}>
          {availMode === 'custom' && (
            <motion.div
              key="custom-schedule"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 rounded-xl px-3 py-3 border border-fg/15" style={{ background: 'rgb(var(--fg) / 0.05)' }}>

                {/* Header hint */}
                <p className="text-[0.62rem] text-fg/35 text-center font-semibold tracking-wide">{t('lbTapDay')}</p>

                {/* Day toggles */}
                <div className="flex gap-1.5 justify-between">
                  {Array.from({ length: 7 }, (_, day) => dayShort(day)).map((abbr, day) => {
                    const active = customDays[day].enabled;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setCustomDays(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }))}
                        className="flex-1 flex items-center justify-center rounded-xl py-2.5 border-2 transition-all active:scale-90"
                        style={{
                          borderColor: active
                            ? (day === 6 ? 'rgba(248,113,113,0.7)' : 'rgba(96,165,250,0.7)')
                            : 'rgb(var(--fg) / 0.1)',
                          background: active
                            ? (day === 6 ? 'rgba(248,113,113,0.12)' : 'rgba(59,130,246,0.12)')
                            : 'rgb(var(--fg) / 0.04)',
                        }}
                      >
                        <span className={`text-[0.7rem] font-black ${active ? (day === 6 ? 'text-red-700 dark:text-red-400' : 'text-blue-700 dark:text-blue-400') : 'text-fg/35'}`}>
                          {abbr}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Per-day time pickers */}
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 7 }, (_, day) => {
                    const d = customDays[day];
                    if (!d.enabled) return null;
                    return (
                      <div key={day} className="flex flex-col gap-1">
                        {d.slots.map((slot, si) => (
                          <div
                            key={si}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 border border-fg/10"
                            style={{ background: 'rgb(var(--fg) / 0.04)' }}
                          >
                            {si === 0
                              ? <span className="text-[0.65rem] font-black text-fg/55 w-16 shrink-0 text-start truncate">{dayName(day)}</span>
                              : <span className="w-16 shrink-0" />
                            }
                            <Clock size={12} className="text-fg/25 shrink-0" />
                            <input
                              type="time"
                              value={slot.start}
                              onChange={e => setCustomDays(prev => {
                                const slots = [...prev[day].slots];
                                slots[si] = { ...slots[si], start: e.target.value };
                                return { ...prev, [day]: { ...prev[day], slots } };
                              })}
                              className="text-sm font-black bg-transparent text-fg focus:outline-none min-h-[36px] cursor-pointer tracking-wide w-20"
                            />
                            <span className="text-fg/25 font-black text-xs">—</span>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={e => setCustomDays(prev => {
                                const slots = [...prev[day].slots];
                                slots[si] = { ...slots[si], end: e.target.value };
                                return { ...prev, [day]: { ...prev[day], slots } };
                              })}
                              className="text-sm font-black bg-transparent text-fg focus:outline-none min-h-[36px] cursor-pointer tracking-wide w-20"
                            />
                            <div className="flex gap-1 ms-auto">
                              {d.slots.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setCustomDays(prev => {
                                    const slots = prev[day].slots.filter((_, i) => i !== si);
                                    return { ...prev, [day]: { ...prev[day], slots } };
                                  })}
                                  className="w-6 h-6 flex items-center justify-center rounded-lg text-fg/35 hover:text-red-400 transition-colors"
                                  style={{ background: 'rgb(var(--fg) / 0.06)' }}
                                >
                                  <span className="text-base leading-none font-black">−</span>
                                </button>
                              )}
                              {si === d.slots.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => setCustomDays(prev => {
                                    const slots = [...prev[day].slots, { start: '08:00', end: '17:00' }];
                                    return { ...prev, [day]: { ...prev[day], slots } };
                                  })}
                                  className="w-6 h-6 flex items-center justify-center rounded-lg text-fg/35 hover:text-blue-400 transition-colors"
                                  style={{ background: 'rgb(var(--fg) / 0.06)' }}
                                >
                                  <span className="text-base leading-none font-black">+</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {Object.values(customDays).every(d => !d.enabled) && (
                  <p className="text-xs text-amber-800 dark:text-amber-400/80 text-center font-semibold py-1">
                    {t('lbPickDay')}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Emergency contact — premium info card */}
      <div
        className="rounded-2xl border overflow-hidden transition-all"
        style={{
          borderColor: emergencyContact ? 'rgba(251,113,133,0.55)' : 'rgba(251,146,60,0.28)',
          background: emergencyContact
            ? 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(251,146,60,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(251,146,60,0.07) 0%, rgba(239,68,68,0.04) 100%)',
          boxShadow: emergencyContact
            ? '0 0 0 1px rgba(251,113,133,0.18), 0 6px 24px rgba(239,68,68,0.12)'
            : '0 0 0 1px rgba(251,146,60,0.08)',
        }}
      >
        {/* Card header */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b" style={{ borderColor: 'rgba(251,146,60,0.18)' }}>
          <AlertCircle size={13} className="text-orange-700 dark:text-orange-400 shrink-0" />
          <span className="text-[0.62rem] font-black text-orange-700 dark:text-orange-300 uppercase tracking-widest">{t('lbExceptional')}</span>
        </div>
        {/* Card body */}
        <button
          type="button"
          onClick={() => setEmergencyContact(prev => !prev)}
          className="flex items-center gap-4 w-full px-4 py-3.5 text-start transition-all active:scale-[0.99]"
        >
          <div className="flex flex-col text-start flex-1 gap-0.5">
            <span className="text-sm font-bold text-fg leading-snug">
              {t('lbEmergencyQuestion')}
            </span>
            <span className={`text-[0.68rem] font-semibold transition-colors ${emergencyContact ? 'text-orange-700 dark:text-orange-300' : 'text-fg/35'}`}>
              {emergencyContact ? t('lbEmergencyYes') : t('lbEmergencyNo')}
            </span>
          </div>
          {/* iOS-style animated toggle */}
          <div
            className="shrink-0 relative w-12 h-6.5 rounded-full transition-all duration-300"
            style={{
              width: 48,
              height: 28,
              background: emergencyContact
                ? 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)'
                : 'rgb(var(--fg) / 0.12)',
              boxShadow: emergencyContact ? '0 2px 12px rgba(249,115,22,0.5)' : 'none',
            }}
          >
            <div
              // theme-ok: white on a coloured button / badge
              className="absolute top-0.5 rounded-full bg-white shadow-md transition-all duration-300"
              style={{
                width: 23,
                height: 23,
                left: emergencyContact ? 22 : 2,
                // theme-ok: white on a coloured button / badge
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              }}
            />
          </div>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 border border-red-400/40 text-red-700 dark:text-red-300 text-sm" style={{ background: 'rgba(239,68,68,0.12)' }}>
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Contextual action buttons */}
      <AnimatePresence mode="wait">
        {mode === 'edit' ? (
          <motion.div
            key="edit-actions"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            <button
              onClick={handleUpdate} disabled={loading}
              // theme-ok: white on a coloured button / badge
              className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 text-white font-black text-base transition-all active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', boxShadow: '0 6px 24px rgba(59,130,246,0.4)' }}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
              {loading ? t('lbSaving') : t('lbUpdateDetails')}
            </button>
            <button
              onClick={handleDelete} disabled={loading}
              className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 font-bold text-sm transition-all active:scale-95 disabled:opacity-60 border-2 bg-transparent"
              style={{ borderColor: 'rgba(239,68,68,0.35)', color: 'rgb(220,38,38)' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <AlertCircle size={18} />}
              {t('lbRemoveMe')}
            </button>
          </motion.div>
        ) : (
          <motion.div key="new-action" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button
              onClick={handleSubmit} disabled={loading || phoneMismatch || (phoneConfirm.trim() !== '' && !phoneMatch)}
              // theme-ok: white on a coloured button / badge
              className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 text-white font-black text-base transition-all active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', boxShadow: '0 6px 24px rgba(59,130,246,0.4)' }}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
              {loading ? t('lbSaving') : t('lbJoinTeam')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── My Profile Card ──────────────────────────────────────────────────────────

interface MyTranslatorData {
  id: string;
  full_name: string;
  phone_number: string;
  languages: string[];
  is_24_7: boolean;
  start_time: string | null;
  end_time: string | null;
  time_slots: TimeSlot[] | null;
  emergency_only_contact: boolean;
  availability: Availability | null;
}

function MyProfileCard({ id, allLanguages, onDeleted, onEdit }: {
  id: string;
  allLanguages: Language[];
  onDeleted: () => void;
  onEdit: (phone: string) => void;
}) {
  const t = useTranslation();
  const [data, setData]               = useState<MyTranslatorData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    supabase
      .from('translators')
      .select('id, full_name, phone_number, languages, is_24_7, start_time, end_time, time_slots, emergency_only_contact, availability')
      .eq('id', id)
      .maybeSingle()
      .then(({ data: row }) => {
        if (row) {
          setData(row as MyTranslatorData);
        } else {
          localStorage.removeItem('lb_translator_id');
          onDeleted();
        }
        setLoading(false);
      });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    setSaving(true);
    const { data: deleted, error: dbError } = await supabase.rpc('delete_translator', {
      p_id:         id,
      p_edit_token: getEditToken(id) ?? '',
    });
    setSaving(false);
    if (dbError || !deleted) {
      console.error('[LB] Delete error:', dbError);
      return;
    }
    localStorage.removeItem('lb_translator_id');
    localStorage.removeItem(LB_TOKEN_KEY);
    onDeleted();
  };

  if (loading) {
    return (
      <div
        className="rounded-2xl border border-fg/15 px-4 py-4 flex items-center gap-3"
        style={{ background: 'rgb(var(--fg) / 0.06)', backdropFilter: 'blur(12px)' }}
      >
        <Loader2 size={18} className="animate-spin text-fg/40" />
        <span className="text-sm text-fg/50">{t('lbLoadingProfile')}</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.28 } }}
      className="rounded-2xl border border-blue-400/30 overflow-hidden"
      style={{
        background: 'rgba(59,130,246,0.1)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 4px 24px rgba(59,130,246,0.14), inset 0 1px 0 rgb(var(--fg) / 0.12)',
      }}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2.5 border-b border-fg/10">
        <div className="w-9 h-9 rounded-full bg-blue-500/25 flex items-center justify-center shrink-0">
          <UserPlus size={16} className="text-blue-700 dark:text-blue-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[0.6rem] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">{t('lbMyProfile')}</p>
          <p className="text-sm font-bold text-fg truncate">{data.full_name}</p>
        </div>
      </div>

      <div className="px-4 py-3 flex flex-col gap-2.5">
        {/* Languages */}
        <div className="flex flex-wrap gap-1">
          {data.languages.map(code => {
            const lang = allLanguages.find(l => l.code === code);
            return lang ? (
              <span key={code} className="text-[0.65rem] px-2 py-0.5 rounded-full bg-fg/10 text-fg/70 border border-fg/10">
                {lang.flag} {langName(lang)}
              </span>
            ) : null;
          })}
        </div>

        {/* Availability status */}
        <div className="flex flex-col gap-0.5">
          {(() => {
            const avail = data.availability;
            if (avail) {
              if (avail.type === '24_7') return <p className="text-xs text-emerald-700 dark:text-emerald-400/80 flex items-center gap-1"><ShieldCheck size={11} />{t('lbAvail247')}</p>;
              if (avail.type === 'no_saturday') return <p className="text-xs text-amber-800 dark:text-amber-400/80 flex items-center gap-1"><Moon size={11} />{t('lbAvailNoSat')}</p>;
              if (avail.type === 'custom' && avail.schedule.length > 0) return (
                <>
                  {avail.schedule.map((entry, i) => (
                    <p key={i} className="text-xs text-fg/45 flex items-center gap-1">
                      <Clock size={11} />
                      <span className="font-semibold text-[0.6rem] text-fg/35">{dayShort(entry.day)}</span>
                      {formatTime(entry.start)} – {formatTime(entry.end)}
                    </p>
                  ))}
                </>
              );
            }
            if (data.is_24_7) return <p className="text-xs text-emerald-700 dark:text-emerald-400/80 flex items-center gap-1"><ShieldCheck size={11} />{t('lbAvail247')}</p>;
            return (data.time_slots && data.time_slots.length > 0
              ? data.time_slots
              : (data.start_time && data.end_time ? [{ start: data.start_time, end: data.end_time }] : [])
            ).map((slot, i) => (
              <p key={i} className="text-xs text-fg/45 flex items-center gap-1">
                <Clock size={11} />
                {formatTime(slot.start)} – {formatTime(slot.end)}
              </p>
            ));
          })()}
        </div>

        {/* Actions */}
        {!confirmDelete ? (
          <div className="flex items-center gap-3 mt-0.5">
            <button
              onClick={() => onEdit(data.phone_number)}
              className="text-xs text-blue-700 dark:text-blue-400/80 hover:text-blue-300 font-bold transition-colors"
            >
              {t('lbEditDetails')}
            </button>
            <span className="text-fg/20 text-xs">|</span>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-red-700 dark:text-red-400/60 hover:text-red-400 font-semibold transition-colors"
            >
              {t('lbRemoveProfile')}
            </button>
          </div>
        ) : (
          <div className="flex gap-2 mt-0.5">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-1.5 rounded-xl text-xs font-bold border border-fg/15 text-fg/60 active:scale-95 transition-all"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 py-1.5 rounded-xl text-xs font-bold border border-red-400/40 text-red-700 dark:text-red-300 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
              style={{ background: 'rgba(239,68,68,0.15)' }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : t('lbDeleteForever')}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────────

type View = 'intro' | 'languages' | 'translators' | 'register';

const getStartView = (): View =>
  localStorage.getItem('lb_intro_seen') ? 'languages' : 'intro';

export default function LanguageBridgeModal({ isOpen, onClose }: Props) {
  const t = useTranslation();
  useLanguage(); // re-render (language names, day names) when the interface language changes
  const [view, setView]                 = useState<View>(getStartView);
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [translators, setTranslators]   = useState<Translator[]>([]);
  const [allTranslators, setAllTranslators] = useState<Translator[]>([]);
  const [customLanguages, setCustomLanguages] = useState<Language[]>([]);
  const [loadingList, setLoadingList]   = useState(false);
  const [loadingAll, setLoadingAll]     = useState(false);
  const [langSearch, setLangSearch]     = useState('');
  const [showInfo, setShowInfo]         = useState(false);
  const [registerMode, setRegisterMode] = useState<'new' | 'checking' | 'edit'>('new');
  const [myTranslatorId, setMyTranslatorId] = useState<string | null>(() => localStorage.getItem('lb_translator_id'));
  const [prefillPhone, setPrefillPhone] = useState<string | undefined>(undefined);
  const [assistCount, setAssistCount]   = useState(0);

  const allLanguages = [...STATIC_LANGUAGES, ...customLanguages];

  // ── View-aware back-button handler ─────────────────────────────────────────
  // First back press from a sub-view → go to the language grid.
  // Second press (or back from the grid itself) → close the modal.

  const viewRef = useRef(view);
  viewRef.current = view;

  // ── Language-grid scroll preservation ────────────────────────────────────────
  // The body scroller is shared by all views; leaving the grid clamps its
  // scrollTop to 0. Track the grid's position live and restore it on re-mount.
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const langGridScrollRef = useRef(0);

  const handleBodyScroll = useCallback(() => {
    if (viewRef.current === 'languages' && scrollBodyRef.current) {
      langGridScrollRef.current = scrollBodyRef.current.scrollTop;
    }
  }, []);

  // Callback ref on the grid view — fires when the grid mounts back into the DOM
  const restoreLangGridScroll = useCallback((node: HTMLDivElement | null) => {
    if (node && scrollBodyRef.current) {
      scrollBodyRef.current.scrollTop = langGridScrollRef.current;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Push one history entry for this modal session.
    window.history.pushState({ lbModal: true }, '');
    let closedByBack = false;

    const handlePop = () => {
      const currentView = viewRef.current;
      if (currentView !== 'languages' && currentView !== 'intro') {
        // Internal navigation: return to the grid and re-push a state entry
        // so the next back press fires another popstate.
        setView('languages');
        setSelectedLang(null);
        setTranslators([]);
        window.history.pushState({ lbModal: true }, '');
      } else {
        // Already at the root view — close the modal.
        closedByBack = true;
        onClose();
      }
    };

    window.addEventListener('popstate', handlePop);
    return () => {
      window.removeEventListener('popstate', handlePop);
      // If closed by X / programmatically, pop our single history entry.
      if (!closedByBack) window.history.back();
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data fetching ──────────────────────────────────────────────────────────

  // Spinner only on first load — realtime refetches update the grid in place,
  // without unmounting it (which would reset the scroll position)
  const hasLoadedAllRef = useRef(false);

  const fetchAllTranslators = useCallback(() => {
    if (!hasLoadedAllRef.current) setLoadingAll(true);
    supabase
      .from('translators')
      .select('id, full_name, phone_number, languages, is_24_7, start_time, end_time, time_slots, emergency_only_contact, availability')
      .then(({ data }) => {
        hasLoadedAllRef.current = true;
        setAllTranslators((data as Translator[]) ?? []);
        setLoadingAll(false);
      });
  }, []);

  const fetchCustomLanguages = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('custom_languages')
        .select('code, name, flag');
      if (data) {
        setCustomLanguages(data.map(d => ({ ...d, custom: true })));
      }
    } catch {
      // Table may not exist yet
    }
  }, []);

  const fetchAssistCount = useCallback(async () => {
    console.log('[LB] fetchAssistCount: querying global_counters...');
    const { data, error } = await supabase
      .from('global_counters')
      .select('count')
      .eq('id', 'translation_assists')
      .single();
    console.log('[LB] fetchAssistCount result:', { data, error });
    if (data) setAssistCount(data.count as number);
  }, []);

  const incrementCounter = useCallback(async () => {
    setAssistCount(prev => prev + 1);
    await supabase.rpc('increment_counter', { counter_id: 'translation_assists' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      ReactGA.event('modal_view', { modal: 'language_bridge' });
      fetchAllTranslators();
      fetchCustomLanguages();
      fetchAssistCount();
    }
  }, [isOpen, fetchAllTranslators, fetchCustomLanguages, fetchAssistCount]);

  const fetchForLanguage = useCallback(async (langCode: string) => {
    setLoadingList(true);
    const { data } = await supabase
      .from('translators')
      .select('id, full_name, phone_number, languages, is_24_7, start_time, end_time, time_slots, emergency_only_contact, availability')
      .contains('languages', [langCode]);
    setTranslators((data as Translator[]) ?? []);
    setLoadingList(false);
  }, []);

  // ── Real-time sync: any change to translators table refreshes all open modals ──
  const selectedLangRef = useRef<Language | null>(null);
  selectedLangRef.current = selectedLang;

  useEffect(() => {
    if (!isOpen) return;
    const channel = supabase
      .channel('lb_translators_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'translators' }, () => {
        fetchAllTranslators();
        const cur = selectedLangRef.current;
        if (cur) fetchForLanguage(cur.code);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isOpen, fetchAllTranslators, fetchForLanguage]);

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleLangSelect = (lang: Language) => {
    ReactGA.event('language_select', { language_code: lang.code, language_name: lang.name });
    if (lang.code === 'isl') {
      ReactGA.event('sign_language_selected', {});
    }
    setTranslators([]);
    setSelectedLang(lang);
    setView('translators');
    fetchForLanguage(lang.code);
  };

  const handleBack = () => {
    setView('languages');
    setSelectedLang(null);
    setTranslators([]);
    setRegisterMode('new');
    setPrefillPhone(undefined);
  };

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView(getStartView());
        setSelectedLang(null);
        setTranslators([]);
        setLangSearch('');
        langGridScrollRef.current = 0;
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const available = translators.filter(isAvailableNow);
  const emergencyBackups = translators.filter(tr => !isAvailableNow(tr) && tr.emergency_only_contact);
  const countFor = (code: string) => allTranslators.filter(tr => tr.languages.includes(code)).length;

  // Staffed languages first, empty ones after — stable sort keeps the curated
  // order within each group
  const filteredLangs = allLanguages
    .filter(l => matchesLangSearch(l, langSearch))
    .sort((a, b) => (countFor(b.code) > 0 ? 1 : 0) - (countFor(a.code) > 0 ? 1 : 0));
  const noResults = langSearch.trim().length > 0 && filteredLangs.length === 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col animate-fade-scale bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-[#0d0d18] dark:via-[#111827] dark:to-[#0f172a]"
    >
      {/* Header */}
      <div
        className="shrink-0 flex items-center px-4 border-b border-fg/10"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
          paddingBottom: '12px',
          background: 'rgb(var(--page) / 0.85)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {(view === 'translators' || view === 'register') ? (
          <button
            onClick={handleBack}
            className="p-2 -ms-2 rounded-xl text-fg/60 active:bg-fg/10"
            aria-label={t('back')}
          >
            <ChevronRight size={22} className="ltr:rotate-180" />
          </button>
        ) : view === 'languages' ? (
          <button
            onClick={() => setView('register')}
            className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold text-fg/85 border border-fg/20 active:scale-95 transition-all"
            style={{
              background: 'rgb(var(--fg) / 0.08)',
              backdropFilter: 'blur(12px)',
              boxShadow: 'inset 0 1px 0 rgb(var(--fg) / 0.12), 0 2px 6px rgba(0,0,0,0.12)',
            }}
          >
            <UserPlus size={13} />
            {t('lbJoin')}
          </button>
        ) : (
          <div className="w-10" />
        )}

        <div className="flex-1 text-center">
          {view === 'translators' && selectedLang ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{selectedLang.flag}</span>
              <h1 className="text-lg font-black text-fg">{langName(selectedLang)}</h1>
            </div>
          ) : view === 'register' ? (
            <h1 className="text-lg font-black text-fg leading-tight">
              {registerMode === 'edit' ? t('lbEditProfileTitle') : t('lbJoinTeam')}
            </h1>
          ) : view === 'languages' ? (
            <h1 className="text-base font-black text-fg leading-snug">{t('lbChooseLang')}</h1>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Globe size={20} className="text-blue-700 dark:text-blue-400" />
              <h1 className="text-lg font-black text-fg">{t('lbTitle')}</h1>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {view !== 'intro' && (
            <button
              onClick={() => setShowInfo(true)}
              className="p-2 rounded-xl text-fg/65 active:bg-fg/10 transition-all"
              aria-label={t('lbAboutAria')}
            >
              <HelpCircle size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 -me-2 rounded-xl text-fg/60 active:bg-fg/10"
            aria-label={t('close')}
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Info Overlay */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            key="info-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center px-5"
            // theme-ok: dim backdrop behind a dialog
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.34, 1.2, 0.64, 1] } }}
              exit={{ opacity: 0, scale: 0.92, y: 8, transition: { duration: 0.2 } }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl overflow-hidden bg-surface/90 border border-line"
              style={{
                backdropFilter: 'blur(28px) saturate(1.6)',
                // theme-ok: drop shadow
                boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/35 flex items-center justify-center shrink-0">
                    <Info size={18} className="text-blue-700 dark:text-blue-300" />
                  </div>
                  <h3 className="font-black text-fg text-2xl leading-tight">{t('lbAboutTitle')}</h3>
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  className="w-7 h-7 rounded-full bg-fg/10 flex items-center justify-center text-fg/70 active:bg-fg/20"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 pb-8 flex flex-col items-center gap-4 text-center">
                {/* 3D-style globe icon */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                    boxShadow: '0 8px 28px rgba(99,102,241,0.45), inset 0 1px 0 rgb(var(--fg) / 0.25)',
                  }}
                >
                  {/* theme-ok: white on a coloured button / badge */}
                  <Globe size={30} className="text-white" />
                </div>

                <div
                  className="rounded-2xl px-4 py-4 w-full"
                  style={{ background: 'rgb(var(--fg) / 0.08)' }}
                >
                  <p className="text-fg/90 text-[0.9rem] leading-[1.75] font-semibold text-center">
                    {t('lbAboutBody')}
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-2.5 justify-center">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/25 flex items-center justify-center shrink-0">
                      <Check size={11} className="text-emerald-700 dark:text-emerald-300" />
                    </div>
                    <p className="text-fg/70 text-sm leading-snug text-start">{t('lbAbout1')}</p>
                  </div>
                  <div className="flex items-center gap-2.5 justify-center">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/25 flex items-center justify-center shrink-0">
                      <Check size={11} className="text-emerald-700 dark:text-emerald-300" />
                    </div>
                    <p className="text-fg/70 text-sm leading-snug text-start">{t('lbAbout2')}</p>
                  </div>
                  <div className="flex items-center gap-2.5 justify-center">
                    <div className="w-5 h-5 rounded-full bg-blue-500/25 flex items-center justify-center shrink-0">
                      <UserPlus size={11} className="text-blue-700 dark:text-blue-300" />
                    </div>
                    <p className="text-fg/70 text-sm leading-snug text-start">{t('lbAbout3')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable body with animated views */}
      <div className="flex-1 overflow-y-auto" ref={scrollBodyRef} onScroll={handleBodyScroll}>
        <AnimatePresence mode="wait">

          {/* ── Intro ── */}
          {view === 'intro' && (
            <motion.div key="intro" {...INTRO_PAGE}>
              <IntroScreen onStart={() => setView('languages')} assistCount={assistCount} />
            </motion.div>
          )}

          {/* ── Language Grid ── */}
          {view === 'languages' && (
            <motion.div key="languages" {...PAGE} ref={restoreLangGridScroll}>
              <div className="p-4" style={{ paddingBottom: 'max(3rem, calc(env(safe-area-inset-bottom, 0px) + 2rem))' }}>

                {/* Assist counter badge */}
                {assistCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.1 } }}
                    className="flex items-center justify-center gap-3 mb-4 rounded-2xl px-4 py-3"
                    style={{
                      background: 'rgb(var(--fg) / 0.09)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgb(var(--fg) / 0.15)',
                      boxShadow: '0 4px 24px rgba(59,130,246,0.1), inset 0 1px 0 rgb(var(--fg) / 0.12)',
                    }}
                  >
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
                    </span>
                    <CountUpNumber
                      value={assistCount}
                      className="text-lg font-black tabular-nums"
                      style={{
                        background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    />
                    <span className="text-xs text-fg/60 font-semibold">{t('lbAssistCalls')}</span>
                  </motion.div>
                )}

                {/* Recruitment share banner */}
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.15 } }}
                  className="flex items-center gap-3 mb-4 rounded-2xl px-4 py-3.5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(130,35,52,0.95) 0%, rgba(158,48,68,0.92) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(200,80,100,0.2)',
                    boxShadow: '0 4px 20px rgba(130,35,52,0.25), inset 0 1px 0 rgb(var(--fg) / 0.08)',
                  }}
                >
                  {/* theme-ok: white text on the dark-red recruitment banner */}
                  <p className="flex-1 text-white text-xs leading-relaxed font-black">
                    {t('lbRecruitBanner')}
                  </p>
                  <button
                    onClick={async () => {
                      ReactGA.event('emergency_recruitment_share', { source: 'language_grid_banner' });
                      const shareData = {
                        title: t('lbShareTitle'),
                        text: t('lbShareText'),
                        url: 'https://hovesh-plus.vercel.app/',
                      };
                      try {
                        if (navigator.share) {
                          await navigator.share(shareData);
                        } else {
                          await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                          alert(t('lbLinkCopied'));
                        }
                      } catch { /* user cancelled */ }
                    }}
                    className="shrink-0 flex flex-col items-center gap-1 active:opacity-70 active:scale-90 transition-all"
                    aria-label={t('share')}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: 'rgb(var(--fg) / 0.22)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                    >
                      {/* theme-ok: white on a coloured button / badge */}
                      <Share2 size={18} className="text-white" />
                    </div>
                    {/* theme-ok: on the dark-red banner */}
                    <span className="text-[9px] font-black text-fg/90 whitespace-nowrap">{t('share')}</span>
                  </button>
                </motion.div>

                {/* My Profile Card */}
                {myTranslatorId && (
                  <div className="mb-4">
                    <MyProfileCard
                      id={myTranslatorId}
                      allLanguages={allLanguages}
                      onDeleted={() => {
                        setMyTranslatorId(null);
                        setTranslators([]);
                        fetchAllTranslators();
                        if (selectedLang) fetchForLanguage(selectedLang.code);
                      }}
                      onEdit={(phone) => { setPrefillPhone(phone); setView('register'); }}
                    />
                  </div>
                )}

                <div className="relative mb-4">
                  <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
                  <input
                    type="text" value={langSearch}
                    onChange={e => setLangSearch(e.target.value)}
                    placeholder={t('lbSearchLang')}
                    className="w-full rounded-xl px-4 py-2.5 ps-9 text-sm bg-fg/10 border border-fg/20 text-fg placeholder-fg/40 focus:outline-none focus:ring-2 focus:ring-fg/30 backdrop-blur-sm"
                  />
                </div>

                {loadingAll ? (
                  <div className="flex justify-center py-12">
                    <Loader2 size={28} className="animate-spin text-blue-700 dark:text-blue-400" />
                  </div>
                ) : noResults ? (
                  <div className="flex flex-col gap-4 py-4">
                    <p className="text-center text-sm text-fg-subtle">
                      {t('lbNoMatchingLang')}
                    </p>
                    <LanguageRequestForm />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                      {filteredLangs.map(lang => (
                        <LangCard
                          key={lang.code}
                          lang={lang}
                          count={countFor(lang.code)}
                          onClick={() => handleLangSelect(lang)}
                        />
                      ))}
                    </div>
                    <LanguageRequestForm />
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* ── Translator List ── */}
          {view === 'translators' && (
            <motion.div key="translators" {...PAGE}>
              <div className="p-4 flex flex-col gap-4">
                {loadingList ? (
                  <div className="flex justify-center py-16">
                    <Loader2 size={28} className="animate-spin text-blue-700 dark:text-blue-400" />
                  </div>
                ) : translators.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <span className="text-5xl">{selectedLang?.flag}</span>
                    <p className="font-bold text-fg/80">{t('lbNoTranslatorsYet')}</p>
                    <p className="text-sm text-fg-subtle">
                      {t('lbBeFirst')}
                    </p>
                    <button
                      onClick={() => setView('register')}
                      className="mt-2 px-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold active:scale-95 transition-all"
                    >
                      {t('lbJoinAsTranslator')}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Currently active translators */}
                    {available.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 px-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow shadow-emerald-400/60 animate-pulse" />
                          <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                            {t('lbAvailableNow', { n: available.length })}
                          </span>
                        </div>
                        {available.map(tr => (
                          <TranslatorCard key={tr.id} translator={tr} available allLanguages={allLanguages} selectedLangName={selectedLang?.name} isSignLanguage={selectedLang?.code === 'isl'} onContact={incrementCounter} />
                        ))}
                      </div>
                    )}

                    {/* No active translators state */}
                    {available.length === 0 && (
                      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-fg/8 flex items-center justify-center">
                          <Clock size={28} className="text-fg/30" />
                        </div>
                        <p className="font-bold text-fg/70">{t('lbNoneAvailable')}</p>
                        {emergencyBackups.length === 0 && (
                          <p className="text-sm text-fg/35 max-w-[200px]">
                            {translators.length > 0
                              ? t('lbRegisteredNotAvailable', { n: translators.length })
                              : t('lbBeFirst')}
                          </p>
                        )}
                        {translators.length === 0 && (
                          <button
                            onClick={() => setView('register')}
                            className="mt-1 px-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold active:scale-95 transition-all"
                          >
                            {t('lbJoinAsTranslator')}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Emergency fallback — always visible when emergency_only_contact=true and out of hours */}
                    {emergencyBackups.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 px-1">
                          <div className="w-2 h-2 rounded-full bg-orange-500 shadow shadow-orange-400/50" />
                          <span className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-wide">
                            {t('lbEmergencyOnlyCount', { n: emergencyBackups.length })}
                          </span>
                        </div>
                        {emergencyBackups.map(tr => (
                          <TranslatorCard key={tr.id} translator={tr} available={false} isEmergency allLanguages={allLanguages} selectedLangName={selectedLang?.name} isSignLanguage={selectedLang?.code === 'isl'} onContact={incrementCounter} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Register Form ── */}
          {view === 'register' && (
            <motion.div key="register" {...PAGE}>
              <RegisterForm
                allLanguages={allLanguages}
                onModeChange={setRegisterMode}
                initialPhone={prefillPhone}
                onSuccess={(langs, newId) => {
                  if (newId) {
                    setMyTranslatorId(newId);
                    // Optimistic add for new registration only
                    setAllTranslators(prev => [
                      ...prev,
                      { id: newId, full_name: '', phone_number: '', languages: langs, is_24_7: false, start_time: null, end_time: null, time_slots: null, emergency_only_contact: false, availability: null }
                    ]);
                  } else if (langs.length === 0) {
                    // Deletion path — clear own id
                    setMyTranslatorId(null);
                  }
                  setPrefillPhone(undefined);
                  setRegisterMode('new');
                  setView('languages');
                  fetchAllTranslators();
                }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
