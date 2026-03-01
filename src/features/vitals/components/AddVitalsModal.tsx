import { useState, useEffect } from 'react';
import { X, Save, Eraser } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useVitalsLogStore } from '../../../store/vitalsLogStore';
import { useVitalsDraftStore } from '../../../store/vitalsDraftStore';

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
      <label className="text-emt-muted text-sm font-bold">{label}</label>
      <input
        type="text"
        inputMode={inputMode}
        placeholder={placeholder ?? '0'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-emt-gray border border-emt-border rounded-2xl px-4 py-2
                   text-emt-light text-center text-base font-bold placeholder:text-emt-border
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

  return (
    <div className="fixed inset-0 z-50 bg-emt-dark flex flex-col animate-fade-scale">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-emt-border shrink-0">
        <button onClick={onClose} className="p-2 text-emt-muted hover:text-emt-light transition-colors" aria-label="סגור">
          <X size={24} />
        </button>
        <h1 className="text-emt-light font-black text-xl">הוספת מדדים</h1>
        <button
          onClick={handleClearData}
          className="flex items-center gap-1 text-emt-muted hover:text-emt-red text-xs font-medium transition-colors px-1"
          aria-label="נקה נתונים"
        >
          <Eraser size={14} />
          <span>נקה</span>
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Blood Pressure — full width */}
          <div className="col-span-2">
            <InputField
              label="לחץ דם"
              value={bloodPressure}
              onChange={(v) => setBloodPressure(formatBP(v))}
              placeholder="120/80"
              inputMode="numeric"
            />
          </div>

          <InputField label="דופק" value={heartRate} onChange={setHeartRate} placeholder="פ/דקה" />
          <InputField label="נשימות" value={breathing} onChange={setBreathing} placeholder="נ/דקה" />
          <InputField label="סטורציה %" value={saturation} onChange={setSaturation} placeholder="98" />
          <InputField label="חום °C" value={temperature} onChange={setTemperature} placeholder="36.5" />

          <div className="col-span-2">
            <InputField label="סוכר (mg/dL)" value={bloodSugar} onChange={setBloodSugar} placeholder="100" />
          </div>

          {/* FAST Test toggle */}
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-emt-muted text-sm font-bold">בדיקת FAST</label>
            <div className="flex gap-2">
              {(['תקין', 'לא תקין'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFastTest(fastTest === opt ? '' : opt)}
                  className={`flex-1 py-2 rounded-2xl font-bold text-sm transition-colors
                    ${fastTest === opt
                      ? opt === 'תקין' ? 'bg-emt-green text-white' : 'bg-emt-red text-white'
                      : 'bg-emt-gray border border-emt-border text-emt-muted'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-emt-muted text-sm font-bold">הערות</label>
            <textarea
              placeholder="הערות נוספות..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-emt-gray border border-emt-border rounded-2xl px-4 py-2
                         text-emt-light text-sm font-medium placeholder:text-emt-border
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
          {saved ? 'נשמר ✓' : (<><Save size={22} />שמירה</>)}
        </button>
      </div>
    </div>
  );
}
