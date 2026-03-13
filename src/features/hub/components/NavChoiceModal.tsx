import { X } from 'lucide-react';

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
  if (!hospital) return null;

  const query = `מיון ${hospital.name} ${hospital.city}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-sm bg-emt-gray rounded-t-2xl p-5 pb-10
                   border-t border-emt-border shadow-2xl"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Handle bar */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-emt-border" />

        <div className="flex items-center justify-between mb-1">
          <h3 className="text-emt-light font-bold text-lg">ניווט למיון</h3>
          <button
            onClick={onClose}
            className="text-emt-muted p-1 rounded-full hover:text-emt-light transition-colors"
            aria-label="סגור"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-emt-muted text-sm mb-5 truncate" dir="rtl">
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
                       text-[#33ccff] font-bold text-lg
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
                       text-green-400 font-bold text-lg
                       active:scale-95 transition-transform"
          >
            Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
