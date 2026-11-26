import { useState } from 'react';
import { X, Search, Navigation, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useTranslation, useLanguage, type TranslationKey } from '../../../hooks/useTranslation';
import HospitalAccordionItem, { type Hospital } from './HospitalAccordionItem';
import { LEVEL_A, LEVEL_B } from '../data/hospitals';
import { trackEvent } from '../../../utils/analytics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}


function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type NearbyHospital = Hospital & { lat: number; lng: number; distKm: number; level: 'A' | 'B' };

type ErrorReason = 'denied' | 'unavailable' | 'timeout' | 'unsupported';

const ERROR_MESSAGES: Record<ErrorReason, TranslationKey> = {
  denied: 'refGeoDenied',
  unavailable: 'refGeoUnavailable',
  timeout: 'refGeoTimeout',
  unsupported: 'refGeoUnsupported',
};

function NearestERButton() {
  const t = useTranslation();
  const { isEn } = useLanguage();
  const [phase, setPhase] = useState<'idle' | 'loading' | 'list' | 'error'>('idle');
  const [nearby, setNearby] = useState<NearbyHospital[]>([]);
  const [errorReason, setErrorReason] = useState<ErrorReason>('unavailable');

  function findNearby() {
    if (!navigator.geolocation) {
      trackEvent('hospital_nav_nearest_er_error', { reason: 'unsupported' });
      setErrorReason('unsupported');
      setPhase('error');
      return;
    }

    setPhase('loading');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const all = [
          ...LEVEL_A.map(h => ({ ...h, level: 'A' as const })),
          ...LEVEL_B.map(h => ({ ...h, level: 'B' as const })),
        ].filter(
          (h): h is typeof h & { lat: number; lng: number } => h.lat !== undefined && h.lng !== undefined,
        );
        const sorted = all
          .map(h => ({ ...h, distKm: haversineKm(coords.latitude, coords.longitude, h.lat, h.lng) }))
          .sort((a, b) => a.distKm - b.distKm)
          .slice(0, 5);
        setNearby(sorted);
        setPhase('list');
        trackEvent('hospital_nav_nearby_list');
      },
      (err) => {
        const reason: ErrorReason =
          err.code === err.PERMISSION_DENIED ? 'denied'
          : err.code === err.TIMEOUT ? 'timeout'
          : 'unavailable';
        trackEvent('hospital_nav_nearest_er_error', { reason });
        setErrorReason(reason);
        setPhase('error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  function openGenericWaze() {
    trackEvent('hospital_nav_nearest_er_fallback');
    window.open('https://waze.com/ul?q=%D7%91%D7%99%D7%AA%20%D7%97%D7%95%D7%9C%D7%99%D7%9D%20%D7%9E%D7%99%D7%95%D7%9F', '_blank');
  }

  function navigateTo(h: NearbyHospital) {
    // i18n-ok: map search query, kept in Hebrew because the hospital names are Hebrew
    const query = h.navQueries?.general ?? `מיון ${h.name} ${h.city}`;
    trackEvent('hospital_nav_nearest_er', { hospital: h.name });
    window.open(`https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`, '_blank');
  }

  if (phase === 'list') {
    return (
      <div className="flex flex-col gap-2 py-2 mb-1">
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-fg-muted text-xs font-medium">{t('refNearbyPick')}</span>
          <button
            onClick={() => setPhase('idle')}
            className="text-fg-subtle hover:text-fg active:scale-90 transition-all p-1 -m-1"
            aria-label={t('close')}
          >
            <X size={15} />
          </button>
        </div>
        {nearby.map(h => (
          <button
            key={h.name}
            onClick={() => navigateTo(h)}
            className="flex items-center justify-between w-full rounded-xl px-4 py-3.5
                       bg-red-50 dark:bg-emt-red/10 border border-red-200 dark:border-emt-red/30
                       active:scale-95 transition-transform"
          >
            <div className="flex flex-col text-start gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-fg font-bold text-sm leading-tight">{isEn && h.en ? h.en[0] : h.name}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none ${
                  h.level === 'A'
                    ? 'bg-red-600 text-white'
                    : 'bg-yellow-400 text-yellow-900'
                }`}>
                  {h.level === 'A' ? 'LEVEL A' : 'LEVEL B'}
                </span>
              </div>
              <span className="text-fg-muted text-xs">{isEn && h.en ? h.en[1] : h.city} · {t('refKm', { km: h.distKm.toFixed(1) })}</span>
            </div>
            <Navigation size={20} className="text-emt-red shrink-0" />
          </button>
        ))}
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 mb-1 px-4 text-center">
        <AlertTriangle size={28} className="text-amber-800 dark:text-amber-500" />
        <p className="text-fg text-sm font-medium max-w-xs">
          {t(ERROR_MESSAGES[errorReason])}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={findNearby}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 bg-emt-red text-white font-bold text-sm
                       active:scale-95 transition-transform"
          >
            <RotateCcw size={16} />
            {t('retry')}
          </button>
          <button
            onClick={openGenericWaze}
            className="rounded-xl px-4 py-2.5 bg-surface-2 border border-line
                       text-fg font-bold text-sm active:scale-95 transition-transform"
          >
            {t('refWazeGeneric')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 mb-1">
      <div className="relative flex items-center justify-center">
        {/* Radar rings — outermost to innermost */}
        <div
          className="absolute rounded-full bg-emt-red/15 animate-ping"
          style={{ width: 176, height: 176, animationDuration: '2.2s', animationDelay: '0s' }}
        />
        <div
          className="absolute rounded-full bg-emt-red/25 animate-ping"
          style={{ width: 148, height: 148, animationDuration: '2.2s', animationDelay: '0.5s' }}
        />
        <div
          className="absolute rounded-full bg-emt-red/35 animate-ping"
          style={{ width: 120, height: 120, animationDuration: '2.2s', animationDelay: '1s' }}
        />

        {/* Static glow ring behind button */}
        <div
          className="absolute rounded-full"
          style={{
            width: 108,
            height: 108,
            background: 'radial-gradient(circle, rgba(239,35,60,0.45) 0%, transparent 70%)',
          }}
        />

        {/* Main circle button */}
        <button
          onClick={findNearby}
          disabled={phase === 'loading'}
          className="relative z-10 flex flex-col items-center justify-center gap-1.5
                     w-28 h-28 rounded-full bg-[#ef233c] text-white font-black text-center
                     active:scale-90 transition-transform disabled:opacity-70"
          style={{
            background: 'linear-gradient(135deg, #ef233c 0%, #b01020 100%)',
            boxShadow: '0 6px 32px rgba(239,35,60,0.7), 0 0 0 3px rgba(239,35,60,0.3)',
          }}
        >
          {phase === 'loading'
            ? <Loader2 size={28} strokeWidth={2.5} className="animate-spin" />
            : <Navigation size={28} strokeWidth={2.5} />
          }
          <span className="text-[9px] leading-tight font-black tracking-wide px-1">
            {t('refNearMe1')}<br />{t('refNearMe2')}
          </span>
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ text, cls }: { text: string; cls: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${cls}`}>
      <span className="font-bold text-sm tracking-wide">{text}</span>
    </div>
  );
}

function filter(list: Hospital[], q: string) {
  if (!q) return list;
  const lower = q.toLowerCase();
  return list.filter(h =>
    h.name.includes(q) || h.city.includes(q) ||
    !!h.en?.some(s => s.toLowerCase().includes(lower)));
}

export default function HospitalsModal({ isOpen, onClose }: Props) {
  const t = useTranslation();
  const { dir } = useLanguage();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  const q = search.trim();
  const listA = filter(LEVEL_A, q);
  const listB = filter(LEVEL_B, q);
  const empty = listA.length === 0 && listB.length === 0;

  function toggle(name: string) {
    setOpenKey(prev => (prev === name ? null : name));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-page" dir={dir}>

      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3
                      border-b border-line bg-surface shadow-sm">
        <h2 className="text-fg font-bold text-xl">{t('hospitalsTitle')}</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-page border border-line
                     flex items-center justify-center active:scale-90 transition-transform
                     text-fg-muted hover:text-fg"
          aria-label={t('close')}
        >
          <X size={20} />
        </button>
      </div>

      {/* Sticky search bar */}
      <div className="shrink-0 px-4 pt-3 pb-2 bg-page border-b border-line/40">
        <div className="relative flex items-center">
          <Search size={16} className="absolute start-3.5 text-fg-subtle pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); setOpenKey(null); }}
            placeholder={t('searchHospital')}
            autoComplete="off"
            className="w-full bg-surface-2 border border-line rounded-2xl
                       ps-10 pe-8 py-2.5 text-fg placeholder:text-fg-subtle text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/40
                       focus:border-blue-500/30 transition-shadow"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setOpenKey(null); }}
              className="absolute end-3 text-fg-subtle hover:text-fg active:scale-90 transition-all"
              aria-label={t('clearSearch')}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">

        {/* Nearest ER navigation — geolocation → closest hospital in our list → Waze */}
        <NearestERButton />

        {empty && (
          <p className="text-center text-fg-muted py-12 text-sm">{t('noHospitalsFound')}</p>
        )}

        {listA.length > 0 && (
          <>
            <SectionLabel text={t('refLevelATrauma')} cls="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700/40" />
            <div className="space-y-2 mb-4">
              {listA.map(h => (
                <HospitalAccordionItem
                  key={h.name}
                  hospital={h}
                  isLevelA={true}
                  isOpen={openKey === h.name}
                  onToggle={() => toggle(h.name)}
                />
              ))}
            </div>
          </>
        )}

        {listB.length > 0 && (
          <>
            <SectionLabel text="LEVEL B" cls="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700/40" />
            <div className="space-y-2">
              {listB.map(h => (
                <HospitalAccordionItem
                  key={h.name}
                  hospital={h}
                  isLevelA={false}
                  isOpen={openKey === h.name}
                  onToggle={() => toggle(h.name)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
