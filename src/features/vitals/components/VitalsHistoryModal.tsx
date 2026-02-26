import { useState } from 'react';
import { X, Trash2, Pencil, Check } from 'lucide-react';
import { useVitalsLogStore } from '../../../store/vitalsLogStore';
import type { VitalsLog } from '../../../store/vitalsLogStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type EditFields = { sys: string; dia: string; heartRate: string; breathing: string; bloodSugar: string };

function EditInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-emt-dark border border-emt-border rounded-xl px-2 py-1.5
                 text-emt-light text-center text-sm font-bold placeholder:text-emt-border
                 focus:outline-none focus:border-emt-red transition-colors"
    />
  );
}

function LogCard({ log, onDelete, onSave }: {
  log: VitalsLog; onDelete: () => void; onSave: (data: EditFields) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState<EditFields>({
    sys: log.bloodPressureSys, dia: log.bloodPressureDia,
    heartRate: log.heartRate, breathing: log.breathing, bloodSugar: log.bloodSugar,
  });

  const upd = (k: keyof EditFields) => (v: string) => setF(prev => ({ ...prev, [k]: v }));
  const bp = log.bloodPressureSys ? `${log.bloodPressureSys}/${log.bloodPressureDia}` : '';

  if (editing) {
    return (
      <div className="bg-emt-gray border border-emt-red/50 rounded-2xl p-3"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
        <p className="text-emt-muted text-xs font-bold mb-2">{log.timestamp}</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <EditInput value={f.sys} onChange={upd('sys')} placeholder="סיסטולי" />
          <EditInput value={f.dia} onChange={upd('dia')} placeholder="דיאסטולי" />
          <EditInput value={f.heartRate} onChange={upd('heartRate')} placeholder="דופק" />
          <EditInput value={f.breathing} onChange={upd('breathing')} placeholder="נשימות" />
          <EditInput value={f.bloodSugar} onChange={upd('bloodSugar')} placeholder="סוכר" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { onSave(f); setEditing(false); }}
            className="flex-1 py-2 rounded-xl bg-emt-green text-white font-bold text-sm
                       flex items-center justify-center gap-1 active:scale-[0.97] transition-transform duration-150"
          >
            <Check size={14} /> שמור
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex-1 py-2 rounded-xl bg-emt-border/30 border border-emt-border
                       text-emt-muted font-bold text-sm"
          >
            ביטול
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-emt-gray border border-emt-border rounded-2xl p-4"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-emt-muted text-xs font-bold">{log.timestamp}</p>
        <div className="flex gap-1">
          <button
            onClick={() => {
              setF({ sys: log.bloodPressureSys, dia: log.bloodPressureDia, heartRate: log.heartRate, breathing: log.breathing, bloodSugar: log.bloodSugar });
              setEditing(true);
            }}
            className="p-1.5 text-emt-muted hover:text-emt-light transition-colors"
            aria-label="ערוך"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-emt-muted hover:text-emt-red transition-colors"
            aria-label="מחק"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {bp && <div><p className="text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">לחץ דם</p><p className="text-emt-light font-black text-lg leading-tight">{bp}</p></div>}
        {log.heartRate && <div><p className="text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">דופק</p><p className="text-emt-light font-black text-lg leading-tight">{log.heartRate}</p></div>}
        {log.breathing && <div><p className="text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">נשימות</p><p className="text-emt-light font-black text-lg leading-tight">{log.breathing}</p></div>}
        {log.bloodSugar && <div><p className="text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">סוכר</p><p className="text-emt-light font-black text-lg leading-tight">{log.bloodSugar}</p></div>}
      </div>
    </div>
  );
}

export default function VitalsHistoryModal({ isOpen, onClose }: Props) {
  const logs = useVitalsLogStore((s) => s.logs);
  const deleteLog = useVitalsLogStore((s) => s.deleteLog);
  const updateLog = useVitalsLogStore((s) => s.updateLog);
  if (!isOpen) return null;

  const reversed = [...logs].reverse();

  return (
    <div className="fixed inset-0 z-50 bg-emt-dark flex flex-col animate-fade-scale">
      <div className="flex items-center justify-between px-4 py-4 border-b border-emt-border shrink-0">
        <button onClick={onClose} className="p-2 text-emt-muted hover:text-emt-light transition-colors" aria-label="סגור">
          <X size={24} />
        </button>
        <h1 className="text-emt-light font-black text-xl">היסטוריית מדדים</h1>
        <div className="w-10" />
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {reversed.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-emt-muted text-base font-medium">אין מדדים שמורים</p>
          </div>
        ) : (
          reversed.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              onDelete={() => deleteLog(log.id)}
              onSave={(fields) => updateLog(log.id, {
                bloodPressureSys: fields.sys, bloodPressureDia: fields.dia,
                heartRate: fields.heartRate, breathing: fields.breathing, bloodSugar: fields.bloodSugar,
              })}
            />
          ))
        )}
      </div>
    </div>
  );
}
