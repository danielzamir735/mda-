import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, Flame, HeartPulse, Phone, Ruler, Search, Wind } from 'lucide-react';
import { trackEvent } from '../../../utils/analytics';
import {
  EAC_DIGITS, EAC_LETTERS, HAZ_CLASSES, HAZ_GENERAL_FIRST_AID, HAZ_GUIDES, HAZ_MATERIALS,
} from '../data/hazmatData';
import type { HazMaterial } from '../data/hazmatData';
import { useTranslation, useLanguage, translate } from '../../../hooks/useTranslation';

const UNKNOWN_GUIDE = 111;

function classInfo(cls: string) {
  return HAZ_CLASSES.find(c => c.cls === cls)
    ?? { cls, name: cls === '2' ? translate('refHazGas') : '', color: 'bg-surface-3 text-fg' };
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
      <div className="flex items-center gap-2 text-fg font-bold text-base">
        {icon}
        <h4>{title}</h4>
      </div>
      {children}
    </div>
  );
}

function Bullets({ items, className }: { items: string[]; className: string }) {
  return (
    <ul className={`flex flex-col gap-1.5 text-sm leading-relaxed list-disc ps-5 ${className}`}>
      {items.map(t => <li key={t}>{t}</li>)}
    </ul>
  );
}

function DistanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5
                    bg-page border border-line">
      <span className="text-sm text-fg-muted">{label}</span>
      <span className="text-base font-black text-fg text-end">{value}</span>
    </div>
  );
}

function MaterialCard({ material }: { material: HazMaterial | null }) {
  const t = useTranslation();
  const { isEn } = useLanguage();
  const guide = HAZ_GUIDES[material?.guide ?? UNKNOWN_GUIDE];
  const cls = material ? classInfo(material.cls) : null;

  return (
    <div className="rounded-2xl border border-orange-400/40 bg-surface p-4 flex flex-col gap-4">
      {material && cls ? (
        <div className="flex items-start gap-3">
          {/* theme-ok: black on the orange placard, like the real sign */}
          <div className="shrink-0 rounded-xl bg-orange-500 text-black font-black text-xl px-3 py-2 leading-none" dir="ltr">
            {material.un}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-fg font-black text-xl leading-tight">{isEn ? material.en : material.he}</p>
            <p className="text-fg-muted text-sm">{isEn ? material.he : <span dir="ltr">{material.en}</span>}</p>
            <span className={`inline-block mt-2 rounded-md px-2 py-0.5 text-xs font-bold ${cls.color}`}>
              {t('refHazClass', { cls: cls.cls })} · {cls.name}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-fg font-bold text-base leading-snug">
          {t('refHazNotFound')}
        </p>
      )}

      {material?.tih && (
        <div className="rounded-xl bg-red-600 text-white px-3 py-2.5 text-sm font-bold leading-snug flex gap-2">
          <Wind size={18} className="shrink-0 mt-0.5" />
          {t('refHazTih')}
        </div>
      )}

      {material?.note && (
        <div className="rounded-xl border border-amber-400/50 bg-amber-50 dark:bg-amber-400/10 px-3 py-2.5
                        text-sm font-semibold text-amber-900 dark:text-amber-200 leading-snug flex gap-2">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          {material.note}
        </div>
      )}

      <Section icon={<Flame size={18} className="text-orange-700 dark:text-orange-500" />} title={`${t('refHazDangers')} · ${guide.title}`}>
        <Bullets items={guide.dangers} className="text-fg/85" />
      </Section>

      <Section icon={<Ruler size={18} className="text-blue-700 dark:text-blue-500" />} title={t('refHazDistances')}>
        <DistanceRow label={t('refHazIsolate')} value={guide.isolate} />
        {guide.largeSpill && <DistanceRow label={t('refHazLargeSpill')} value={guide.largeSpill} />}
        {guide.fire && <DistanceRow label={t('refHazFire')} value={guide.fire} />}
      </Section>

      <Section icon={<HeartPulse size={18} className="text-emt-red" />} title={t('refHazCasualtyCare')}>
        <Bullets items={[...guide.firstAid, ...HAZ_GENERAL_FIRST_AID]} className="text-fg/85" />
      </Section>
    </div>
  );
}

