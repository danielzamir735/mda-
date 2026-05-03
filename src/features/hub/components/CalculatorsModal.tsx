import { useState } from 'react';
import { X, Wind, RefreshCw, Flame, Activity, Timer, Brain, Baby, HeartPulse } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackInteraction } from '../../../utils/analytics';
import OxygenCalculatorModal from '../../quicktools/OxygenCalculatorModal';
import BarPsiConverterModal from './BarPsiConverterModal';
import BurnsCalculatorModal from './BurnsCalculatorModal';
import ApgarCalculatorModal from './ApgarCalculatorModal';
import ContractionTimerModal from './ContractionTimerModal';
import GlasgowCalculatorModal from './GlasgowCalculatorModal';
import PediatricDosageCalculatorModal from './PediatricDosageCalculatorModal';
import ShockCalculator from '../../calculators/ShockCalculator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalculatorsModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const [o2Open, setO2Open] = useState(false);
  const [barPsiOpen, setBarPsiOpen] = useState(false);
  const [burnsOpen, setBurnsOpen] = useState(false);
  const [apgarOpen, setApgarOpen] = useState(false);
  const [contractionOpen, setContractionOpen] = useState(false);
  const [gcsOpen, setGcsOpen] = useState(false);
  const [pediatricOpen, setPediatricOpen] = useState(false);
  const [shockOpen, setShockOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-emt-dark" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
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
          {/* Contraction Timer — FIRST */}
          <button
            onClick={() => { trackInteraction('מחשבון צירי לידה', 'calculators'); setContractionOpen(true); }}
            className="flex items-center gap-4 w-full rounded-2xl border border-purple-400/30
                       bg-purple-400/5 p-4 active:scale-95 transition-transform text-right"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-purple-400/20 border border-purple-400/40">
              <Timer size={22} className="text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-purple-400 font-bold text-base">מחשבון צירי לידה</p>
              <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">
                מדידת משך וזמן בין צירים
              </p>
            </div>
          </button>

          {/* Shock & Perfusion Calculator */}
          <button
            onClick={() => { trackInteraction('מחשבון הלם ופרפוזיה', 'calculators'); setShockOpen(true); }}
            className="flex items-center gap-4 w-full rounded-2xl border border-red-400/30
                       bg-red-400/5 p-4 active:scale-95 transition-transform text-right"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-red-400/20 border border-red-400/40">
              <HeartPulse size={22} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-red-400 font-bold text-base">מחשבון הלם ופרפוזיה</p>
              <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">
                Shock Index ו־MAP — זיהוי הלם מוקדם
              </p>
            </div>
          </button>

          {/* O2 Calculator */}
          <button
            onClick={() => { trackInteraction('מחשבון חמצן', 'calculators'); setO2Open(true); }}
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
            onClick={() => { trackInteraction('ממיר Bar / PSI', 'calculators'); setBarPsiOpen(true); }}
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
            onClick={() => { trackInteraction('מחשבון כוויות', 'calculators'); setBurnsOpen(true); }}
            className="flex items-center gap-4 w-full rounded-2xl border border-emt-red/30
                       bg-emt-red/5 p-4 active:scale-95 transition-transform text-right"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-emt-red/20 border border-emt-red/40">
              <Flame size={22} className="text-emt-red" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-emt-red font-bold text-base">מחשבון כוויות</p>
              </div>
              <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">
                כלל תשעיות — שטח גוף עם כוויות
              </p>
            </div>
          </button>

          {/* Glasgow Coma Scale */}
          <button
            onClick={() => { trackInteraction('מחשבון גלזגו (GCS)', 'calculators'); setGcsOpen(true); }}
            className="flex items-center gap-4 w-full rounded-2xl border border-cyan-400/30
                       bg-cyan-400/5 p-4 active:scale-95 transition-transform text-right"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-cyan-400/20 border border-cyan-400/40">
              <Brain size={22} className="text-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="text-cyan-400 font-bold text-base">מחשבון גלזגו (GCS)</p>
              <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">
                הערכת רמת הכרה — ציון 3–15
              </p>
            </div>
          </button>

          {/* APGAR Calculator */}
          <button
            onClick={() => { trackInteraction('מחשבון APGAR', 'calculators'); setApgarOpen(true); }}
            className="flex items-center gap-4 w-full rounded-2xl border border-pink-400/30
                       bg-pink-400/5 p-4 active:scale-95 transition-transform text-right"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-pink-400/20 border border-pink-400/40">
              <Activity size={22} className="text-pink-400" />
            </div>
            <div className="flex-1">
              <p className="text-pink-400 font-bold text-base">מחשבון APGAR</p>
              <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">
                הערכת מצב יילוד — ציון 0–10
              </p>
            </div>
          </button>

          {/* Pediatric Dosage Calculator */}
          <button
            onClick={() => { trackInteraction('מינון תרופות ילדים', 'calculators'); setPediatricOpen(true); }}
            className="flex items-center gap-4 w-full rounded-2xl border border-emt-green/30
                       bg-emt-green/5 p-4 active:scale-95 transition-transform text-right"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-emt-green/20 border border-emt-green/40">
              <Baby size={22} className="text-emt-green" />
            </div>
            <div className="flex-1">
              <p className="text-emt-green font-bold text-base">מינון תרופות ילדים</p>
              <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">
                פרוטוקול חירום — מינון לפי משקל
              </p>
            </div>
          </button>
        </div>
      </div>

      <OxygenCalculatorModal isOpen={o2Open} onClose={() => setO2Open(false)} zClass="z-[70]" />
      <BarPsiConverterModal isOpen={barPsiOpen} onClose={() => setBarPsiOpen(false)} />
      <BurnsCalculatorModal isOpen={burnsOpen} onClose={() => setBurnsOpen(false)} />
      <ContractionTimerModal isOpen={contractionOpen} onClose={() => setContractionOpen(false)} />
      <ApgarCalculatorModal isOpen={apgarOpen} onClose={() => setApgarOpen(false)} />
      <GlasgowCalculatorModal isOpen={gcsOpen} onClose={() => setGcsOpen(false)} />
      <PediatricDosageCalculatorModal isOpen={pediatricOpen} onClose={() => setPediatricOpen(false)} />
      <ShockCalculator isOpen={shockOpen} onClose={() => setShockOpen(false)} />
    </>
  );
}
