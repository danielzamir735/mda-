import { X, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

interface Hospital {
  name: string;
  city: string;
  phone: string;
}

const LEVEL_A: Hospital[] = [
  { name: 'הדסה עין כרם', city: 'ירושלים', phone: '02-6777111' },
  { name: 'שיבא תל השומר', city: 'רמת גן', phone: '03-5302222' },
  { name: 'איכילוב (סוראסקי)', city: 'תל אביב', phone: '03-6974444' },
  { name: 'רמב"ם', city: 'חיפה', phone: '04-7772222' },
  { name: 'סורוקה', city: 'באר שבע', phone: '08-6400111' },
];

const LEVEL_B: Hospital[] = [
  { name: 'ברזילי', city: 'אשקלון', phone: '08-6745000' },
  { name: 'קפלן', city: 'רחובות', phone: '08-9441000' },
  { name: 'וולפסון', city: 'חולון', phone: '03-5028211' },
  { name: 'מאיר', city: 'כפר סבא', phone: '09-7472211' },
  { name: 'הלל יפה', city: 'חדרה', phone: '04-6304304' },
  { name: 'העמק', city: 'עפולה', phone: '04-6495000' },
  { name: 'פוריה', city: 'טבריה', phone: '04-6652211' },
  { name: 'זיו', city: 'צפת', phone: '04-6828000' },
  { name: 'יוספטל', city: 'אילת', phone: '08-6358011' },
  { name: 'כרמל', city: 'חיפה', phone: '04-8250211' },
  { name: 'שמיר (אסף הרופא)', city: 'צריפין', phone: '08-9779000' },
  { name: 'הדסה הר הצופים', city: 'ירושלים', phone: '02-5844111' },
];

interface SectionProps {
  title: string;
  badge: string;
  badgeColor: string;
  hospitals: Hospital[];
}

function HospitalSection({ title, badge, badgeColor, hospitals }: SectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-emt-border overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3
                   bg-gray-100 dark:bg-emt-gray active:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
            {badge}
          </span>
          <span className="text-gray-900 dark:text-emt-light font-bold text-base">{title}</span>
          <span className="text-xs text-gray-400 dark:text-emt-muted">({hospitals.length})</span>
        </div>
        {open ? (
          <ChevronUp size={18} className="text-gray-400 dark:text-emt-muted" />
        ) : (
          <ChevronDown size={18} className="text-gray-400 dark:text-emt-muted" />
        )}
      </button>

      {/* Hospital list */}
      {open && (
        <div className="divide-y divide-gray-100 dark:divide-emt-border">
          {hospitals.map((h) => (
            <div
              key={h.phone}
              className="flex items-center justify-between px-4 py-3
                         bg-white dark:bg-emt-dark"
            >
              <div className="flex flex-col text-right">
                <span className="text-gray-900 dark:text-emt-light font-semibold text-sm">
                  {h.name}
                </span>
                <span className="text-gray-400 dark:text-emt-muted text-xs">{h.city}</span>
              </div>
              <a
                href={`tel:${h.phone.replace(/-/g, '')}`}
                className="flex items-center gap-1.5 bg-emt-green/10 border border-emt-green/30
                           text-emt-green font-bold text-sm px-3 py-2 rounded-xl
                           active:scale-95 transition-transform"
              >
                <Phone size={15} />
                {h.phone}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function HospitalsModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-emt-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">בתי חולים</h2>
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <HospitalSection
          title="מרכזי טראומה"
          badge="LEVEL A"
          badgeColor="bg-emt-red/10 text-emt-red"
          hospitals={LEVEL_A}
        />
        <HospitalSection
          title="בתי חולים אזוריים"
          badge="LEVEL B"
          badgeColor="bg-blue-500/10 text-blue-500"
          hospitals={LEVEL_B}
        />
      </div>
    </div>
  );
}
