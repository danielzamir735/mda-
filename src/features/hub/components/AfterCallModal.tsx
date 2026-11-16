import { useState, useEffect, useRef } from 'react';
import { X, HeartHandshake, Wind, Phone, Trash2, Lock, Check, ChevronDown, Pencil } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HapticButton from '../../../components/HapticButton';
import { useDebriefStore } from '../../../store/debriefStore';
import { trackInteraction } from '../../../utils/analytics';
import { useTranslation, useLanguage, translate, type TranslationKey } from '../../../i18n';

// "After a hard call" — works fully offline, nothing is sent to a server.

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale';
const PHASES: { phase: Exclude<BreathPhase, 'idle'>; sec: number; labelKey: TranslationKey }[] = [
  { phase: 'inhale', sec: 4, labelKey: 'acBreathInhale' },
  { phase: 'hold',   sec: 4, labelKey: 'acBreathHold' },
  { phase: 'exhale', sec: 6, labelKey: 'acBreathExhale' },
];

const HELPERS: { id: string; emoji: string; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { id: 'ground', emoji: '🖐️', titleKey: 'acGroundTitle', descKey: 'acGroundDesc' },
  { id: 'water',  emoji: '💧', titleKey: 'acWaterTitle',  descKey: 'acWaterDesc' },
  { id: 'move',   emoji: '🚶', titleKey: 'acMoveTitle',   descKey: 'acMoveDesc' },
  { id: 'talk',   emoji: '🤝', titleKey: 'acTalkTitle',   descKey: 'acTalkDesc' },
  { id: 'plan',   emoji: '🗓️', titleKey: 'acPlanTitle',   descKey: 'acPlanDesc' },
];

const SIGNS: TranslationKey[] = ['acSign1', 'acSign2', 'acSign3', 'acSign4', 'acSign5', 'acSign6', 'acSign7'];

const HOTLINES: { nameKey: TranslationKey; phone: string; display: string }[] = [
  { nameKey: 'acHotlineEran', phone: '1201', display: '1201' },
  { nameKey: 'acHotlineNatal', phone: '1800363363', display: '1-800-363-363' },
];

// analytics labels stay in Hebrew so reports don't split by interface language
const TRACK_TITLE = () => translate('acTitle', undefined, 'he');

function fmtDate(ts: number) {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ── guided breathing 4-4-6 ────────────────────────────────────────────────

function GuidedBreathing() {
  const t = useTranslation();
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
    trackInteraction(`${TRACK_TITLE()} · ${translate('acGuidedBreathing', undefined, 'he')}`, 'wellness');
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
        <div className="absolute rounded-full border border-fg/10" style={{ width: 230, height: 230 }} />
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
          <span className="text-fg font-black text-3xl">{running ? t(PHASES[idx].labelKey) : t('acReady')}</span>
          {running && <span className="text-fg/70 font-mono font-black text-4xl tabular-nums mt-1">{left}</span>}
        </div>
      </div>
      <p className="text-fg-muted text-sm">
        {running ? t('cprCycleN', { n: cycles + 1 }) : t('acBreathPattern')}
      </p>
      <HapticButton
        onClick={running ? stop : start}
        pressScale={0.96}
        className={`w-48 py-3.5 rounded-full font-black text-lg ${running ? 'bg-fg/10 border border-fg/25 text-fg' : 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'}`}
      >
        {running ? t('stop') : t('acStartBreathing')}
      </HapticButton>
    </div>
  );
}

// ── section wrapper ───────────────────────────────────────────────────────

