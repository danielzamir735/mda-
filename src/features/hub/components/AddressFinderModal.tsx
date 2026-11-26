import { useState, useRef, useEffect } from 'react';
import { X, MapPinned, Search, Building2, Hash, Footprints, Navigation, Compass, MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';
import { trackInteraction } from '../../../utils/analytics';
import { suggestAddresses, lookupAddress, mapLink, type AddressResult } from '../utils/addressSearch';

// "איתור כתובת מהיר" (beta): the map opens straight away on the user's own location, so they can see what is
// around them. An address typed in the bar above it is marked on the same map (the building in red, every
// house number, footpaths and stairs), and the small buttons hand it to Waze or Google Maps.
// The map itself is a separate page, embedded here.
const MAP_URL = 'https://entrance-finder-ten.vercel.app/';
const MAP_ORIGIN = new URL(MAP_URL).origin;
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
    <span className="text-[10px] font-extrabold tracking-wide px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/40">
      בטא
    </span>
  );
}

// the address as the user typed it (49א stays 49א even when the map only knows 49)
const label = (r: AddressResult) => {
  const num = r.exact ? (r.housenumber || r.qNum) : r.qNum;
  const street = r.street || r.line1.replace(/\s*\d+\s*[א-ת]?$/, '');
  const l1 = num && (!r.housenumber || !r.exact) ? `${street} ${num}`.trim() : r.line1;
  return r.line2 ? `${l1}, ${r.line2}` : l1;
};

