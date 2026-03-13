import { useState } from 'react';
import { X } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import HospitalAccordionItem from './HospitalAccordionItem';
import NavChoiceModal, { type Hospital } from './NavChoiceModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const LEVEL_A: Hospital[] = [
  { name: 'רמב"ם',           city: 'חיפה',        central: '04-777-2222', er: '04-777-1300' },
  { name: 'בלינסון',          city: 'פתח תקווה',   central: '03-937-7377', er: '03-937-7021' },
  { name: 'איכילוב',          city: 'תל אביב',     central: '03-697-4444', er: '03-697-3232' },
  { name: 'תל השומר שיבא',    city: 'רמת גן',      central: '03-530-3030', er: '03-530-3101' },
  { name: 'הדסה עין כרם',     city: 'ירושלים',     central: '02-677-7111', er: '02-677-7222' },
  { name: 'שערי צדק',         city: 'ירושלים',     central: '02-655-5111', er: '02-655-5509' },
  { name: 'סורוקה',           city: 'באר שבע',     central: '08-640-0111', er: '08-640-0888' },
];

const LEVEL_B: Hospital[] = [
  { name: 'המרכז הרפואי לגליל', city: 'נהריה',      central: '04-910-7107', er: '04-910-7766' },
  { name: 'זיו',               city: 'צפת',         central: '04-682-8811', er: '04-682-8838' },
  { name: 'פוריה',             city: 'טבריה',       central: '04-665-2211', er: '04-665-2850' },
  { name: 'העמק',              city: 'עפולה',       central: '04-649-4000', er: '04-649-4166' },
  { name: 'בני ציון',          city: 'חיפה',        central: '04-835-9359', er: '04-835-9210' },
  { name: 'כרמל',              city: 'חיפה',        central: '04-825-0211', er: '04-825-0240' },
  { name: 'מעלה הכרמל',        city: 'טירת הכרמל', central: '-',           er: '-'           },
  { name: 'הלל יפה',           city: 'חדרה',        central: '04-774-4477', er: '04-774-4277' },
  { name: 'מאיר',              city: 'כפר סבא',     central: '09-747-2555', er: '09-747-2322' },
  { name: 'לניאדו',            city: 'נתניה',       central: '09-860-4666', er: '09-860-4624' },
  { name: 'שניידר (ילדים)',    city: 'פתח תקווה',   central: '03-925-3726', er: '03-925-3656' },
  { name: 'וולפסון',           city: 'חולון',       central: '03-502-8211', er: '03-502-8888' },
  { name: 'מעייני הישועה',     city: 'בני ברק',     central: '03-615-1515', er: '03-615-1511' },
];

function SectionLabel({ text, cls }: { text: string; cls: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${cls}`}>
      <span className="font-bold text-sm tracking-wide">{text}</span>
    </div>
  );
}

export default function HospitalsModal({ isOpen, onClose }: Props) {
  const [navHospital, setNavHospital] = useState<Hospital | null>(null);
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-emt-dark" dir="rtl">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3
                      border-b border-emt-border bg-emt-gray shadow-sm">
        <h2 className="text-emt-light font-bold text-xl">בתי חולים בפריסה ארצית</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-emt-dark border border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-emt-muted hover:text-emt-light"
          aria-label="סגור"
        >
          <X size={20} />
        </button>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <SectionLabel
          text="LEVEL A — מרכזי טראומה"
          cls="bg-red-900/30 text-red-300 border-red-700/40"
        />
        <div className="space-y-2 mb-4">
          {LEVEL_A.map(h => (
            <HospitalAccordionItem
              key={h.name}
              hospital={h}
              isLevelA={true}
              onNavigate={setNavHospital}
            />
          ))}
        </div>

        <SectionLabel
          text="LEVEL B"
          cls="bg-yellow-900/30 text-yellow-300 border-yellow-700/40"
        />
        <div className="space-y-2">
          {LEVEL_B.map(h => (
            <HospitalAccordionItem
              key={h.name}
              hospital={h}
              isLevelA={false}
              onNavigate={setNavHospital}
            />
          ))}
        </div>
      </div>

      <NavChoiceModal hospital={navHospital} onClose={() => setNavHospital(null)} />
    </div>
  );
}
