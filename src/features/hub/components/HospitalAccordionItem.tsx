import { useState } from 'react';
import { ChevronDown, Phone, PhoneCall, Navigation, X } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';

export interface Hospital {
  name: string;
  city: string;
  central: string;
  er: string;
  hasSeparateERs?: boolean;
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

function erUrl(prefix: string, name: string, city: string) {
  return 'geo:0,0?q=' + encodeURIComponent(prefix + ' ' + name + ' ' + city);
}

export default function HospitalAccordionItem({ hospital, isLevelA, isOpen, onToggle }: Props) {
  const t = useTranslation();
  const [showERChoice, setShowERChoice] = useState(false);

  // Reset sub-menu when accordion closes
  function handleToggle() {
    if (isOpen) setShowERChoice(false);
    onToggle();
  }

  return (
    <div
      className="rounded-xl border border-gray-200 dark:border-emt-border bg-white dark:bg-emt-gray overflow-hidden"
    >
      {/* Header row — always visible */}
      <button
        onClick={handleToggle}
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

          {hospital.hasSeparateERs ? (
            showERChoice ? (
              /* Sub-menu: 3 ER type buttons */
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1 pb-0.5">
                  <span className="text-gray-500 dark:text-emt-muted text-xs">בחר/י סוג מיון לניווט</span>
                  <button
                    onClick={() => setShowERChoice(false)}
                    className="text-gray-400 dark:text-emt-muted hover:text-gray-700 dark:hover:text-emt-light
                               active:scale-90 transition-all p-1 -m-1"
                    aria-label="סגור"
                  >
                    <X size={16} />
                  </button>
                </div>

                <a
                  href={erUrl('מיון', hospital.name, hospital.city)}
                  className="flex items-center gap-3 w-full rounded-xl px-4 py-4
                             bg-blue-600 dark:bg-blue-600 border border-blue-500
                             active:scale-95 transition-transform"
                >
                  <Navigation size={20} className="text-white shrink-0" />
                  <span className="text-white font-bold text-base">מיון כללי</span>
                </a>

                <a
                  href={erUrl('מיון ילדים', hospital.name, hospital.city)}
                  className="flex items-center gap-3 w-full rounded-xl px-4 py-4
                             bg-emerald-600 dark:bg-emerald-600 border border-emerald-500
                             active:scale-95 transition-transform"
                >
                  <Navigation size={20} className="text-white shrink-0" />
                  <span className="text-white font-bold text-base">מיון ילדים</span>
                </a>

                <a
                  href={erUrl('מיון יולדות', hospital.name, hospital.city)}
                  className="flex items-center gap-3 w-full rounded-xl px-4 py-4
                             bg-purple-600 dark:bg-purple-600 border border-purple-500
                             active:scale-95 transition-transform"
                >
                  <Navigation size={20} className="text-white shrink-0" />
                  <span className="text-white font-bold text-base">מיון יולדות</span>
                </a>
              </div>
            ) : (
              /* Trigger button — shows sub-menu */
              <button
                onClick={() => setShowERChoice(true)}
                className="flex items-center gap-3 w-full rounded-xl px-4 py-3.5
                           bg-blue-600/15 border border-blue-500/40
                           active:scale-95 transition-transform"
              >
                <Navigation size={20} className="text-blue-400 shrink-0" />
                <span className="text-blue-300 font-semibold">{t('navigateToER')}</span>
              </button>
            )
          ) : (
            /* Single direct nav link */
            <a
              href={erUrl('מיון', hospital.name, hospital.city)}
              className="flex items-center gap-3 w-full rounded-xl px-4 py-3.5
                         bg-blue-600/15 border border-blue-500/40
                         active:scale-95 transition-transform"
            >
              <Navigation size={20} className="text-blue-400 shrink-0" />
              <span className="text-blue-300 font-semibold">{t('navigateToER')}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
