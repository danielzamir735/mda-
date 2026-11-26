import { useState } from 'react';
import { ChevronDown, Phone, PhoneCall, Navigation, X } from 'lucide-react';
import { useTranslation, useLanguage } from '../../../hooks/useTranslation';
import { trackEvent } from '../../../utils/analytics';

export interface Hospital {
  name: string;
  city: string;
  /** English display name and city; the Hebrew `name` stays the key and the map search text. */
  en?: [name: string, city: string];
  central: string;
  er: string;
  lat?: number;
  lng?: number;
  navQueries?: {
    general: string;
    pediatric: string;
    maternity?: string;
  };
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
                 bg-page border border-line
                 active:scale-95 transition-transform"
    >
      <span className="text-blue-700 dark:text-blue-400 shrink-0">{icon}</span>
      <div className="flex flex-col flex-1 text-start">
        <span className="text-fg-muted text-xs leading-none mb-0.5">{label}</span>
        <span className="text-fg font-semibold text-base leading-none" dir="ltr">
          {number}
        </span>
      </div>
    </a>
  );
}

function navUrl(query: string) {
  return 'geo:0,0?q=' + encodeURIComponent(query);
}

export default function HospitalAccordionItem({ hospital, isLevelA, isOpen, onToggle }: Props) {
  const t = useTranslation();
  const { isEn } = useLanguage();
  const [showERChoice, setShowERChoice] = useState(false);
  const [name, city] = isEn && hospital.en ? hospital.en : [hospital.name, hospital.city];

  function handleToggle() {
    if (isOpen) setShowERChoice(false);
    onToggle();
  }

  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      {/* Header row — always visible */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3.5
                   active:bg-fg/5 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          {isLevelA && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0
                         bg-transparent text-red-700 dark:text-red-400 border border-red-600/60 dark:border-red-500/60"
            >
              A
            </span>
          )}
          <div className="text-start">
            <div className="text-fg font-bold text-base leading-tight">{name}</div>
            <div className="text-fg-muted text-xs mt-0.5">{city}</div>
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`text-fg-subtle transition-transform duration-200 shrink-0
                      ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded actions */}
      {isOpen && (
        <div className="px-3 pb-3 pt-1 flex flex-col gap-2 border-t border-line/60">
          <PhoneRow number={hospital.central} label={t('hospitalCentral')} icon={<Phone size={20} />} />
          <PhoneRow number={hospital.er} label={t('hospitalER')} icon={<PhoneCall size={20} />} />

          {hospital.navQueries ? (
            showERChoice ? (
              /* Sub-menu: ER type buttons using exact search queries */
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1 pb-0.5">
                  <span className="text-fg-muted text-xs">{t('refChooseErType')}</span>
                  <button
                    onClick={() => setShowERChoice(false)}
                    className="text-fg-subtle hover:text-fg active:scale-90 transition-all p-1 -m-1"
                    aria-label={t('close')}
                  >
                    <X size={16} />
                  </button>
                </div>

                <a
                  href={navUrl(hospital.navQueries.general)}
                  onClick={() => trackEvent('hospital_navigation_clicked', { hospital_name: hospital.name, type: 'Adult' })}
                  className="flex items-center gap-3 w-full rounded-xl px-4 py-4
                             bg-blue-600 text-white border border-blue-500
                             active:scale-95 transition-transform"
                >
                  <Navigation size={20} className="shrink-0" />
                  <span className="font-bold text-base">{t('refErGeneral')}</span>
                </a>

                <a
                  href={navUrl(hospital.navQueries.pediatric)}
                  onClick={() => trackEvent('hospital_navigation_clicked', { hospital_name: hospital.name, type: 'Child' })}
                  className="flex items-center gap-3 w-full rounded-xl px-4 py-4
                             bg-emerald-600 text-white border border-emerald-500
                             active:scale-95 transition-transform"
                >
                  <Navigation size={20} className="shrink-0" />
                  <span className="font-bold text-base">{t('refErPediatric')}</span>
                </a>

                {hospital.navQueries.maternity && (
                  <a
                    href={navUrl(hospital.navQueries.maternity)}
                    onClick={() => trackEvent('hospital_navigation_clicked', { hospital_name: hospital.name, type: 'Maternity' })}
                    className="flex items-center gap-3 w-full rounded-xl px-4 py-4
                               bg-purple-600 text-white border border-purple-500
                               active:scale-95 transition-transform"
                  >
                    <Navigation size={20} className="shrink-0" />
                    <span className="font-bold text-base">{t('refErMaternity')}</span>
                  </a>
                )}
              </div>
            ) : (
              /* Trigger button — opens ER type sub-menu */
              <button
                onClick={() => setShowERChoice(true)}
                className="flex items-center gap-3 w-full rounded-xl px-4 py-3.5
                           bg-blue-600/15 border border-blue-500/40
                           active:scale-95 transition-transform"
              >
                <Navigation size={20} className="text-blue-700 dark:text-blue-400 shrink-0" />
                <span className="text-blue-700 dark:text-blue-300 font-semibold">{t('navigateToER')}</span>
              </button>
            )
          ) : (
            /* Single direct nav link — searches hospital name + city */
            <a
              // i18n-ok: map search query, kept in Hebrew because the hospital names are Hebrew
              href={navUrl('מיון ' + hospital.name + ' ' + hospital.city)}
              onClick={() => trackEvent('hospital_navigation_clicked', { hospital_name: hospital.name, type: 'Adult' })}
              className="flex items-center gap-3 w-full rounded-xl px-4 py-3.5
                         bg-blue-600/15 border border-blue-500/40
                         active:scale-95 transition-transform"
            >
              <Navigation size={20} className="text-blue-700 dark:text-blue-400 shrink-0" />
              <span className="text-blue-700 dark:text-blue-300 font-semibold">{t('navigateToER')}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
