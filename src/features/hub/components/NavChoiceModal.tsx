import { X } from 'lucide-react';
import { useTranslation } from '../../../i18n';

export interface Hospital {
  name: string;
  city: string;
  central: string;
  er: string;
}

interface Props {
  hospital: Hospital | null;
  onClose: () => void;
}

export default function NavChoiceModal({ hospital, onClose }: Props) {
  const t = useTranslation();
  if (!hospital) return null;

  // i18n-ok: search query for Waze/Maps; Israeli hospital names are Hebrew
  const query = `מיון ${hospital.name} ${hospital.city}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      onClick={onClose}
    >
      {/* theme-ok: backdrop dims the page in both modes */}
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-sm bg-surface rounded-t-2xl p-5 pb-10
                   border-t border-line shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-line" />

        <div className="flex items-center justify-between mb-1">
          <h3 className="text-fg font-bold text-lg">{t('hubNavTitle')}</h3>
          <button
            onClick={onClose}
            className="text-fg-muted p-1 rounded-full hover:text-fg transition-colors"
            aria-label={t('close')}
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-fg-muted text-sm mb-5 truncate">
          {hospital.name} — {hospital.city}
        </p>

        <div className="flex flex-col gap-3">
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-center gap-3 rounded-xl py-4
                       bg-[#33ccff]/10 border border-[#33ccff]/40
                       text-sky-700 dark:text-[#33ccff] font-bold text-lg
                       active:scale-95 transition-transform"
          >
            Waze
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-center gap-3 rounded-xl py-4
                       bg-green-600/10 border border-green-500/40
                       text-green-700 dark:text-green-400 font-bold text-lg
                       active:scale-95 transition-transform"
          >
            Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
