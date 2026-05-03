import { useState, useEffect } from 'react';
import { X, Wind } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import { useTranslation } from '../../hooks/useTranslation';
import { trackEvent } from '../../utils/analytics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  zClass?: string;
}

type PressureUnit = 'bar' | 'psi';

export default function OxygenCalculatorModal({ isOpen, onClose, zClass = 'z-50' }: Props) {
  useModalBackHandler(isOpen, onClose);
  const t = useTranslation();
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>('bar');
  const [pressure, setPressure] = useState('');
  const [volume, setVolume] = useState('');
  const [flow, setFlow] = useState('');

  const pressureNum = parseFloat(pressure);
  const volumeNum   = parseFloat(volume);
  const flowNum     = parseFloat(flow);

  const allFilled =
    pressure !== '' && volume !== '' && flow !== '' &&
    !isNaN(pressureNum) && !isNaN(volumeNum) && !isNaN(flowNum) &&
    flowNum > 0 && volumeNum > 0 && pressureNum > 0;

  let minutes: number | null = null;
  if (allFilled) {
    minutes = pressureUnit === 'bar'
      ? Math.floor((pressureNum * volumeNum) / flowNum)
      : Math.floor(((pressureNum / 15) * volumeNum) / flowNum);
  }

  useEffect(() => {
    if (minutes !== null) {
      trackEvent('calculate_oxygen_time', { minutes, unit: pressureUnit });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minutes]);

  if (!isOpen) return null;

  const handleReset = () => { setPressure(''); setVolume(''); setFlow(''); };

  const inputCls =
    'w-full bg-gray-100 dark:bg-[#1A1A20] border border-gray-200 dark:border-emt-border rounded-xl ' +
    'px-4 py-3 text-gray-900 dark:text-emt-light text-lg font-semibold ' +
    'placeholder:text-gray-300 dark:placeholder:text-emt-border focus:outline-none ' +
    'focus:border-emt-blue focus:ring-2 focus:ring-emt-blue/20';

  return (
    <div
      className={`fixed inset-0 ${zClass} flex items-center justify-center bg-black/70 backdrop-blur-sm px-4`}
      role="dialog" aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#111114] border border-gray-200 dark:border-emt-border
                   shadow-2xl overflow-hidden animate-fade-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center px-5 pt-5 pb-4
                        border-b border-gray-200 dark:border-emt-border">
          <button
            onClick={onClose}
            className="absolute right-4 w-9 h-9 rounded-full bg-gray-100 dark:bg-emt-border/30
                       flex items-center justify-center
                       text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light active:scale-90 transition-all"
            aria-label={t('close')}
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Wind size={20} className="text-emt-blue" />
            <p className="text-gray-900 dark:text-emt-light font-bold text-lg">{t('oxygenCalculator')}</p>
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">

          {/* Pressure + Bar/PSI toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-500 dark:text-emt-muted uppercase tracking-wide">
              {t('tankPressure')}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={pressure}
                onChange={e => setPressure(e.target.value)}
                placeholder="0"
                className={inputCls + ' flex-1'}
              />
              {/* Toggle switch */}
              <div className="flex rounded-xl border border-gray-200 dark:border-emt-border overflow-hidden shrink-0">
                {(['bar', 'psi'] as PressureUnit[]).map(u => (
                  <button
                    key={u}
                    onClick={() => setPressureUnit(u)}
                    className={[
                      'px-4 py-2 text-sm font-bold transition-colors duration-150',
                      pressureUnit === u
                        ? 'bg-emt-blue text-white'
                        : 'bg-gray-100 dark:bg-[#1A1A20] text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light',
                    ].join(' ')}
                  >
                    {u === 'bar' ? 'Bar' : 'PSI'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Volume */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-500 dark:text-emt-muted uppercase tracking-wide">
              {t('tankVolume')}
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={volume}
              onChange={e => setVolume(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>

          {/* Flow rate */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-500 dark:text-emt-muted uppercase tracking-wide">
              {t('flowRate')}
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={flow}
              onChange={e => setFlow(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>

          {/* Result display */}
          <div
            className={[
              'rounded-2xl border px-5 py-4 text-center transition-all duration-300',
              minutes !== null
                ? 'bg-emt-blue/10 border-emt-blue/40'
                : 'bg-emt-border/10 border-emt-border',
            ].join(' ')}
          >
            {minutes !== null ? (
              <>
                <p className="text-gray-500 dark:text-emt-muted text-xs font-semibold uppercase tracking-wide mb-1">
                  {t('estimatedOxygenTime')}
                </p>
                <p
                  className="font-mono font-black tabular-nums text-emt-blue leading-none"
                  style={{ fontSize: 'clamp(3rem, 14vw, 5rem)' }}
                >
                  {minutes}
                </p>
                <p className="text-gray-500 dark:text-emt-muted text-sm font-medium mt-1">{t('minutes')}</p>
              </>
            ) : (
              <p className="text-gray-600 dark:text-gray-200 text-base font-medium py-2">
                {t('fillAllFields')}
              </p>
            )}
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="w-full py-3 rounded-xl bg-gray-100 dark:bg-emt-border/20 border border-gray-200 dark:border-emt-border
                       text-gray-500 dark:text-emt-muted font-semibold text-sm
                       active:scale-95 transition-transform duration-150
                       hover:bg-gray-200 dark:hover:bg-emt-border/40 hover:text-gray-900 dark:hover:text-emt-light"
          >
            {t('reset')}
          </button>

        </div>
      </div>
    </div>
  );
}
