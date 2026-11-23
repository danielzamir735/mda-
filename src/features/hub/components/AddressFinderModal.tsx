import { useState, useRef, useEffect } from 'react';
import { X, MapPinned, Search, Building2, Hash, Footprints, Navigation, Compass, ArrowRight, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';
import { trackInteraction } from '../../../utils/analytics';
import { suggestAddresses, lookupAddress, mapLink, type AddressResult } from '../utils/addressSearch';

// "איתור כתובת מהיר" (beta): the user types an address, and the map page shows the building in red,
// every house number, footpaths and stairs, and where the user stands relative to it.
// The map itself is a separate page, embedded here.
const MAP_URL = 'https://entrance-finder-ten.vercel.app/';
const INTRO_KEY = 'address_finder_intro_seen_v1';

const BENEFITS = [
  { icon: Building2,  title: 'הבניין עצמו מסומן באדום', desc: 'גם כשהוא בתוך מתחם או גוש בניינים, ולא רק נקודה על הרחוב.' },
  { icon: Hash,       title: 'כל מספרי הבתים על המפה', desc: 'המספר שחיפשת מודגש באדום, גם כשיש על הבניין כמה מספרים.' },
  { icon: Navigation, title: 'אתה והבניין על אותו מסך', desc: 'המיקום שלך מתעדכן כל הזמן, עם קו הליכה עד הבניין.' },
  { icon: Footprints, title: 'שבילים ומדרגות', desc: 'דרכים להולכי רגל שלא מופיעות באפליקציות ניווט לרכב.' },
  { icon: Compass,    title: 'המפה מסתובבת איתך', desc: 'מה שמולך נמצא למעלה במסך, כך שקל להבין לאן ללכת.' },
];

function BetaTag() {
  return (
    <span className="text-[10px] font-extrabold tracking-wide px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
      בטא
    </span>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddressFinderModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [mapQuery, setMapQuery] = useState<string | null>(null); // the map page link once a search is done
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
  const [picked, setPicked] = useState<AddressResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const sugTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sugAbort = useRef<AbortController | null>(null);
  useEffect(() => () => { clearTimeout(sugTimer.current); sugAbort.current?.abort(); }, []);
  // the explanation shows only the first time (the modal is mounted only while open)
  const [showIntro, setShowIntro] = useState(() => {
    try { return localStorage.getItem(INTRO_KEY) !== '1'; } catch { return true; }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const closeIntro = () => {
    try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* private mode */ }
    setShowIntro(false);
    setTimeout(() => inputRef.current?.focus(), 250);
  };

  // back: map → address screen → tools
  useModalBackHandler(isOpen, onClose);
  useModalBackHandler(mapQuery !== null, () => setMapQuery(null));

  const label = (r: AddressResult) => {
    const num = r.housenumber || r.qNum;
    const l1 = !r.housenumber && num ? `${r.line1} ${num}` : r.line1;
    return r.line2 ? `${l1}, ${r.line2}` : l1;
  };

  // suggestions from the first letters typed
  const onType = (v: string) => {
    setQuery(v); setPicked(null); setMessage('');
    clearTimeout(sugTimer.current); sugAbort.current?.abort();
    if (v.trim().length < 2) { setSuggestions([]); return; }
    sugTimer.current = setTimeout(async () => {
      const ctrl = new AbortController(); sugAbort.current = ctrl;
      try { const res = await suggestAddresses(v.trim(), ctrl.signal); if (!ctrl.signal.aborted) setSuggestions(res); } catch { /* aborted or offline */ }
    }, 300);
  };

  const choose = (r: AddressResult) => {
    clearTimeout(sugTimer.current); sugAbort.current?.abort();
    setPicked(r); setQuery(label(r)); setSuggestions([]); setMessage('');
  };

  const open = (r: AddressResult) => {
    inputRef.current?.blur();
    setSuggestions([]);
    trackInteraction('איתור כתובת מהיר · חיפוש', 'emergency_info');
    setMapQuery(mapLink(MAP_URL, r));
  };

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (q.length < 2) { inputRef.current?.focus(); return; }
    if (picked) { open(picked); return; }
    clearTimeout(sugTimer.current); sugAbort.current?.abort();
    setBusy(true); setMessage('');
    const res = await lookupAddress(q);
    setBusy(false);
    if (!res.length) { setSuggestions([]); setMessage('לא מצאתי את הכתובת. נסו להוסיף עיר'); return; }
    if (res.length === 1 || res[0].exact) { open(res[0]); return; }
    setSuggestions(res); setMessage('בחרו את הכתובת המתאימה');
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-emt-dark" dir="rtl">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2 min-w-0">
          {mapQuery !== null ? (
            <HapticButton
              onClick={() => setMapQuery(null)}
              pressScale={0.88}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border flex items-center justify-center text-gray-500 dark:text-emt-muted"
              aria-label="חיפוש כתובת אחרת"
            >
              <ArrowRight size={20} />
            </HapticButton>
          ) : (
            <MapPinned size={22} className="text-rose-400 shrink-0" />
          )}
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl leading-tight truncate">איתור כתובת מהיר</h2>
          <BetaTag />
        </div>
        <HapticButton
          onClick={onClose}
          pressScale={0.88}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border flex items-center justify-center text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
          aria-label="סגור"
        >
          <X size={20} />
        </HapticButton>
      </div>

      {mapQuery !== null ? (
        <iframe
          key={mapQuery}
          title="מפת איתור כתובת"
          src={mapQuery}
          allow="geolocation; accelerometer; gyroscope; magnetometer"
          className="flex-1 w-full border-0 bg-white"
        />
      ) : (
        <div className="flex-1 overflow-y-auto px-5 pt-10 pb-10 flex flex-col items-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center border border-rose-400/35 mb-6"
            style={{ background: 'linear-gradient(135deg, rgba(251,113,133,0.20) 0%, rgba(225,29,72,0.10) 100%)', boxShadow: '0 0 40px rgba(244,63,94,0.18)' }}
          >
            <MapPinned size={40} className="text-rose-400" />
          </div>
          <h1 className="text-gray-900 dark:text-emt-light font-bold text-2xl text-center leading-snug max-w-sm">
            ברוכים הבאים לשירות איתור כתובת מהיר מבית חובש +
          </h1>
          <p className="text-gray-500 dark:text-emt-muted text-base text-center mt-3 mb-7">אנא הזן את שם הכתובת</p>

          <form onSubmit={search} className="w-full max-w-md flex flex-col gap-3" role="search">
            <input
              ref={inputRef}
              value={query}
              onChange={e => onType(e.target.value)}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              lang="he"
              autoComplete="off"
              placeholder="רחוב, מספר בית ועיר"
              aria-label="כתובת ועיר"
              className="w-full rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray px-4 py-4 text-lg text-gray-900 dark:text-emt-light placeholder:text-gray-400 dark:placeholder:text-emt-muted outline-none focus:border-rose-400/70 focus:ring-2 focus:ring-rose-400/25"
            />
            {message && <p className="text-sm font-semibold text-rose-400 px-1">{message}</p>}
            {suggestions.length > 0 && (
              <div className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray overflow-hidden" role="listbox" aria-label="הצעות כתובת">
                {suggestions.map((r, i) => (
                  <button
                    key={`${r.line1}|${r.line2}|${i}`}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => choose(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-right border-t first:border-t-0 border-gray-100 dark:border-emt-border active:bg-rose-400/10"
                  >
                    <MapPin size={18} className="text-rose-400 shrink-0" />
                    <span className="min-w-0">
                      <span className="block font-bold text-gray-900 dark:text-emt-light truncate">{r.line1}</span>
                      {r.line2 && <span className="block text-xs text-gray-500 dark:text-emt-muted">{r.line2}</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <HapticButton
              type="submit"
              pressScale={0.96}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-lg disabled:opacity-80"
              style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', boxShadow: '0 4px 24px rgba(225,29,72,0.35)' }}
            >
              {busy ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
              {busy ? 'מחפש…' : 'חיפוש'}
            </HapticButton>
          </form>

          <p className="text-gray-400 dark:text-emt-muted text-xs text-center mt-6 max-w-xs leading-relaxed">
            השירות בניסוי. המידע מגיע ממפה פתוחה ועלול להיות חסר, אז בקריאה דחופה כדאי לאמת גם מול המוקד.
          </p>
        </div>
      )}

      {/* First-time explanation */}
      <AnimatePresence>
        {showIntro && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/55"
              onClick={closeIntro}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              className="fixed inset-x-0 bottom-0 z-[71] max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-white dark:bg-emt-dark border-t border-gray-200 dark:border-emt-border px-5 pt-4"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
              role="dialog"
              aria-label="מה זה איתור כתובת מהיר"
            >
              <div className="mx-auto mb-3 w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">איתור כתובת מהיר</h2>
                <BetaTag />
              </div>
              <p className="text-gray-500 dark:text-emt-muted text-sm text-center mb-4">
                לכתובות שקשה למצוא: מתחמים, בניינים פנימיים וכניסות מאחור
              </p>
              <div className="flex flex-col gap-2">
                {BENEFITS.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-rose-400/12 border border-rose-400/30">
                      <Icon size={20} className="text-rose-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-900 dark:text-emt-light font-bold text-sm leading-tight">{title}</p>
                      <p className="text-gray-500 dark:text-emt-muted text-xs leading-relaxed mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <HapticButton
                onClick={closeIntro}
                pressScale={0.96}
                className="w-full mt-4 py-3.5 rounded-2xl text-white font-bold text-lg"
                style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' }}
              >
                הבנתי, בוא נתחיל
              </HapticButton>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
