import { useState, useEffect } from 'react';
import { ChevronRight, Backpack, CheckCircle2, Circle, XCircle, RotateCcw, Calendar, AlertTriangle } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useTranslation } from '../../../hooks/useTranslation';
import { trackEvent } from '../../../utils/analytics';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BagItem { name: string; qty: string }
interface Bag { id: string; title: string; subtitle: string; color: string; border: string; bg: string; iconColor: string; items: BagItem[] }
interface MDACategory { id: string; title: string; color: string; border: string; bg: string; items: BagItem[] }
interface ItemStatus { status: 'have' | 'missing' | null; expiryDate?: string }
type BagInventory = Record<string, ItemStatus>

// ─── Data ────────────────────────────────────────────────────────────────────

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
      { name: 'אספירין 300מ"ג', qty: '10' },
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

const HATZALAH_CATEGORIES: MDACategory[] = [
  {
    id: 'trauma',
    title: 'חבישה וטראומה',
    color: 'text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/10',
    items: [
      { name: 'חסם עורקים', qty: '1' },
      { name: 'פלסטרים', qty: '10' },
      { name: 'אגד חבישה - גלילים', qty: '5' },
      { name: 'פדי גזה סטרילי 10×10', qty: '20' },
      { name: 'שמיכת מילוט', qty: '1' },
      { name: 'סביעור/אלכוקסידין 100 מ"ל', qty: '1' },
      { name: 'טרנספר - לויקופלסט', qty: '1' },
      { name: 'תחבושת אלסטית', qty: '1' },
      { name: 'תחבושת אישית', qty: '3' },
      { name: 'משולש', qty: '4' },
      { name: 'מלע"כ מקצועי', qty: '1' },
    ],
  },
  {
    id: 'airway',
    title: 'הנשמה וחמצן',
    color: 'text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/10',
    items: [
      { name: 'בלון חמצן 2.4 ליטר', qty: '1' },
      { name: 'ווסת', qty: '1' },
      { name: 'סקשן ידני + 2 מחברים', qty: '1' },
      { name: 'מפוח הנשמה סיליקון מבוגר + מסכה 5', qty: '1' },
      { name: 'מפוח הנשמה סיליקון ילד + מסכה 2', qty: '1' },
      { name: "מסכת הנשמה סיליקון מס' 0", qty: '2' },
      { name: "סט מנתבי אוויר 00-4", qty: '1' },
      { name: 'מסנן ויראלי מבוגר', qty: '1' },
      { name: 'מסנן ויראלי ילד', qty: '1' },
      { name: 'מסיכת חמצן מבוגר + שקית', qty: '3' },
      { name: 'מסיכת חמצן ילד + שקית', qty: '2' },
    ],
  },
  {
    id: 'meds',
    title: 'אבחון, עירוי ותרופות',
    color: 'text-rose-400',
    border: 'border-rose-400/30',
    bg: 'bg-rose-400/10',
    items: [
      { name: 'אספירין 300 מ"ג', qty: '10' },
      { name: "גלוקוג'ל", qty: '2' },
      { name: 'סליין 0.5 ליטר', qty: '1' },
      { name: 'סט שטיפה לעירוי', qty: '1' },
      { name: 'וונפלונים (כחול 2, ירוק 2, ורוד 2)', qty: '6' },
      { name: 'מדל"ד + סטטוסקופ מבוגר', qty: '1' },
      { name: 'מדל"ד + סטטוסקופ ילד', qty: '1' },
      { name: 'קטטר לסקשן אדום 18', qty: '2' },
      { name: 'קטטר לסקשן כחול 8', qty: '2' },
    ],
  },
  {
    id: 'general',
    title: 'כללי',
    color: 'text-violet-400',
    border: 'border-violet-400/30',
    bg: 'bg-violet-400/10',
    items: [
      { name: 'כפפות L', qty: '30' },
      { name: "ספונג'טה לחיטוי", qty: '10' },
      { name: 'מסכת הגנה לפנים', qty: '1' },
      { name: 'חומר לחיטוי ידיים', qty: '1' },
      { name: 'פחי מחטים 0.6 ליטר', qty: '1' },
      { name: 'צווארון מתכוונן מבוגר', qty: '1' },
      { name: 'ערכת לידה', qty: '1' },
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
      { name: 'אספירין 300mg', qty: '10' },
      { name: "גלוקוג'ל", qty: '1' },
      { name: 'פולידין 20 מ"ל', qty: '1' },
      { name: 'מי מלח 0.9%', qty: '1' },
    ],
  },
  {
    id: 'airway',
    title: 'ציוד הנשמה וחמצן',
    color: 'text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/10',
    items: [
      { name: 'שק הנשמה מבוגר (אמבו)', qty: '1' },
      { name: 'שק הנשמה ילד (אמבו)', qty: '1' },
      { name: 'מסכת חמצן מבוגר M', qty: '1' },
      { name: 'מסכת חמצן מבוגר S', qty: '1' },
      { name: 'מסכת חמצן ילד', qty: '1' },
      { name: 'מסכת חמצן פעוט (Toddler)', qty: '1' },
      { name: 'מסכת חמצן תינוק (Infant)', qty: '1' },
      { name: 'מנתב אוויר פלסטי 00', qty: '1' },
      { name: 'מנתב אוויר פלסטי 0', qty: '1' },
      { name: 'מנתב אוויר פלסטי 1', qty: '1' },
      { name: 'מנתב אוויר פלסטי 2', qty: '1' },
      { name: 'מנתב אוויר פלסטי 3', qty: '1' },
      { name: 'מנתב אוויר פלסטי 4', qty: '1' },
      { name: 'סקשן ידני', qty: '1' },
      { name: 'קטטר שאיבה 18', qty: '1' },
      { name: 'קטטר שאיבה 8', qty: '1' },
      { name: 'מיכל חמצן D + וסת', qty: '1' },
    ],
  },
  {
    id: 'diagnostics',
    title: 'אבחון ומדידה',
    color: 'text-violet-400',
    border: 'border-violet-400/30',
    bg: 'bg-violet-400/10',
    items: [
      { name: 'מד ל"ד + סטטוסקופ (מבוגר)', qty: '1' },
      { name: 'מד ל"ד + סטטוסקופ (ילד)', qty: '1' },
      { name: 'גלוקומטר + 5 מחטים + 5 סטיקים', qty: '1' },
    ],
  },
  {
    id: 'trauma',
    title: 'חבישה וטראומה',
    color: 'text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/10',
    items: [
      { name: 'חוסם עורקים גומי', qty: '3' },
      { name: 'תחבושת אישית', qty: '1' },
      { name: 'תחבושת בינונית', qty: '1' },
      { name: 'פד גזה 3x3 סטרילי', qty: '10' },
      { name: 'מספריים', qty: '1' },
      { name: 'תחבושות אלסטיות', qty: '5' },
      { name: 'צווארון צוואר מבוגר', qty: '1' },
      { name: 'צווארון צוואר ילד', qty: '1' },
      { name: 'ערכת מגן אישי (PPE)', qty: '1' },
      { name: 'שמיכה אלומיניום', qty: '1' },
    ],
  },
];

