import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, Flame, HeartPulse, Phone, Ruler, Search, Wind } from 'lucide-react';
import { trackEvent } from '../../../utils/analytics';
import {
  EAC_DIGITS, EAC_LETTERS, HAZ_CLASSES, HAZ_GENERAL_FIRST_AID, HAZ_GUIDES, HAZ_MATERIALS,
} from '../data/hazmatData';
import type { HazMaterial } from '../data/hazmatData';

const UNKNOWN_GUIDE = 111;

function classInfo(cls: string) {
  return HAZ_CLASSES.find(c => c.cls === cls)
    ?? { cls, name: cls === '2' ? 'גז' : '', color: 'bg-gray-200 text-black' };
}

function decodeEac(raw: string) {
  const code = raw.toUpperCase().replace(/[^0-9A-Z]/g, '');
  const digit = EAC_DIGITS[code[0]];
  const letter = EAC_LETTERS[code[1]];
  if (!digit || !letter) return null;
  return { digit, letter, evacuate: code[2] === 'E' };
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-gray-900 dark:text-emt-light font-bold text-base">
        {icon}
        <h4>{title}</h4>
      </div>
      {children}
    </div>
  );
}

function Bullets({ items, className }: { items: string[]; className: string }) {
  return (
    <ul className={`flex flex-col gap-1.5 text-sm leading-relaxed list-disc pr-5 ${className}`}>
      {items.map(t => <li key={t}>{t}</li>)}
    </ul>
  );
}

function DistanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5
                    bg-gray-100 dark:bg-emt-dark border border-gray-200 dark:border-emt-border">
      <span className="text-sm text-gray-600 dark:text-emt-muted">{label}</span>
      <span className="text-base font-black text-gray-900 dark:text-emt-light text-left">{value}</span>
    </div>
  );
}

function MaterialCard({ material }: { material: HazMaterial | null }) {
  const guide = HAZ_GUIDES[material?.guide ?? UNKNOWN_GUIDE];
  const cls = material ? classInfo(material.cls) : null;

  return (
    <div className="rounded-2xl border border-orange-400/40 bg-white dark:bg-emt-gray p-4 flex flex-col gap-4">
      {material && cls ? (
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-xl bg-orange-500 text-black font-black text-xl px-3 py-2 leading-none" dir="ltr">
            {material.un}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 dark:text-emt-light font-black text-xl leading-tight">{material.he}</p>
            <p className="text-gray-500 dark:text-emt-muted text-sm" dir="ltr" style={{ textAlign: 'right' }}>{material.en}</p>
            <span className={`inline-block mt-2 rounded-md px-2 py-0.5 text-xs font-bold ${cls.color}`}>
              קבוצה {cls.cls} · {cls.name}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-gray-900 dark:text-emt-light font-bold text-base leading-snug">
          המספר לא נמצא ברשימה. אלה ההנחיות לחומר לא מזוהה, עד לזיהוי בידי כבאות והצלה.
        </p>
      )}

      {material?.tih && (
        <div className="rounded-xl bg-red-600 text-white px-3 py-2.5 text-sm font-bold leading-snug flex gap-2">
          <Wind size={18} className="shrink-0 mt-0.5" />
          גז רעיל בשאיפה. בדליפה גדולה אזור הסכנה במורד הרוח עלול להגיע לקילומטרים. להתמקם במעלה הרוח.
        </div>
      )}

      {material?.note && (
        <div className="rounded-xl border border-amber-400/50 bg-amber-50 dark:bg-amber-400/10 px-3 py-2.5
                        text-sm font-semibold text-amber-900 dark:text-amber-200 leading-snug flex gap-2">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          {material.note}
        </div>
      )}

      <Section icon={<Flame size={18} className="text-orange-500" />} title={`סכנות · ${guide.title}`}>
        <Bullets items={guide.dangers} className="text-gray-700 dark:text-emt-light/85" />
      </Section>

      <Section icon={<Ruler size={18} className="text-blue-500" />} title="מרחקי בטיחות ראשוניים">
        <DistanceRow label="בידוד מיידי לכל הכיוונים" value={guide.isolate} />
        {guide.largeSpill && <DistanceRow label="דליפה גדולה, במורד הרוח" value={guide.largeSpill} />}
        {guide.fire && <DistanceRow label="מכל או מכלית בשריפה" value={guide.fire} />}
      </Section>

      <Section icon={<HeartPulse size={18} className="text-emt-red" />} title="טיפול בנפגע">
        <Bullets items={[...guide.firstAid, ...HAZ_GENERAL_FIRST_AID]} className="text-gray-700 dark:text-emt-light/85" />
      </Section>
    </div>
  );
}

