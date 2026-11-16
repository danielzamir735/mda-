import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackEvent } from '../../../utils/analytics';
import { useTranslation } from '../../../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const BAR_TO_PSI = 15; // exactly 1 Bar = 15 PSI

export default function BarPsiConverterModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const t = useTranslation();
  const [barValue, setBarValue] = useState('');
  const [psiValue, setPsiValue] = useState('');

  if (!isOpen) return null;

  const handleBarChange = (val: string) => {
    setBarValue(val);
    if (val === '' || isNaN(Number(val))) { setPsiValue(''); return; }
    setPsiValue(String(+(parseFloat(val) * BAR_TO_PSI).toFixed(2)));
    trackEvent('convert_bar_psi', { direction: 'bar_to_psi' });
  };

  const handlePsiChange = (val: string) => {
    setPsiValue(val);
    if (val === '' || isNaN(Number(val))) { setBarValue(''); return; }
    setBarValue(String(+(parseFloat(val) / BAR_TO_PSI).toFixed(2)));
    trackEvent('convert_bar_psi', { direction: 'psi_to_bar' });
  };

  const inputCls =
    'w-full bg-surface-2 border border-line rounded-xl ' +
    'px-4 py-3 text-fg text-lg font-semibold ' +
    'placeholder:text-fg-subtle focus:outline-none ' +
    'focus:border-emt-green focus:ring-2 focus:ring-emt-green/20';

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-page">
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <div className="flex items-center gap-2">
          <RefreshCw size={20} className="text-emt-green" />
          <h2 className="text-fg font-bold text-xl">{t('calcBarPsiTitle')}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-surface-2 border border-line
                     flex items-center justify-center active:scale-90 transition-transform
                     text-fg-muted hover:text-fg"
          aria-label={t('close')}
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        <div className="rounded-2xl border border-emt-green/30 bg-emt-green/5 p-3 text-center">
          <p className="text-emt-green font-bold text-sm">1 Bar = 15 PSI</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-fg-muted uppercase tracking-wide">
              {t('calcBarLabel')}
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={barValue}
              onChange={(e) => handleBarChange(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-line" />
            <RefreshCw size={16} className="text-emt-green shrink-0" />
            <div className="flex-1 h-px bg-line" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-fg-muted uppercase tracking-wide">
              {t('calcPsiLabel')}
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={psiValue}
              onChange={(e) => handlePsiChange(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
