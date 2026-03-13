import { useState } from 'react';
import { ChevronDown, Phone, PhoneCall, Navigation } from 'lucide-react';
import type { Hospital } from './NavChoiceModal';

interface Props {
  hospital: Hospital;
  isLevelA: boolean;
  onNavigate: (h: Hospital) => void;
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
                 bg-emt-dark border border-emt-border
                 active:scale-95 transition-transform"
    >
      <span className="text-blue-400 shrink-0">{icon}</span>
      <div className="flex flex-col flex-1 text-right">
        <span className="text-emt-muted text-xs leading-none mb-0.5">{label}</span>
        <span className="text-emt-light font-semibold text-base leading-none" dir="ltr">
          {number}
        </span>
      </div>
    </a>
  );
}

export default function HospitalAccordionItem({ hospital, isLevelA, onNavigate }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-xl border overflow-hidden
        ${isLevelA
          ? 'border-red-700/40 bg-red-950/20'
          : 'border-emt-border bg-emt-gray'
        }`}
    >
      {/* Collapsed row — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5
                   active:bg-white/5 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          {isLevelA && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full
                         bg-red-900/60 text-red-300 border border-red-700/50 shrink-0"
            >
              A
            </span>
          )}
          <div className="text-right">
            <div className="text-emt-light font-bold text-base leading-tight">
              {hospital.name}
            </div>
            <div className="text-emt-muted text-xs mt-0.5">{hospital.city}</div>
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`text-emt-muted transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-3 pb-3 pt-1 flex flex-col gap-2 border-t border-emt-border/60">
          <PhoneRow number={hospital.central} label="מרכזיה" icon={<Phone size={20} />} />
          <PhoneRow number={hospital.er} label="מיון" icon={<PhoneCall size={20} />} />
          <button
            onClick={() => onNavigate(hospital)}
            className="flex items-center gap-3 w-full rounded-xl px-4 py-3.5
                       bg-blue-600/15 border border-blue-500/40
                       active:scale-95 transition-transform"
          >
            <Navigation size={20} className="text-blue-400 shrink-0" />
            <span className="text-blue-300 font-semibold">ניווט למיון</span>
          </button>
        </div>
      )}
    </div>
  );
}
