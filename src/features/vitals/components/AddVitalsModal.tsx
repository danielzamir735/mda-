import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useVitalsLogStore } from '../../../store/vitalsLogStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function InputField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-emt-muted text-sm font-bold">{label}</label>
      <input
        type="number"
        inputMode="numeric"
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

export default function AddVitalsModal({ isOpen, onClose }: Props) {
  const addLog = useVitalsLogStore((s) => s.addLog);
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [breathing, setBreathing] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    addLog({ bloodPressureSys: sys, bloodPressureDia: dia, heartRate, breathing, bloodSugar });
    setSys(''); setDia(''); setHeartRate(''); setBreathing(''); setBloodSugar('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-emt-dark flex flex-col animate-fade-scale">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-emt-border shrink-0">
        <button
          onClick={onClose}
          className="p-2 text-emt-muted hover:text-emt-light transition-colors"
          aria-label="סגור"
        >
          <X size={24} />
        </button>
        <h1 className="text-emt-light font-black text-xl">הוספת מדדים</h1>
        <div className="w-10" />
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {/* Blood Pressure */}
        <div className="flex flex-col gap-1.5">
          <label className="text-emt-muted text-sm font-bold">לחץ דם</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="סיסטולי"
              value={sys}
              onChange={(e) => setSys(e.target.value)}
              className="flex-1 bg-emt-gray border border-emt-border rounded-2xl px-4 py-2
                         text-emt-light text-center text-lg font-bold placeholder:text-emt-border
                         focus:outline-none focus:border-emt-red transition-colors"
            />
            <span className="text-emt-muted font-black text-2xl select-none">/</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="דיאסטולי"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
              className="flex-1 bg-emt-gray border border-emt-border rounded-2xl px-4 py-2
                         text-emt-light text-center text-lg font-bold placeholder:text-emt-border
                         focus:outline-none focus:border-emt-red transition-colors"
            />
          </div>
        </div>

        <InputField label="דופק (פעימות/דקה)" value={heartRate} onChange={setHeartRate} />
        <InputField label="נשימות (לדקה)" value={breathing} onChange={setBreathing} />
        <InputField label="סוכר בדם (mg/dL)" value={bloodSugar} onChange={setBloodSugar} />
      </div>

      {/* Save */}
      <div className="p-4 shrink-0">
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-2xl bg-emt-green text-white font-black text-xl
                     flex items-center justify-center gap-2
                     active:scale-[0.97] transition-transform duration-150"
          style={{ boxShadow: '0 4px 20px rgba(34,197,94,0.35)' }}
        >
          <Save size={22} />
          שמירה
        </button>
      </div>
    </div>
  );
}
