import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useTranslation } from '../../../hooks/useTranslation';
import HospitalAccordionItem, { type Hospital } from './HospitalAccordionItem';

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
  { name: 'המרכז הרפואי לגליל', city: 'נהריה',      central: '04-910-7107', er: '04-9107766' },
  { name: 'זיו',               city: 'צפת',         central: '04-682-8811', er: '04-682-8838' },
  { name: 'פוריה',             city: 'טבריה',       central: '04-665-2211', er: '04-665-2850' },
  { name: 'העמק',              city: 'עפולה',       central: '04-649-4000', er: '04-649-4166' },
  { name: 'בני ציון',          city: 'חיפה',        central: '04-835-9359', er: '04-835-9210' },
  { name: 'כרמל',              city: 'חיפה',        central: '04-825-0211', er: '04-825-0240' },
  { name: 'מעלה הכרמל',        city: 'טירת הכרמל', central: '-',           er: '-'           },
  { name: 'הלל יפה',           city: 'חדרה',        central: '04-774-4477', er: '04-774-4277' },
  { name: 'מאיר',              city: 'כפר סבא',     central: '09-747-2555', er: '09-747-2322' },
  { name: 'לניאדו',            city: 'נתניה',       central: '09-860-4666', er: '09-8604619' },
  { name: 'שניידר (ילדים)',    city: 'פתח תקווה',   central: '03-925-3726', er: '03-925-3656' },
  { name: 'וולפסון',           city: 'חולון',       central: '03-502-8211', er: '03-5028317' },
  { name: 'מעייני הישועה',     city: 'בני ברק',     central: '03-5771111',  er: '053-7345978' },
];

function SectionLabel({ text, cls }: { text: string; cls: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${cls}`}>
      <span className="font-bold text-sm tracking-wide">{text}</span>
    </div>
  );
}

function filter(list: Hospital[], q: string) {
  if (!q) return list;
  return list.filter(h => h.name.includes(q) || h.city.includes(q));
}

export default function HospitalsModal({ isOpen, onClose }: Props) {
  const t = useTranslation();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useModalBackHandler(isOpen, onClose);
  if (!isOpen) return null;

  const q = search.trim();
  const listA = filter(LEVEL_A, q);
  const listB = filter(LEVEL_B, q);
  const empty = listA.length === 0 && listB.length === 0;

  function toggle(name: string) {
    setOpenKey(prev => (prev === name ? null : name));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-emt-dark" dir="rtl">

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3
                      border-b border-gray-200 dark:border-emt-border bg-gray-100 dark:bg-emt-gray shadow-sm">
        <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">{t('hospitalsTitle')}</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white dark:bg-emt-dark border border-gray-200 dark:border-emt-border
                     flex items-center justify-center active:scale-90 transition-transform
                     text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
          aria-label={t('close')}
        >
          <X size={20} />
        </button>
      </div>

      {/* Sticky search bar */}
      <div className="shrink-0 px-4 pt-3 pb-2 bg-white dark:bg-emt-dark border-b border-gray-200/40 dark:border-emt-border/40">
        <div className="relative flex items-center">
          <Search size={16} className="absolute right-3.5 text-gray-400 dark:text-emt-muted pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); setOpenKey(null); }}
            placeholder={t('searchHospital')}
            autoComplete="off"
            className="w-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl
                       pr-10 pl-8 py-2.5 text-gray-900 dark:text-emt-light placeholder:text-gray-400 dark:placeholder:text-emt-muted text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/40
                       focus:border-blue-500/30 transition-shadow"
            dir="rtl"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setOpenKey(null); }}
              className="absolute left-3 text-gray-400 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light active:scale-90 transition-all"
              aria-label={t('clearSearch')}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {empty && (
          <p className="text-center text-gray-500 dark:text-emt-muted py-12 text-sm">{t('noHospitalsFound')}</p>
        )}

        {listA.length > 0 && (
          <>
            <SectionLabel text="LEVEL A — מרכזי טראומה" cls="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700/40" />
            <div className="space-y-2 mb-4">
              {listA.map(h => (
                <HospitalAccordionItem
                  key={h.name}
                  hospital={h}
                  isLevelA={true}
                  isOpen={openKey === h.name}
                  onToggle={() => toggle(h.name)}
                />
              ))}
            </div>
          </>
        )}

        {listB.length > 0 && (
          <>
            <SectionLabel text="LEVEL B" cls="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700/40" />
            <div className="space-y-2">
              {listB.map(h => (
                <HospitalAccordionItem
                  key={h.name}
                  hospital={h}
                  isLevelA={false}
                  isOpen={openKey === h.name}
                  onToggle={() => toggle(h.name)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
