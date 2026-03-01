import { useState } from 'react';
import { X, Wind, RefreshCw } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import OxygenCalculatorModal from '../../quicktools/OxygenCalculatorModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const BAR_TO_PSI = 14.5038;

export default function CalculatorsModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [o2Open, setO2Open] = useState(false);
  const [barValue, setBarValue] = useState('');
  const [psiValue, setPsiValue] = useState('');

  if (!isOpen) return null;

  const handleBarChange = (val: string) => {
    setBarValue(val);
    if (val === '' || isNaN(Number(val))) { setPsiValue(''); return; }
    setPsiValue(String(+(parseFloat(val) * BAR_TO_PSI).toFixed(4)));
  };

  const handlePsiChange = (val: string) => {
    setPsiValue(val);
    if (val === '' || isNaN(Number(val))) { setBarValue(''); return; }
    setBarValue(String(+(parseFloat(val) / BAR_TO_PSI).toFixed(4)));
  };

  const inputCls =
    'w-full bg-[#1A1A20] border border-emt-border rounded-xl ' +
    'px-4 py-3 text-emt-light text-lg font-semibold ' +
    'placeholder:text-emt-border focus:outline-none ' +
    'focus:border-emt-green focus:ring-2 focus:ring-emt-green/20';

  return (
    <>
      <div className="fixed inset-0 z-[60] flex flex-col bg-emt-dark">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-emt-border">
          <h2 className="text-emt-light font-bold text-xl">מחשבונים</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-emt-gray border border-emt-border
                       flex items-center justify-center
                       active:scale-90 transition-transform text-emt-muted hover:text-emt-light"
            aria-label="סגור"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

          {/* O2 Calculator button */}
          <button
            onClick={() => setO2Open(true)}
            className="flex items-center gap-4 w-full rounded-2xl border border-emt-blue/30
                       bg-emt-blue/10 p-4 active:scale-95 transition-transform text-right"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0
                         bg-emt-blue/20 border border-emt-blue/40"
            >
              <Wind size={22} className="text-emt-blue" />
            </div>
            <div className="flex-1">
              <p className="text-emt-blue font-bold text-base">מחשבון חמצן</p>
              <p className="text-emt-muted text-xs mt-0.5">חישוב זמן חמצן לפי לחץ, נפח וזרימה</p>
            </div>
          </button>

          {/* Bar / PSI Converter */}
          <div className="rounded-2xl border border-emt-green/30 bg-emt-green/5 p-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <RefreshCw size={18} className="text-emt-green" />
              <p className="text-emt-green font-bold text-base">ממיר Bar / PSI</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-emt-muted uppercase tracking-wide">
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

              <p className="text-center text-emt-muted text-xs">1 Bar = 14.5038 PSI</p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-emt-muted uppercase tracking-wide">
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
      </div>

      <OxygenCalculatorModal
        isOpen={o2Open}
        onClose={() => setO2Open(false)}
        zClass="z-[70]"
      />
    </>
  );
}
