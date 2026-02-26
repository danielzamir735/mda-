import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useVitalsLogStore } from '../../../store/vitalsLogStore';

interface EditData {
  sys: string;
  dia: string;
  heartRate: string;
  breathing: string;
  bloodSugar: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logId: string;
  initialData: EditData;
}

function InputField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
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

export default function EditVitalsModal({ isOpen, onClose, logId, initialData }: Props) {
  const updateLog = useVitalsLogStore((s) => s.updateLog);

  const [sys, setSys] = useState(initialData.sys);
  const [dia, setDia] = useState(initialData.dia);
  const [heartRate, setHeartRate] = useState(initialData.heartRate);
  const [breathing, setBreathing] = useState(initialData.breathing);
  const [bloodSugar, setBloodSugar] = useState(initialData.bloodSugar);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    updateLog(logId, {
      bloodPressureSys: sys,
      bloodPressureDia: dia,
      heartRate,
      breathing,
      bloodSugar,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-emt-dark flex flex-col animate-fade-scale">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-emt-border shrink-0">
        <button
          onClick={onClose}
          className="p-2 text-emt-muted hover:text-emt-light transition-colors"
          aria-label="סגור"
        >
          <X size={24} />
        </button>
        <h1 className="text-emt-light font-black text-xl">עריכת מדדים</h1>
        <div className="w-10" />
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-emt-muted text-sm font-bold">לחץ דם</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              inputMode="numeric"
              placeholder="סיסטולי"
              value={sys}
              onChange={(e) => setSys(e.target.value)}
              className="w-full bg-emt-gray border border-emt-border rounded-2xl px-3 py-2
                         text-emt-light text-center text-lg font-bold placeholder:text-emt-border
                         focus:outline-none focus:border-emt-red transition-colors"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="דיאסטולי"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
              className="w-full bg-emt-gray border border-emt-border rounded-2xl px-3 py-2
                         text-emt-light text-center text-lg font-bold placeholder:text-emt-border
                         focus:outline-none focus:border-emt-red transition-colors"
            />
          </div>
        </div>

        <InputField label="דופק (פעימות לדקה)" value={heartRate} onChange={setHeartRate} />
        <InputField label="נשימות (לדקה)" value={breathing} onChange={setBreathing} />
        <InputField label="סוכר בדם (mg/dL)" value={bloodSugar} onChange={setBloodSugar} />
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
          style={{ boxShadow: '0 4px 20px rgba(34,197,94,0.35)' }}
        >
          {saved ? 'נשמר ✓' : (<><Save size={22} />שמירה</>)}
        </button>
      </div>
    </div>
  );
}
