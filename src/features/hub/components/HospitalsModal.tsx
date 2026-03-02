import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { LEVEL_A, LEVEL_B, type Hospital } from '../data/hospitalsData';

function PhoneBtn({ label, number, primary }: { label: string; number: string; primary?: boolean }) {
  const base = 'flex flex-col items-center px-2.5 py-1.5 rounded-xl active:scale-95 transition-transform text-center min-w-[88px]';
  const style = primary
    ? 'bg-emt-green/10 border border-emt-green/30 text-emt-green'
    : 'bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border text-gray-500 dark:text-emt-muted';
  return (
    <a href={`tel:${number.replace(/-/g, '')}`} className={`${base} ${style}`}>
      <span className="text-[10px] font-medium leading-none mb-0.5">{label}</span>
      <span className="text-xs font-bold leading-tight">{number}</span>
    </a>
  );
}

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
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3
                   bg-gray-100 dark:bg-emt-gray active:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
          <span className="text-gray-900 dark:text-emt-light font-bold text-base">{title}</span>
          <span className="text-xs text-gray-400 dark:text-emt-muted">({hospitals.length})</span>
        </div>
        {open
          ? <ChevronUp size={18} className="text-gray-400 dark:text-emt-muted" />
          : <ChevronDown size={18} className="text-gray-400 dark:text-emt-muted" />}
      </button>

      {open && (
        <div className="divide-y divide-gray-100 dark:divide-emt-border">
          {hospitals.map((h) => (
            <div
              key={h.name}
              className="flex items-center justify-between px-4 py-3 bg-white dark:bg-emt-dark"
            >
              <div className="flex gap-1.5">
                {h.er !== h.switchboard ? (
                  <>
                    <PhoneBtn label="מרכזיה" number={h.switchboard} />
                    <PhoneBtn label="מיון" number={h.er} primary />
                  </>
                ) : (
                  <PhoneBtn label="טלפון" number={h.er} primary />
                )}
              </div>
              <div className="flex flex-col text-right">
                <span className="text-gray-900 dark:text-emt-light font-semibold text-sm">{h.name}</span>
                <span className="text-gray-400 dark:text-emt-muted text-xs">{h.city}</span>
              </div>
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
