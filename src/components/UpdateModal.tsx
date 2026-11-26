import { useState } from 'react';
import { DownloadCloud } from 'lucide-react';
import { useTranslation } from '../i18n';

interface Props {
  onUpdate: () => void;
  onDismiss?: () => void;
}

export default function UpdateModal({ onUpdate, onDismiss }: Props) {
  const t = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleUpdate = () => {
    setLoading(true);
    onUpdate();
  };

  return (
    // theme-ok: the dim backdrop behind a pop-up stays dark in both modes
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[90%] max-w-md bg-surface shadow-2xl rounded-2xl border border-emerald-500/30 p-6 sm:p-8 text-center">
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 mx-auto mb-4">
          <DownloadCloud size={28} className="text-emerald-700 dark:text-emerald-400" />
        </div>

        {/* Text */}
        <p className="text-2xl font-bold text-fg mb-3">
          {t('obUpdateTitle')}
        </p>
        <p className="text-base text-fg-muted mb-6">
          {t('obUpdateText')}
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full py-3 text-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold
                       rounded-xl transition-colors duration-150
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? t('obUpdating') : t('obUpdateNow')}
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="w-full py-2.5 text-fg-muted hover:text-fg text-base
                         transition-colors duration-150"
            >
              {t('obLater')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
