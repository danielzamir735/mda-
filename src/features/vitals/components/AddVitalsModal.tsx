import { useState, useEffect } from 'react';
import { X, Save, Eraser } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useVitalsLogStore } from '../../../store/vitalsLogStore';
import { useVitalsDraftStore } from '../../../store/vitalsDraftStore';
import { useTranslation } from '../../../hooks/useTranslation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function InputField({
  label, value, onChange, placeholder, inputMode = 'numeric',
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-gray-500 dark:text-emt-muted text-sm font-bold">{label}</label>
      <input
        type="text"
        inputMode={inputMode}
        placeholder={placeholder ?? '0'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl px-4 py-2
                   text-gray-900 dark:text-emt-light text-center text-base font-bold placeholder:text-gray-300 dark:placeholder:text-emt-border
                   focus:outline-none focus:border-emt-red transition-colors"
      />
    </div>
  );
}

function formatBP(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length === 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 3)}/${digits.slice(3, 6)}`;
}

export default function AddVitalsModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const t = useTranslation();
  const addLog = useVitalsLogStore((s) => s.addLog);
  const draftHeartRate = useVitalsDraftStore((s) => s.draftHeartRate);
  const draftBreathing = useVitalsDraftStore((s) => s.draftBreathing);
  const clearDraft = useVitalsDraftStore((s) => s.clearDraft);

  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [breathing, setBreathing] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [saturation, setSaturation] = useState('');
  const [temperature, setTemperature] = useState('');
  const [fastTest, setFastTest] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (draftHeartRate) setHeartRate(draftHeartRate);
      if (draftBreathing) setBreathing(draftBreathing);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClearData = () => {
    clearDraft();
    setBloodPressure(''); setHeartRate(''); setBreathing('');
    setBloodSugar(''); setSaturation(''); setTemperature(''); setFastTest(''); setNotes('');
  };

  const handleSave = () => {
    addLog({ bloodPressure, heartRate, breathing, bloodSugar, saturation, temperature, fastTest, notes });
    handleClearData();
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1500);
  };

  // FAST options stored as Hebrew regardless of UI language (data compatibility)
  const fastOptions = [
    { value: 'תקין', label: t('normal') },
    { value: 'לא תקין', label: t('abnormal') },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-emt-dark flex flex-col animate-fade-scale">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-emt-border shrink-0">
        <button onClick={onClose} className="p-2 text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light transition-colors" aria-label={t('close')}>
          <X size={24} />
        </button>
        <h1 className="text-gray-900 dark:text-emt-light font-black text-xl">{t('addVitals')}</h1>
        <button
          onClick={handleClearData}
          className="flex items-center gap-1 text-gray-400 dark:text-emt-muted hover:text-emt-red text-xs font-medium transition-colors px-1"
          aria-label={t('clearData')}
        >
          <Eraser size={14} />
          <span>{t('clear')}</span>
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Blood Pressure — full width */}
          <div className="col-span-2">
            <InputField
              label={t('bloodPressure')}
              value={bloodPressure}
              onChange={(v) => setBloodPressure(formatBP(v))}
              placeholder="120/80"
              inputMode="numeric"
            />
          </div>

          <InputField label={t('heartRate')} value={heartRate} onChange={setHeartRate} placeholder={t('hrPlaceholder')} />
          <InputField label={t('breathing')} value={breathing} onChange={setBreathing} placeholder={t('breathPlaceholder')} />
          <InputField label={t('saturation')} value={saturation} onChange={setSaturation} placeholder="98" />
          <InputField label={t('temperature')} value={temperature} onChange={setTemperature} placeholder="36.5" />

          <div className="col-span-2">
            <InputField label={t('bloodSugar')} value={bloodSugar} onChange={setBloodSugar} placeholder="100" />
          </div>

          {/* FAST Test toggle */}
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-gray-500 dark:text-emt-muted text-sm font-bold">{t('fastTest')}</label>
            <div className="flex gap-2">
              {fastOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFastTest(fastTest === value ? '' : value)}
                  className={`flex-1 py-2 rounded-2xl font-bold text-sm transition-colors
                    ${fastTest === value
                      ? value === 'תקין' ? 'bg-emt-green text-white' : 'bg-emt-red text-white'
                      : 'bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border text-gray-500 dark:text-emt-muted'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-gray-500 dark:text-emt-muted text-sm font-bold">{t('notesLabel')}</label>
            <textarea
              placeholder={t('additionalNotesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl px-4 py-2
                         text-gray-900 dark:text-emt-light text-sm font-medium placeholder:text-gray-300 dark:placeholder:text-emt-border
                         focus:outline-none focus:border-emt-red transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="p-4 shrink-0">
        <button
          onClick={handleSave}
          disabled={saved}
          className="w-full py-3 rounded-2xl bg-emt-green text-white font-black text-xl
                     flex items-center justify-center gap-2
                     active:scale-[0.97] transition-all duration-150
                     disabled:opacity-90 disabled:scale-100"
        >
          {saved ? t('savedConfirm') : (<><Save size={22} />{t('save')}</>)}
        </button>
      </div>
    </div>
  );
}
