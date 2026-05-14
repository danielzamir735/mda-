import { useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { X, Wind, RefreshCw, Flame, Activity, Timer, Brain, Baby, HeartPulse, Stethoscope, GripVertical, Pencil, Check } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { trackInteraction } from '../../../utils/analytics';
import OxygenCalculatorModal from '../../quicktools/OxygenCalculatorModal';
import BarPsiConverterModal from './BarPsiConverterModal';
import BurnsCalculatorModal from './BurnsCalculatorModal';
import ApgarCalculatorModal from './ApgarCalculatorModal';
import ContractionTimerModal from './ContractionTimerModal';
import GlasgowCalculatorModal from './GlasgowCalculatorModal';
import PediatricDosageCalculatorModal from './PediatricDosageCalculatorModal';
import AdultDosageCalculatorModal from './AdultDosageCalculatorModal';
import ShockCalculator from '../../calculators/ShockCalculator';
import TubeSizingCalculatorModal from './TubeSizingCalculatorModal';
import QSofaCalculatorModal from './QSofaCalculatorModal';

interface CalcDef {
  id: string;
  name: string;
  desc: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  textClass: string;
  borderClass: string;
  bgClass: string;
  iconBgClass: string;
  iconBorderClass: string;
}

const CALC_DEFS: CalcDef[] = [
  {
    id: 'pediatric',
    name: 'מינון תרופות ילדים ALS',
    desc: '7 תרחישים — אירווי, לב, נשימה, כאב ועוד',
    Icon: Baby,
    textClass: 'text-emt-green',
    borderClass: 'border-emt-green/30',
    bgClass: 'bg-emt-green/5',
    iconBgClass: 'bg-emt-green/20',
    iconBorderClass: 'border-emt-green/40',
  },
  {
    id: 'adult',
    name: 'מינון תרופות מבוגרים ALS',
    desc: '10 תרחישים — דום לב, ACS, סדציה, כאב ועוד',
    Icon: Stethoscope,
    textClass: 'text-orange-400',
    borderClass: 'border-orange-400/30',
    bgClass: 'bg-orange-400/5',
    iconBgClass: 'bg-orange-400/20',
    iconBorderClass: 'border-orange-400/40',
  },
  {
    id: 'tube',
    name: 'גדלי טיובוס ו-LMA',
    desc: 'ETT + LMA לפי גיל ומשקל — כולל עומק הכנסה',
    Icon: Wind,
    textClass: 'text-sky-400',
    borderClass: 'border-sky-400/30',
    bgClass: 'bg-sky-400/5',
    iconBgClass: 'bg-sky-400/20',
    iconBorderClass: 'border-sky-400/40',
  },
  {
    id: 'contraction',
    name: 'מחשבון צירי לידה',
    desc: 'מדידת משך וזמן בין צירים',
    Icon: Timer,
    textClass: 'text-purple-400',
    borderClass: 'border-purple-400/30',
    bgClass: 'bg-purple-400/5',
    iconBgClass: 'bg-purple-400/20',
    iconBorderClass: 'border-purple-400/40',
  },
  {
    id: 'burns',
    name: 'מחשבון כוויות',
    desc: 'כלל תשעיות — שטח גוף עם כוויות',
    Icon: Flame,
    textClass: 'text-emt-red',
    borderClass: 'border-emt-red/30',
    bgClass: 'bg-emt-red/5',
    iconBgClass: 'bg-emt-red/20',
    iconBorderClass: 'border-emt-red/40',
  },
  {
    id: 'gcs',
    name: 'מחשבון גלזגו (GCS)',
    desc: 'הערכת רמת הכרה — ציון 3–15',
    Icon: Brain,
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-400/30',
    bgClass: 'bg-cyan-400/5',
    iconBgClass: 'bg-cyan-400/20',
    iconBorderClass: 'border-cyan-400/40',
  },
  {
    id: 'qsofa',
    name: 'מחשבון qSOFA',
    desc: 'הערכת ספסיס מהירה — 3 קריטריונים',
    Icon: Activity,
    textClass: 'text-amber-400',
    borderClass: 'border-amber-400/30',
    bgClass: 'bg-amber-400/5',
    iconBgClass: 'bg-amber-400/20',
    iconBorderClass: 'border-amber-400/40',
  },
  {
    id: 'apgar',
    name: 'מחשבון APGAR',
    desc: 'הערכת מצב יילוד — ציון 0–10',
    Icon: Activity,
    textClass: 'text-pink-400',
    borderClass: 'border-pink-400/30',
    bgClass: 'bg-pink-400/5',
    iconBgClass: 'bg-pink-400/20',
    iconBorderClass: 'border-pink-400/40',
  },
  {
    id: 'shock',
    name: 'מחשבון הלם ופרפוזיה',
    desc: 'Shock Index ו־MAP — זיהוי הלם מוקדם',
    Icon: HeartPulse,
    textClass: 'text-red-400',
    borderClass: 'border-red-400/30',
    bgClass: 'bg-red-400/5',
    iconBgClass: 'bg-red-400/20',
    iconBorderClass: 'border-red-400/40',
  },
  {
    id: 'o2',
    name: 'מחשבון חמצן',
    desc: 'חישוב זמן חמצן לפי לחץ, נפח וזרימה',
    Icon: Wind,
    textClass: 'text-emt-blue',
    borderClass: 'border-emt-blue/30',
    bgClass: 'bg-emt-blue/10',
    iconBgClass: 'bg-emt-blue/20',
    iconBorderClass: 'border-emt-blue/40',
  },
  {
    id: 'barPsi',
    name: 'ממיר Bar / PSI',
    desc: 'המרת לחץ — 1 Bar = 15 PSI',
    Icon: RefreshCw,
    textClass: 'text-emt-green',
    borderClass: 'border-emt-green/30',
    bgClass: 'bg-emt-green/5',
    iconBgClass: 'bg-emt-green/20',
    iconBorderClass: 'border-emt-green/40',
  },
];

const DEFAULT_ORDER = CALC_DEFS.map(c => c.id);
const STORAGE_KEY = 'calc_order_v1';

function loadOrder(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: string[] = JSON.parse(saved);
      const valid = parsed.filter(id => DEFAULT_ORDER.includes(id));
      const missing = DEFAULT_ORDER.filter(id => !valid.includes(id));
      return [...valid, ...missing];
    }
  } catch {}
  return DEFAULT_ORDER;
}

