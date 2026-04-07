import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Phone, Globe, ChevronRight, UserPlus, Clock, Check,
  Loader2, AlertCircle, Search, Plus, Languages,
} from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { supabase } from '../../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Translator {
  id: string;
  full_name: string;
  phone_number: string;
  languages: string[];
  is_24_7: boolean;
  start_time: string | null;
  end_time: string | null;
}

interface Language {
  code: string;
  name: string;
  flag: string;
  custom?: boolean;
}

// ─── 52 Languages ─────────────────────────────────────────────────────────────

const STATIC_LANGUAGES: Language[] = [
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
  if (!t.start_time || !t.end_time) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = t.start_time.split(':').map(Number);
  const [eh, em] = t.end_time.split(':').map(Number);
  const start = sh * 60 + sm;
  const end   = eh * 60 + em;
  return start <= end ? cur >= start && cur <= end : cur >= start || cur <= end;
}

function formatTime(t: string | null): string {
  return t ? t.slice(0, 5) : '';
}

// ─── iOS Toggle ────────────────────────────────────────────────────────────────

function IOSToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button" role="switch" aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-[28px] w-[50px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none
        ${value ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span
        className={`pointer-events-none inline-block h-[24px] w-[24px] transform rounded-full bg-white transition duration-200
          ${value ? 'translate-x-[22px]' : 'translate-x-0'}`}
        style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
      />
    </button>
  );
}

// ─── Intro Screen ──────────────────────────────────────────────────────────────

function IntroScreen({ onStart }: { onStart: () => void }) {
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
    </div>
  );
}

// ─── Translator Card ───────────────────────────────────────────────────────────