// Waze and Google Maps: the exact point when the house itself was found, else the address as typed
// (they know house numbers the open map lacks)
function navLinks(r: AddressResult) {
  const exact = r.exact && !!r.housenumber;
  const q = encodeURIComponent(label(r));
  const ll = `${r.lat.toFixed(6)},${r.lng.toFixed(6)}`;
  return {
    waze: exact ? `https://waze.com/ul?ll=${ll}&navigate=yes` : `https://waze.com/ul?q=${q}&navigate=yes`,
    google: `https://www.google.com/maps/dir/?api=1&destination=${exact ? ll : q}`,
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddressFinderModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
  const [picked, setPicked] = useState<AddressResult | null>(null);
  const [shown, setShown] = useState<AddressResult | null>(null); // the address marked on the map now
  const [busy, setBusy] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [message, setMessage] = useState('');
  const frameRef = useRef<HTMLIFrameElement>(null);
  const mapReady = useRef(false);
  const pending = useRef<string | null>(null); // an address chosen before the map finished loading
  const sugTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sugAbort = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // the map opens on the user's own location; addresses are sent to it later, without loading it again
  const send = (link: string) => {
    const win = frameRef.current?.contentWindow;
    if (!mapReady.current || !win) { pending.current = link; return; }
    win.postMessage({ type: 'ef-goto', query: link.split('?')[1] || '' }, MAP_ORIGIN);
  };

  useEffect(() => () => { clearTimeout(sugTimer.current); sugAbort.current?.abort(); }, []);

  // the explanation shows only the first time (the modal is mounted only while open)
  const [showIntro, setShowIntro] = useState(() => {
    try { return localStorage.getItem(INTRO_KEY) !== '1'; } catch { return true; }
  });
  const closeIntro = () => {
    try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* private mode */ }
    setShowIntro(false);
  };

  useModalBackHandler(isOpen, onClose);

  // Location. The app asks for it itself as soon as the map is on screen, so the browser's own prompt opens at
  // once and names the app. A browser never shows that prompt again after the user blocked it, so then a note
  // explains how to allow it, with a button that asks again. Once allowed, the map is told to go to the user.
  const [loc, setLoc] = useState<'asking' | 'granted' | 'denied' | 'unavailable'>('asking');
  const [howTo, setHowTo] = useState(false);
  // The app follows the position itself and hands every update to the map: the map frame then never needs a
  // permission of its own (some phones refuse it inside a frame even when the site is allowed).
  // First a quick rough fix, so the map moves at once; then GPS updates refine it to a few metres.
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [roughHint, setRoughHint] = useState(false);
  const watchRef = useRef<number | null>(null);
  const lastPos = useRef<GeolocationPosition | null>(null);
  const postPos = (p: GeolocationPosition) => {
    lastPos.current = p;
    setAccuracy(a => (a == null ? p.coords.accuracy : Math.min(a, p.coords.accuracy)));
    const win = frameRef.current?.contentWindow;
    if (!mapReady.current || !win) return; // sent once the map is ready
    const c = p.coords;
    win.postMessage({ type: 'ef-pos', latitude: c.latitude, longitude: c.longitude, accuracy: c.accuracy, heading: c.heading, speed: c.speed }, MAP_ORIGIN);
  };
  const followPosition = () => {
    if (watchRef.current != null || !navigator.geolocation) return;
    // a quick first fix from the network or a recent reading
    navigator.geolocation.getCurrentPosition(postPos, () => { /* the GPS watch below still runs */ }, { enableHighAccuracy: false, timeout: 4000, maximumAge: 120000 });
    watchRef.current = navigator.geolocation.watchPosition(postPos, err => {
      if (err.code === err.PERMISSION_DENIED) { setLoc('denied'); if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
  };
  useEffect(() => () => { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); }, []);
  // still only a rough position after a while: usually "precise location" is off for the browser
  useEffect(() => {
    if (loc !== 'granted') return;
    const t = setTimeout(() => setRoughHint(true), 12000);
    return () => clearTimeout(t);
  }, [loc]);
  const askLocation = () => {
    if (!navigator.geolocation) { setLoc('unavailable'); return; }
    setLoc('asking');
    navigator.geolocation.getCurrentPosition(
      p => {
        setLoc('granted'); setHowTo(false);
        postPos(p);
        followPosition();
      },
      err => setLoc(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 },
    );
  };
  useEffect(() => {
    if (showIntro) return; // first the explanation, then the browser's question
    askLocation();
    // a permission changed in the browser's settings while the map is open is picked up at once
    let status: PermissionStatus | null = null;
    navigator.permissions?.query({ name: 'geolocation' }).then(s => {
      status = s;
      s.onchange = () => { if (s.state === 'granted') askLocation(); else if (s.state === 'denied') setLoc('denied'); };
    }).catch(() => { /* not supported (older Safari): the error from asking is enough */ });
    return () => { if (status) status.onchange = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showIntro]);

  // the map page says when it is drawn: then it gets the address chosen meanwhile and the latest position
  useEffect(() => {
    const t = setTimeout(() => setMapLoading(false), 15000); // never keep the loading screen forever
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== MAP_ORIGIN || e.data?.type !== 'entrance-finder-ready') return;
      mapReady.current = true; setMapLoading(false);
      if (pending.current) { const l = pending.current; pending.current = null; send(l); }
      if (lastPos.current) postPos(lastPos.current);
    };
    window.addEventListener('message', onMsg);
    return () => { clearTimeout(t); window.removeEventListener('message', onMsg); };
  }, []);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

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

  const open = (r: AddressResult) => {
    inputRef.current?.blur();
    clearTimeout(sugTimer.current); sugAbort.current?.abort();
    setSuggestions([]); setMessage('');
    setPicked(r); setShown(r); setQuery(label(r));
    trackInteraction('איתור כתובת מהיר · חיפוש', 'emergency_info');
    send(mapLink(MAP_URL, r));
  };

  const clear = () => {
    clearTimeout(sugTimer.current); sugAbort.current?.abort();
    setQuery(''); setPicked(null); setSuggestions([]); setMessage('');
    inputRef.current?.focus();
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

  const nav = shown ? navLinks(shown) : null;
  const navBtn = 'shrink-0 w-12 flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold leading-none transition-opacity';

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-emt-dark" dir="rtl">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <MapPinned size={22} className="text-rose-700 dark:text-rose-400 shrink-0" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl leading-tight truncate">איתור כתובת מהיר</h2>
          <BetaTag />
        </div>
        <HapticButton
          onClick={onClose}
          pressScale={0.88}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border flex items-center justify-center text-gray-600 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
          aria-label="סגור"
        >
          <X size={20} />
        </HapticButton>
      </div>

      {/* Search bar, with Waze and Google Maps for the address on the map */}
      <form onSubmit={search} className="relative z-10 shrink-0 px-3 pb-2.5 border-b border-gray-200 dark:border-emt-border" role="search">
        <div className="flex items-stretch gap-1.5 h-12">
          <div className="relative flex-1 min-w-0">
            <MapPin size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-rose-700 dark:text-rose-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => onType(e.target.value)}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              lang="he"
              autoComplete="off"
              placeholder="חיפוש כתובת"
              aria-label="כתובת ועיר"
              className={`w-full h-full rounded-xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray pr-9 ${query ? 'pl-10' : 'pl-3'} text-base text-gray-900 dark:text-emt-light placeholder:text-gray-400 dark:placeholder:text-emt-muted outline-none focus:border-rose-400/70 focus:ring-2 focus:ring-rose-400/25`}
            />
            {/* clears the whole field in one tap */}
            {query && (
              <button
                type="button"
                onPointerDown={e => e.preventDefault()}
                onClick={clear}
                aria-label="מחיקת הכתובת"
                className="absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center active:bg-gray-100 dark:active:bg-white/10"
              >
                <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/15 flex items-center justify-center">
                  <X size={14} strokeWidth={2.6} className="text-gray-600 dark:text-emt-light" />
                </span>
              </button>
            )}
          </div>
          <HapticButton
            type="submit"
            pressScale={0.94}
            disabled={busy}
            onPointerDown={e => e.preventDefault()}
            aria-label="חיפוש"
            className="shrink-0 w-12 flex items-center justify-center rounded-xl text-white disabled:opacity-80"
            style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' }}
          >
            {busy ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
          </HapticButton>
          {/* navigation apps: active once an address is on the map */}
          <a
            href={nav?.waze}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!nav}
            aria-label="ניווט בוויז"
            onClick={e => { if (!nav) { e.preventDefault(); setMessage('חפשו כתובת, ואז אפשר לנווט אליה'); } else trackInteraction('איתור כתובת מהיר · וויז', 'emergency_info'); }}
            className={`${navBtn} bg-[#33ccff] text-[#06263a] ${nav ? '' : 'opacity-40'}`}
          >
            <Navigation size={17} strokeWidth={2.4} />
            וויז
          </a>
          <a
            href={nav?.google}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!nav}
            aria-label="ניווט בגוגל מפות"
            onClick={e => { if (!nav) { e.preventDefault(); setMessage('חפשו כתובת, ואז אפשר לנווט אליה'); } else trackInteraction('איתור כתובת מהיר · גוגל מפות', 'emergency_info'); }}
            className={`${navBtn} bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border text-gray-800 dark:text-emt-light ${nav ? '' : 'opacity-40'}`}
          >
            <MapPin size={17} strokeWidth={2.4} className="text-[#ea4335]" />
            גוגל
          </a>
        </div>
        {message && <p className="text-sm font-semibold text-rose-700 dark:text-rose-400 px-1 pt-1.5">{message}</p>}
        {/* location allowed but only rough: "precise location" is off for the browser */}
        {loc === 'granted' && roughHint && accuracy != null && accuracy > 300 && (
          <div className="mt-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2.5 text-sm" role="status">
            <p className="font-bold text-gray-900 dark:text-emt-light">המיקום לא מדויק (בערך {Math.round(accuracy / 100) * 100} מ')</p>
            <p className="text-gray-600 dark:text-emt-muted leading-snug mt-0.5">
              {isIOS
                ? <>בהגדרות הטלפון: <b>פרטיות ואבטחה</b> ← <b>שירותי מיקום</b> ← <b>אתרי Safari</b> (או הדפדפן שלך) ← להדליק <b>מיקום מדויק</b>.</>
                : <>ליד כתובת האתר: סמל המנעול ← <b>הרשאות</b> ← <b>מיקום</b> ← להדליק <b>מיקום מדויק</b>. ובהגדרות הטלפון: <b>מיקום</b> ← <b>דיוק מיקום של Google</b> פועל.</>}
            </p>
          </div>
        )}
        {/* location blocked: the browser will not ask again by itself, so say how to allow it */}
        {(loc === 'denied' || loc === 'unavailable') && (
          <div className="mt-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2.5 text-sm" role="alert">
            <div className="flex items-start gap-2">
              <Navigation size={16} className="shrink-0 mt-0.5 text-amber-800 dark:text-amber-300" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 dark:text-emt-light">כדי שהשירות יעבוד, צריך להפעיל את המיקום בטלפון</p>
                <p className="text-gray-600 dark:text-emt-muted leading-snug mt-0.5">
                  {loc === 'denied'
                    ? 'המיקום כבוי או חסום לדפדפן, ולכן המפה לא יודעת איפה אתה ביחס לבניין. אפשר לחפש כתובת גם בינתיים.'
                    : 'המיקום (GPS) בטלפון כבוי, או שאין כרגע קליטה. הפעילו אותו ולחצו "נסה שוב".'}
                </p>
                {howTo && (
                  <ol className="list-decimal pr-4 mt-1.5 space-y-0.5 text-gray-700 dark:text-emt-light">
                    {isIOS ? (
                      <>
                        <li>פותחים את <b>הגדרות</b> בטלפון ← <b>פרטיות ואבטחה</b> ← <b>שירותי מיקום</b>: להדליק</li>
                        <li>באותו מסך: <b>אתרי Safari</b> (או הדפדפן שבו פתחת) ← <b>בעת השימוש ביישום</b>, ולהדליק <b>מיקום מדויק</b></li>
                        <li>חוזרים לכאן ולוחצים <b>נסה שוב</b></li>
                      </>
                    ) : (
                      <>
                        <li>מושכים מלמעלה את ההגדרות המהירות ומדליקים <b>מיקום</b></li>
                        <li>סמל המנעול ליד כתובת האתר ← <b>הרשאות</b> ← <b>מיקום</b> ← <b>אישור</b>, ולהדליק <b>מיקום מדויק</b></li>
                        <li>חוזרים לכאן ולוחצים <b>נסה שוב</b></li>
                      </>
                    )}
                  </ol>
                )}
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={askLocation} className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs active:opacity-80">
                    נסה שוב
                  </button>
                  <button type="button" onClick={() => setHowTo(v => !v)} className="px-3 py-1.5 rounded-lg border border-amber-400/50 text-amber-800 dark:text-amber-200 font-bold text-xs">
                    {howTo ? 'הסתר הסבר' : 'איך מפעילים?'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* suggestions open over the map */}
        {suggestions.length > 0 && (
          <div className="absolute right-3 left-3 top-full mt-1 rounded-xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray overflow-hidden shadow-xl" role="listbox" aria-label="הצעות כתובת">
            {suggestions.map((r, i) => (
              <button
                key={`${r.line1}|${r.line2}|${i}`}
                type="button"
                role="option"
                aria-selected={false}
                onPointerDown={e => e.preventDefault()}
                onClick={() => open(r)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-right border-t first:border-t-0 border-gray-100 dark:border-emt-border active:bg-rose-400/10"
              >
                <MapPin size={18} className="text-rose-700 dark:text-rose-400 shrink-0" />
                <span className="min-w-0">
                  <span className="block font-bold text-gray-900 dark:text-emt-light truncate">{r.line1}</span>
                  {r.line2 && <span className="block text-xs text-gray-600 dark:text-emt-muted">{r.line2}</span>}
                  {/* the map knows the street but not the number typed: say so before the tap */}
                  {!r.exact && r.qNum && !r.housenumber && (
                    <span className="block text-xs font-semibold text-amber-800 dark:text-amber-300">מספר {r.qNum} לא רשום במפה, יסומן הרחוב</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* The map: the user's own location until an address is searched */}
      <div className="relative flex-1 flex">
        <iframe
          ref={frameRef}
          title="מפת איתור כתובת"
          src={`${MAP_URL}?embed=1`}
          allow="geolocation; accelerometer; gyroscope; magnetometer"
          className="flex-1 w-full border-0 bg-white"
        />
        {/* the first open downloads the map page, which can take a few seconds */}
        {mapLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-emt-dark" role="status">
            <Loader2 size={34} className="animate-spin text-rose-700 dark:text-rose-400" />
            <p className="text-gray-600 dark:text-emt-muted font-semibold">טוען את המפה…</p>
          </div>
        )}
      </div>

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
                <MapPinned size={50} className="text-rose-700 dark:text-rose-400" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-gray-900 dark:text-emt-light font-extrabold text-3xl leading-tight">איתור כתובת מהיר</h2>
                <BetaTag />
              </div>
              <p className="text-gray-600 dark:text-emt-muted text-base text-center mb-6 leading-relaxed">
                לכתובות שקשה למצוא: מתחמים, בניינים פנימיים וכניסות מאחור
              </p>
              <div className="flex flex-col gap-3 pb-2">
                {BENEFITS.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-center gap-4 rounded-2xl px-4 py-3.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-rose-400/12 border border-rose-400/30">
                      <Icon size={24} className="text-rose-700 dark:text-rose-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-900 dark:text-emt-light font-bold text-base leading-tight">{title}</p>
                      <p className="text-gray-600 dark:text-emt-muted text-sm leading-relaxed mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-gray-600 dark:text-emt-muted text-xs text-center mt-4 leading-relaxed">
                השירות בניסוי. המידע מגיע ממפות פתוחות ומהעיריות ועלול להיות חסר, אז בקריאה דחופה כדאי לאמת גם מול המוקד.
              </p>
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
