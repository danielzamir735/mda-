import { useState } from 'react';
import { Baby, Stethoscope, LayoutGrid } from 'lucide-react';
import { trackInteraction } from '../../utils/analytics';
import PediatricDosageCalculatorModal from '../hub/components/PediatricDosageCalculatorModal';
import AdultDosageCalculatorModal from '../hub/components/AdultDosageCalculatorModal';
import CalculatorsModal from '../hub/components/CalculatorsModal';

export default function QuickToolsCard() {
  const [pediatricOpen, setPediatricOpen] = useState(false);
  const [adultOpen, setAdultOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <>
      <div
        className="flex flex-col items-center gap-2 rounded-3xl border border-gray-200 dark:border-emt-border
                   p-2 h-full w-full bg-white dark:bg-emt-gray"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <p className="text-gray-900 dark:text-emt-light font-black text-lg tracking-wide text-center w-full">
          מחשבונים
        </p>

        <div className="flex-1 w-full flex flex-col justify-evenly gap-1">

          {/* Pediatric ALS */}
          <button
            onClick={() => { trackInteraction('מינון תרופות ילדים ALS', 'quick_tools'); setPediatricOpen(true); }}
            className="flex items-center gap-3 px-3 py-2 rounded-2xl
                       transition-all duration-200 active:scale-95"
            aria-label="מינון תרופות ילדים ALS"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0
                         border border-emt-green/40 bg-emt-green/10"
            >
              <Baby size={18} className="text-emt-green" />
            </div>
            <span className="text-emt-green text-sm font-bold">מינון ילדים</span>
          </button>

          {/* Adult ALS */}
          <button
            onClick={() => { trackInteraction('תרופות מבוגרים ALS', 'quick_tools'); setAdultOpen(true); }}
            className="flex items-center gap-3 px-3 py-2 rounded-2xl
                       transition-all duration-200 active:scale-95"
            aria-label="תרופות מבוגרים ALS"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0
                         border border-orange-400/40 bg-orange-400/10"
            >
              <Stethoscope size={18} className="text-orange-400" />
            </div>
            <span className="text-orange-400 text-sm font-bold">מינון מבוגרים</span>
          </button>

          {/* All Calculators */}
          <button
            onClick={() => { trackInteraction('כל המחשבונים', 'quick_tools'); setCalcOpen(true); }}
            className="flex items-center gap-3 px-3 py-2 rounded-2xl
                       transition-all duration-200 active:scale-95"
            aria-label="כל המחשבונים"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0
                         border border-amber-400/40 bg-amber-400/10"
            >
              <LayoutGrid size={18} className="text-amber-400" />
            </div>
            <span className="text-amber-400 text-sm font-bold">כל המחשבונים</span>
          </button>

        </div>
      </div>

      <PediatricDosageCalculatorModal isOpen={pediatricOpen} onClose={() => setPediatricOpen(false)} />
      <AdultDosageCalculatorModal isOpen={adultOpen} onClose={() => setAdultOpen(false)} />
      <CalculatorsModal isOpen={calcOpen} onClose={() => setCalcOpen(false)} />
    </>
  );
}
