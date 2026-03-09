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
      { name: 'מיקרופור', qty: '2' },
      { name: 'פלסטר', qty: '200' },
      { name: 'מלע״כ (מספריים)', qty: '1' },
      { name: 'פד גזה סטרילי', qty: '20' },
      { name: 'סד קשיח', qty: '1' },
      { name: 'סביעור / חיטוי', qty: '2' },
      { name: 'מסכת כיס להנשמה', qty: '1' },
      { name: 'תחבושת לכוויות (ברנשילד)', qty: '3' },
      { name: 'שמיכה היפותרמית', qty: '2' },
      { name: 'כפפות ח״פ (זוגות)', qty: '20' },
      { name: 'פנס ראש', qty: '1' },
      { name: 'תחבושות אלסטיות', qty: '5' },
      { name: 'מזרק אפיפן (במקרה אלרגיה)', qty: '1' },
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
      { name: 'מיקרופור', qty: '3' },
      { name: 'פלסטר', qty: '200' },
      { name: 'מלע״כ', qty: '1' },
      { name: 'פד גזה', qty: '20' },
      { name: 'סד קשיח', qty: '1' },
      { name: 'חיטוי עור', qty: '1' },
      { name: 'תחבושת לכוויות', qty: '3' },
      { name: 'אשרמן', qty: '1' },
      { name: 'שמיכה היפותרמית', qty: '1' },
      { name: 'מנתב אוויר 3,4,5', qty: '1 כ״א' },
      { name: 'כפפות', qty: '20' },
      { name: 'צווארון מתכוונן', qty: '1' },
      { name: 'מד ל״ד + סטטוסקופ', qty: '1 כ״א' },
      { name: 'מד סטורציה', qty: '1' },
      { name: 'ערכת עירוי NaCl 0.9%', qty: '4' },
      { name: 'מסכת כיס', qty: '1' },
      { name: 'קטטר סקשן', qty: '2' },
      { name: 'סקשן', qty: '1' },
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
      { name: 'ערכת אינטובציה קומפלט + LMA', qty: '1' },
      { name: 'מזרק תוך גרמי (BIG) ילד+מבוגר', qty: '2' },
      { name: 'אשרמן', qty: '1' },
      { name: 'מחט וויגון לניקוז חזה + סקלפל', qty: '2' },
      { name: 'מד ל״ד, סטטוסקופ, סטורציה, מד חום', qty: '1 כ״א' },
      { name: 'גלוקומטר + סטיקים', qty: '1' },
      { name: 'צווארון מתכוונן + סד קשיח', qty: '1 כ״א' },
      { name: 'מיכל חמצן נייד + וסת + מסכות', qty: '1' },
      { name: 'אדרנלין 1mg', qty: '5' },
      { name: 'אטרופין 1mg', qty: '4' },
      { name: 'פרוקור 150mg', qty: '2' },
      { name: 'דורמיקום 5mg', qty: '5' },
      { name: 'סוכר מרוכז Dextrose 50%', qty: '1' },
      { name: 'איזוקט ספריי', qty: '1' },
      { name: 'אספירין 300mg', qty: '10' },
      { name: 'ונטולין + אירוונט', qty: '1 כ״א' },
      { name: 'אקמול + אופטלגין', qty: '20 כ״א' },
    ],
  },
  {
    id: 'doctor_camp',
    title: 'תיק רופא חניון',
    subtitle: 'רופא חניון',
    color: 'text-purple-400',
    border: 'border-purple-400/30',
    bg: 'bg-purple-400/10',
    iconColor: 'text-purple-400',
    items: [
      { name: 'ציוד החייאה וטראומה מלא (זהה לפראמדיק)', qty: '1' },
      { name: 'Lidocaine 2%', qty: '1' },
      { name: 'Diazapam (Assival) 1mg/5mg', qty: '2' },
      { name: 'Furosemide 40mg', qty: '4' },
      { name: 'Prednisone 20mg', qty: '8' },
      { name: 'Diclofenac (Voltaren) 25mg', qty: '20' },
      { name: 'Pramin 10mg', qty: '10' },
      { name: 'Amoxicillin 250mg', qty: '20' },
      { name: 'Cephalexin 250mg', qty: '6' },
      { name: 'Penicillin 250mg', qty: '20' },
      { name: 'Fenistil Drops', qty: '1' },
      { name: 'Synthomycine 5%', qty: '1' },
      { name: 'Zofran 4mg', qty: '20' },
    ],
  },
  {
    id: 'doctor_walk',
    title: 'תיק רופא הליכה',
    subtitle: 'רופא הליכה',
    color: 'text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/10',
    iconColor: 'text-amber-400',
    items: [
      { name: 'ציוד טראומה בסיסי (כמו חובש)', qty: '1 סט' },
      { name: 'מפוח הנשמה + מסכות', qty: '1' },
      { name: 'ערכת עירוי NaCl 0.9% 500cc', qty: '2' },
      { name: 'אדרנלין 1mg', qty: '3' },
      { name: 'אטרופין 1mg', qty: '2' },
      { name: 'Diazepam (Assival) 10mg', qty: '2' },
      { name: 'Furosemide 40mg', qty: '2' },
      { name: 'Prednisone 20mg', qty: '4' },
      { name: 'Diclofenac (Voltaren) 25mg', qty: '10' },
      { name: 'Lidocaine 2%', qty: '1' },
      { name: 'Amoxicillin 250mg', qty: '10' },
      { name: 'Pramin 10mg', qty: '5' },
      { name: 'Zofran 4mg', qty: '10' },
      { name: 'אספירין 300mg', qty: '5' },
      { name: 'מזרקים + מחטים', qty: 'מגוון' },
      { name: 'כפפות חד-פעמיות (זוגות)', qty: '10' },
      { name: 'גלוקומטר + סטיקים', qty: '1' },
      { name: 'מד ל״ד + סטטוסקופ', qty: '1 כ״א' },
    ],
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function BagStandardsModal({ isOpen, onClose }: Props) {
  const [selectedBag, setSelectedBag] = useState<Bag | null>(null);

  // When a bag detail is open, hardware back clears the selection;
  // otherwise it closes the entire modal.
  useModalBackHandler(isOpen, selectedBag ? () => setSelectedBag(null) : onClose);

  if (!isOpen) return null;

  const handleSelectBag = (bag: Bag) => {
    setSelectedBag(bag);
    // Push an extra history entry so hardware back navigates to list, not out of modal
    window.history.pushState({ bagDetail: true }, '');
  };

  const handleBackFromDetail = () => {
    // Pop the bagDetail history entry → triggers popstate → setSelectedBag(null)
    window.history.back();
  };

  if (selectedBag) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-emt-dark">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-emt-border">
          <button
            onClick={handleBackFromDetail}
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
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {BAGS.map((bag) => (
          <button
            key={bag.id}
            onClick={() => handleSelectBag(bag)}
            className={`w-full rounded-2xl border ${bag.border} ${bag.bg} p-5
                        flex items-center gap-4 active:scale-[0.98] transition-transform`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bag.bg} border ${bag.border}`}>
              <Backpack size={24} className={bag.iconColor} />
            </div>
            <div className="flex-1 text-right">
              <p className={`text-lg font-bold ${bag.color}`}>{bag.title}</p>
              <p className="text-xs text-emt-muted mt-0.5">{bag.items.length} פריטים</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
