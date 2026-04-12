import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Phone, Globe, ChevronRight, UserPlus, Clock, Check,
  Loader2, AlertCircle, Search, Plus, Languages, Info, Send,
  HelpCircle, ShieldCheck, Trash2, Users, Video, Share2,
} from 'lucide-react';
import ReactGA from 'react-ga4';
import { supabase } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface TimeSlot { start: string; end: string; }

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
}

interface Language {
  code: string;
  name: string;
  flag: string;
  custom?: boolean;
}

// ─── 52 Languages ─────────────────────────────────────────────────────────────

const STATIC_LANGUAGES: Language[] = [
  { code: 'isl',   name: 'שפת סימנים',         flag: '🤟' },
  { code: 'ru',    name: 'רוסית',              flag: '🇷🇺' },
  { code: 'ar',    name: 'ערבית',              flag: '🇸🇦' },
  { code: 'am',    name: 'אמהרית',             flag: '🇪🇹' },
  { code: 'en',    name: 'אנגלית',             flag: '🇬🇧' },
  { code: 'fr',    name: 'צרפתית',             flag: '🇫🇷' },
  { code: 'es',    name: 'ספרדית',             flag: '🇪🇸' },
  { code: 'ro',    name: 'רומנית',             flag: '🇷🇴' },
  { code: 'ti',    name: 'טיגרינית',           flag: '🇪🇷' },
  { code: 'ka',    name: 'גיאורגית',           flag: '🇬🇪' },
  { code: 'yi',    name: 'יידיש',              flag: '✡️'  },
  { code: 'th',    name: 'תאית',               flag: '🇹🇭' },
  { code: 'zh',    name: 'סינית',              flag: '🇨🇳' },
  { code: 'uk',    name: 'אוקראינית',          flag: '🇺🇦' },
  { code: 'he',    name: 'עברית',              flag: '🇮🇱' },
  { code: 'it',    name: 'איטלקית',            flag: '🇮🇹' },
  { code: 'de',    name: 'גרמנית',             flag: '🇩🇪' },
  { code: 'pt',    name: 'פורטוגזית',          flag: '🇵🇹' },
  { code: 'hi',    name: 'הינדי',              flag: '🇮🇳' },
  { code: 'tr',    name: 'טורקית',             flag: '🇹🇷' },
  { code: 'hu',    name: 'הונגרית',            flag: '🇭🇺' },
  { code: 'pl',    name: 'פולנית',             flag: '🇵🇱' },
  { code: 'bg',    name: 'בולגרית',            flag: '🇧🇬' },
  { code: 'cs',    name: "צ'כית",              flag: '🇨🇿' },
  { code: 'sr',    name: 'סרבית',              flag: '🇷🇸' },
  { code: 'hr',    name: 'קרואטית',            flag: '🇭🇷' },
  { code: 'sq',    name: 'אלבנית',             flag: '🇦🇱' },
  { code: 'el',    name: 'יוונית',             flag: '🇬🇷' },
  { code: 'nl',    name: 'הולנדית',            flag: '🇳🇱' },
  { code: 'sv',    name: 'שוודית',             flag: '🇸🇪' },
  { code: 'no',    name: 'נורווגית',           flag: '🇳🇴' },
  { code: 'da',    name: 'דנית',               flag: '🇩🇰' },
  { code: 'fi',    name: 'פינית',              flag: '🇫🇮' },
  { code: 'ja',    name: 'יפנית',              flag: '🇯🇵' },
  { code: 'ko',    name: 'קוריאנית',           flag: '🇰🇷' },
  { code: 'vi',    name: 'וייטנאמית',          flag: '🇻🇳' },
  { code: 'id',    name: 'אינדונזית',          flag: '🇮🇩' },
  { code: 'tl',    name: 'טגלוג',              flag: '🇵🇭' },
  { code: 'sw',    name: 'סוואהילי',           flag: '🇰🇪' },
  { code: 'so',    name: 'סומלית',             flag: '🇸🇴' },
  { code: 'fa',    name: 'פרסית',              flag: '🇮🇷' },
  { code: 'ur',    name: 'אורדו',              flag: '🇵🇰' },
  { code: 'bn',    name: 'בנגלית',             flag: '🇧🇩' },
  { code: 'ta',    name: 'טמילית',             flag: '🇮🇳' },
  { code: 'ne',    name: 'נפאלית',             flag: '🇳🇵' },
  { code: 'az',    name: 'אזרית',              flag: '🇦🇿' },
  { code: 'hy',    name: 'ארמנית',             flag: '🇦🇲' },
  { code: 'kk',    name: 'קזחית',              flag: '🇰🇿' },
  { code: 'uz',    name: 'אוזבקית',            flag: '🇺🇿' },
  { code: 'ms',    name: 'מלאית',              flag: '🇲🇾' },
  { code: 'ps',    name: 'פשטו',               flag: '🇦🇫' },
  { code: 'mk',    name: 'מקדונית',            flag: '🇲🇰' },
  { code: 'pt-br', name: 'פורטוגזית (ברזיל)', flag: '🇧🇷' },
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

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isAvailableNow(t: Translator): boolean {
  if (t.is_24_7) return true;
  // Prefer multi-slot array, fall back to legacy single slot
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
    const start = sh * 60 + sm;
    const end   = eh * 60 + em;
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
          <Languages size={52} className="text-white" />
        </motion.div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { delay: 0.25, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] } }}
          className="absolute -bottom-2 -right-2 w-11 h-11 rounded-[1rem] bg-emerald-500 flex items-center justify-center"
          style={{ boxShadow: '0 4px 16px rgba(34,197,94,0.45)' }}
        >
          <Phone size={20} className="text-white" fill="white" />
        </motion.div>
      </div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.3 } }}
        className="flex flex-col gap-3"
      >
        <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
          סיוע בתרגום
        </h2>
        <p className="text-[0.95rem] text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
          צריך עזרה בתרגום מול מטופל? בחר שפה, מצא חובש זמין, והתקשר בלחיצת כפתור.
          גם אתה יכול להצטרף לצוות המתרגמים שלנו!
        </p>
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.32, duration: 0.3 } }}
        whileTap={{ scale: 0.96 }}
        onClick={handleStart}
        className="w-full max-w-xs py-4 rounded-2xl text-white font-black text-lg"
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
          boxShadow: '0 8px 32px rgba(59,130,246,0.38)',
        }}
      >
        קדימה, בואו נתחיל
      </motion.button>

      {assistCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.45, duration: 0.35 } }}
          className="w-full max-w-xs rounded-2xl px-5 py-4 flex flex-col gap-3"
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(52,211,153,0.3)',
            boxShadow: '0 8px 32px rgba(52,211,153,0.12), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          {/* Live label */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.9)' }} />
            </span>
            <span className="text-[0.6rem] font-black text-emerald-400 uppercase tracking-widest">קהילת חובש+ בתנופה</span>
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
              <Users size={20} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-xs text-white/55 font-semibold leading-relaxed">
            אינטראקציות רפואיות מצילות חיים בוצעו עד כה
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Translator Card ───────────────────────────────────────────────────────────

