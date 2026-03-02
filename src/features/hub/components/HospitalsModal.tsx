import { X } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { LEVEL_A, LEVEL_B, type Hospital } from '../data/hospitalsData';

function PhoneLink({ number }: { number: string }) {
  return (
    <a
      href={`tel:${number.replace(/-/g, '')}`}
      className="text-blue-500 font-medium hover:underline active:opacity-70"
    >
      {number}
    </a>
  );
}

function HospitalTable({
  title,
  badge,
  badgeColor,
  hospitals,
}: {
  title: string;
  badge: string;
  badgeColor: string;
  hospitals: Hospital[];
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-emt-border overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-emt-gray border-b border-gray-200 dark:border-emt-border">
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${badgeColor}`}>{badge}</span>
        <span className="text-gray-900 dark:text-emt-light font-bold text-base">{title}</span>
        <span className="text-xs text-gray-400 dark:text-emt-muted">({hospitals.length})</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-emt-gray/60">
              <th className="px-3 py-2.5 font-bold text-gray-700 dark:text-emt-light border-b border-gray-200 dark:border-emt-border">בית חולים</th>
              <th className="px-3 py-2.5 font-bold text-gray-700 dark:text-emt-light border-b border-gray-200 dark:border-emt-border">עיר</th>
              <th className="px-3 py-2.5 font-bold text-gray-700 dark:text-emt-light border-b border-gray-200 dark:border-emt-border">מרכזיה</th>
              <th className="px-3 py-2.5 font-bold text-gray-700 dark:text-emt-light border-b border-gray-200 dark:border-emt-border">מיון</th>
            </tr>
          </thead>
          <tbody>
            {hospitals.map((h, i) => (
              <tr
                key={h.name}
                className={
                  i % 2 === 0
                    ? 'bg-white dark:bg-emt-dark'
                    : 'bg-gray-50 dark:bg-emt-gray/30'
                }
              >
                <td className="px-3 py-2.5 font-semibold text-gray-900 dark:text-emt-light border-b border-gray-100 dark:border-emt-border">{h.name}</td>
                <td className="px-3 py-2.5 text-gray-500 dark:text-emt-muted border-b border-gray-100 dark:border-emt-border">{h.city}</td>
                <td className="px-3 py-2.5 border-b border-gray-100 dark:border-emt-border"><PhoneLink number={h.switchboard} /></td>
                <td className="px-3 py-2.5 border-b border-gray-100 dark:border-emt-border"><PhoneLink number={h.er} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <HospitalTable
          title="מרכזי טראומה"
          badge="LEVEL A"
          badgeColor="bg-emt-red/10 text-emt-red"
          hospitals={LEVEL_A}
        />
        <HospitalTable
          title="בתי חולים אזוריים"
          badge="LEVEL B"
          badgeColor="bg-blue-500/10 text-blue-500"
          hospitals={LEVEL_B}
        />
      </div>
    </div>
  );
}
