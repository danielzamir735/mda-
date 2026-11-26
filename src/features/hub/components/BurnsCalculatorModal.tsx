import { useState, useEffect, useRef } from 'react';
import { X, Flame, Share2, Droplets } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import ReactGA from 'react-ga4';
import { trackEvent } from '../../../utils/analytics';
import { useTranslation } from '../../../i18n';
import AdultBodyDiagram, { ADULT_PART_LOOKUP } from './AdultBodyDiagram';
import ChildBodyDiagram, { CHILD_PART_LOOKUP } from './ChildBodyDiagram';
import type { BodyPartId } from './BodySilhouette';

interface Props { isOpen: boolean; onClose: () => void; }
type AgeGroup = 'adult' | 'child';

export default function BurnsCalculatorModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const t = useTranslation();
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult');

  useEffect(() => {
    if (isOpen) ReactGA.event('modal_view', { modal: 'burns_calculator' });
  }, [isOpen]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [weight, setWeight] = useState('');
  const [burnOverride, setBurnOverride] = useState('');

  // Total uses the active mode's percentage table. IDs are shared between modes,
  // but values differ (head/leg weights change between adult and child).
  const lookup = ageGroup === 'adult' ? ADULT_PART_LOOKUP : CHILD_PART_LOOKUP;
  const total = Array.from(selected).reduce((sum, id) => {
    const p = lookup[id as BodyPartId];
    return p ? sum + p.percentage : sum;
  }, 0);

  const parklandBurn = burnOverride !== '' ? parseFloat(burnOverride) : total;
  const parklandWeight = parseFloat(weight);
  const parklandResult =
    parklandWeight > 0 && parklandBurn > 0
      ? (4 * parklandWeight * parklandBurn) / 1000
      : null;

  const resultTrackedRef = useRef(false);
  useEffect(() => {
    if (parklandResult !== null) {
      if (!resultTrackedRef.current) {
        resultTrackedRef.current = true;
        trackEvent('calculate_burns', { total_percentage: parklandBurn });
      }
    } else {
      resultTrackedRef.current = false;
    }
  }, [parklandResult, parklandBurn]);

  if (!isOpen) return null;

  const toggle = (id: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    ReactGA.event('burn_body_part_toggle', { part: id, age_group: ageGroup });
  };

  const handleAge = (ag: AgeGroup) => { setAgeGroup(ag); setSelected(new Set()); };
  const resetSelection = () => setSelected(new Set());

  // Both modes use 0.5 increments (4.5%, 7%, 9%, etc.) so totals can be fractional.
  const totalDisplay = Number.isInteger(total) ? String(total) : total.toFixed(1);

  const severity = total === 0 ? null : total < 10 ? t('calcBurnsSevMinor') : total < 25 ? t('calcBurnsSevModerate') : t('calcBurnsSevSevere');
  const sevColor  = total < 10 ? 'text-amber-600 dark:text-emt-yellow' : total < 25 ? 'text-orange-400' : 'text-emt-red';
  const sevBadge  = total < 10 ? 'bg-emt-yellow/20 text-amber-600 dark:text-emt-yellow' : total < 25 ? 'bg-orange-400/20 text-orange-400' : 'bg-emt-red/20 text-emt-red';

  const handleShare = () => {
    if (!navigator.share) return;
    trackEvent('app_share_clicked', { context: 'burns_calculator' });
    navigator.share({
      title: t('calcParklandShareTitle'),
      text: t('calcParklandShareText', { w: parklandWeight, burn: parklandBurn, liters: parklandResult?.toFixed(2) ?? '' }),
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-page">

      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Flame size={20} className="text-emt-red" />
          <h2 className="text-fg font-bold text-xl">{t('calcBurnsTitle')}</h2>
        </div>
        <button onClick={onClose}
          className="w-10 h-10 rounded-full bg-surface-2 border border-line flex items-center justify-center active:scale-90 transition-transform text-fg-muted"
          aria-label={t('close')}>
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 items-center">

        {/* Age toggle */}
        <div className="flex gap-2 w-full">
          {(['adult', 'child'] as AgeGroup[]).map(ag => (
            <button key={ag} onClick={() => handleAge(ag)}
              className={['flex-1 py-2.5 rounded-xl border font-bold text-sm transition-all active:scale-95',
                ageGroup === ag
                  ? 'border-emt-red/50 bg-emt-red/10 text-emt-red'
                  : 'border-line bg-surface-2 text-fg-muted',
              ].join(' ')}>
              {ag === 'adult' ? t('calcAdult') : t('calcChild')}
            </button>
          ))}
        </div>

        {/* Body diagram — animated swap between Adult/Child modes */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {ageGroup === 'adult' ? (
              <AdultBodyDiagram
                key="adult"
                selected={selected}
                onToggle={(id) => toggle(id)}
                onReset={resetSelection}
              />
            ) : (
              <ChildBodyDiagram
                key="child"
                selected={selected}
                onToggle={(id) => toggle(id)}
                onReset={resetSelection}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Total */}
        <div className={['w-full rounded-2xl border p-4 flex flex-col items-center gap-1 transition-all duration-300',
          total > 0 ? 'border-emt-red/30 bg-emt-red/5' : 'border-line bg-surface-2',
        ].join(' ')}>
          <p className="text-fg-muted text-sm font-semibold uppercase tracking-wide">{t('calcBurnsTotal')}</p>
          <div className="flex items-baseline gap-1">
            <span
              className={`font-black tabular-nums transition-colors duration-300 ${total > 0 ? sevColor : 'text-fg/20'}`}
              style={{ fontSize: 'clamp(2.5rem, 14vw, 4rem)' }}>
              {totalDisplay}
            </span>
            <span className={`text-xl font-bold ${total > 0 ? sevColor : 'text-fg/20'}`}>%</span>
          </div>
          {severity && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sevBadge}`}>{severity}</span>}
          {total === 0 && <p className="text-fg-muted text-base">{t('calcBurnsTapAreas')}</p>}
        </div>

        {/* ── Parkland Fluid Resuscitation ── */}
        <div className="w-full rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Droplets size={18} className="text-blue-500" />
            <h3 className="text-blue-700 dark:text-blue-300 font-bold text-base">{t('calcParklandTitle')}</h3>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-semibold text-fg-muted">{t('calcBodyWeightKg')}</label>
              <input
                type="number"
                min="0"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-line bg-surface text-fg px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-400 text-start"
              />
            </div>

            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-semibold text-fg-muted">{t('calcBurnPercent')}</label>
              <input
                type="number"
                min="0"
                max="100"
                value={burnOverride !== '' ? burnOverride : total > 0 ? totalDisplay : ''}
                onChange={e => setBurnOverride(e.target.value)}
                placeholder={total > 0 ? totalDisplay : '0'}
                className="w-full rounded-xl border border-line bg-surface text-fg px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-400 text-start"
              />
            </div>
          </div>

          <div className={['rounded-xl border p-3 flex flex-col items-center gap-0.5 transition-all duration-300',
            parklandResult !== null
              ? 'border-blue-300 dark:border-blue-700 bg-surface dark:bg-blue-900/30'
              : 'border-line bg-surface-2',
          ].join(' ')}>
            {parklandResult !== null ? (
              <>
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide">{t('calcFluidsRequired')}</p>
                <p className="font-black text-blue-600 dark:text-blue-300 tabular-nums" style={{ fontSize: 'clamp(2rem, 10vw, 3rem)' }}>
                  {parklandResult.toFixed(2)} <span className="text-lg">{t('calcLiters')}</span>
                </p>
                <p className="text-xs text-fg-muted">{t('calcParkland24h')}</p>
              </>
            ) : (
              <p className="text-fg-muted text-sm py-1">{t('calcParklandEnterInputs')}</p>
            )}
          </div>

          {parklandResult !== null && (
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-sm active:scale-95 transition-all"
            >
              <Share2 size={16} />
              {t('calcShareResults')}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
