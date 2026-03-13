import { ChevronDown, Phone, PhoneCall, Navigation } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';

export interface Hospital {
  name: string;
  city: string;
  central: string;
  er: string;
}

interface Props {
  hospital: Hospital;
  isLevelA: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

function PhoneRow({
  number,
  label,
  icon,
}: {
  number: string;
  label: string;
  icon: React.ReactNode;
}) {
  if (number === '-') return null;
  const digits = number.replace(/\D/g, '');
  return (
    <a
      href={`tel:${digits}`}
      className="flex items-center gap-3 w-full rounded-xl px-4 py-3.5
                 bg-gray-50 dark:bg-emt-dark border border-gray-200 dark:border-emt-border
                 active:scale-95 transition-transform"
    >
      <span className="text-blue-400 shrink-0">{icon}</span>
      <div className="flex flex-col flex-1 text-right">
        <span className="text-gray-500 dark:text-emt-muted text-xs leading-none mb-0.5">{label}</span>
        <span className="text-gray-900 dark:text-emt-light font-semibold text-base leading-none" dir="ltr">
          {number}
        </span>
      </div>
    </a>
  );
}

export default function HospitalAccordionItem({ hospital, isLevelA, isOpen, onToggle }: Props) {
  const t = useTranslation();
  const mapsUrl = 'geo:0,0?q=' + encodeURIComponent('מיון ' + hospital.name + ' ' + hospital.city);

  return (
    <div
      className="rounded-xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray overflow-hidden"
    >
      {/* Header row — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5
                   active:bg-white/5 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          {isLevelA && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0
                         bg-transparent text-red-600 dark:text-red-400 border border-red-600/60 dark:border-red-500/60"
            >
              A
            </span>
          )}
          <div className="text-right">
            <div className="text-gray-900 dark:text-emt-light font-bold text-base leading-tight">{hospital.name}</div>
            <div className="text-gray-500 dark:text-emt-muted text-xs mt-0.5">{hospital.city}</div>
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`text-gray-400 dark:text-emt-muted transition-transform duration-200 shrink-0
                      ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded actions */}
      {isOpen && (
        <div className="px-3 pb-3 pt-1 flex flex-col gap-2 border-t border-gray-200/60 dark:border-emt-border/60">
          <PhoneRow number={hospital.central} label={t('hospitalCentral')} icon={<Phone size={20} />} />
          <PhoneRow number={hospital.er} label={t('hospitalER')} icon={<PhoneCall size={20} />} />
          <a
            href={mapsUrl}
            className="flex items-center gap-3 w-full rounded-xl px-4 py-3.5
                       bg-blue-600/15 border border-blue-500/40
                       active:scale-95 transition-transform"
          >
            <Navigation size={20} className="text-blue-400 shrink-0" />
            <span className="text-blue-300 font-semibold">{t('navigateToER')}</span>
          </a>
        </div>
      )}
    </div>
  );
}
