import { useState } from 'react';
import { X, Wind, RefreshCw, Flame } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import OxygenCalculatorModal from '../../quicktools/OxygenCalculatorModal';
import BarPsiConverterModal from './BarPsiConverterModal';
import BurnsCalculatorModal from './BurnsCalculatorModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalculatorsModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [o2Open, setO2Open] = useState(false);
  const [barPsiOpen, setBarPsiOpen] = useState(false);
  const [burnsOpen, setBurnsOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-emt-dark">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מחשבונים</h2>
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

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {/* O2 Calculator */}
          <button
            onClick={() => setO2Open(true)}
            className="flex items-center gap-4 w-full rounded-2xl border border-emt-blue/30
                       bg-emt-blue/10 p-4 active:scale-95 transition-transform text-right"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-emt-blue/20 border border-emt-blue/40">
              <Wind size={22} className="text-emt-blue" />
            </div>
            <div className="flex-1">
              <p className="text-emt-blue font-bold text-base">מחשבון חמצן</p>
              <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">
                חישוב זמן חמצן לפי לחץ, נפח וזרימה
              </p>
            </div>
          </button>

          {/* Bar / PSI Converter */}
          <button
            onClick={() => setBarPsiOpen(true)}
            className="flex items-center gap-4 w-full rounded-2xl border border-emt-green/30
                       bg-emt-green/5 p-4 active:scale-95 transition-transform text-right"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-emt-green/20 border border-emt-green/40">
              <RefreshCw size={22} className="text-emt-green" />
            </div>
            <div className="flex-1">
              <p className="text-emt-green font-bold text-base">ממיר Bar / PSI</p>
              <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">
                המרת לחץ — 1 Bar = 15 PSI
              </p>
            </div>
          </button>

          {/* Burns Calculator */}
          <button
            onClick={() => setBurnsOpen(true)}
            className="flex items-center gap-4 w-full rounded-2xl border border-emt-red/30
                       bg-emt-red/5 p-4 active:scale-95 transition-transform text-right"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-emt-red/20 border border-emt-red/40">
              <Flame size={22} className="text-emt-red" />
            </div>
            <div className="flex-1">
              <p className="text-emt-red font-bold text-base">מחשבון כוויות</p>
              <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">
                כלל תשעיות — שטח גוף עם כוויות
              </p>
            </div>
          </button>
        </div>
      </div>

      <OxygenCalculatorModal isOpen={o2Open} onClose={() => setO2Open(false)} zClass="z-[70]" />
      <BarPsiConverterModal isOpen={barPsiOpen} onClose={() => setBarPsiOpen(false)} />
      <BurnsCalculatorModal isOpen={burnsOpen} onClose={() => setBurnsOpen(false)} />
    </>
  );
}
