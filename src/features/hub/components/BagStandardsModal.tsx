import { useState } from 'react';
import { ChevronRight, Backpack } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

interface BagItem {
  name: string;
  qty: string;
}

interface Bag {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  border: string;
  bg: string;
  iconColor: string;
  items: BagItem[];
}

const BAGS: Bag[] = [
  {
    id: 'maar',
    title: 'תיק מע״ר',
    subtitle: 'מגיב ראשון',
    color: 'text-emerald-400',
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-400/10',
    iconColor: 'text-emerald-400',
    items: [
      { name: 'תרמיל גב', qty: '1' },
      { name: 'משולש בד', qty: '5' },
      { name: 'תחבושת אישית', qty: '5' },
      { name: 'תחבושת בינונית', qty: '1' },
      { name: 'חוסם עורקים', qty: '1' },
      { name: 'אגד (תחבושת)', qty: '10' },
      { name: 'איספלנית ניילון (מיקרופור)', qty: '2' },
      { name: 'אגד מידבק (פלסטר)', qty: '200' },
      { name: 'מלע״כ (מספריים)', qty: '1' },
      { name: 'פד גזה סטרילי', qty: '20' },
      { name: 'סד קשיח לקיבוע', qty: '1' },
      { name: 'סביעור / חיטוי', qty: '2' },
      { name: 'מסכת כיס להנשמה', qty: '1' },
      { name: 'תחבושת לכוויות (ברנשילד)', qty: '1' },
      { name: 'שמיכה היפותרמית', qty: '3' },
      { name: 'כפפות חד-פעמיות (זוגות)', qty: '20' },
      { name: 'פנס ראש', qty: '1' },
      { name: 'תחבושות אלסטיות', qty: '5' },
      { name: 'מזרק אפיפן', qty: '1' },
    ],
  },
  {
    id: 'chovesh',
    title: 'תיק חובש',
    subtitle: 'חובש מוסמך',
    color: 'text-blue-400',
    border: 'border-blue-400/30',
    bg: 'bg-blue-400/10',
    iconColor: 'text-blue-400',
    items: [
      { name: 'תרמיל גב', qty: '1' },
      { name: 'משולש בד', qty: '8' },
      { name: 'תחבושת אישית', qty: '4' },
      { name: 'תחבושת בינונית', qty: '1' },
      { name: 'חוסם עורקים', qty: '2' },
      { name: 'אגד (תחבושת)', qty: '10' },
      { name: 'איספלנית ניילון (מיקרופור)', qty: '3' },
      { name: 'אגד מידבק (פלסטר)', qty: '200' },
      { name: 'מלע״כ (מספריים)', qty: '1' },
      { name: 'פד גזה סטרילי', qty: '20' },
      { name: 'סד קשיח לקיבוע', qty: '1' },
      { name: 'תמיסה לחיטוי עור', qty: '1' },
      { name: 'תחבושת לכוויות', qty: '3' },
      { name: 'אשרמן', qty: '1' },
      { name: 'שמיכה היפותרמית', qty: '1' },
      { name: 'מנתב אוויר 3,4,5', qty: '1 כ״א' },
      { name: 'כפפות חד-פעמיות (זוגות)', qty: '20' },
      { name: 'צווארון מתכוונן', qty: '1' },
      { name: 'מד לחץ דם + סטטוסקופ', qty: '1 כ״א' },
      { name: 'מד סטורציה', qty: '1' },
      { name: 'ערכת עירוי NaCl 0.9%', qty: '4' },
      { name: 'מסכת כיס', qty: '1' },
      { name: 'קטטר לסקשן (אדום)', qty: '2' },
      { name: 'מכשיר סקשן ידני', qty: '1' },
      { name: 'פנס ראש', qty: '1' },
      { name: 'תחבושות אלסטיות', qty: '5' },
      { name: "גלוקוג'ל", qty: '1' },
      { name: 'אספירין', qty: '10' },
      { name: 'תחבושת המוסטטית', qty: '5' },
      { name: 'מד חום', qty: '2' },
      { name: 'מזרק אפיפן', qty: '1' },
    ],
  },
  {
    id: 'paramedic',
    title: 'תיק פאראמדיק',
    subtitle: 'פאראמדיק מוסמך',
    color: 'text-emt-red',
    border: 'border-emt-red/30',
    bg: 'bg-emt-red/10',
    iconColor: 'text-emt-red',
    items: [
      { name: 'דפיברילטור', qty: '1' },
      { name: 'חוסם עורקים', qty: '2' },
      { name: 'ערכת עירוי NaCl 0.9% 500cc', qty: '4' },
      { name: 'מפוח הנשמה + מסכות + מסנן', qty: '1' },
      { name: 'מכשיר סקשן + קטטרים', qty: '1' },
      { name: 'ערכת אינטובציה קומפלט', qty: '1' },
      { name: 'מזרק תוך גרמי (BIG) ילד+מבוגר', qty: '2' },
      { name: 'אשרמן', qty: '1' },
      { name: 'מחט וויגון לניקוז חזה + סקלפל', qty: '2' },
      { name: 'מד ל״ד, סטטוסקופ, סטורציה, מד חום', qty: '1 כ״א' },
      { name: 'גלוקומטר + סטיקים', qty: '1' },
      { name: 'תרופות חירום (אדרנלין, מידזולם, ניטרו)', qty: 'לפי פרוטוקול' },
      { name: 'מזרקים + מחטים', qty: 'מגוון' },
      { name: 'כפפות חד-פעמיות (זוגות)', qty: '20' },
      { name: 'תחבושת המוסטטית', qty: '5' },
      { name: 'מסכת חמצן + טובינג', qty: '1' },
    ],
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function BagStandardsModal({ isOpen, onClose }: Props) {
  const [selectedBag, setSelectedBag] = useState<Bag | null>(null);
  useModalBackHandler(isOpen, onClose);

  if (!isOpen) return null;

  if (selectedBag) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-emt-dark">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-emt-border">
          <button
            onClick={() => setSelectedBag(null)}
            className="w-10 h-10 rounded-full bg-emt-gray border border-emt-border
                       flex items-center justify-center active:scale-90 transition-transform
                       text-emt-muted hover:text-emt-light"
            aria-label="חזור"
          >
            <ChevronRight size={20} />
          </button>
          <h2 className="text-emt-light font-bold text-xl">{selectedBag.title}</h2>
          <div className="w-10" />
        </div>

        {/* Item count badge */}
        <div className="shrink-0 px-4 py-2 border-b border-emt-border">
          <span className="text-sm text-emt-muted">{selectedBag.items.length} פריטים</span>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {selectedBag.items.map((item, i) => (
            <div
              key={i}
              className="bg-slate-800 rounded-xl p-4 flex justify-between items-center border border-emt-border"
            >
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedBag.bg} ${selectedBag.color} border ${selectedBag.border} shrink-0`}>
                {item.qty}
              </span>
              <span className="text-emt-light font-medium text-sm text-right flex-1 mr-3">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-emt-border">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-emt-gray border border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-emt-muted hover:text-emt-light"
          aria-label="חזור"
        >
          <ChevronRight size={20} />
        </button>
        <h2 className="text-emt-light font-bold text-xl">תקנים לתיקי כונן</h2>
        <div className="w-10" />
      </div>

      {/* Bag selection cards */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 justify-center">
        {BAGS.map((bag) => (
          <button
            key={bag.id}
            onClick={() => setSelectedBag(bag)}
            className={`w-full rounded-2xl border ${bag.border} ${bag.bg} p-6
                        flex items-center gap-4 active:scale-[0.98] transition-transform`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${bag.bg} border ${bag.border}`}>
              <Backpack size={28} className={bag.iconColor} />
            </div>
            <div className="flex-1 text-right">
              <p className={`text-xl font-bold ${bag.color}`}>{bag.title}</p>
              <p className="text-sm text-emt-muted mt-0.5">{bag.subtitle}</p>
              <p className="text-xs text-emt-muted mt-1">{bag.items.length} פריטים</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