// ─── Utilities ───────────────────────────────────────────────────────────────

function daysUntilExpiry(dateStr: string): number {
  const expiry = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatExpiryLabel(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-');
  const dateFormatted = `${day}/${month}/${year}`;
  if (days < 0) return `פג תוקף! ${dateFormatted}`;
  if (days === 0) return `פג תוקף היום - ${dateFormatted}`;
  if (days === 1) return `פג תוקף מחר - ${dateFormatted}`;
  if (days <= 7) return `פג תוקף בעוד ${days} ימים - ${dateFormatted}`;
  return `תוקף עד ${dateFormatted}`;
}

function loadInventory(key: string): BagInventory {
  const stored = localStorage.getItem(key);
  if (!stored) return {};
  try {
    const parsed = JSON.parse(stored);
    const vals = Object.values(parsed);
    if (vals.length > 0 && typeof vals[0] === 'boolean') {
      const migrated: BagInventory = {};
      for (const [k, v] of Object.entries(parsed)) {
        migrated[k] = { status: v ? 'have' : null };
      }
      return migrated;
    }
    return parsed as BagInventory;
  } catch {
    return {};
  }
}

function saveInventory(key: string, inv: BagInventory) {
  localStorage.setItem(key, JSON.stringify(inv));
}

function cycleStatus(current: 'have' | 'missing' | null): 'have' | 'missing' | null {
  if (current === null) return 'have';
  if (current === 'have') return 'missing';
  return null;
}

function clearStatusOnly(inv: BagInventory): BagInventory {
  const cleared: BagInventory = {};
  for (const [k, v] of Object.entries(inv)) {
    cleared[k] = { status: null, expiryDate: v.expiryDate };
  }
  return cleared;
}

function checkExpiryNotifications() {
  if (!('Notification' in window)) return;
  const today = new Date().toDateString();
  if (localStorage.getItem('bag-expiry-notif-date') === today) return;
  localStorage.setItem('bag-expiry-notif-date', today);

  const keys = [
    'mda-kit-checklist',
    'hatzalah-kit-checklist',
    ...BAGS.map(b => `bag-checklist-${b.id}`),
  ];

  let expired = 0, soon = 0;
  for (const key of keys) {
    for (const { expiryDate } of Object.values(loadInventory(key))) {
      if (!expiryDate) continue;
      const d = daysUntilExpiry(expiryDate);
      if (d < 0) expired++;
      else if (d <= 7) soon++;
    }
  }

  if (expired + soon === 0) return;

  const doNotify = () => {
    const parts: string[] = [];
    if (expired > 0) parts.push(`${expired} פריטים פג תוקפם`);
    if (soon > 0) parts.push(`${soon} פריטים פגים תוקף תוך שבוע`);
    new Notification('⚠️ בדיקת תיק הצלה', { body: parts.join(', ') + '.' });
  };

  if (Notification.permission === 'granted') doNotify();
  else if (Notification.permission === 'default') {
    Notification.requestPermission().then(p => { if (p === 'granted') doNotify(); });
  }
}

// ─── ItemRow ─────────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: BagItem;
  itemKey: string;
  status: ItemStatus;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  onToggle: () => void;
  onExpiryChange: (date: string | undefined) => void;
}

