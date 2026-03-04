import { X } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Hospital {
  name: string;
  city: string;
  central: string;
  er: string;
}

const LEVEL_A: Hospital[] = [
  { name: 'רמב"ם', city: 'חיפה', central: '04-777-2222', er: '04-777-1300' },
  { name: 'בלינסון', city: 'פתח תקווה', central: '03-937-7377', er: '03-937-7021' },
  { name: 'איכילוב', city: 'תל אביב', central: '03-697-4444', er: '03-697-3232' },
  { name: 'תל השומר שיבא', city: 'רמת גן', central: '03-530-3030', er: '03-530-3101' },
  { name: 'הדסה עין כרם', city: 'ירושלים', central: '02-677-7111', er: '02-677-7222' },
  { name: 'שערי צדק', city: 'ירושלים', central: '02-655-5111', er: '02-655-5509' },
  { name: 'סורוקה', city: 'באר שבע', central: '08-640-0111', er: '08-640-0888' },
];

const LEVEL_B: Hospital[] = [
  { name: 'המרכז הרפואי לגליל', city: 'נהריה', central: '04-910-7107', er: '04-910-7766' },
  { name: 'זיו', city: 'צפת', central: '04-682-8811', er: '04-682-8838' },
  { name: 'פוריה', city: 'טבריה', central: '04-665-2211', er: '04-665-2850' },
  { name: 'העמק', city: 'עפולה', central: '04-649-4000', er: '04-649-4166' },
  { name: 'בני ציון', city: 'חיפה', central: '04-835-9359', er: '04-835-9210' },
  { name: 'כרמל', city: 'טירת הכרמל', central: '04-825-0211', er: '04-825-0240' },
  { name: 'הלל יפה', city: 'חדרה', central: '04-774-4477', er: '04-774-4277' },
  { name: 'מאיר', city: 'כפר סבא', central: '09-747-2555', er: '09-747-2322' },
  { name: 'לניאדו', city: 'נתניה', central: '09-860-4666', er: '09-860-4624' },
  { name: 'שניידר (ילדים)', city: 'תל אביב', central: '03-925-3726', er: '03-925-3656' },
  { name: 'וולפסון', city: 'חולון', central: '03-502-8211', er: '03-502-8888' },
];

function PhoneLink({ number }: { number: string }) {
  const digits = number.replace(/\D/g, '');
  return (
    <a
      href={`tel:${digits}`}
      className="text-blue-500 dark:text-blue-400 font-medium hover:underline active:opacity-70"
      dir="ltr"
    >
      {number}
    </a>
  );
}

function HospitalTable({ hospitals, level, color }: { hospitals: Hospital[]; level: string; color: string }) {
  return (
    <div className="mb-6">
      <div className={`flex items-center gap-2 mb-2 px-1`}>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${color}`}>{level}</span>
        <span className="text-gray-500 dark:text-emt-muted text-xs">רמת טראומה</span>
      </div>
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-emt-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" dir="rtl">
            <thead>
              <tr className="bg-gray-100 dark:bg-emt-gray text-gray-700 dark:text-emt-light text-xs uppercase tracking-wide">
                <th className="text-right px-3 py-2.5 border-b border-gray-200 dark:border-emt-border font-semibold">בית חולים</th>
                <th className="text-right px-3 py-2.5 border-b border-gray-200 dark:border-emt-border font-semibold">מיקום</th>
                <th className="text-right px-3 py-2.5 border-b border-gray-200 dark:border-emt-border font-semibold">מרכזיה</th>
                <th className="text-right px-3 py-2.5 border-b border-gray-200 dark:border-emt-border font-semibold">טלפון מיון</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h, i) => (
                <tr
                  key={h.name}
                  className={
                    i % 2 === 0
                      ? 'bg-white dark:bg-emt-dark'
                      : 'bg-gray-50 dark:bg-emt-gray/40'
                  }
                >
                  <td className="px-3 py-2.5 border-b border-gray-100 dark:border-emt-border/50 font-medium text-gray-900 dark:text-emt-light whitespace-nowrap">
                    {h.name}
                  </td>
                  <td className="px-3 py-2.5 border-b border-gray-100 dark:border-emt-border/50 text-gray-600 dark:text-emt-muted whitespace-nowrap">
                    {h.city}
                  </td>
                  <td className="px-3 py-2.5 border-b border-gray-100 dark:border-emt-border/50 whitespace-nowrap">
                    <PhoneLink number={h.central} />
                  </td>
                  <td className="px-3 py-2.5 border-b border-gray-100 dark:border-emt-border/50 whitespace-nowrap">
                    <PhoneLink number={h.er} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function HospitalsModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-emt-dark" dir="rtl">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray shadow-sm">
        <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">
          בתי חולים בפריסה ארצית
        </h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-dark border border-gray-200 dark:border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
          aria-label="סגור"
        >
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <HospitalTable
          hospitals={LEVEL_A}
          level="LEVEL A"
          color="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
        />
        <HospitalTable
          hospitals={LEVEL_B}
          level="LEVEL B"
          color="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300"
        />

      </div>
    </div>
  );
}