// WhatsApp SVG icon
function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.862L.057 23.885a.5.5 0 0 0 .611.612l6.115-1.457A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.935 9.935 0 0 1-5.122-1.415l-.363-.214-3.791.904.942-3.706-.236-.374A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  );
}

function TranslatorCard({ translator, available, isEmergency, allLanguages, selectedLangName, isSignLanguage, onContact }: {
  translator: Translator;
  available: boolean;
  isEmergency?: boolean;
  allLanguages: Language[];
  selectedLangName?: string;
  isSignLanguage?: boolean;
  onContact?: () => void;
}) {
  const phone = translator.phone_number.replace(/\D/g, '');
  const waNumber = phone.startsWith('0') ? `972${phone.slice(1)}` : phone;
  const waMessage = selectedLangName
    ? `שלום, הודעה זו נשלחה דרך אפליקציית חובש +. קיים צורך דחוף בסיוע בתרגום לשפה ה-${selectedLangName} עבור מטופל בשטח. האם ניתן לסייע כעת?`
    : 'שלום, הודעה זו נשלחה דרך אפליקציית חובש +. קיים צורך דחוף בסיוע בתרגום עבור מטופל בשטח. האם ניתן לסייע כעת?';
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all
        ${available
          ? 'bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 backdrop-blur-md'
          : isEmergency
            ? 'border-orange-500/20'
            : 'bg-gray-100/60 dark:bg-white/[0.03] border-gray-200/60 dark:border-white/5 opacity-60'
        }`}
      style={available
        ? { boxShadow: '0 4px 24px rgba(96,165,250,0.08), inset 0 1px 0 rgba(255,255,255,0.1)' }
        : isEmergency
          ? { background: 'rgba(249,115,22,0.06)', boxShadow: '0 2px 12px rgba(249,115,22,0.08)' }
          : undefined}
    >
      <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-lg font-black
        ${available
          ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30'
          : isEmergency
            ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-lg shadow-orange-500/25'
            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        }`}
      >
        {translator.full_name.charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{translator.full_name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {translator.languages.map(code => {
            const lang = allLanguages.find(l => l.code === code);
            return lang ? `${lang.flag} ${lang.name}` : code;
          }).join(' · ')}
        </p>
        {!translator.is_24_7 && (
          <div className="flex flex-col gap-0.5 mt-0.5">
            {(translator.time_slots && translator.time_slots.length > 0
              ? translator.time_slots
              : (translator.start_time && translator.end_time
                  ? [{ start: translator.start_time, end: translator.end_time }]
                  : [])
            ).map((slot, i) => (
              <p key={i} className="text-[0.65rem] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Clock size={10} />
                {formatTime(slot.start)} – {formatTime(slot.end)}
              </p>
            ))}
          </div>
        )}
        {translator.is_24_7 && (
          <div className="flex items-center gap-1 mt-0.5">
            <ShieldCheck size={11} className="text-emerald-400" style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.65))' }} />
            <span className="text-[0.65rem] text-emerald-400 font-bold">24/7</span>
          </div>
        )}
        {isEmergency && (
          <div className="flex items-center gap-1 mt-0.5">
            <AlertCircle size={10} className="text-orange-400 shrink-0" />
            <span className="text-[0.6rem] text-orange-400 font-bold">לחירום בלבד (מחוץ לשעות)</span>
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
            className="flex items-center justify-center w-10 h-10 rounded-full text-white transition-all active:scale-90"
            style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', boxShadow: '0 4px 16px rgba(37,211,102,0.4)' }}
            aria-label="שיחת וידאו WhatsApp"
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
            className="flex items-center justify-center w-10 h-10 rounded-full text-white transition-all active:scale-90"
            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)', boxShadow: '0 4px 16px rgba(34,197,94,0.4)' }}
            aria-label="התקשר"
          >
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
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl py-5 px-2 border
        bg-white/10 border-white/20
        active:scale-95 transition-all hover:border-white/40 hover:bg-white/15"
      style={{
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      <span className="text-4xl leading-none">{lang.flag}</span>
      <span className="text-sm font-bold text-white">{lang.name}</span>
      {count > 0 ? (
        <span className="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white/80 border border-white/20">
          {count} מתרגמים
        </span>
      ) : (
        <span className="text-[0.6rem] text-white/40">אין רשומים</span>
      )}
    </button>
  );
}

// ─── Language Request Form ─────────────────────────────────────────────────────

function LanguageRequestForm() {
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
        className="flex items-center justify-center gap-2 w-full rounded-2xl py-3 px-4 border border-dashed border-gray-300 dark:border-white/20 text-gray-500 dark:text-gray-400 text-sm font-semibold transition-all active:scale-95 hover:border-blue-400 dark:hover:border-blue-400 hover:text-blue-500 dark:hover:text-blue-400"
      >
        <Plus size={15} />
        השפה שלך לא ברשימה? שלח בקשה
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
        <Check size={20} className="text-emerald-400" />
        <p className="text-sm font-bold text-emerald-300">הבקשה נשלחה בהצלחה!</p>
        <p className="text-xs text-emerald-400/70">נוסיף את השפה בהקדם האפשרי</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2 rounded-2xl p-3 border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5"
    >
      <p className="text-xs font-bold text-gray-600 dark:text-gray-400">בקש הוספת שפה חדשה</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="שם השפה..."
          autoFocus
          disabled={status === 'sending'}
          className="flex-1 rounded-xl px-3 py-2 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
          dir="rtl"
        />
        <button
          onClick={handleSend}
          disabled={!name.trim() || status === 'sending'}
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
        >
          {status === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-400">שליחה נכשלה, נסה שוב</p>
      )}
    </motion.div>
  );
}