function ItemRow({ item, status, accentColor, accentBg, accentBorder, onToggle, onExpiryChange }: ItemRowProps) {
  const [showDate, setShowDate] = useState(false);
  const days = status.expiryDate != null ? daysUntilExpiry(status.expiryDate) : null;
  const isExpired = days !== null && days < 0;
  const isSoon = days !== null && days >= 0 && days <= 7;
  const hasWarning = isExpired || isSoon;

  return (
    <div className="flex flex-col">
      <div
        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
          status.status === 'have' ? 'bg-emerald-950/20' :
          status.status === 'missing' ? 'bg-red-950/20' : ''
        }`}
        dir="rtl"
      >
        {/* Status icon — tap to cycle null → have → missing → null */}
        <button onClick={onToggle} className="shrink-0 active:scale-90 transition-transform flex flex-col items-center gap-0.5">
          {status.status === 'have'
            ? <CheckCircle2 size={22} className="text-emerald-400" />
            : status.status === 'missing'
            ? <XCircle size={22} className="text-red-400" />
            : <Circle size={22} className="text-gray-300 dark:text-slate-600" />}
        </button>

        <span className={`flex-1 text-sm font-medium ${
          status.status === 'missing' ? 'text-red-400' :
          status.status === 'have' ? 'text-emerald-400' :
          'text-gray-900 dark:text-emt-light'
        }`}>
          {item.name}
        </span>

        {hasWarning && (
          <AlertTriangle size={15} className={`shrink-0 ${isExpired ? 'text-red-400' : 'text-amber-400'}`} />
        )}

        <button
          onClick={() => setShowDate(v => !v)}
          className={`shrink-0 flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg active:scale-90 transition-all ${
            status.expiryDate
              ? isExpired ? 'text-red-400' : isSoon ? 'text-amber-400' : 'text-emerald-400'
              : 'text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800'
          }`}
          aria-label="תאריך תפוגה"
        >
          <Calendar size={14} />
          {!status.expiryDate && <span className="text-[8px] font-medium leading-none">תפוגה</span>}
        </button>

        <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${accentBg} ${accentColor} border ${accentBorder}`}>
          {item.qty}
        </span>
      </div>

      {/* Expiry label (collapsed) */}
      {status.expiryDate && !showDate && (
        <p
          className={`px-14 pb-2 text-xs font-medium ${
            isExpired ? 'text-red-400' : isSoon ? 'text-amber-400' : 'text-gray-500 dark:text-emt-muted'
          }`}
          dir="rtl"
        >
          {formatExpiryLabel(status.expiryDate, days!)}
        </p>
      )}

      {/* Date picker (expanded) */}
      {showDate && (
        <div className="px-4 pb-3 flex items-center gap-2" dir="rtl">
          <input
            type="date"
            value={status.expiryDate ?? ''}
            onChange={e => {
              const val = e.target.value || undefined;
              onExpiryChange(val);
              if (val && 'Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
              }
            }}
            className="flex-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-emt-border rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-emt-light"
          />
          {status.expiryDate && (
            <button
              onClick={() => onExpiryChange(undefined)}
              className="text-red-400 text-xs px-2 py-2 rounded-xl bg-red-950/20 shrink-0"
            >
              מחק
            </button>
          )}
          <button
            onClick={() => setShowDate(false)}
            className="text-gray-500 text-xs px-2 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 shrink-0"
          >
            סגור
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Helper: count expiry warnings in an inventory ────────────────────────────

function countWarnings(inv: BagInventory): { expired: number; soon: number } {
  let expired = 0, soon = 0;
  for (const { expiryDate } of Object.values(inv)) {
    if (!expiryDate) continue;
    const d = daysUntilExpiry(expiryDate);
    if (d < 0) expired++;
    else if (d <= 7) soon++;
  }
  return { expired, soon };
}

// ─── Main component ───────────────────────────────────────────────────────────

type Standard = 'moh' | 'mda' | 'hatzalah';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function BagStandardsModal({ isOpen, onClose }: Props) {
  const t = useTranslation();
  const [selectedBag, setSelectedBag] = useState<Bag | null>(null);
  const [mohInventory, setMohInventory] = useState<BagInventory>({});
  const [mdaInventory, setMdaInventory] = useState<BagInventory>({});
  const [hatzalahInventory, setHatzalahInventory] = useState<BagInventory>({});
  const [activeStandard, setActiveStandard] = useState<Standard>('moh');

  // Check expiry notifications once on mount
  useEffect(() => { checkExpiryNotifications(); }, []);

  // Load MOH bag inventory when a bag is selected
  useEffect(() => {
    if (!selectedBag) return;
    setMohInventory(loadInventory(`bag-checklist-${selectedBag.id}`));
  }, [selectedBag]);

  // Load MDA & Hatzalah inventories on mount
  useEffect(() => {
    setMdaInventory(loadInventory('mda-kit-checklist'));
    setHatzalahInventory(loadInventory('hatzalah-kit-checklist'));
  }, []);

  // ── MOH bag handlers ───────────────────────────────────────────────────────

  const toggleMohItem = (key: string) => {
    setMohInventory(prev => {
      const cur = prev[key] ?? { status: null };
      const next = { ...prev, [key]: { ...cur, status: cycleStatus(cur.status) } };
      saveInventory(`bag-checklist-${selectedBag!.id}`, next);
      return next;
    });
  };

  const setMohExpiry = (key: string, date: string | undefined) => {
    setMohInventory(prev => {
      const cur = prev[key] ?? { status: null };
      const next = { ...prev, [key]: { ...cur, expiryDate: date } };
      saveInventory(`bag-checklist-${selectedBag!.id}`, next);
      return next;
    });
  };

  const clearMohChecklist = () => {
    const cleared = clearStatusOnly(mohInventory);
    saveInventory(`bag-checklist-${selectedBag!.id}`, cleared);
    setMohInventory(cleared);
  };

  // ── MDA handlers ───────────────────────────────────────────────────────────

  const toggleMdaItem = (key: string) => {
    setMdaInventory(prev => {
      const cur = prev[key] ?? { status: null };
      const next = { ...prev, [key]: { ...cur, status: cycleStatus(cur.status) } };
      saveInventory('mda-kit-checklist', next);
      return next;
    });
  };

  const setMdaExpiry = (key: string, date: string | undefined) => {
    setMdaInventory(prev => {
      const cur = prev[key] ?? { status: null };
      const next = { ...prev, [key]: { ...cur, expiryDate: date } };
      saveInventory('mda-kit-checklist', next);
      return next;
    });
  };

  const clearMdaChecklist = () => {
    const cleared = clearStatusOnly(mdaInventory);
    saveInventory('mda-kit-checklist', cleared);
    setMdaInventory(cleared);
  };

  // ── Hatzalah handlers ──────────────────────────────────────────────────────

  const toggleHatzalahItem = (key: string) => {
    setHatzalahInventory(prev => {
      const cur = prev[key] ?? { status: null };
      const next = { ...prev, [key]: { ...cur, status: cycleStatus(cur.status) } };
      saveInventory('hatzalah-kit-checklist', next);
      return next;
    });
  };

  const setHatzalahExpiry = (key: string, date: string | undefined) => {
    setHatzalahInventory(prev => {
      const cur = prev[key] ?? { status: null };
      const next = { ...prev, [key]: { ...cur, expiryDate: date } };
      saveInventory('hatzalah-kit-checklist', next);
      return next;
    });
  };

  const clearHatzalahChecklist = () => {
    const cleared = clearStatusOnly(hatzalahInventory);
    saveInventory('hatzalah-kit-checklist', cleared);
    setHatzalahInventory(cleared);
  };

  useModalBackHandler(isOpen, selectedBag ? () => setSelectedBag(null) : onClose);

  if (!isOpen) return null;

  // ── Selected bag detail view ───────────────────────────────────────────────

  if (selectedBag) {
    const haveCount = selectedBag.items.filter(item => mohInventory[item.name]?.status === 'have').length;
    const missingCount = selectedBag.items.filter(item => mohInventory[item.name]?.status === 'missing').length;

    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-emt-dark">
        <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
          <button
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                       flex items-center justify-center active:scale-90 transition-transform
                       text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
            aria-label={t('back')}
          >
            <ChevronRight size={20} />
          </button>
          <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">{selectedBag.title}</h2>
          <button
            onClick={clearMohChecklist}
            className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm transition-colors active:scale-90"
            aria-label={t('clearMarkings')}
          >
            <RotateCcw size={15} />
            <span>{t('clearMarkings')}</span>
          </button>
        </div>

        {/* Status summary */}
        <div className="shrink-0 px-4 py-2 border-b border-gray-200 dark:border-emt-border flex items-center gap-3" dir="rtl">
          <span className="text-sm text-gray-500 dark:text-emt-muted">{selectedBag.items.length} {t('items')}</span>
          {haveCount > 0 && (
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} /> {haveCount} יש
            </span>
          )}
          {missingCount > 0 && (
            <span className="text-xs font-medium text-red-400 flex items-center gap-1">
              <XCircle size={12} /> {missingCount} אין
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="shrink-0 px-4 py-2 border-b border-gray-100 dark:border-white/5 flex flex-col gap-1.5 text-xs text-gray-400 dark:text-emt-muted" dir="rtl">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-gray-500 dark:text-emt-light/70">לחץ על הסמל לסימון:</span>
            <span className="flex items-center gap-1"><Circle size={11} /> לא סומן</span>
            <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={11} /> יש</span>
            <span className="flex items-center gap-1 text-red-400"><XCircle size={11} /> אין</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={11} className="text-blue-400 shrink-0" />
            <span>לחץ על כפתור <span className="font-semibold">״תפוגה״</span> ליד פריט להוספת תאריך תפוגה</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-gray-100 dark:divide-white/5">
          {selectedBag.items.map((item) => (
            <ItemRow
              key={item.name}
              item={item}
              itemKey={item.name}
              status={mohInventory[item.name] ?? { status: null }}
              accentColor={selectedBag.color}
              accentBg={selectedBag.bg}
              accentBorder={selectedBag.border}
              onToggle={() => toggleMohItem(item.name)}
              onExpiryChange={(date) => setMohExpiry(item.name, date)}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Standard selector tabs ─────────────────────────────────────────────────

  const STANDARDS: { id: Standard; label: string }[] = [
    { id: 'moh', label: 'תקן משרד החינוך' },
    { id: 'mda', label: 'תקן מד״א' },
    { id: 'hatzalah', label: 'תקן איחוד הצלה' },
  ];

  // ── List view ──────────────────────────────────────────────────────────────

  const renderCategoryChecklist = (
    categories: MDACategory[],
    inventory: BagInventory,
    onToggle: (key: string) => void,
    onExpiry: (key: string, date: string | undefined) => void,
  ) => (
    <div className="flex flex-col gap-4" dir="rtl">
      {categories.map((cat) => {
        const haveCount = cat.items.filter((_, i) => inventory[`${cat.id}-${i}`]?.status === 'have').length;
        const catWarnings = cat.items.reduce((acc, _, i) => {
          const inv = inventory[`${cat.id}-${i}`];
          if (!inv?.expiryDate) return acc;
          const d = daysUntilExpiry(inv.expiryDate);
          if (d < 0) acc.expired++;
          else if (d <= 7) acc.soon++;
          return acc;
        }, { expired: 0, soon: 0 });

        return (
          <div key={cat.id} className={`rounded-2xl border ${cat.border} ${cat.bg} overflow-hidden`}>
            <div className={`px-4 py-3 border-b ${cat.border} flex items-center justify-between`} dir="rtl">
              <p className={`font-bold text-sm ${cat.color}`}>{cat.title}</p>
              <div className="flex items-center gap-2">
                {(catWarnings.expired > 0 || catWarnings.soon > 0) && (
                  <AlertTriangle size={14} className={catWarnings.expired > 0 ? 'text-red-400' : 'text-amber-400'} />
                )}
                <span className={`text-xs font-medium ${cat.color} opacity-70`}>
                  {haveCount}/{cat.items.length}
                </span>
              </div>
            </div>
            <div className="flex flex-col divide-y divide-white/5">
              {cat.items.map((item, i) => {
                const key = `${cat.id}-${i}`;
                return (
                  <ItemRow
                    key={i}
                    item={item}
                    itemKey={key}
                    status={inventory[key] ?? { status: null }}
                    accentColor={cat.color}
                    accentBg={cat.bg}
                    accentBorder={cat.border}
                    onToggle={() => onToggle(key)}
                    onExpiryChange={(date) => onExpiry(key, date)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

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
        {activeStandard === 'mda' || activeStandard === 'hatzalah' ? (
          <button
            onClick={activeStandard === 'mda' ? clearMdaChecklist : clearHatzalahChecklist}
            className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm transition-colors active:scale-90"
            aria-label={t('clearMarkings')}
          >
            <RotateCcw size={15} />
            <span>{t('clearMarkings')}</span>
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Tabs */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-100 dark:border-white/10">
        <div className="flex rounded-2xl p-1 gap-1" style={{ background: 'rgba(120,120,128,0.12)' }} dir="rtl">
          {STANDARDS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => { setActiveStandard(id); trackEvent('bag_standards_tab', { standard: id }); }}
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

      {/* Legend for MDA / Hatzalah */}
      {(activeStandard === 'mda' || activeStandard === 'hatzalah') && (
        <div className="shrink-0 px-4 py-2 border-b border-gray-100 dark:border-white/5 flex flex-col gap-1.5 text-xs text-gray-400 dark:text-emt-muted" dir="rtl">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-gray-500 dark:text-emt-light/70">לחץ על הסמל לסימון:</span>
            <span className="flex items-center gap-1"><Circle size={11} /> לא סומן</span>
            <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={11} /> יש</span>
            <span className="flex items-center gap-1 text-red-400"><XCircle size={11} /> אין</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={11} className="text-blue-400 shrink-0" />
            <span>לחץ על כפתור <span className="font-semibold">״תפוגה״</span> ליד פריט להוספת תאריך תפוגה</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeStandard === 'moh' && (
          <div className="flex flex-col gap-3">
            {BAGS.map((bag) => {
              const bagInv = loadInventory(`bag-checklist-${bag.id}`);
              const { expired, soon } = countWarnings(bagInv);
              const hasAnyWarning = expired > 0 || soon > 0;

              return (
                <button
                  key={bag.id}
                  onClick={() => {
                    setSelectedBag(bag);
                    trackEvent('bag_standards_view', { bag_id: bag.id, bag_title: bag.title });
                    window.history.pushState({ bagDetail: true }, '');
                  }}
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
                  {hasAnyWarning && (
                    <AlertTriangle size={18} className={expired > 0 ? 'text-red-400' : 'text-amber-400'} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {activeStandard === 'mda' && renderCategoryChecklist(
          MDA_CATEGORIES, mdaInventory, toggleMdaItem, setMdaExpiry,
        )}

        {activeStandard === 'hatzalah' && renderCategoryChecklist(
          HATZALAH_CATEGORIES, hatzalahInventory, toggleHatzalahItem, setHatzalahExpiry,
        )}
      </div>
    </div>
  );
}
