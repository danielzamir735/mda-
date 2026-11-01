import { useState, useEffect, useRef } from 'react';
import { X, HeartHandshake, Wind, Phone, Trash2, Lock, Check, ChevronDown, Pencil } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';
import { useDebriefStore } from '../../../store/debriefStore';
import { trackInteraction } from '../../../utils/analytics';

// "אחרי קריאה קשה" — works fully offline, nothing is sent to a server.

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale';
const PHASES: { phase: Exclude<BreathPhase, 'idle'>; sec: number; label: string }[] = [
  { phase: 'inhale', sec: 4, label: 'שאיפה' },
  { phase: 'hold',   sec: 4, label: 'עצירה' },
  { phase: 'exhale', sec: 6, label: 'נשיפה' },
];

const HELPERS: { id: string; emoji: string; title: string; desc: string }[] = [
  { id: 'ground', emoji: '🖐️', title: 'קרקוע 5-4-3-2-1', desc: '5 דברים שאתה רואה, 4 שאתה שומע, 3 שאתה מרגיש במגע, 2 ריחות, דבר אחד שאתה טועם. מחזיר את הגוף לכאן ועכשיו.' },
  { id: 'water',  emoji: '💧', title: 'לשתות ולאכול משהו', desc: 'כוס מים ומשהו קטן לאכול. אחרי אדרנלין של קריאה הגוף צריך דלק.' },
  { id: 'move',   emoji: '🚶', title: 'לזוז קצת', desc: 'הליכה קצרה, מתיחות או לשטוף פנים במים קרים — עוזר לגוף לפרוק את המתח.' },
  { id: 'talk',   emoji: '🤝', title: 'לדבר עם מישהו מהצוות', desc: 'כמה מילים עם השותף למשמרת או עם ראש הצוות. לא צריך לנתח, מספיק לשתף.' },
  { id: 'plan',   emoji: '🗓️', title: 'תוכנית פשוטה לשעות הקרובות', desc: 'משהו רגיל ונעים: מקלחת, ארוחה, שיחה עם מישהו קרוב, שינה. לחזור לשגרה בהדרגה.' },
];

const SIGNS = [
  'קשיי שינה או חלומות מטרידים שלא עוברים',
  'פלשבקים — תמונות, קולות או ריחות מהאירוע שחוזרים בלי שליטה',
  'עצבנות, דריכות או מתח שלא יורדים',
  'הימנעות ממקומות, ממשמרות או מקריאות שמזכירות את האירוע',
  'תחושת ניתוק, ריקנות או אשמה שמלווה אותך',
  'שימוש מוגבר באלכוהול או בחומרים כדי "להירגע"',
  'אחרי כמה שבועות זה לא נהיה קל יותר',
];

const HOTLINES = [
  { name: 'ער"ן — עזרה ראשונה נפשית', phone: '1201', display: '1201' },
  { name: 'נט"ל — טראומה על רקע לאומי', phone: '1800363363', display: '1-800-363-363' },
];