function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-right
                   text-gray-900 dark:text-emt-light font-bold text-base"
      >
        {title}
        <ChevronDown size={20} className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 flex flex-col gap-3">{children}</div>}
    </div>
  );
}

export default function HazmatLookup() {
  const [query, setQuery] = useState('');
  const [eac, setEac] = useState('');

  const q = query.trim();
  const isNumber = /^\d+$/.test(q);
  const exact = useMemo(
    () => (isNumber && q.length === 4 ? HAZ_MATERIALS.find(m => m.un === Number(q)) ?? null : null),
    [q, isNumber],
  );
  const suggestions = useMemo(() => {
    if (!q || exact) return [];
    if (isNumber) return q.length < 4 ? HAZ_MATERIALS.filter(m => String(m.un).startsWith(q)).slice(0, 8) : [];
    if (q.length < 2) return [];
    const lower = q.toLowerCase();
    return HAZ_MATERIALS.filter(m => m.he.includes(q) || m.en.toLowerCase().includes(lower)).slice(0, 8);
  }, [q, isNumber, exact]);
  const notFound = isNumber && q.length === 4 && !exact;
  const decoded = decodeEac(eac);

  const pick = (m: HazMaterial) => {
    setQuery(String(m.un));
    trackEvent('hazmat_lookup', { un: m.un });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* UN number / name search */}
      <div className="flex flex-col gap-2">
        <label htmlFor="hazmat-query" className="text-sm font-semibold text-gray-800 dark:text-emt-light">
          מספר או״ם מהשלט הכתום (4 ספרות), או שם החומר
        </label>
        <div className="relative">
          <Search size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            id="hazmat-query"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="למשל 1203 או בנזין"
            autoComplete="off"
            enterKeyHint="search"
            className="w-full rounded-xl border border-gray-300 dark:border-emt-border bg-white dark:bg-emt-gray
                       pr-11 pl-4 py-3.5 text-xl font-bold text-gray-900 dark:text-emt-light
                       placeholder:text-gray-400 placeholder:font-normal placeholder:text-base
                       focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {suggestions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {suggestions.map(m => (
              <button
                key={m.un}
                onClick={() => pick(m)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-right
                           bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border active:scale-[0.98] transition-transform"
              >
                <span className="shrink-0 rounded-md bg-orange-500 text-black font-black text-sm px-2 py-1" dir="ltr">{m.un}</span>
                <span className="flex-1 text-gray-900 dark:text-emt-light font-semibold text-sm">{m.he}</span>
              </button>
            ))}
          </div>
        )}
        {q.length >= 2 && !isNumber && suggestions.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-emt-muted">לא נמצא חומר בשם הזה. נסו לפי מספר האו״ם.</p>
        )}
      </div>

      {(exact || notFound) && <MaterialCard material={exact} />}

      {/* Safety first */}
      <div className="rounded-2xl border border-red-400/50 bg-red-50 dark:bg-red-900/20 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-600 dark:text-red-400 shrink-0" />
          <h3 className="text-red-700 dark:text-red-300 font-bold text-base">קודם כול בטיחות</h3>
        </div>
        <ul className="flex flex-col gap-1.5 text-sm text-red-800 dark:text-red-200 leading-relaxed list-disc pr-5">
          <li>לעצור רחוק, במעלה הרוח ובמקום גבוה. לקרוא את השלט ממרחק.</li>
          <li>לא נכנסים לאזור הדליפה בלי מיגון מתאים ולא נוגעים בחומר.</li>
          <li>לדווח למוקד ולכבאות והצלה ולפעול לפי ההנחיות שלהם.</li>
        </ul>
        <a
          href="tel:102"
          onClick={() => trackEvent('hazmat_call_fire')}
          className="flex items-center justify-center gap-3 py-3 rounded-xl
                     bg-emt-red text-white font-bold text-xl active:scale-95 transition-transform shadow-md"
        >
          <Phone size={24} />
          כבאות והצלה · 102
        </a>
      </div>

      {/* Emergency action code */}
      <Collapsible title="פענוח קוד חירום (למשל 2WE)">
        <input
          value={eac}
          onChange={e => setEac(e.target.value)}
          placeholder="2WE"
          maxLength={4}
          autoComplete="off"
          autoCapitalize="characters"
          dir="ltr"
          aria-label="קוד חירום"
          className="w-full rounded-xl border border-gray-300 dark:border-emt-border bg-white dark:bg-emt-dark
                     px-4 py-3 text-xl font-bold uppercase text-gray-900 dark:text-emt-light text-center
                     placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        {decoded ? (
          <ul className="flex flex-col gap-1.5 text-sm text-gray-800 dark:text-emt-light leading-relaxed list-disc pr-5">
            <li>{decoded.digit}.</li>
            <li>מיגון לצוות המטפל בחומר: {decoded.letter.ppe}.</li>
            <li>{decoded.letter.spill === 'dilute' ? 'שפך: לדלל ולשטוף במים רבים.' : 'שפך: להכיל. למנוע זרימה לביוב ולמקורות מים.'}</li>
            {decoded.letter.violent && <li className="font-bold text-red-600 dark:text-red-400">החומר עלול להגיב בעוצמה או להתפוצץ.</li>}
            {decoded.evacuate && <li className="font-bold text-red-600 dark:text-red-400">E: סכנה לציבור. לשקול פינוי של הסביבה.</li>}
          </ul>
        ) : eac.trim().length >= 2 ? (
          <p className="text-sm text-gray-500 dark:text-emt-muted">קוד לא תקין. הקוד בנוי מספרה 1–4, אות P–Z ולעיתים E.</p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-emt-muted leading-relaxed">
            הקוד מופיע על השלט הכתום לצד מספר האו״ם. הוא מיועד בעיקר לכבאים, אבל מלמד אם החומר נפיץ ואם נדרש פינוי.
          </p>
        )}
        {decoded && /[STYZ]/.test(eac.toUpperCase()) && (
          <p className="text-xs text-gray-500 dark:text-emt-muted leading-relaxed">
            אות לבנה על רקע שחור: מערכת נשימה נדרשת רק כשיש שריפה.
          </p>
        )}
      </Collapsible>

      {/* Hazard classes */}
      <Collapsible title="קבוצות סיכון 1–9 (המעוין על המשאית)">
        <div className="flex flex-col gap-1.5">
          {HAZ_CLASSES.map(c => (
            <div key={c.cls} className="flex items-center gap-3">
              <span className={`shrink-0 w-12 text-center rounded-md py-1 text-sm font-black ${c.color}`} dir="ltr">{c.cls}</span>
              <span className="text-sm text-gray-800 dark:text-emt-light">{c.name}</span>
            </div>
          ))}
        </div>
      </Collapsible>

      <p className="text-xs text-gray-500 dark:text-emt-muted leading-relaxed">
        הרשימה כוללת {HAZ_MATERIALS.length} חומרים נפוצים ואינה מלאה. המרחקים וההנחיות לפי מדריך התגובה לחירום ERG 2024
        והם ראשוניים בלבד. הנחיות כבאות והצלה והמוקד קובעות.
      </p>
    </div>
  );
}