function TranslatorCard({ translator, available, allLanguages }: {
  translator: Translator;
  available: boolean;
  allLanguages: Language[];
}) {
  return (
    <a
      href={`tel:${translator.phone_number}`}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all active:scale-95
        ${available
          ? 'bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 backdrop-blur-md'
          : 'bg-gray-100/60 dark:bg-white/[0.03] border-gray-200/60 dark:border-white/5 opacity-60'
        }`}
      style={available ? { boxShadow: '0 4px 24px rgba(96,165,250,0.08), inset 0 1px 0 rgba(255,255,255,0.1)' } : undefined}
    >
      <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-lg font-black
        ${available
          ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30'
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
        {!translator.is_24_7 && translator.start_time && (
          <p className="text-[0.65rem] text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
            <Clock size={10} />
            {formatTime(translator.start_time)} – {formatTime(translator.end_time)}
          </p>
        )}
        {translator.is_24_7 && (
          <p className="text-[0.65rem] text-emerald-500 dark:text-emerald-400 mt-0.5">24/7</p>
        )}
      </div>

      {available && (
        <div
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-white"
          style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)', boxShadow: '0 4px 16px rgba(34,197,94,0.4)' }}
        >
          <Phone size={18} fill="white" />
        </div>
      )}
    </a>
  );
}

// ─── Language Grid Card ────────────────────────────────────────────────────────

function LangCard({ lang, count, onClick }: { lang: Language; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl py-5 px-2 border
        bg-white dark:bg-white/5 border-gray-200 dark:border-white/10
        active:scale-95 transition-all hover:border-blue-400 dark:hover:border-blue-500"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      <span className="text-4xl leading-none">{lang.flag}</span>
      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{lang.name}</span>
      {count > 0 ? (
        <span className="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
          {count} מתרגמים
        </span>
      ) : (
        <span className="text-[0.6rem] text-gray-400 dark:text-gray-500">אין רשומים</span>
      )}
    </button>
  );
}

// ─── Add Missing Language Widget ───────────────────────────────────────────────

function AddLanguageWidget({ onAdd }: { onAdd: (lang: Language) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);

    const code = `custom_${Date.now()}`;
    const newLang: Language = { code, name: trimmed, flag: '🌐', custom: true };

    try {
      await supabase.from('custom_languages').insert({ code, name: trimmed, flag: '🌐' });
    } catch {
      // Table may not exist yet — still update local state
    }

    setLoading(false);
    setDone(true);
    onAdd(newLang);

    setTimeout(() => {
      setDone(false);
      setExpanded(false);
      setName('');
    }, 2500);
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center gap-2 rounded-2xl py-3 px-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 text-sm font-bold"
      >
        <Check size={16} />
        השפה נוספה — תודה!
      </motion.div>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center justify-center gap-2 w-full rounded-2xl py-3 px-4 border border-dashed border-gray-300 dark:border-white/20 text-gray-500 dark:text-gray-400 text-sm font-semibold transition-all active:scale-95 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400"
      >
        <Plus size={15} />
        השפה שלך לא ברשימה? לחץ להוספה
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2 rounded-2xl p-3 border border-blue-200 dark:border-blue-800/50 bg-blue-50/60 dark:bg-blue-900/10"
    >
      <p className="text-xs font-bold text-blue-600 dark:text-blue-400">הוסף שפה חדשה לרשימה</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="שם השפה..."
          autoFocus
          className="flex-1 rounded-xl px-3 py-2 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          dir="rtl"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !name.trim()}
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500 text-white transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={18} />}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Registration Form ─────────────────────────────────────────────────────────

function RegisterForm({
  allLanguages,
  onSuccess,
}: {
  allLanguages: Language[];
  onSuccess: (langs: string[]) => void;
}) {
  const [fullName, setFullName]         = useState('');
  const [phone, setPhone]               = useState('');
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [formLangSearch, setFormLangSearch] = useState('');
  const [is24_7, setIs24_7]             = useState(false);
  const [startTime, setStartTime]       = useState('08:00');
  const [endTime, setEndTime]           = useState('22:00');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [submitted, setSubmitted]       = useState(false);

  const toggleLang = (code: string) =>
    setSelectedLangs(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);

  const filteredFormLangs = allLanguages.filter(l =>
    l.name.includes(formLangSearch) || l.code.toLowerCase().includes(formLangSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!fullName.trim())        { setError('נא להזין שם מלא');           return; }
    if (!phone.trim())           { setError('נא להזין מספר טלפון');       return; }
    if (selectedLangs.length === 0) { setError('נא לבחור לפחות שפה אחת'); return; }

    setLoading(true);
    setError(null);

    const { error: dbError } = await supabase.from('translators').upsert(
      {
        full_name:    fullName.trim(),
        phone_number: phone.trim(),
        languages:    selectedLangs,
        is_24_7: is24_7,
        start_time: is24_7 ? null : startTime.slice(0, 5),
        end_time:   is24_7 ? null : endTime.slice(0, 5),
      },
      { onConflict: 'phone_number' }
    );

    setLoading(false);
    if (dbError) { setError('שגיאה בשמירה. נסה שוב.'); return; }

    setSubmitted(true);
    setTimeout(() => onSuccess(selectedLangs), 2000);
  };

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
        <p className="text-xl font-black text-gray-900 dark:text-white">נרשמת בהצלחה!</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">תודה על ההצטרפות לסיוע בתרגום</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">שם מלא</label>
        <input
          type="text" value={fullName} onChange={e => setFullName(e.target.value)}
          placeholder="ישראל ישראלי" dir="rtl"
          className="w-full rounded-xl px-4 py-3 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">מספר טלפון</label>
        <input
          type="tel" value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="050-000-0000" dir="ltr"
          className="w-full rounded-xl px-4 py-3 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      {/* Languages */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">שפות שאני מדבר/ת</label>
        <div className="relative">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text" value={formLangSearch} onChange={e => setFormLangSearch(e.target.value)}
            placeholder="חפש שפה..." dir="rtl"
            className="w-full rounded-xl px-4 py-2.5 pr-9 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                    ? 'bg-blue-500 dark:bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/30'
                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10'
                  }`}
              >
                <span className="text-xl leading-none">{lang.flag}</span>
                <span className={`text-[0.6rem] font-semibold leading-tight text-center ${selected ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {lang.name}
                </span>
              </button>
            );
          })}
          {filteredFormLangs.length === 0 && (
            <p className="col-span-4 text-center text-sm text-gray-400 dark:text-gray-500 py-4">לא נמצאה שפה</p>
          )}
        </div>
      </div>

      {/* Availability */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">זמינות</label>
        <div className="flex items-center justify-between rounded-xl px-4 py-3 border bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">זמין/ה 24/7</span>
          <IOSToggle value={is24_7} onChange={setIs24_7} />
        </div>
        {!is24_7 && (
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 border bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
            <Clock size={16} className="text-gray-400 shrink-0" />
            <div className="flex items-center gap-2 flex-1">
              <input
                type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="flex-1 text-sm font-semibold bg-transparent text-gray-900 dark:text-white focus:outline-none"
              />
              <span className="text-gray-400 text-sm font-bold">—</span>
              <input
                type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="flex-1 text-sm font-semibold bg-transparent text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit} disabled={loading}
        className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 text-white font-black text-base transition-all active:scale-95 disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', boxShadow: '0 6px 24px rgba(59,130,246,0.4)' }}
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
        {loading ? 'שומר...' : 'הצטרף לצוות'}
      </button>
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────────

type View = 'intro' | 'languages' | 'translators' | 'register';

const getStartView = (): View =>
  localStorage.getItem('lb_intro_seen') ? 'languages' : 'intro';

export default function LanguageBridgeModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);

  const [view, setView]                 = useState<View>(getStartView);
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [translators, setTranslators]   = useState<Translator[]>([]);
  const [allTranslators, setAllTranslators] = useState<Translator[]>([]);
  const [customLanguages, setCustomLanguages] = useState<Language[]>([]);
  const [loadingList, setLoadingList]   = useState(false);
  const [loadingAll, setLoadingAll]     = useState(false);
  const [langSearch, setLangSearch]     = useState('');

  const allLanguages = [...STATIC_LANGUAGES, ...customLanguages];

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchAllTranslators = useCallback(() => {
    setLoadingAll(true);
    supabase
      .from('translators')
      .select('id, full_name, phone_number, languages, is_24_7, start_time, end_time')
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

  useEffect(() => {
    if (isOpen) {
      fetchAllTranslators();
      fetchCustomLanguages();
    }
  }, [isOpen, fetchAllTranslators, fetchCustomLanguages]);

  const fetchForLanguage = useCallback(async (langCode: string) => {
    setLoadingList(true);
    const { data } = await supabase
      .from('translators')
      .select('id, full_name, phone_number, languages, is_24_7, start_time, end_time')
      .contains('languages', [langCode]);
    setTranslators((data as Translator[]) ?? []);
    setLoadingList(false);
  }, []);

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleLangSelect = (lang: Language) => {
    setSelectedLang(lang);
    setView('translators');
    fetchForLanguage(lang.code);
  };

  const handleBack = () => {
    setView('languages');
    setSelectedLang(null);
    setTranslators([]);
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

  const available   = translators.filter(isAvailableNow);
  const unavailable = translators.filter(t => !isAvailableNow(t));
  const countFor = (code: string) => allTranslators.filter(t => t.languages.includes(code)).length;

  const filteredLangs = allLanguages.filter(l =>
    l.name.includes(langSearch) || l.code.toLowerCase().includes(langSearch.toLowerCase())
  );
  const noResults = langSearch.trim().length > 0 && filteredLangs.length === 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-emt-dark animate-fade-scale"
      dir="rtl"
    >
      {/* Header */}
      <div
        className="shrink-0 flex items-center px-4 border-b border-gray-200 dark:border-emt-border bg-white dark:bg-[#0D0D10]"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)', paddingBottom: '12px' }}
      >
        {view === 'translators' ? (
          <button
            onClick={handleBack}
            className="p-2 -mr-2 rounded-xl text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-white/5"
          >
            <ChevronRight size={22} />
          </button>
        ) : (
          <div className="w-10" />
        )}

        <div className="flex-1 text-center">
          {view === 'translators' && selectedLang ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{selectedLang.flag}</span>
              <h1 className="text-lg font-black text-gray-900 dark:text-white">{selectedLang.name}</h1>
            </div>
          ) : view === 'intro' ? (
            <div className="flex items-center justify-center gap-2">
              <Globe size={20} className="text-blue-500" />
              <h1 className="text-lg font-black text-gray-900 dark:text-white">סיוע בתרגום</h1>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Globe size={20} className="text-blue-500" />
              <h1 className="text-lg font-black text-gray-900 dark:text-white">סיוע בתרגום</h1>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-xl text-gray-500 dark:text-gray-400 active:bg-gray-100 dark:active:bg-white/5"
        >
          <X size={22} />
        </button>
      </div>

      {/* Tab bar — hidden for intro & translators */}
      {view !== 'translators' && view !== 'intro' && (
        <div className="shrink-0 flex px-4 pt-3 pb-1 gap-2">
          <button
            onClick={() => setView('languages')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
              ${view === 'languages'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10'
              }`}
          >
            מצא מתרגם
          </button>
          <button
            onClick={() => setView('register')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
              ${view === 'register'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10'
              }`}
          >
            הצטרף לצוות
          </button>
        </div>
      )}

      {/* Scrollable body with animated views */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ── Intro ── */}
          {view === 'intro' && (
            <motion.div key="intro" {...INTRO_PAGE}>
              <IntroScreen onStart={() => setView('languages')} />
            </motion.div>
          )}

          {/* ── Language Grid ── */}
          {view === 'languages' && (
            <motion.div key="languages" {...PAGE}>
              <div className="p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">
                  בחר שפה למציאת מתרגמים זמינים בקהילה
                </p>

                <div className="relative mb-4">
                  <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text" value={langSearch}
                    onChange={e => setLangSearch(e.target.value)}
                    placeholder="חפש שפה..." dir="rtl"
                    className="w-full rounded-xl px-4 py-2.5 pr-9 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                    <AddLanguageWidget
                      onAdd={lang => setCustomLanguages(prev => [...prev, lang])}
                    />
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
                    <AddLanguageWidget
                      onAdd={lang => setCustomLanguages(prev => [...prev, lang])}
                    />
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
                    {available.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 px-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow shadow-emerald-400/60 animate-pulse" />
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                            זמינים עכשיו · {available.length}
                          </span>
                        </div>
                        {available.map(t => (
                          <TranslatorCard key={t.id} translator={t} available allLanguages={allLanguages} />
                        ))}
                      </div>
                    )}

                    {unavailable.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 px-1">
                          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600" />
                          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                            לא זמינים כרגע · {unavailable.length}
                          </span>
                        </div>
                        {unavailable.map(t => (
                          <TranslatorCard key={t.id} translator={t} available={false} allLanguages={allLanguages} />
                        ))}
                      </div>
                    )}

                    {available.length === 0 && unavailable.length > 0 && (
                      <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 font-medium text-center">
                        אין מתרגמים זמינים כרגע — נסה שוב מאוחר יותר
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
                onSuccess={(langs) => {
                  // Optimistic update for immediate count reflection
                  setAllTranslators(prev => [
                    ...prev,
                    { id: 'optimistic', full_name: '', phone_number: '', languages: langs, is_24_7: false, start_time: null, end_time: null }
                  ]);
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
