import { useState, useEffect } from 'react';
import { ChevronRight, Backpack, CheckCircle2, Circle, RotateCcw, Clock } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useTranslation } from '../../../hooks/useTranslation';

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

interface MDACategory {
  id: string;
  title: string;
  color: string;
  border: string;
  bg: string;
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

const MDA_CATEGORIES: MDACategory[] = [
  {
    id: 'meds',
    title: 'תרופות ונוזלים',
    color: 'text-rose-400',
    border: 'border-rose-400/30',
    bg: 'bg-rose-400/10',
    items: [
      { name: 'אספירין', qty: '10' },
      { name: "גלוקוג'ל", qty: '1' },
      { name: 'מי מלח 0.9% (Saline)', qty: '1' },
    ],
  },
  {
    id: 'airway',
    title: 'נתיב אוויר וחמצן',
    color: 'text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/10',
    items: [
      { name: 'ערכת החייאה B.L.S. (מבוגר + ילד)', qty: '1' },
      { name: 'מיכל חמצן D', qty: '1' },
      { name: 'סקשן ידני', qty: '1' },
    ],
  },
  {
    id: 'diagnostics',
    title: 'אבחון',
    color: 'text-violet-400',
    border: 'border-violet-400/30',
    bg: 'bg-violet-400/10',
    items: [
      { name: 'מד ל״ד + סטטוסקופ', qty: '1 כ״א' },
      { name: 'גלוקומטר', qty: '1' },
    ],
  },
  {
    id: 'trauma',
    title: 'טראומה וחבישה',
    color: 'text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/10',
    items: [
      { name: 'חוסם עורקים (גומי)', qty: '3' },
      { name: 'תחבושות שדה', qty: '1 סט' },
      { name: 'מספריים לתחבושות', qty: '1' },
    ],
  },
];

type Standard = 'moh' | 'mda' | 'hatzalah';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function BagStandardsModal({ isOpen, onClose }: Props) {
  const t = useTranslation();
  const [selectedBag, setSelectedBag] = useState<Bag | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [activeStandard, setActiveStandard] = useState<Standard>('moh');

  useEffect(() => {
    if (!selectedBag) return;
    const stored = localStorage.getItem(`bag-checklist-${selectedBag.id}`);
    setCheckedItems(stored ? JSON.parse(stored) : {});
  }, [selectedBag]);

  const clearChecklist = () => {
    setCheckedItems({});
    localStorage.removeItem(`bag-checklist-${selectedBag!.id}`);
  };

  const toggleItem = (key: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(`bag-checklist-${selectedBag!.id}`, JSON.stringify(next));
      return next;
    });
  };

  useModalBackHandler(isOpen, selectedBag ? () => setSelectedBag(null) : onClose);

  if (!isOpen) return null;

  const handleSelectBag = (bag: Bag) => {
    setSelectedBag(bag);
    window.history.pushState({ bagDetail: true }, '');
  };

  const handleBackFromDetail = () => {
    window.history.back();
  };

  if (selectedBag) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-emt-dark">
        {/* Header */}
        <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
          <button
            onClick={handleBackFromDetail}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                       flex items-center justify-center active:scale-90 transition-transform
                       text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
            aria-label={t('back')}
          >
            <ChevronRight size={20} />
          </button>
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">{selectedBag.title}</h2>
          <button
            onClick={clearChecklist}
            className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm transition-colors active:scale-90"
            aria-label={t('clearMarkings')}
          >
            <RotateCcw size={15} />
            <span>{t('clearMarkings')}</span>
          </button>
        </div>

        {/* Item count badge */}
        <div className="shrink-0 px-4 py-2 border-b border-gray-200 dark:border-emt-border">
          <span className="text-sm text-gray-500 dark:text-emt-muted">{selectedBag.items.length} {t('items')}</span>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {selectedBag.items.map((item, i) => {
            const isChecked = !!checkedItems[item.name];
            return (
              <button
                key={i}
                onClick={() => toggleItem(item.name)}
                className={`w-full rounded-xl p-4 flex items-center gap-3 border text-right transition-colors active:scale-[0.98] ${
                  isChecked
                    ? 'bg-emerald-950/30 border-emerald-500/30'
                    : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-emt-border'
                }`}
              >
                {isChecked
                  ? <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                  : <Circle size={20} className="text-gray-300 dark:text-slate-600 shrink-0" />}
                <span className={`flex-1 text-sm font-medium ${isChecked ? 'line-through text-slate-500' : 'text-gray-900 dark:text-emt-light'}`}>
                  {item.name}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${selectedBag.bg} ${selectedBag.color} border ${selectedBag.border}`}>
                  {item.qty}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const STANDARDS: { id: Standard; label: string }[] = [
    { id: 'moh', label: 'תקן משרד הבריאות' },
    { id: 'mda', label: 'תקן מד״א' },
    { id: 'hatzalah', label: 'תקן איחוד הצלה' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
          aria-label={t('back')}
        >
          <ChevronRight size={20} />
        </button>
        <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">{t('bagStandardsTitle')}</h2>
        <div className="w-10" />
      </div>

      {/* Standard selector tabs */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-100 dark:border-white/10">
        <div
          className="flex rounded-2xl p-1 gap-1"
          style={{ background: 'rgba(120,120,128,0.12)' }}
          dir="rtl"
        >
          {STANDARDS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveStandard(id)}
              className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-bold transition-all duration-200 active:scale-95 leading-tight ${
                activeStandard === id
                  ? 'bg-white dark:bg-emt-gray text-gray-900 dark:text-emt-light shadow-sm'
                  : 'text-gray-500 dark:text-emt-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* MOH — bag selection cards */}
        {activeStandard === 'moh' && (
          <div className="flex flex-col gap-3">
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
                  <p className="text-xs text-gray-500 dark:text-emt-muted mt-0.5">{bag.items.length} {t('items')}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* MDA — categorized equipment */}
        {activeStandard === 'mda' && (
          <div className="flex flex-col gap-4" dir="rtl">
            {MDA_CATEGORIES.map((cat) => (
              <div key={cat.id} className={`rounded-2xl border ${cat.border} ${cat.bg} overflow-hidden`}>
                <div className={`px-4 py-3 border-b ${cat.border}`}>
                  <p className={`font-bold text-sm ${cat.color}`}>{cat.title}</p>
                </div>
                <div className="flex flex-col divide-y divide-white/5 dark:divide-white/5">
                  {cat.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 gap-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${cat.bg} ${cat.color} border ${cat.border}`}>
                        {item.qty}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-emt-light text-right flex-1">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hatzalah — coming soon */}
        {activeStandard === 'hatzalah' && (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4 text-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(120,120,128,0.12)' }}
            >
              <Clock size={36} className="text-gray-400 dark:text-emt-muted" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-lg font-bold text-gray-900 dark:text-emt-light" dir="rtl">בקרוב</p>
              <p className="text-sm text-gray-500 dark:text-emt-muted" dir="rtl">תקן איחוד הצלה יתווסף בקרוב</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
