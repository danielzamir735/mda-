import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const BAR_TO_PSI = 15; // exactly 1 Bar = 15 PSI

export default function BarPsiConverterModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [barValue, setBarValue] = useState('');
  const [psiValue, setPsiValue] = useState('');

  if (!isOpen) return null;

  const handleBarChange = (val: string) => {
    setBarValue(val);
    if (val === '' || isNaN(Number(val))) { setPsiValue(''); return; }
    setPsiValue(String(+(parseFloat(val) * BAR_TO_PSI).toFixed(2)));
  };

  const handlePsiChange = (val: string) => {
    setPsiValue(val);
    if (val === '' || isNaN(Number(val))) { setBarValue(''); return; }
    setBarValue(String(+(parseFloat(val) / BAR_TO_PSI).toFixed(2)));
  };

  const inputCls =
    'w-full bg-gray-100 dark:bg-[#1A1A20] border border-gray-200 dark:border-emt-border rounded-xl ' +
    'px-4 py-3 text-gray-900 dark:text-emt-light text-lg font-semibold ' +
    'placeholder:text-gray-400 dark:placeholder:text-emt-border focus:outline-none ' +
    'focus:border-emt-green focus:ring-2 focus:ring-emt-green/20';

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50 dark:bg-emt-dark">
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <div className="flex items-center gap-2">
          <RefreshCw size={20} className="text-emt-green" />
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">ממיר Bar / PSI</h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
          aria-label="סגור"
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
            <label className="text-xs font-semibold text-gray-500 dark:text-emt-muted uppercase tracking-wide">
              בר (Bar)
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
            <div className="flex-1 h-px bg-gray-200 dark:bg-emt-border" />
            <RefreshCw size={16} className="text-emt-green shrink-0" />
            <div className="flex-1 h-px bg-gray-200 dark:bg-emt-border" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-emt-muted uppercase tracking-wide">
              פי.אס.איי (PSI)
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
