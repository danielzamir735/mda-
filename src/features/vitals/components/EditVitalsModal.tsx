import { useState } from 'react';
import { X, Save, ChevronDown } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useVitalsLogStore } from '../../../store/vitalsLogStore';
import { useTranslation } from '../../../hooks/useTranslation';

export interface EditData {
  bloodPressure: string;
  heartRate: string;
  breathing: string;
  bloodSugar: string;
  saturation: string;
  temperature: string;
  fastTest: string;
  fastMotorStrength?: string;
  fastFacialDroop?: string;
  fastSymptomTime?: string;
  notes: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logId: string;
  initialData: EditData;
}

function InputField({ label, value, onChange, placeholder, inputMode = 'numeric' }: {
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

export default function EditVitalsModal({ isOpen, onClose, logId, initialData }: Props) {
  useModalBackHandler(isOpen, onClose);
  const t = useTranslation();
  const updateLog = useVitalsLogStore((s) => s.updateLog);

  const [bloodPressure, setBloodPressure] = useState(initialData.bloodPressure);
  const [heartRate, setHeartRate] = useState(initialData.heartRate);
  const [breathing, setBreathing] = useState(initialData.breathing);
  const [bloodSugar, setBloodSugar] = useState(initialData.bloodSugar);
  const [saturation, setSaturation] = useState(initialData.saturation);
  const [temperature, setTemperature] = useState(initialData.temperature);
  const [fastTest, setFastTest] = useState(initialData.fastTest);
  const [fastExpanded, setFastExpanded] = useState(
    !!(initialData.fastMotorStrength || initialData.fastFacialDroop || initialData.fastSymptomTime)
  );
  const [fastMotorStrength, setFastMotorStrength] = useState(initialData.fastMotorStrength ?? '');
  const [fastFacialDroop, setFastFacialDroop] = useState(initialData.fastFacialDroop ?? '');
  const [fastSymptomTime, setFastSymptomTime] = useState(initialData.fastSymptomTime ?? '');
  const [notes, setNotes] = useState(initialData.notes);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    updateLog(logId, { bloodPressure, heartRate, breathing, bloodSugar, saturation, temperature, fastTest, fastMotorStrength, fastFacialDroop, fastSymptomTime, notes });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1500);
  };

  // FAST options stored as Hebrew regardless of UI language (data compatibility)
  const fastOptions = [
    { value: 'תקין', label: t('normal') },
    { value: 'לא תקין', label: t('abnormal') },
  ] as const;

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-emt-dark flex flex-col animate-fade-scale">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-emt-border shrink-0">
        <button onClick={onClose} className="p-2 text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light transition-colors" aria-label={t('close')}>
          <X size={24} />
        </button>
        <h1 className="text-gray-900 dark:text-emt-light font-black text-xl">{t('editVitals')}</h1>
        <div className="w-10" />
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

          <InputField label={t('heartRate')} value={heartRate} onChange={setHeartRate} placeholder="bpm" />
          <InputField label={t('breathing')} value={breathing} onChange={setBreathing} placeholder="bpm" />
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

          {/* FAST Expansion */}
          <div className="col-span-2">
            <button
              type="button"
              onClick={() => setFastExpanded(!fastExpanded)}
              className="flex items-center gap-1.5 text-gray-400 dark:text-emt-muted text-xs font-bold w-full py-1.5 hover:text-gray-600 dark:hover:text-emt-light transition-colors"
            >
              <ChevronDown size={14} className={`transition-transform duration-200 ${fastExpanded ? 'rotate-180' : ''}`} />
              {t('fastExpand')}
            </button>
            {fastExpanded && (
              <div className="flex flex-col gap-3 mt-1 pt-3 border-t border-gray-200 dark:border-emt-border">
                {[
                  { label: t('fastMotorStrength'), val: fastMotorStrength, set: setFastMotorStrength },
                  { label: t('fastFacialDroop'), val: fastFacialDroop, set: setFastFacialDroop },
                ].map(({ label, val, set }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <label className="text-gray-500 dark:text-emt-muted text-sm font-bold">{label}</label>
                    <div className="flex gap-2">
                      {fastOptions.map(({ value, label: optLabel }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => set(val === value ? '' : value)}
                          className={`flex-1 py-2 rounded-2xl font-bold text-sm transition-colors
                            ${val === value
                              ? value === 'תקין' ? 'bg-emt-green text-white' : 'bg-emt-red text-white'
                              : 'bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border text-gray-500 dark:text-emt-muted'}`}
                        >
                          {optLabel}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-500 dark:text-emt-muted text-sm font-bold">{t('fastSymptomTime')}</label>
                  <input
                    type="time"
                    value={fastSymptomTime}
                    onChange={(e) => setFastSymptomTime(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl px-4 py-2
                               text-gray-900 dark:text-emt-light text-center text-base font-bold
                               focus:outline-none focus:border-emt-red transition-colors"
                  />
                </div>
              </div>
            )}
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