function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-line bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-start
                   text-fg font-bold text-base"
      >
        {title}
        <ChevronDown size={20} className={`shrink-0 text-fg-subtle transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 flex flex-col gap-3">{children}</div>}
    </div>
  );
}

export default function HazmatLookup() {
  const t = useTranslation();
  const { isEn } = useLanguage();
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
        <label htmlFor="hazmat-query" className="text-sm font-semibold text-fg">
          {t('refHazQueryLabel')}
        </label>
        <div className="relative">
          <Search size={20} className="absolute start-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
          <input
            id="hazmat-query"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('refHazQueryPlaceholder')}
            autoComplete="off"
            enterKeyHint="search"
            className="w-full rounded-xl border border-line-strong bg-surface
                       ps-11 pe-4 py-3.5 text-xl font-bold text-fg
                       placeholder:text-fg-subtle placeholder:font-normal placeholder:text-base
                       focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {suggestions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {suggestions.map(m => (
              <button
                key={m.un}
                onClick={() => pick(m)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-start
                           bg-surface border border-line active:scale-[0.98] transition-transform"
              >
                {/* theme-ok: black on the orange placard, like the real sign */}
                <span className="shrink-0 rounded-md bg-orange-500 text-black font-black text-sm px-2 py-1" dir="ltr">{m.un}</span>
                <span className="flex-1 text-fg font-semibold text-sm">{isEn ? m.en : m.he}</span>
              </button>
            ))}
          </div>
        )}
        {q.length >= 2 && !isNumber && suggestions.length === 0 && (
          <p className="text-sm text-fg-muted">{t('refHazNoName')}</p>
        )}
      </div>

      {(exact || notFound) && <MaterialCard material={exact} />}

      {/* Safety first */}
      <div className="rounded-2xl border border-red-400/50 bg-red-50 dark:bg-red-900/20 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-700 dark:text-red-400 shrink-0" />
          <h3 className="text-red-700 dark:text-red-300 font-bold text-base">{t('refHazSafetyFirst')}</h3>
        </div>
        <ul className="flex flex-col gap-1.5 text-sm text-red-800 dark:text-red-200 leading-relaxed list-disc ps-5">
          <li>{t('refHazSafety1')}</li>
          <li>{t('refHazSafety2')}</li>
          <li>{t('refHazSafety3')}</li>
        </ul>
        <a
          href="tel:102"
          onClick={() => trackEvent('hazmat_call_fire')}
          className="flex items-center justify-center gap-3 py-3 rounded-xl
                     bg-emt-red text-white font-bold text-xl active:scale-95 transition-transform shadow-md"
        >
          <Phone size={24} />
          {t('refHazFireCall')}
        </a>
      </div>

      {/* Emergency action code */}
      <Collapsible title={t('refHazEacTitle')}>
        <input
          value={eac}
          onChange={e => setEac(e.target.value)}
          placeholder="2WE"
          maxLength={4}
          autoComplete="off"
          autoCapitalize="characters"
          dir="ltr"
          aria-label={t('refHazEacLabel')}
          className="w-full rounded-xl border border-line-strong bg-page
                     px-4 py-3 text-xl font-bold uppercase text-fg text-center
                     placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        {decoded ? (
          <ul className="flex flex-col gap-1.5 text-sm text-fg leading-relaxed list-disc ps-5">
            <li>{decoded.digit}.</li>
            <li>{t('refHazEacPpe', { ppe: decoded.letter.ppe })}</li>
            <li>{decoded.letter.spill === 'dilute' ? t('refHazEacDilute') : t('refHazEacContain')}</li>
            {decoded.letter.violent && <li className="font-bold text-red-700 dark:text-red-400">{t('refHazEacViolent')}</li>}
            {decoded.evacuate && <li className="font-bold text-red-700 dark:text-red-400">{t('refHazEacEvacuate')}</li>}
          </ul>
        ) : eac.trim().length >= 2 ? (
          <p className="text-sm text-fg-muted">{t('refHazEacInvalid')}</p>
        ) : (
          <p className="text-sm text-fg-muted leading-relaxed">
            {t('refHazEacHelp')}
          </p>
        )}
        {decoded && /[STYZ]/.test(eac.toUpperCase()) && (
          <p className="text-xs text-fg-muted leading-relaxed">
            {t('refHazEacWhiteOnBlack')}
          </p>
        )}
      </Collapsible>

      {/* Hazard classes */}
      <Collapsible title={t('refHazClassesTitle')}>
        <div className="flex flex-col gap-1.5">
          {HAZ_CLASSES.map(c => (
            <div key={c.cls} className="flex items-center gap-3">
              <span className={`shrink-0 w-12 text-center rounded-md py-1 text-sm font-black ${c.color}`} dir="ltr">{c.cls}</span>
              <span className="text-sm text-fg">{c.name}</span>
            </div>
          ))}
        </div>
      </Collapsible>

      <p className="text-xs text-fg-muted leading-relaxed">
        {t('refHazFooter', { n: HAZ_MATERIALS.length })}
      </p>
    </div>
  );
}