function fmtDate(ts: number) {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ── guided breathing 4-4-6 ────────────────────────────────────────────────

function GuidedBreathing() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState({ idx: 0, left: PHASES[0].sec, cycles: 0 });
  const { idx, left, cycles } = step;
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setStep((s) => {
        if (s.left > 1) return { ...s, left: s.left - 1 };
        const next = (s.idx + 1) % PHASES.length;
        return { idx: next, left: PHASES[next].sec, cycles: next === 0 ? s.cycles + 1 : s.cycles };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => () => { lockRef.current?.release().catch(() => {}); }, []);

  const start = async () => {
    setStep({ idx: 0, left: PHASES[0].sec, cycles: 0 }); setRunning(true);
    trackInteraction('אחרי קריאה קשה · נשימות', 'wellness');
    try { lockRef.current = await navigator.wakeLock.request('screen'); } catch { /* unsupported */ }
  };
  const stop = () => {
    setRunning(false);
    lockRef.current?.release().catch(() => {});
    lockRef.current = null;
  };

  const phase: BreathPhase = running ? PHASES[idx].phase : 'idle';
  const scale = phase === 'inhale' || phase === 'hold' ? 1 : 0.55;
  const duration = phase === 'idle' ? 0.6 : phase === 'hold' ? 0.3 : PHASES[idx].sec;
  const color = phase === 'exhale' ? '#fbbf24' : phase === 'hold' ? '#a78bfa' : '#38bdf8';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center" style={{ width: 230, height: 230 }}>
        <div className="absolute rounded-full border border-white/10" style={{ width: 230, height: 230 }} />
        <div
          className="absolute rounded-full"
          style={{
            width: 220,
            height: 220,
            transform: `scale(${scale})`,
            transition: `transform ${duration}s ${phase === 'exhale' ? 'cubic-bezier(0.4,0,0.2,1)' : 'cubic-bezier(0.37,0,0.63,1)'}, background-color 1s, box-shadow 1s`,
            backgroundColor: `${color}33`,
            boxShadow: `0 0 60px ${color}55, inset 0 0 40px ${color}44`,
            border: `2px solid ${color}88`,
          }}
        />
        <div className="relative flex flex-col items-center">
          <span className="text-white font-black text-3xl">{running ? PHASES[idx].label : 'מוכן?'}</span>
          {running && <span className="text-white/70 font-mono font-black text-4xl tabular-nums mt-1">{left}</span>}
        </div>
      </div>
      <p className="text-white/45 text-sm">
        {running ? `מחזור ${cycles + 1}` : 'שאיפה 4 · עצירה 4 · נשיפה 6'}
      </p>
      <HapticButton
        onClick={running ? stop : start}
        pressScale={0.96}
        className={`w-48 py-3.5 rounded-full font-black text-lg ${running ? 'bg-white/10 border border-white/25 text-white' : 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'}`}
      >
        {running ? 'עצור' : 'התחל לנשום'}
      </HapticButton>
    </div>
  );
}

// ── section wrapper ───────────────────────────────────────────────────────