function DraggableCalcRow({ calc }: { calc: CalcDef }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      key={calc.id}
      value={calc}
      dragListener={false}
      dragControls={controls}
      className={`flex items-center gap-4 w-full rounded-2xl border ${calc.borderClass} ${calc.bgClass} p-4 select-none`}
      whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 10 }}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${calc.iconBgClass} border ${calc.iconBorderClass}`}>
        <calc.Icon size={22} className={calc.textClass} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`${calc.textClass} font-bold text-base`}>{calc.name}</p>
        <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">{calc.desc}</p>
      </div>
      <div
        onPointerDown={(e) => controls.start(e)}
        className="p-2 -m-2 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical size={22} className="text-gray-400 dark:text-emt-muted" />
      </div>
    </Reorder.Item>
  );
}

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
  const [adultOpen, setAdultOpen] = useState(false);
  const [shockOpen, setShockOpen] = useState(false);
  const [tubeOpen, setTubeOpen] = useState(false);
  const [qsofaOpen, setQsofaOpen] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [order, setOrder] = useState<string[]>(() => loadOrder());

  const orderedCalcs = order.map(id => CALC_DEFS.find(c => c.id === id)!).filter(Boolean);

  const handleReorder = (newCalcs: CalcDef[]) => {
    const newOrder = newCalcs.map(c => c.id);
    setOrder(newOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
  };

  const openCalc = (id: string) => {
    switch (id) {
      case 'pediatric':   trackInteraction('מינון תרופות ילדים ALS', 'calculators');    setPediatricOpen(true);   break;
      case 'adult':       trackInteraction('מינון תרופות מבוגרים ALS', 'calculators');  setAdultOpen(true);       break;
      case 'tube':        trackInteraction('גדלי טיובוס ו-LMA', 'calculators');          setTubeOpen(true);        break;
      case 'contraction': trackInteraction('מחשבון צירי לידה', 'calculators');          setContractionOpen(true); break;
      case 'burns':       trackInteraction('מחשבון כוויות', 'calculators');             setBurnsOpen(true);       break;
      case 'gcs':         trackInteraction('מחשבון גלזגו (GCS)', 'calculators');        setGcsOpen(true);         break;
      case 'qsofa':       trackInteraction('מחשבון qSOFA', 'calculators');              setQsofaOpen(true);       break;
      case 'apgar':       trackInteraction('מחשבון APGAR', 'calculators');              setApgarOpen(true);       break;
      case 'shock':       trackInteraction('מחשבון הלם ופרפוזיה', 'calculators');      setShockOpen(true);       break;
      case 'o2':          trackInteraction('מחשבון חמצן', 'calculators');               setO2Open(true);          break;
      case 'barPsi':      trackInteraction('ממיר Bar / PSI', 'calculators');            setBarPsiOpen(true);      break;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-emt-dark">
        {/* Header */}
        <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מחשבונים</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(e => !e)}
              className={`w-10 h-10 rounded-full border flex items-center justify-center active:scale-90 transition-all
                ${editMode
                  ? 'bg-emt-green/15 border-emt-green/40 text-emt-green'
                  : 'bg-emt-green/5 dark:bg-emt-green/10 border-emt-green/40 text-emt-green/70 hover:text-emt-green'
                }`}
              aria-label={editMode ? 'סיום עריכה' : 'סדר מחשבונים'}
            >
              {editMode ? <Check size={18} /> : <Pencil size={18} />}
            </button>
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
        </div>

        {/* Edit mode hint */}
        {editMode && (
          <div className="shrink-0 px-4 py-2 bg-emt-green/5 border-b border-emt-green/20">
            <p className="text-xs text-emt-green/80 text-center font-medium">החזק את הידית ⠿ וגרור • לחץ ✓ לסיום</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {editMode ? (
            <Reorder.Group
              axis="y"
              values={orderedCalcs}
              onReorder={handleReorder}
              className="flex flex-col gap-3 list-none m-0 p-0"
            >
              {orderedCalcs.map(calc => (
                <DraggableCalcRow key={calc.id} calc={calc} />
              ))}
            </Reorder.Group>
          ) : (
            <div className="flex flex-col gap-3">
              {orderedCalcs.map(calc => (
                <button
                  key={calc.id}
                  onClick={() => openCalc(calc.id)}
                  className={`flex items-center gap-4 w-full rounded-2xl border ${calc.borderClass} ${calc.bgClass} p-4 active:scale-95 transition-transform text-right`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${calc.iconBgClass} border ${calc.iconBorderClass}`}>
                    <calc.Icon size={22} className={calc.textClass} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`${calc.textClass} font-bold text-base`}>{calc.name}</p>
                    <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">{calc.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <OxygenCalculatorModal isOpen={o2Open} onClose={() => setO2Open(false)} zClass="z-[70]" />
      <BarPsiConverterModal isOpen={barPsiOpen} onClose={() => setBarPsiOpen(false)} />
      <BurnsCalculatorModal isOpen={burnsOpen} onClose={() => setBurnsOpen(false)} />
      <ContractionTimerModal isOpen={contractionOpen} onClose={() => setContractionOpen(false)} />
      <ApgarCalculatorModal isOpen={apgarOpen} onClose={() => setApgarOpen(false)} />
      <GlasgowCalculatorModal isOpen={gcsOpen} onClose={() => setGcsOpen(false)} />
      <PediatricDosageCalculatorModal isOpen={pediatricOpen} onClose={() => setPediatricOpen(false)} />
      <AdultDosageCalculatorModal isOpen={adultOpen} onClose={() => setAdultOpen(false)} />
      <ShockCalculator isOpen={shockOpen} onClose={() => setShockOpen(false)} />
      <TubeSizingCalculatorModal isOpen={tubeOpen} onClose={() => setTubeOpen(false)} />
      <QSofaCalculatorModal isOpen={qsofaOpen} onClose={() => setQsofaOpen(false)} />
    </>
  );
}