// ─── Registration Form ─────────────────────────────────────────────────────────

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
  const [fullName, setFullName]             = useState('');
  const [phone, setPhone]                   = useState('');
  const [phoneConfirm, setPhoneConfirm]     = useState('');
  const [selectedLangs, setSelectedLangs]   = useState<string[]>([]);
  const [formLangSearch, setFormLangSearch] = useState('');
  const [is24_7, setIs24_7]                 = useState(false);
  const [timeSlots, setTimeSlots]           = useState<TimeSlot[]>([{ start: '08:00', end: '22:00' }]);
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

  const filteredFormLangs = allLanguages.filter(l =>
    l.name.includes(formLangSearch) || l.code.toLowerCase().includes(formLangSearch.toLowerCase())
  );

  // ── Phone-based identity lookup ──────────────────────────────────────────────
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    setMode('new');
    setExistingId(null);
    if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current);

    const digits = val.replace(/\D/g, '');
    if (digits.length < 9) return;

    setMode('checking');
    phoneTimerRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('translators')
        .select('id, full_name, languages, is_24_7, start_time, end_time, time_slots, emergency_only_contact')
        .eq('phone_number', val.trim())
        .maybeSingle();

      if (data) {
        setExistingId(data.id);
        setFullName(data.full_name);
        setSelectedLangs(data.languages ?? []);
        setIs24_7(data.is_24_7);
        // Load multi-slot, fall back to legacy single slot
        if (data.time_slots && (data.time_slots as TimeSlot[]).length > 0) {
          setTimeSlots(data.time_slots as TimeSlot[]);
        } else if (data.start_time && data.end_time) {
          setTimeSlots([{ start: data.start_time.slice(0, 5), end: data.end_time.slice(0, 5) }]);
        } else {
          setTimeSlots([{ start: '08:00', end: '22:00' }]);
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
    if (!fullName.trim())           { setError('נא להזין שם מלא');          return; }
    if (selectedLangs.length === 0) { setError('נא לבחור לפחות שפה אחת'); return; }
    setLoading(true); setError(null);

    try {
      const payload = {
        full_name:               fullName.trim(),
        languages:               selectedLangs,
        is_24_7:                 is24_7,
        start_time:              is24_7 ? null : (timeSlots[0]?.start ?? null),
        end_time:                is24_7 ? null : (timeSlots[0]?.end ?? null),
        time_slots:              is24_7 ? [] : timeSlots,
        emergency_only_contact:  emergencyContact,
      };
      console.log('[LB] update payload:', payload);
      const { error: dbError } = await supabase
        .from('translators')
        .update(payload)
        .eq('id', existingId!);

      if (dbError) {
        console.error('[LB] Supabase update error:', dbError);
        setError(`שגיאה בעדכון: ${dbError.message}`);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('[LB] Unexpected update error:', err);
      setError('שגיאה בלתי צפויה. נסה שוב.');
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
    const { error: dbError } = await supabase
      .from('translators')
      .delete()
      .eq('id', existingId!);
    setLoading(false);
    if (dbError) { setError('שגיאה במחיקה. נסה שוב.'); return; }
    ReactGA.event('translator_delete', {});
    setDeletedSuccess(true);
    setTimeout(() => onSuccess([]), 2000);
  };

  const handleSubmit = async () => {
    if (!fullName.trim())           { setError('נא להזין שם מלא');          return; }
    if (!phone.trim())              { setError('נא להזין מספר טלפון');       return; }
    if (!phoneMatch)                { setError('מספרי הטלפון אינם תואמים'); return; }
    if (selectedLangs.length === 0) { setError('נא לבחור לפחות שפה אחת'); return; }
    setLoading(true); setError(null);

    try {
      const payload = {
        full_name:               fullName.trim(),
        phone_number:            phone.trim(),
        languages:               selectedLangs,
        is_24_7:                 is24_7,
        start_time:              is24_7 ? null : (timeSlots[0]?.start ?? null),
        end_time:                is24_7 ? null : (timeSlots[0]?.end ?? null),
        time_slots:              is24_7 ? [] : timeSlots,
        emergency_only_contact:  emergencyContact,
      };
      console.log('[LB] insert payload:', payload);
      const { data: inserted, error: dbError } = await supabase
        .from('translators')
        .insert(payload)
        .select('id')
        .single();

      if (dbError) {
        console.error('[LB] Supabase insert error:', dbError);
        setError(`שגיאה בשמירה: ${dbError.message}`);
        setLoading(false);
        return;
      }

      const newId = (inserted as { id: string } | null)?.id;
      if (newId) localStorage.setItem('lb_translator_id', newId);
      setLoading(false);
      ReactGA.event('translator_registration', { languages: selectedLangs.join(',') });
      setSubmitted(true);
      setTimeout(() => onSuccess(selectedLangs, newId), 2000);
    } catch (err) {
      console.error('[LB] Unexpected insert error:', err);
      setError('שגיאה בלתי צפויה. נסה שוב.');
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
          className="w-20 h-20 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center"
        >
          <Check size={36} className="text-white" strokeWidth={3} />
        </motion.div>
        <p className="text-xl font-black text-gray-900 dark:text-white">הוסרת מהמערכת</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">תודה על תרומתך לקהילה</p>
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
          <Check size={36} className="text-white" strokeWidth={3} />
        </motion.div>
        <p className="text-xl font-black text-gray-900 dark:text-white">
          {mode === 'edit' ? 'פרטיך עודכנו בהצלחה!' : 'נרשמת בהצלחה!'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {mode === 'edit' ? 'השינויים נשמרו במערכת' : 'תודה על ההצטרפות לסיוע בתרגום'}
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
              <UserPlus size={16} className="text-blue-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-blue-200">מספר זה כבר רשום במערכת</span>
              <span className="text-xs text-blue-300/70">תוכל/י לעדכן פרטים או להסיר את עצמך</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-white/50 uppercase tracking-wide">שם מלא</label>
        <input
          type="text" value={fullName} onChange={e => setFullName(e.target.value)}
          placeholder="שם פרטי ושם משפחה" dir="rtl"
          className="w-full rounded-xl px-4 py-3 text-sm bg-white/8 border border-white/15 text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        />
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-white/50 uppercase tracking-wide">מספר טלפון</label>
        <div className="relative">
          <input
            type="tel" value={phone} onChange={e => handlePhoneChange(e.target.value)}
            placeholder="05X-XXXXXXX" dir="ltr"
            className={`w-full rounded-xl px-4 py-3 pr-10 text-sm border text-white placeholder-white/35 focus:outline-none focus:ring-2 transition-all
              ${mode === 'edit'
                ? 'border-blue-400/70 focus:ring-blue-400/40'
                : 'border-white/15 focus:ring-blue-400/50'
              }`}
            style={{ background: 'rgba(255,255,255,0.07)' }}
          />
          {mode === 'checking' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Loader2 size={16} className="animate-spin text-white/40" />
            </div>
          )}
          {mode === 'edit' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <Check size={11} className="text-white" strokeWidth={3} />
            </div>
          )}
        </div>
      </div>

      {/* Phone confirm — only for new registrations */}
      {mode !== 'edit' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-white/50 uppercase tracking-wide">אימות מספר טלפון</label>
          <div className="relative">
            <input
              type="tel" value={phoneConfirm} onChange={e => setPhoneConfirm(e.target.value)}
              placeholder="05X-XXXXXXX" dir="ltr"
              className={`w-full rounded-xl px-4 py-3 pr-10 text-sm border text-white placeholder-white/35 focus:outline-none focus:ring-2 transition-all
                ${phoneMismatch
                  ? 'border-red-400/70 focus:ring-red-400/40'
                  : phoneMatch
                    ? 'border-emerald-400/70 focus:ring-emerald-400/40'
                    : 'border-white/15 focus:ring-blue-400/50'
                }`}
              style={{ background: 'rgba(255,255,255,0.07)' }}
            />
            {phoneMatch && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check size={11} className="text-white" strokeWidth={3} />
              </div>
            )}
          </div>
          {phoneMismatch && (
            <p className="text-xs text-red-400 font-medium flex items-center gap-1">
              <AlertCircle size={12} />
              מספרי הטלפון אינם תואמים
            </p>
          )}
        </div>
      )}

      {/* Languages */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-white/50 uppercase tracking-wide">שפות שאני מדבר/ת</label>
        <div className="relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          <input
            type="text" value={formLangSearch} onChange={e => setFormLangSearch(e.target.value)}
            placeholder="חפש שפה..." dir="rtl"
            className="w-full rounded-xl px-4 py-2.5 pr-9 text-sm border border-white/15 text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            style={{ background: 'rgba(255,255,255,0.07)' }}
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
                    : 'border-white/15'
                  }`}
                style={{ background: selected ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.06)' }}
              >
                <span className="text-xl leading-none">{lang.flag}</span>
                <span className={`text-[0.6rem] font-semibold leading-tight text-center ${selected ? 'text-white' : 'text-white/70'}`}>
                  {lang.name}
                </span>
              </button>
            );
          })}
          {filteredFormLangs.length === 0 && (
            <p className="col-span-4 text-center text-sm text-white/40 py-4">לא נמצאה שפה</p>
          )}
        </div>

        {/* Language Request */}
        <div className="flex flex-col gap-2 mt-1" dir="rtl">
          <p className="text-[0.72rem] text-white/45 text-center leading-relaxed">
            לא מוצאים את שפת האם שלכם? שלחו בקשה להוספה ונדאג לצרף אתכם.
          </p>
          <LanguageRequestForm />
        </div>
      </div>

      {/* Availability */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold text-white/50 uppercase tracking-wide">זמינות</label>
        <div className="grid grid-cols-2 gap-3">
          {/* Option A: 24/7 */}
          <button
            type="button"
            onClick={() => setIs24_7(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl px-4 py-5 border-2 transition-all active:scale-95"
            style={{
              borderColor: is24_7 ? 'rgba(34,197,94,0.8)' : 'rgba(255,255,255,0.12)',
              background: is24_7 ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
              boxShadow: is24_7 ? '0 0 0 3px rgba(34,197,94,0.12), 0 6px 24px rgba(34,197,94,0.2)' : 'none',
            }}
          >
            <ShieldCheck size={26} className={is24_7 ? 'text-emerald-400' : 'text-white/50'} style={is24_7 ? { filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.6))' } : undefined} />
            <span className="text-sm font-black text-white">זמין 24/7</span>
            {is24_7 && <span className="text-[0.65rem] text-emerald-400 font-semibold">נבחר ✓</span>}
          </button>

          {/* Option B: Manual hours */}
          <button
            type="button"
            onClick={() => setIs24_7(false)}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl px-4 py-5 border-2 transition-all active:scale-95"
            style={{
              borderColor: !is24_7 ? 'rgba(96,165,250,0.8)' : 'rgba(255,255,255,0.12)',
              background: !is24_7 ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.05)',
              boxShadow: !is24_7 ? '0 0 0 3px rgba(96,165,250,0.12), 0 6px 24px rgba(59,130,246,0.2)' : 'none',
            }}
          >
            <Clock size={26} className={!is24_7 ? 'text-blue-400' : 'text-white/50'} />
            <span className="text-sm font-black text-white">בחירת שעות ידנית</span>
            {!is24_7 && <span className="text-[0.65rem] text-blue-400 font-semibold">נבחר ✓</span>}
          </button>
        </div>
        <AnimatePresence initial={false}>
          {!is24_7 && (
            <motion.div
              key="time-picker"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 rounded-xl px-3 py-3 border border-white/15" style={{ background: 'rgba(255,255,255,0.06)' }}>
                {timeSlots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Clock size={16} className="text-white/40 shrink-0" />
                    <input
                      type="time"
                      value={slot.start}
                      onChange={e => setTimeSlots(prev => prev.map((s, j) => j === i ? { ...s, start: e.target.value } : s))}
                      className="min-w-[5.5rem] text-base font-black bg-transparent text-white focus:outline-none min-h-[44px] cursor-pointer tracking-wide"
                    />
                    <span className="text-white/40 font-black">—</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={e => setTimeSlots(prev => prev.map((s, j) => j === i ? { ...s, end: e.target.value } : s))}
                      className="min-w-[5.5rem] text-base font-black bg-transparent text-white focus:outline-none min-h-[44px] cursor-pointer tracking-wide"
                    />
                    {timeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setTimeSlots(prev => prev.filter((_, j) => j !== i))}
                        className="ml-auto p-1.5 rounded-lg text-red-400/70 hover:text-red-400 active:scale-90 transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
                {timeSlots.length < 4 && (
                  <button
                    type="button"
                    onClick={() => setTimeSlots(prev => [...prev, { start: '08:00', end: '20:00' }])}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed text-xs font-bold transition-all active:scale-95 mt-1"
                    style={{
                      borderColor: 'rgba(96,165,250,0.35)',
                      color: 'rgba(96,165,250,0.75)',
                      background: 'rgba(59,130,246,0.04)',
                    }}
                  >
                    <Plus size={13} />
                    הוסף טווח שעות
                  </button>
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
          <AlertCircle size={13} className="text-orange-400 shrink-0" />
          <span className="text-[0.62rem] font-black text-orange-300 uppercase tracking-widest">זמינות חריגה</span>
        </div>
        {/* Card body */}
        <button
          type="button"
          onClick={() => setEmergencyContact(prev => !prev)}
          className="flex items-center gap-4 w-full px-4 py-3.5 text-right transition-all active:scale-[0.99]"
        >
          <div className="flex flex-col text-right flex-1 gap-0.5">
            <span className="text-sm font-bold text-white leading-snug">
              האם ניתן ליצור עמך קשר במקרה חירום חריג גם מחוץ לשעות הזמינות?
            </span>
            <span className={`text-[0.68rem] font-semibold transition-colors ${emergencyContact ? 'text-orange-300' : 'text-white/35'}`}>
              {emergencyContact ? 'כן — זמין גם בחירום' : 'לא — רק בשעות הזמינות'}
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
                : 'rgba(255,255,255,0.12)',
              boxShadow: emergencyContact ? '0 2px 12px rgba(249,115,22,0.5)' : 'none',
            }}
          >
            <div
              className="absolute top-0.5 rounded-full bg-white shadow-md transition-all duration-300"
              style={{
                width: 23,
                height: 23,
                left: emergencyContact ? 22 : 2,
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              }}
            />
          </div>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 border border-red-400/40 text-red-300 text-sm" style={{ background: 'rgba(239,68,68,0.12)' }}>
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
              className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 text-white font-black text-base transition-all active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', boxShadow: '0 6px 24px rgba(59,130,246,0.4)' }}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
              {loading ? 'שומר...' : 'עדכן פרטים'}
            </button>
            <button
              onClick={handleDelete} disabled={loading}
              className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 font-bold text-sm transition-all active:scale-95 disabled:opacity-60 border-2 bg-transparent"
              style={{ borderColor: 'rgba(239,68,68,0.35)', color: 'rgb(220,38,38)' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <AlertCircle size={18} />}
              הסר אותי מהמערכת
            </button>
          </motion.div>
        ) : (
          <motion.div key="new-action" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button
              onClick={handleSubmit} disabled={loading || phoneMismatch || (phoneConfirm.trim() !== '' && !phoneMatch)}
              className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 text-white font-black text-base transition-all active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', boxShadow: '0 6px 24px rgba(59,130,246,0.4)' }}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
              {loading ? 'שומר...' : 'הצטרף לצוות המתרגמים'}
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
}

function MyProfileCard({ id, allLanguages, onDeleted, onUpdated, onEdit }: {
  id: string;
  allLanguages: Language[];
  onDeleted: () => void;
  onUpdated: () => void;
  onEdit: (phone: string) => void;
}) {
  const [data, setData]               = useState<MyTranslatorData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    supabase
      .from('translators')
      .select('id, full_name, phone_number, languages, is_24_7, start_time, end_time, time_slots, emergency_only_contact')
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

  const toggleAvailability = async () => {
    if (!data || saving) return;
    setSaving(true);
    const next = !data.is_24_7;
    await supabase.from('translators').update({ is_24_7: next }).eq('id', id);
    setData(prev => prev ? { ...prev, is_24_7: next } : prev);
    setSaving(false);
    onUpdated();
  };

  const handleDelete = async () => {
    setSaving(true);
    await supabase.from('translators').delete().eq('id', id);
    localStorage.removeItem('lb_translator_id');
    setSaving(false);
    onDeleted();
  };

  if (loading) {
    return (
      <div
        className="rounded-2xl border border-white/15 px-4 py-4 flex items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
      >
        <Loader2 size={18} className="animate-spin text-white/40" />
        <span className="text-sm text-white/50">טוען פרופיל...</span>
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
        boxShadow: '0 4px 24px rgba(59,130,246,0.14), inset 0 1px 0 rgba(255,255,255,0.12)',
      }}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2.5 border-b border-white/10">
        <div className="w-9 h-9 rounded-full bg-blue-500/25 flex items-center justify-center shrink-0">
          <UserPlus size={16} className="text-blue-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[0.6rem] font-black text-blue-400 uppercase tracking-widest">ניהול הפרופיל שלי</p>
          <p className="text-sm font-bold text-white truncate">{data.full_name}</p>
        </div>
        {/* Availability toggle */}
        <button
          onClick={toggleAvailability}
          disabled={saving}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 disabled:opacity-50 ${
            data.is_24_7
              ? 'border-emerald-400/50 text-emerald-300 bg-emerald-500/15'
              : 'border-white/20 text-white/50 bg-white/8'
          }`}
        >
          {saving
            ? <Loader2 size={12} className="animate-spin" />
            : data.is_24_7
              ? <><Check size={12} /> זמין</>
              : <>לא זמין</>
          }
        </button>
      </div>

      <div className="px-4 py-3 flex flex-col gap-2.5">
        {/* Languages */}
        <div className="flex flex-wrap gap-1">
          {data.languages.map(code => {
            const lang = allLanguages.find(l => l.code === code);
            return lang ? (
              <span key={code} className="text-[0.65rem] px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
                {lang.flag} {lang.name}
              </span>
            ) : null;
          })}
        </div>

        {/* Hours */}
        {!data.is_24_7 && (
          <div className="flex flex-col gap-0.5">
            {(data.time_slots && data.time_slots.length > 0
              ? data.time_slots
              : (data.start_time && data.end_time ? [{ start: data.start_time, end: data.end_time }] : [])
            ).map((slot, i) => (
              <p key={i} className="text-xs text-white/45 flex items-center gap-1">
                <Clock size={11} />
                {formatTime(slot.start)} – {formatTime(slot.end)}
              </p>
            ))}
          </div>
        )}

        {/* Actions */}
        {!confirmDelete ? (
          <div className="flex items-center gap-3 mt-0.5">
            <button
              onClick={() => onEdit(data.phone_number)}
              className="text-xs text-blue-400/80 hover:text-blue-300 font-bold transition-colors"
            >
              ערוך פרטים
            </button>
            <span className="text-white/20 text-xs">|</span>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-red-400/60 hover:text-red-400 font-semibold transition-colors"
            >
              הסר פרופיל
            </button>
          </div>
        ) : (
          <div className="flex gap-2 mt-0.5">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-1.5 rounded-xl text-xs font-bold border border-white/15 text-white/60 active:scale-95 transition-all"
            >
              ביטול
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 py-1.5 rounded-xl text-xs font-bold border border-red-400/40 text-red-300 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
              style={{ background: 'rgba(239,68,68,0.15)' }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : 'מחק לצמיתות'}
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

  const fetchAllTranslators = useCallback(() => {
    setLoadingAll(true);
    supabase
      .from('translators')
      .select('id, full_name, phone_number, languages, is_24_7, start_time, end_time, time_slots, emergency_only_contact')
      .then(({ data }) => {
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
      .select('id, full_name, phone_number, languages, is_24_7, start_time, end_time, time_slots, emergency_only_contact')
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
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const available = translators.filter(isAvailableNow);
  const emergencyBackups = translators.filter(t => !isAvailableNow(t) && t.emergency_only_contact);
  const countFor = (code: string) => allTranslators.filter(t => t.languages.includes(code)).length;

  const filteredLangs = allLanguages.filter(l =>
    l.name.includes(langSearch) || l.code.toLowerCase().includes(langSearch.toLowerCase())
  );
  const noResults = langSearch.trim().length > 0 && filteredLangs.length === 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col animate-fade-scale"
      style={{ background: 'linear-gradient(160deg, #0d0d18 0%, #111827 60%, #0f172a 100%)' }}
      dir="rtl"
    >
      {/* Header */}
      <div
        className="shrink-0 flex items-center px-4 border-b border-white/10"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
          paddingBottom: '12px',
          background: 'rgba(13,13,24,0.85)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {(view === 'translators' || view === 'register') ? (
          <button
            onClick={handleBack}
            className="p-2 -mr-2 rounded-xl text-white/60 active:bg-white/10"
          >
            <ChevronRight size={22} />
          </button>
        ) : view === 'languages' ? (
          <button
            onClick={() => setView('register')}
            className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold text-white/85 border border-white/20 active:scale-95 transition-all"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 6px rgba(0,0,0,0.12)',
            }}
          >
            <UserPlus size={13} />
            הצטרף
          </button>
        ) : (
          <div className="w-10" />
        )}

        <div className="flex-1 text-center">
          {view === 'translators' && selectedLang ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{selectedLang.flag}</span>
              <h1 className="text-lg font-black text-white">{selectedLang.name}</h1>
            </div>
          ) : view === 'register' ? (
            <h1 className="text-lg font-black text-white leading-tight">
              {registerMode === 'edit' ? 'עדכון או הסרת פרופיל' : 'הצטרף לצוות המתרגמים'}
            </h1>
          ) : view === 'languages' ? (
            <h1 className="text-base font-black text-white leading-snug">בחר שפה למציאת מתרגמים</h1>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Globe size={20} className="text-blue-400" />
              <h1 className="text-lg font-black text-white">סיוע בתרגום</h1>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {view !== 'intro' && (
            <button
              onClick={() => setShowInfo(true)}
              className="p-2 rounded-xl text-white/65 active:bg-white/10 transition-all"
              aria-label="מידע על השירות"
            >
              <HelpCircle size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-xl text-white/60 active:bg-white/10"
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
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.34, 1.2, 0.64, 1] } }}
              exit={{ opacity: 0, scale: 0.92, y: 8, transition: { duration: 0.2 } }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.13)',
                backdropFilter: 'blur(28px) saturate(1.6)',
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.22)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/35 flex items-center justify-center shrink-0">
                    <Info size={18} className="text-blue-300" />
                  </div>
                  <h3 className="font-black text-white text-2xl leading-tight">מהו שירות סיוע בתרגום?</h3>
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 active:bg-white/20"
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
                    boxShadow: '0 8px 28px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
                  }}
                >
                  <Globe size={30} className="text-white" />
                </div>

                <div
                  className="rounded-2xl px-4 py-4 w-full"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <p className="text-white/90 text-[0.9rem] leading-[1.75] font-semibold text-center">
                    שירות זה מחבר בזמן אמת בין חובשים בשטח למתרגמים מתנדבים מתוך קהילת הכוננים, על מנת להעניק טיפול רפואי מדויק למטופלים שאינם דוברי עברית.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-2.5 justify-center">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/25 flex items-center justify-center shrink-0">
                      <Check size={11} className="text-emerald-300" />
                    </div>
                    <p className="text-white/70 text-sm leading-snug text-right">בחר שפה מהרשימה ואתר מתרגם פנוי (נקודה ירוקה)</p>
                  </div>
                  <div className="flex items-center gap-2.5 justify-center">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/25 flex items-center justify-center shrink-0">
                      <Check size={11} className="text-emerald-300" />
                    </div>
                    <p className="text-white/70 text-sm leading-snug text-right">צור קשר בשיחת טלפון או בוואטסאפ בלחיצת כפתור</p>
                  </div>
                  <div className="flex items-center gap-2.5 justify-center">
                    <div className="w-5 h-5 rounded-full bg-blue-500/25 flex items-center justify-center shrink-0">
                      <UserPlus size={11} className="text-blue-300" />
                    </div>
                    <p className="text-white/70 text-sm leading-snug text-right">גם אתה יכול להצטרף לצוות המתרגמים ולהיות זמין לסייע</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable body with animated views */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ── Intro ── */}
          {view === 'intro' && (
            <motion.div key="intro" {...INTRO_PAGE}>
              <IntroScreen onStart={() => setView('languages')} assistCount={assistCount} />
            </motion.div>
          )}

          {/* ── Language Grid ── */}
          {view === 'languages' && (
            <motion.div key="languages" {...PAGE}>
              <div className="p-4" style={{ paddingBottom: 'max(3rem, calc(env(safe-area-inset-bottom, 0px) + 2rem))' }}>

                {/* Assist counter badge */}
                {assistCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.1 } }}
                    className="flex items-center justify-center gap-3 mb-4 rounded-2xl px-4 py-3"
                    style={{
                      background: 'rgba(255,255,255,0.09)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 4px 24px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.12)',
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
                    <span className="text-xs text-white/60 font-semibold">שיחות סיוע בוצעו דרך המערכת</span>
                  </motion.div>
                )}

                {/* Recruitment share banner */}
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.15 } }}
                  className="flex items-center gap-3 mb-4 rounded-2xl px-4 py-3.5"
                  style={{
                    background: 'linear-gradient(135deg, #7B1D2C 0%, #9B2B3F 100%)',
                    boxShadow: '0 4px 20px rgba(123,29,44,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
                  }}
                >
                  <p dir="rtl" className="flex-1 text-white text-xs leading-relaxed font-black">
                    עזרו לנו לאייש כל שפה. מכירים מישהו שדובר את השפות האלו? שתפו אותו עכשיו. יחד נציל חיים.
                  </p>
                  <button
                    onClick={async () => {
                      ReactGA.event('emergency_recruitment_share', { source: 'language_grid_banner' });
                      const shareData = {
                        title: 'חובש+',
                        text: 'עוזרים להנגיש את הרפואה לכולם - הצטרפו למערך התרגום של חובש+!',
                        url: 'https://hovesh-plus.vercel.app/',
                      };
                      try {
                        if (navigator.share) {
                          await navigator.share(shareData);
                        } else {
                          await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                          alert('הקישור הועתק ללוח!');
                        }
                      } catch { /* user cancelled */ }
                    }}
                    className="shrink-0 flex flex-col items-center gap-1 active:opacity-70 active:scale-90 transition-all"
                    aria-label="שיתוף"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.22)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                    >
                      <Share2 size={18} className="text-white" />
                    </div>
                    <span className="text-[9px] font-black text-white/90 whitespace-nowrap">שתף</span>
                  </button>
                </motion.div>

                {/* My Profile Card */}
                {myTranslatorId && (
                  <div className="mb-4">
                    <MyProfileCard
                      id={myTranslatorId}
                      allLanguages={allLanguages}
                      onDeleted={() => { setMyTranslatorId(null); fetchAllTranslators(); }}
                      onUpdated={fetchAllTranslators}
                      onEdit={(phone) => { setPrefillPhone(phone); setView('register'); }}
                    />
                  </div>
                )}

                <div className="relative mb-4">
                  <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text" value={langSearch}
                    onChange={e => setLangSearch(e.target.value)}
                    placeholder="חפש שפה..." dir="rtl"
                    className="w-full rounded-xl px-4 py-2.5 pr-9 text-sm bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                  />
                </div>

                {loadingAll ? (
                  <div className="flex justify-center py-12">
                    <Loader2 size={28} className="animate-spin text-blue-400" />
                  </div>
                ) : noResults ? (
                  <div className="flex flex-col gap-4 py-4">
                    <p className="text-center text-sm text-gray-400 dark:text-gray-500">
                      לא נמצאה שפה תואמת
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
                    <Loader2 size={28} className="animate-spin text-blue-400" />
                  </div>
                ) : translators.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <span className="text-5xl">{selectedLang?.flag}</span>
                    <p className="font-bold text-gray-700 dark:text-gray-300">אין מתרגמים רשומים עדיין</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      לא נמצאו מתרגמים לשפה זו — אתה יכול להיות הראשון!
                    </p>
                    <button
                      onClick={() => setView('register')}
                      className="mt-2 px-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold active:scale-95 transition-all"
                    >
                      הצטרף כמתרגם
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Currently active translators */}
                    {available.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 px-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow shadow-emerald-400/60 animate-pulse" />
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                            זמינים עכשיו · {available.length}
                          </span>
                        </div>
                        {available.map(t => (
                          <TranslatorCard key={t.id} translator={t} available allLanguages={allLanguages} selectedLangName={selectedLang?.name} isSignLanguage={selectedLang?.code === 'isl'} onContact={incrementCounter} />
                        ))}
                      </div>
                    )}

                    {/* No active translators state */}
                    {available.length === 0 && (
                      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-white/8 flex items-center justify-center">
                          <Clock size={28} className="text-white/30" />
                        </div>
                        <p className="font-bold text-white/70">אין מתרגמים זמינים כרגע</p>
                        {emergencyBackups.length === 0 && (
                          <p className="text-sm text-white/35 max-w-[200px]">
                            {translators.length > 0
                              ? `${translators.length} מתרגמים רשומים לשפה זו אך אינם זמינים כעת — נסה שוב מאוחר יותר`
                              : 'לא נמצאו מתרגמים לשפה זו — אתה יכול להיות הראשון!'}
                          </p>
                        )}
                        {translators.length === 0 && (
                          <button
                            onClick={() => setView('register')}
                            className="mt-1 px-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold active:scale-95 transition-all"
                          >
                            הצטרף כמתרגם
                          </button>
                        )}
                      </div>
                    )}

                    {/* Emergency fallback — always visible when emergency_only_contact=true and out of hours */}
                    {emergencyBackups.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 px-1">
                          <div className="w-2 h-2 rounded-full bg-orange-500 shadow shadow-orange-400/50" />
                          <span className="text-xs font-black text-orange-400 uppercase tracking-wide">
                            לחירום בלבד (מחוץ לשעות) · {emergencyBackups.length}
                          </span>
                        </div>
                        {emergencyBackups.map(t => (
                          <TranslatorCard key={t.id} translator={t} available={false} isEmergency allLanguages={allLanguages} selectedLangName={selectedLang?.name} isSignLanguage={selectedLang?.code === 'isl'} onContact={incrementCounter} />
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
                      { id: newId, full_name: '', phone_number: '', languages: langs, is_24_7: false, start_time: null, end_time: null, time_slots: null, emergency_only_contact: false }
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
