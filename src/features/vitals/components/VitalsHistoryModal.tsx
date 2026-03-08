import { useState } from 'react';
import { X, Trash2, Pencil, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useVitalsLogStore } from '../../../store/vitalsLogStore';
import type { VitalsLog } from '../../../store/vitalsLogStore';
import EditVitalsModal from './EditVitalsModal';

function CPRLogCard({ log, onDelete }: { log: VitalsLog; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasShocks = (log.cprShockLogs?.length ?? 0) > 0;

  return (
    <div
      className="bg-emt-gray border rounded-2xl p-4"
      style={{
        borderColor: 'rgba(245,158,11,0.35)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 12px rgba(245,158,11,0.08)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Zap size={13} className="text-yellow-400" fill="currentColor" />
          <p className="text-yellow-400/80 text-xs font-black uppercase tracking-wide">החייאה</p>
          <p className="text-emt-muted text-xs">· {log.timestamp}</p>
        </div>
        <div className="flex items-center gap-1">
          {hasShocks && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 text-yellow-400/60 hover:text-yellow-400 transition-colors"
              aria-label={expanded ? 'כווץ' : 'הרחב'}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          <button onClick={onDelete} className="p-1.5 text-emt-muted hover:text-emt-red transition-colors" aria-label="מחק">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">משך סשן</p>
          <p className="text-emt-light font-black text-xl leading-tight tabular-nums">{log.cprDuration || '—'}</p>
        </div>
        <div>
          <p className="text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">שוקים חשמליים</p>
          <p className="font-black text-xl leading-tight" style={{ color: (log.cprShocks ?? 0) > 0 ? '#fb923c' : '#6b7280' }}>
            {log.cprShocks ?? 0}
          </p>
        </div>
      </div>

      {expanded && hasShocks && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
          <p className="text-yellow-400/50 text-[0.62rem] font-bold uppercase tracking-wide mb-2">יומן שוקים</p>
          <div className="flex flex-col gap-2">
            {log.cprShockLogs!.map((shock, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-black/20 rounded-xl px-3 py-2">
                <span className="text-orange-400 font-black w-12">שוק {i + 1}</span>
                <span className="text-emt-light font-mono">{shock.time}</span>
                <span className="text-emt-muted font-mono">{shock.elapsed} מהתחלה</span>
                <span className="text-emt-muted/60 font-mono tabular-nums">
                  {shock.gap !== '—' ? `+${shock.gap}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
          reversed.map((log) =>
            log.type === 'cpr' ? (
              <CPRLogCard key={log.id} log={log} onDelete={() => deleteLog(log.id)} />
            ) : (
              <LogCard
                key={log.id}
                log={log}
                onDelete={() => deleteLog(log.id)}
                onEdit={() => setEditingLog(log)}
              />
            )
          )
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