function Section({ title, icon, children, defaultOpen = false }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="shrink-0 rounded-3xl border border-fg/10 bg-surface/60 dark:bg-fg/[0.04] overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-4 py-4 text-start" aria-expanded={open}>
        <span className="text-2xl">{icon}</span>
        <span className="flex-1 text-fg font-bold text-base">{title}</span>
        <ChevronDown size={18} className={`text-fg-subtle transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

// ── main ──────────────────────────────────────────────────────────────────

interface Props { isOpen: boolean; onClose: () => void; onOpenBreathing?: () => void; }

export default function AfterCallModal({ isOpen, onClose, onOpenBreathing }: Props) {
  useModalBackHandler(isOpen, onClose);
  const t = useTranslation();
  const { dir } = useLanguage();
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

  const inputCls = 'w-full rounded-2xl bg-surface dark:bg-fg/5 border border-fg/15 px-3.5 py-3 text-fg placeholder:text-fg-subtle text-sm leading-relaxed focus:outline-none focus:border-violet-400/60';

  return (
    <div
      className="fixed inset-0 z-[75] flex flex-col overflow-hidden bg-gradient-to-br from-sky-50 via-violet-50 to-sky-50 dark:from-[#0b1026] dark:via-[#1b1440] dark:to-[#0c1d2e]"
      dir={dir}
    >

      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-fg/10 bg-fg/[0.03] backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <HeartHandshake size={22} className="text-violet-600 dark:text-violet-300" />
          <h2 className="text-fg font-bold text-xl">{t('acTitle')}</h2>
        </div>
        <HapticButton
          onClick={onClose}
          pressScale={0.88}
          className="w-10 h-10 rounded-full bg-fg/10 border border-fg/20 flex items-center justify-center text-fg/70"
          aria-label={t('close')}
        >
          <X size={20} />
        </HapticButton>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4">
        <p className="text-fg/70 text-sm leading-relaxed text-center px-2">
          {t('acIntro1')}
          <br />
          {t('acIntro2')}
        </p>

        {/* 1. breathing */}
        <section className="shrink-0 rounded-3xl border border-sky-400/30 dark:border-sky-300/20 bg-sky-400/[0.06] dark:bg-sky-400/[0.04] px-4 py-5">
          <div className="flex items-center gap-2 mb-4">
            <Wind size={18} className="text-sky-600 dark:text-sky-300" />
            <h3 className="text-fg font-bold text-base">{t('acGuidedBreathing')}</h3>
          </div>
          <GuidedBreathing />
          {onOpenBreathing && (
            <button onClick={onOpenBreathing} className="mt-4 w-full text-center text-xs text-sky-700 dark:text-sky-300/70 underline underline-offset-2">
              {t('acFullBreathing')}
            </button>
          )}
        </section>

        {/* 2. things that help now */}
        <Section title={t('acHelpsNow')} icon="🌱" defaultOpen>
          <div className="flex flex-col gap-2">
            {HELPERS.map((h) => {
              const isDone = done.includes(h.id);
              return (
                <button
                  key={h.id}
                  onClick={() => setDone((d) => (isDone ? d.filter((x) => x !== h.id) : [...d, h.id]))}
                  aria-pressed={isDone}
                  className={`w-full flex items-start gap-3 rounded-2xl p-3.5 text-start border transition-colors ${isDone ? 'border-green-500/40 bg-green-400/10' : 'border-fg/10 bg-fg/[0.03]'}`}
                >
                  <span className="text-2xl leading-none mt-0.5">{h.emoji}</span>
                  <span className="flex-1 flex flex-col gap-1">
                    <span className={`font-bold text-sm ${isDone ? 'text-green-700 dark:text-green-300' : 'text-fg'}`}>{t(h.titleKey)}</span>
                    <span className="text-fg-muted text-xs leading-relaxed">{t(h.descKey)}</span>
                  </span>
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isDone ? 'border-green-500 bg-green-500' : 'border-fg/25'}`}>
                    {/* theme-ok: white tick on the solid green circle */}
                    {isDone && <Check size={14} className="text-white" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* 3. personal debrief */}
        <Section title={t('acDebriefTitle')} icon="📝">
          <div className="flex items-center gap-1.5 text-xs text-violet-700 dark:text-violet-200/70 mb-3">
            <Lock size={12} />
            {t('acDeviceOnly')}
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-fg/80 text-sm font-bold">{t('acQWhat')}</span>
              <textarea value={what} onChange={(e) => setWhat(e.target.value)} rows={3} className={inputCls} placeholder={t('acQWhatPh')} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-fg/80 text-sm font-bold">{t('acQDidWell')}</span>
              <textarea value={didWell} onChange={(e) => setDidWell(e.target.value)} rows={3} className={inputCls} placeholder={t('acQDidWellPh')} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-fg/80 text-sm font-bold">{t('acQOnMind')}</span>
              <textarea value={onMind} onChange={(e) => setOnMind(e.target.value)} rows={3} className={inputCls} placeholder={t('acQOnMindPh')} />
            </label>
            <HapticButton
              onClick={handleSave}
              disabled={!canSave}
              pressScale={0.97}
              className="w-full py-3 rounded-2xl font-black text-base bg-violet-500 text-white disabled:opacity-40"
            >
              {saved ? t('acSaved') : t('acSaveOnDevice')}
            </HapticButton>
          </div>

          {entries.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-fg-muted text-xs font-bold">{t('acSavedDebriefs', { n: entries.length })}</p>
                <button
                  onClick={() => { if (window.confirm(t('acConfirmDeleteAll'))) deleteAll(); }}
                  className="text-xs font-bold text-red-600 dark:text-red-300/80"
                >
                  {t('acDeleteAll')}
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {entries.map((e) => {
                  const isOpen = expanded === e.id;
                  return (
                    <div key={e.id} className="rounded-2xl border border-fg/10 bg-fg/[0.03]">
                      <div className="flex items-center gap-2 px-3.5 py-2.5">
                        <button onClick={() => setExpanded(isOpen ? null : e.id)} className="flex-1 flex flex-col items-start text-start">
                          <span className="text-fg/80 text-sm font-bold tabular-nums">{fmtDate(e.createdAt)}</span>
                          {!isOpen && <span className="text-fg-subtle text-xs line-clamp-1">{e.what || e.onMind || e.didWell}</span>}
                        </button>
                        <button
                          onClick={() => { if (window.confirm(t('acConfirmDeleteOne'))) deleteEntry(e.id); }}
                          className="p-2 rounded-full bg-red-500/10"
                          aria-label={t('acDeleteDebrief')}
                        >
                          <Trash2 size={14} className="text-red-600 dark:text-red-300/80" />
                        </button>
                      </div>
                      {isOpen && (
                        <div className="px-3.5 pb-3 flex flex-col gap-2 text-sm">
                          {([['acAWhat', e.what], ['acADidWell', e.didWell], ['acAOnMind', e.onMind]] as const).map(([q, a]) => a && (
                            <div key={q}>
                              <p className="text-violet-700 dark:text-violet-200/70 text-xs font-bold">{t(q)}</p>
                              <p className="text-fg/80 whitespace-pre-wrap leading-relaxed">{a}</p>
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
        <Section title={t('acSignsTitle')} icon="💬">
          <p className="text-fg-muted text-xs leading-relaxed mb-3">
            {t('acSignsIntro')}
          </p>
          <ul className="flex flex-col gap-2">
            {SIGNS.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm text-fg/80 leading-relaxed">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                {t(s)}
              </li>
            ))}
          </ul>
        </Section>

        {/* 5. call someone */}
        <section className="shrink-0 rounded-3xl border border-green-500/30 dark:border-green-300/20 bg-green-400/[0.06] dark:bg-green-400/[0.04] px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Phone size={18} className="text-green-600 dark:text-green-300" />
            <h3 className="text-fg font-bold text-base">{t('acTalkNow')}</h3>
          </div>
          <div className="flex flex-col gap-2">
            {HOTLINES.map((h) => (
              <a
                key={h.phone}
                href={telHref(h.phone)}
                onClick={() => trackInteraction(`${TRACK_TITLE()} · ${h.display}`, 'wellness')}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5 bg-green-500/15 border border-green-500/30 active:scale-[0.98] transition-transform"
              >
                <Phone size={18} className="text-green-600 dark:text-green-300 shrink-0" />
                <span className="flex-1 text-fg font-bold text-sm">{t(h.nameKey)}</span>
                <span className="text-green-700 dark:text-green-200 font-black tabular-nums" dir="ltr">{h.display}</span>
              </a>
            ))}

            {supportPhone && !editSupport && (
              <div className="flex items-center gap-2">
                <a
                  href={telHref(supportPhone)}
                  className="flex-1 flex items-center gap-3 rounded-2xl px-4 py-3.5 bg-violet-500/15 border border-violet-400/30 active:scale-[0.98] transition-transform"
                >
                  <Phone size={18} className="text-violet-600 dark:text-violet-300 shrink-0" />
                  <span className="flex-1 text-fg font-bold text-sm">{supportName || t('acMySupportLine')}</span>
                  <span className="text-violet-700 dark:text-violet-200 font-black tabular-nums" dir="ltr">{supportPhone}</span>
                </a>
                <button onClick={openSupportEditor} className="w-11 h-11 rounded-xl bg-fg/5 border border-fg/10 flex items-center justify-center" aria-label={t('acEditNumber')}>
                  <Pencil size={15} className="text-fg/60" />
                </button>
              </div>
            )}

            {editSupport ? (
              <div className="rounded-2xl border border-fg/15 bg-fg/[0.03] p-3 flex flex-col gap-2">
                <input value={draftName} onChange={(e) => setDraftName(e.target.value)} className={inputCls} placeholder={t('acSupportNamePh')} />
                <input value={draftPhone} onChange={(e) => setDraftPhone(e.target.value)} className={inputCls} placeholder={t('acPhonePh')} inputMode="tel" dir="ltr" />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSupport(draftName.trim(), draftPhone.trim()); setEditSupport(false); }}
                    className="flex-1 py-2.5 rounded-xl bg-violet-500 text-white font-bold text-sm"
                  >
                    {t('save')}
                  </button>
                  <button onClick={() => setEditSupport(false)} className="px-4 py-2.5 rounded-xl bg-fg/10 text-fg/70 font-bold text-sm">{t('cancel')}</button>
                </div>
              </div>
            ) : !supportPhone && (
              <button
                onClick={openSupportEditor}
                className="rounded-2xl border border-dashed border-fg/20 px-4 py-3 text-start text-sm text-fg-muted"
              >
                {t('acAddSupport')}
              </button>
            )}
          </div>
          <p className="text-fg-subtle text-[0.7rem] mt-3 leading-relaxed">
            {t('acEmergency')}
          </p>
        </section>

        <div className="h-6 shrink-0" />
      </div>
    </div>
  );
}
