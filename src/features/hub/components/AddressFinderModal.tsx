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
  const [focused, setFocused] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [message, setMessage] = useState('');
  const sugTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sugAbort = useRef<AbortController | null>(null);
  useEffect(() => () => { clearTimeout(sugTimer.current); sugAbort.current?.abort(); }, []);
  // the map page says when its first map tiles are drawn; until then a loading screen covers the white page
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin === new URL(MAP_URL).origin && e.data?.type === 'entrance-finder-ready') setMapLoading(false);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);
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

  const typing = focused || query.trim().length > 0 || suggestions.length > 0;

  const label = (r: AddressResult) => {
    // keep the number the user typed (49א) even when the map only knows 49
    const num = r.exact ? (r.housenumber || r.qNum) : r.qNum;
    const street = r.street || r.line1.replace(/\s*\d+\s*[א-ת]?$/, '');
    const l1 = num && (!r.housenumber || !r.exact) ? `${street} ${num}`.trim() : r.line1;
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

  // tapping a suggestion opens the map straight away: no second tap on "חיפוש"
  const choose = (r: AddressResult) => {
    clearTimeout(sugTimer.current); sugAbort.current?.abort();
    setPicked(r); setQuery(label(r)); setMessage('');
    open(r);
  };

  const clear = () => {
    clearTimeout(sugTimer.current); sugAbort.current?.abort();
    setQuery(''); setPicked(null); setSuggestions([]); setMessage('');
    inputRef.current?.focus();
  };

  const open = (r: AddressResult) => {
    inputRef.current?.blur();
    setSuggestions([]);
    trackInteraction('איתור כתובת מהיר · חיפוש', 'emergency_info');
    setMapLoading(true);
    setTimeout(() => setMapLoading(false), 15000); // never keep the loading screen forever
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
        <div className="relative flex-1 flex">
          <iframe
            key={mapQuery}
            title="מפת איתור כתובת"
            src={mapQuery}
            allow="geolocation; accelerometer; gyroscope; magnetometer"
            className="flex-1 w-full border-0 bg-white"
          />
          {/* the first open downloads the map page, which can take a few seconds */}
          {mapLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-emt-dark" role="status">
              <Loader2 size={34} className="animate-spin text-rose-400" />
              <p className="text-gray-600 dark:text-emt-muted font-semibold">טוען את המפה…</p>
            </div>
          )}
        </div>
      ) : (
        // while typing, the welcome text folds away so the field, search button and suggestions
        // sit at the top of the screen, above the phone keyboard
        <div className={`relative flex-1 overflow-y-auto px-5 flex flex-col items-center ${typing ? 'pt-4 pb-4' : 'pt-12 pb-10'}`}>
          {!typing && (
            <>
              <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[28rem] h-80 rounded-full bg-rose-500/10 blur-3xl" />
              {/* a pin with a slow ring around it, like a location being found */}
              <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border border-rose-400/25 motion-safe:animate-ping [animation-duration:2.6s]" />
                <span className="absolute inset-2 rounded-full border border-rose-400/30" />
                <span
                  className="relative w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)', boxShadow: '0 8px 30px rgba(225,29,72,0.40)' }}
                >
                  <MapPin size={30} className="text-white" strokeWidth={2.4} />
                </span>
              </div>
              <span className="relative text-xs font-bold text-rose-500 dark:text-rose-300 bg-rose-500/10 border border-rose-400/30 rounded-full px-3 py-1 mb-3">
                ברוכים הבאים · מבית חובש +
              </span>
              <h1 className="relative text-gray-900 dark:text-emt-light font-extrabold text-[28px] text-center leading-tight">
                לאיזו כתובת מגיעים?
              </h1>
              <p className="relative text-gray-500 dark:text-emt-muted text-base text-center mt-2 mb-7 max-w-xs leading-relaxed">
                כתבו רחוב, מספר בית ועיר, והבניין יסומן לכם על המפה
              </p>
            </>
          )}

          <form onSubmit={search} className="relative w-full max-w-md flex flex-col gap-2.5" role="search">
            <div className="flex items-stretch gap-2">
              <div className="relative flex-1 min-w-0">
                <MapPin size={20} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-rose-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => onType(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  lang="he"
                  autoComplete="off"
                  placeholder="רחוב, מספר בית ועיר"
                  aria-label="כתובת ועיר"
                  className={`w-full rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray pr-10 ${query ? 'pl-11' : 'pl-3'} py-3.5 text-lg text-gray-900 dark:text-emt-light placeholder:text-gray-400 dark:placeholder:text-emt-muted outline-none focus:border-rose-400/70 focus:ring-2 focus:ring-rose-400/25`}
                />
                {/* clears the whole field in one tap */}
                {query && (
                  <button
                    type="button"
                    onPointerDown={e => e.preventDefault()}
                    onClick={clear}
                    aria-label="מחיקת הכתובת"
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-gray-400 dark:text-emt-muted active:bg-gray-100 dark:active:bg-white/10"
                  >
                    <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/15 flex items-center justify-center">
                      <X size={15} strokeWidth={2.6} className="text-gray-600 dark:text-emt-light" />
                    </span>
                  </button>
                )}
              </div>
              {/* the search button sits next to the field, so the keyboard never hides it */}
              <HapticButton
                type="submit"
                pressScale={0.94}
                disabled={busy}
                onPointerDown={e => e.preventDefault()}
                className="shrink-0 flex items-center justify-center gap-1.5 px-4 rounded-2xl text-white font-bold text-base disabled:opacity-80"
                style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', boxShadow: '0 4px 18px rgba(225,29,72,0.35)' }}
              >
                {busy ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                חיפוש
              </HapticButton>
            </div>
            {message && <p className="text-sm font-semibold text-rose-400 px-1">{message}</p>}
            {suggestions.length > 0 && (
              <div className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray overflow-hidden" role="listbox" aria-label="הצעות כתובת">
                {suggestions.map((r, i) => (
                  <button
                    key={`${r.line1}|${r.line2}|${i}`}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onPointerDown={e => e.preventDefault()}
                    onClick={() => choose(r)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-right border-t first:border-t-0 border-gray-100 dark:border-emt-border active:bg-rose-400/10"
                  >
                    <MapPin size={18} className="text-rose-400 shrink-0" />
                    <span className="min-w-0">
                      <span className="block font-bold text-gray-900 dark:text-emt-light truncate">{r.line1}</span>
                      {r.line2 && <span className="block text-xs text-gray-500 dark:text-emt-muted">{r.line2}</span>}
                      {/* the map knows the street but not the number typed: say so before the tap */}
                      {!r.exact && r.qNum && !r.housenumber && (
                        <span className="block text-xs font-semibold text-amber-600 dark:text-amber-300">מספר {r.qNum} לא רשום במפה, יסומן הרחוב</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </form>

          {!typing && (
            <p className="text-gray-400 dark:text-emt-muted text-xs text-center mt-6 max-w-xs leading-relaxed">
              השירות בניסוי. המידע מגיע ממפה פתוחה ועלול להיות חסר, אז בקריאה דחופה כדאי לאמת גם מול המוקד.
            </p>
          )}
        </div>
      )}

      {/* First-time explanation: a full screen of its own */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="fixed inset-0 z-[71] flex flex-col overflow-hidden bg-gray-50 dark:bg-emt-dark"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
            role="dialog"
            aria-label="מה זה איתור כתובת מהיר"
          >
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl" />
            <div className="relative flex-1 overflow-y-auto px-5 pt-8 flex flex-col">
              <div
                className="mx-auto w-24 h-24 rounded-3xl flex items-center justify-center border border-rose-400/35 mb-5"
                style={{ background: 'linear-gradient(135deg, rgba(251,113,133,0.22) 0%, rgba(225,29,72,0.10) 100%)', boxShadow: '0 0 48px rgba(244,63,94,0.22)' }}
              >
                <MapPinned size={50} className="text-rose-400" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-gray-900 dark:text-emt-light font-extrabold text-3xl leading-tight">איתור כתובת מהיר</h2>
                <BetaTag />
              </div>
              <p className="text-gray-500 dark:text-emt-muted text-base text-center mb-6 leading-relaxed">
                לכתובות שקשה למצוא: מתחמים, בניינים פנימיים וכניסות מאחור
              </p>
              <div className="flex flex-col gap-3 pb-2">
                {BENEFITS.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-center gap-4 rounded-2xl px-4 py-3.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-rose-400/12 border border-rose-400/30">
                      <Icon size={24} className="text-rose-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-900 dark:text-emt-light font-bold text-base leading-tight">{title}</p>
                      <p className="text-gray-500 dark:text-emt-muted text-sm leading-relaxed mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative px-5 pt-4">
              <HapticButton
                onClick={closeIntro}
                pressScale={0.96}
                className="w-full py-4 rounded-2xl text-white font-bold text-xl"
                style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', boxShadow: '0 4px 28px rgba(225,29,72,0.4)' }}
              >
                הבנתי, בוא נתחיל
              </HapticButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
