import { useState } from 'react';
import { X, Trash2, Pencil } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useVitalsLogStore } from '../../../store/vitalsLogStore';
import type { VitalsLog } from '../../../store/vitalsLogStore';
import EditVitalsModal from './EditVitalsModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function LogCard({ log, onDelete, onEdit }: {
  log: VitalsLog; onDelete: () => void; onEdit: () => void;
}) {
  return (
    <div className="bg-emt-gray border border-emt-border rounded-2xl p-4"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
      {/* Timestamp + actions */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-emt-muted text-xs font-bold">{log.timestamp}</p>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1.5 text-emt-muted hover:text-emt-light transition-colors" aria-label="ערוך">
            <Pencil size={16} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-emt-muted hover:text-emt-red transition-colors" aria-label="מחק">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Core vitals grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {log.bloodPressure && (
          <div>
            <p className="text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">לחץ דם</p>
            <p className="text-emt-light font-black text-lg leading-tight">{log.bloodPressure}</p>
          </div>
        )}
        {log.heartRate && (
          <div>
            <p className="text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">דופק</p>
            <p className="text-emt-light font-black text-lg leading-tight">{log.heartRate}</p>
          </div>
        )}
        {log.breathing && (
          <div>
            <p className="text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">נשימות</p>
            <p className="text-emt-light font-black text-lg leading-tight">{log.breathing}</p>
          </div>
        )}
        {log.bloodSugar && (
          <div>
            <p className="text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">סוכר</p>
            <p className="text-emt-light font-black text-lg leading-tight">{log.bloodSugar}</p>
          </div>
        )}
        {log.saturation && (
          <div>
            <p className="text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">סטורציה</p>
            <p className="text-emt-light font-black text-lg leading-tight">{log.saturation}%</p>
          </div>
        )}
        {log.temperature && (
          <div>
            <p className="text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">חום</p>
            <p className="text-emt-light font-black text-lg leading-tight">{log.temperature}°C</p>
          </div>
        )}
        {log.fastTest && (
          <div>
            <p className="text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">FAST</p>
            <p className={`font-black text-lg leading-tight ${log.fastTest === 'תקין' ? 'text-emt-green' : 'text-emt-red'}`}>
              {log.fastTest}
            </p>
          </div>
        )}
      </div>

      {/* Notes — full-width below grid */}
      {log.notes && (
        <div className="mt-3 pt-3 border-t border-emt-border">
          <p className="text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide mb-1">הערות</p>
          <p className="text-emt-light text-sm font-medium whitespace-pre-wrap">{log.notes}</p>
        </div>
      )}
    </div>
  );
}

export default function VitalsHistoryModal({ isOpen, onClose }: Props) {
  useModalBackHandler(isOpen, onClose);
  const logs = useVitalsLogStore((s) => s.logs);
  const deleteLog = useVitalsLogStore((s) => s.deleteLog);
  const [editingLog, setEditingLog] = useState<VitalsLog | null>(null);

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
              onEdit={() => setEditingLog(log)}
            />
          ))
        )}
      </div>

      {editingLog && (
        <EditVitalsModal
          key={editingLog.id}
          isOpen={true}
          onClose={() => setEditingLog(null)}
          logId={editingLog.id}
          initialData={{
            bloodPressure: editingLog.bloodPressure ?? '',
            heartRate: editingLog.heartRate,
            breathing: editingLog.breathing,
            bloodSugar: editingLog.bloodSugar,
            saturation: editingLog.saturation ?? '',
            temperature: editingLog.temperature ?? '',
            fastTest: editingLog.fastTest ?? '',
            notes: editingLog.notes ?? '',
          }}
        />
      )}
    </div>
  );
}