function Section({ title, icon, children, defaultOpen = false }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="shrink-0 rounded-3xl border border-white/10 bg-white/[0.04] overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 py-4 text-right" aria-expanded={open}>
        <span className="text-2xl">{icon}</span>
        <span className="flex-1 text-white font-bold text-base">{title}</span>
        <ChevronDown size={18} className={`text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

// ── main ──────────────────────────────────────────────────────────────────

interface Props { isOpen: boolean; onClose: () => void; onOpenBreathing?: () => void; }

export default function AfterCallModal({ isOpen, onClose, onOpenBreathing }: Props) {
  useModalBackHandler(isOpen, onClose);
  const { entries, supportName, supportPhone, addEntry, deleteEntry, deleteAll, setSupport } = useDebriefStore();
  const [done, setDone] = useState<string[]>([]);
  const [what, setWhat] = useState('');
  const [didWell, setDidWell] = useState('');
  const [onMind, setOnMind] = useState('');
  const [saved, setSaved] = useState(false);
  const [editSupport, setEditSupport] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!isOpen) return null;

  const canSave = what.trim() || didWell.trim() || onMind.trim();
  const handleSave = () => {
    if (!canSave) return;
    addEntry({ what: what.trim(), didWell: didWell.trim(), onMind: onMind.trim() });
    setWhat(''); setDidWell(''); setOnMind('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const openSupportEditor = () => {
    setDraftName(supportName);
    setDraftPhone(supportPhone);
    setEditSupport(true);
  };

  const telHref = (p: string) => `tel:${p.replace(/[^\d+*#]/g, '')}`;

  const inputCls = 'w-full rounded-2xl bg-white/5 border border-white/15 px-3.5 py-3 text-white placeholder-white/30 text-sm leading-relaxed focus:outline-none focus:border-violet-300/60';

  return (
    <div className="fixed inset-0 z-[75] flex flex-col overflow-hidden" dir="rtl"
         style={{ background: 'linear-gradient(160deg, #0b1026 0%, #1b1440 50%, #0c1d2e 100%)' }}>

      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <HeartHandshake size={22} className="text-violet-300" />
          <h2 className="text-white font-bold text-xl">אחרי קריאה קשה</h2>
        </div>
        <HapticButton
          onClick={onClose}
          pressScale={0.88}
          className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70"
          aria-label="סגור"
        >
          <X size={20} />
        </HapticButton>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4">
        <p className="text-white/70 text-sm leading-relaxed text-center px-2">
          מה שאתה מרגיש עכשיו זו תגובה טבעית למצב לא טבעי.
          <br />
          קח כמה דקות לעצמך — בקצב שלך.
        </p>

        {/* 1. breathing */}
        <section className="shrink-0 rounded-3xl border border-sky-300/20 bg-sky-400/[0.04] px-4 py-5">
          <div className="flex items-center gap-2 mb-4">
            <Wind size={18} className="text-sky-300" />
            <h3 className="text-white font-bold text-base">נשימה מונחית</h3>
          </div>
          <GuidedBreathing />
          {onOpenBreathing && (
            <button onClick={onOpenBreathing} className="mt-4 w-full text-center text-xs text-sky-300/70 underline underline-offset-2">
              למסנכרן הנשימות המלא
            </button>
          )}
        </section>

        {/* 2. things that help now */}
        <Section title="דברים שעוזרים עכשיו" icon="🌱" defaultOpen>
          <div className="flex flex-col gap-2">
            {HELPERS.map((h) => {
              const isDone = done.includes(h.id);
              return (
                <button
                  key={h.id}
                  onClick={() => setDone((d) => (isDone ? d.filter((x) => x !== h.id) : [...d, h.id]))}
                  aria-pressed={isDone}
                  className={`w-full flex items-start gap-3 rounded-2xl p-3.5 text-right border transition-colors ${isDone ? 'border-green-400/40 bg-green-400/10' : 'border-white/10 bg-white/[0.03]'}`}
                >
                  <span className="text-2xl leading-none mt-0.5">{h.emoji}</span>
                  <span className="flex-1 flex flex-col gap-1">
                    <span className={`font-bold text-sm ${isDone ? 'text-green-300' : 'text-white'}`}>{h.title}</span>
                    <span className="text-white/55 text-xs leading-relaxed">{h.desc}</span>
                  </span>
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isDone ? 'border-green-400 bg-green-400' : 'border-white/25'}`}>
                    {isDone && <Check size={14} className="text-slate-900" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* 3. personal debrief */}
        <Section title="תחקיר אישי — 3 שאלות" icon="📝">
          <div className="flex items-center gap-1.5 text-xs text-violet-200/70 mb-3">
            <Lock size={12} />
            נשמר רק במכשיר שלך. לא נשלח לשום מקום.
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-white/80 text-sm font-bold">מה קרה?</span>
              <textarea value={what} onChange={(e) => setWhat(e.target.value)} rows={3} className={inputCls} placeholder="במילים שלך, בקצרה" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-white/80 text-sm font-bold">מה עשיתי טוב?</span>
              <textarea value={didWell} onChange={(e) => setDidWell(e.target.value)} rows={3} className={inputCls} placeholder="גם דברים קטנים נחשבים" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-white/80 text-sm font-bold">מה מעסיק אותי?</span>
              <textarea value={onMind} onChange={(e) => setOnMind(e.target.value)} rows={3} className={inputCls} placeholder="מה נשאר איתי מהקריאה" />
            </label>
            <HapticButton
              onClick={handleSave}
              disabled={!canSave}
              pressScale={0.97}
              className="w-full py-3 rounded-2xl font-black text-base bg-violet-500 text-white disabled:opacity-40"
            >
              {saved ? 'נשמר ✓' : 'שמור במכשיר'}
            </HapticButton>
          </div>

          {entries.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/60 text-xs font-bold">תחקירים שמורים ({entries.length})</p>
                <button
                  onClick={() => { if (window.confirm('למחוק את כל התחקירים מהמכשיר?')) deleteAll(); }}
                  className="text-xs font-bold text-red-300/80"
                >
                  מחק הכל
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {entries.map((e) => {
                  const isOpen = expanded === e.id;
                  return (
                    <div key={e.id} className="rounded-2xl border border-white/10 bg-white/[0.03]">
                      <div className="flex items-center gap-2 px-3.5 py-2.5">
                        <button onClick={() => setExpanded(isOpen ? null : e.id)} className="flex-1 flex flex-col items-start text-right">
                          <span className="text-white/80 text-sm font-bold tabular-nums">{fmtDate(e.createdAt)}</span>
                          {!isOpen && <span className="text-white/40 text-xs line-clamp-1">{e.what || e.onMind || e.didWell}</span>}
                        </button>
                        <button
                          onClick={() => { if (window.confirm('למחוק את התחקיר הזה?')) deleteEntry(e.id); }}
                          className="p-2 rounded-full bg-red-500/10"
                          aria-label="מחק תחקיר"
                        >
                          <Trash2 size={14} className="text-red-300/80" />
                        </button>
                      </div>
                      {isOpen && (
                        <div className="px-3.5 pb-3 flex flex-col gap-2 text-sm">
                          {[['מה קרה', e.what], ['מה עשיתי טוב', e.didWell], ['מה מעסיק אותי', e.onMind]].map(([q, a]) => a && (
                            <div key={q}>
                              <p className="text-violet-200/70 text-xs font-bold">{q}</p>
                              <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{a}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Section>

        {/* 4. signs */}
        <Section title="סימנים ששווה לדבר עליהם עם מישהו" icon="💬">
          <p className="text-white/60 text-xs leading-relaxed mb-3">
            בימים הראשונים אחרי קריאה קשה רוב התגובות טבעיות ונרגעות עם הזמן. אם אחד מאלה נמשך או מפריע לך — כדאי לפנות:
          </p>
          <ul className="flex flex-col gap-2">
            {SIGNS.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm text-white/80 leading-relaxed">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </Section>

        {/* 5. call someone */}
        <section className="shrink-0 rounded-3xl border border-green-300/20 bg-green-400/[0.04] px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Phone size={18} className="text-green-300" />
            <h3 className="text-white font-bold text-base">לדבר עם מישהו עכשיו</h3>
          </div>
          <div className="flex flex-col gap-2">
            {HOTLINES.map((h) => (
              <a
                key={h.phone}
                href={telHref(h.phone)}
                onClick={() => trackInteraction(`אחרי קריאה קשה · חיוג ${h.display}`, 'wellness')}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5 bg-green-500/15 border border-green-400/30 active:scale-[0.98] transition-transform"
              >
                <Phone size={18} className="text-green-300 shrink-0" />
                <span className="flex-1 text-white font-bold text-sm">{h.name}</span>
                <span className="text-green-200 font-black tabular-nums" dir="ltr">{h.display}</span>
              </a>
            ))}

            {supportPhone && !editSupport && (
              <div className="flex items-center gap-2">
                <a
                  href={telHref(supportPhone)}
                  className="flex-1 flex items-center gap-3 rounded-2xl px-4 py-3.5 bg-violet-500/15 border border-violet-400/30 active:scale-[0.98] transition-transform"
                >
                  <Phone size={18} className="text-violet-300 shrink-0" />
                  <span className="flex-1 text-white font-bold text-sm">{supportName || 'קו התמיכה שלי'}</span>
                  <span className="text-violet-200 font-black tabular-nums" dir="ltr">{supportPhone}</span>
                </a>
                <button onClick={openSupportEditor} className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center" aria-label="ערוך מספר">
                  <Pencil size={15} className="text-white/60" />
                </button>
              </div>
            )}

            {editSupport ? (
              <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-3 flex flex-col gap-2">
                <input value={draftName} onChange={(e) => setDraftName(e.target.value)} className={inputCls} placeholder='שם (למשל: תמיכה למתנדבי מד"א)' />
                <input value={draftPhone} onChange={(e) => setDraftPhone(e.target.value)} className={inputCls} placeholder="מספר טלפון" inputMode="tel" dir="ltr" />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSupport(draftName.trim(), draftPhone.trim()); setEditSupport(false); }}
                    className="flex-1 py-2.5 rounded-xl bg-violet-500 text-white font-bold text-sm"
                  >
                    שמור
                  </button>
                  <button onClick={() => setEditSupport(false)} className="px-4 py-2.5 rounded-xl bg-white/10 text-white/70 font-bold text-sm">ביטול</button>
                </div>
              </div>
            ) : !supportPhone && (
              <button
                onClick={openSupportEditor}
                className="rounded-2xl border border-dashed border-white/20 px-4 py-3 text-right text-sm text-white/60"
              >
                + הוסף את מספר התמיכה של הארגון שלך (מד"א / איחוד הצלה / אחר)
              </button>
            )}
          </div>
          <p className="text-white/35 text-[0.7rem] mt-3 leading-relaxed">
            במצב של סכנה מיידית לחיים — חייגו 101 או 100.
          </p>
        </section>

        <div className="h-6 shrink-0" />
      </div>
    </div>
  );
}
