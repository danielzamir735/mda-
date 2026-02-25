import { X, Trash2 } from 'lucide-react';
import { useVitalsLogStore } from '../../../store/vitalsLogStore';
import type { VitalsLog } from '../../../store/vitalsLogStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function LogRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">{label}</p>
      <p className="text-emt-light font-black text-lg leading-tight">{value}</p>
    </div>
  );
}

function LogCard({ log, onDelete }: { log: VitalsLog; onDelete: () => void }) {
  const bp = log.bloodPressureSys
    ? `${log.bloodPressureSys}/${log.bloodPressureDia}`
    : '';

  return (
    <div
      className="bg-emt-gray border border-emt-border rounded-2xl p-4"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-emt-muted text-xs font-bold">{log.timestamp}</p>
        <button
          onClick={onDelete}
          className="p-1.5 text-emt-muted hover:text-emt-red transition-colors"
          aria-label="מחק"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <LogRow label="לחץ דם" value={bp} />
        <LogRow label="דופק" value={log.heartRate} />
        <LogRow label="נשימות" value={log.breathing} />
        <LogRow label="סוכר" value={log.bloodSugar} />
      </div>
    </div>
  );
}

export default function VitalsHistoryModal({ isOpen, onClose }: Props) {
  const logs = useVitalsLogStore((s) => s.logs);
  const deleteLog = useVitalsLogStore((s) => s.deleteLog);
  if (!isOpen) return null;

  const reversed = [...logs].reverse();

  return (
    <div className="fixed inset-0 z-50 bg-emt-dark flex flex-col animate-fade-scale">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-emt-border shrink-0">
        <button
          onClick={onClose}
          className="p-2 text-emt-muted hover:text-emt-light transition-colors"
          aria-label="סגור"
        >
          <X size={24} />
        </button>
        <h1 className="text-emt-light font-black text-xl">היסטוריית מדדים</h1>
        <div className="w-10" />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {reversed.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-emt-muted text-base font-medium">אין מדדים שמורים</p>
          </div>
        ) : (
          reversed.map((log) => (
            <LogCard key={log.id} log={log} onDelete={() => deleteLog(log.id)} />
          ))
        )}
      </div>
    </div>
  );
}
