import { useState } from 'react';
import { X, Trash2, Pencil, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useModalBackHandler } from '../../../hooks/useModalBackHandler';
import { useVitalsLogStore } from '../../../store/vitalsLogStore';
import type { VitalsLog } from '../../../store/vitalsLogStore';
import { useTranslation } from '../../../hooks/useTranslation';
import EditVitalsModal from './EditVitalsModal';

function CPRLogCard({ log, onDelete }: { log: VitalsLog; onDelete: () => void }) {
  const t = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const hasShocks = (log.cprShockLogs?.length ?? 0) > 0;

  return (
    <div
      className="bg-gray-100 dark:bg-emt-gray border rounded-2xl p-4"
      style={{
        borderColor: 'rgba(245,158,11,0.35)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 0 12px rgba(245,158,11,0.08)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Zap size={13} className="text-yellow-400" fill="currentColor" />
          <p className="text-yellow-400/80 text-xs font-black uppercase tracking-wide">{t('cprLabel')}</p>
          <p className="text-gray-500 dark:text-emt-muted text-xs">· {log.timestamp}</p>
        </div>
        <div className="flex items-center gap-1">
          {hasShocks && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 text-yellow-400/60 hover:text-yellow-400 transition-colors"
              aria-label={expanded ? t('collapse') : t('expand')}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          <button onClick={onDelete} className="p-1.5 text-gray-400 dark:text-emt-muted hover:text-emt-red transition-colors" aria-label={t('delete')}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-gray-500 dark:text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">{t('sessionDuration')}</p>
          <p className="text-gray-900 dark:text-emt-light font-black text-xl leading-tight tabular-nums">{log.cprDuration || '—'}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">{t('electricShocks')}</p>
          <p className="font-black text-xl leading-tight" style={{ color: (log.cprShocks ?? 0) > 0 ? '#fb923c' : '#6b7280' }}>
            {log.cprShocks ?? 0}
          </p>
        </div>
      </div>

      {expanded && hasShocks && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(245,158,11,0.18)' }}>
          <p className="text-yellow-400/50 text-[0.62rem] font-black uppercase tracking-wider mb-2">
            {t('shockLog')}
          </p>
          {/* shock table */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
            {/* header */}
            <div
              className="grid text-[0.6rem] font-black text-amber-400/50 uppercase tracking-wider bg-black/10 dark:bg-black/30 px-3 py-1.5"
              style={{ gridTemplateColumns: '1.5rem 1fr 1fr 1fr' }}
            >
              <span>#</span>
              <span>{t('shockTime')}</span>
              <span>{t('fromStart')}</span>
              <span>{t('gap')}</span>
            </div>
            {log.cprShockLogs!.map((shock, i) => (
              <div
                key={i}
                className="grid px-3 py-2 text-xs font-mono border-t"
                style={{
                  gridTemplateColumns: '1.5rem 1fr 1fr 1fr',
                  borderColor: 'rgba(245,158,11,0.1)',
                  backgroundColor: i % 2 === 0 ? 'rgba(245,158,11,0.04)' : 'transparent',
                }}
              >
                <span className="font-black text-orange-400">{i + 1}</span>
                <span className="text-gray-900 dark:text-emt-light">{shock.time}</span>
                <span className="text-gray-500 dark:text-emt-muted">{shock.elapsed}</span>
                <span className="text-gray-400 dark:text-emt-muted/60">
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
  const t = useTranslation();
  return (
    <div className="bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl p-4"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      {/* Timestamp + actions */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-500 dark:text-emt-muted text-xs font-bold">{log.timestamp}</p>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1.5 text-gray-400 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light transition-colors" aria-label={t('edit')}>
            <Pencil size={16} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 dark:text-emt-muted hover:text-emt-red transition-colors" aria-label={t('delete')}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Core vitals grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {log.bloodPressure && (
          <div>
            <p className="text-gray-500 dark:text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">{t('bloodPressure')}</p>
            <p className="text-gray-900 dark:text-emt-light font-black text-lg leading-tight">{log.bloodPressure}</p>
          </div>
        )}
        {log.heartRate && (
          <div>
            <p className="text-gray-500 dark:text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">{t('heartRate')}</p>
            <p className="text-gray-900 dark:text-emt-light font-black text-lg leading-tight">{log.heartRate}</p>
          </div>
        )}
        {log.breathing && (
          <div>
            <p className="text-gray-500 dark:text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">{t('breathing')}</p>
            <p className="text-gray-900 dark:text-emt-light font-black text-lg leading-tight">{log.breathing}</p>
          </div>
        )}
        {log.bloodSugar && (
          <div>
            <p className="text-gray-500 dark:text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">{t('sugarLabel')}</p>
            <p className="text-gray-900 dark:text-emt-light font-black text-lg leading-tight">{log.bloodSugar}</p>
          </div>
        )}
        {log.saturation && (
          <div>
            <p className="text-gray-500 dark:text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">{t('saturationLabel')}</p>
            <p className="text-gray-900 dark:text-emt-light font-black text-lg leading-tight">{log.saturation}%</p>
          </div>
        )}
        {log.temperature && (
          <div>
            <p className="text-gray-500 dark:text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">{t('temperatureLabel')}</p>
            <p className="text-gray-900 dark:text-emt-light font-black text-lg leading-tight">{log.temperature}°C</p>
          </div>
        )}
        {log.fastTest && (
          <div>
            <p className="text-gray-500 dark:text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide">FAST</p>
            <p className={`font-black text-lg leading-tight ${log.fastTest === 'תקין' ? 'text-emt-green' : 'text-emt-red'}`}>
              {log.fastTest === 'תקין' ? t('normal') : log.fastTest === 'לא תקין' ? t('abnormal') : log.fastTest}
            </p>
          </div>
        )}
      </div>

      {/* FAST expanded details */}
      {(log.fastMotorStrength || log.fastFacialDroop || log.fastSymptomTime) && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-emt-border flex flex-wrap gap-x-4 gap-y-1">
          {log.fastMotorStrength && (
            <span className="text-xs text-gray-500 dark:text-emt-muted">
              {t('fastMotorStrength')}: <span className={`font-bold ${log.fastMotorStrength === 'תקין' ? 'text-emt-green' : 'text-emt-red'}`}>
                {log.fastMotorStrength === 'תקין' ? t('normal') : t('abnormal')}
              </span>
            </span>
          )}
          {log.fastFacialDroop && (
            <span className="text-xs text-gray-500 dark:text-emt-muted">
              {t('fastFacialDroop')}: <span className={`font-bold ${log.fastFacialDroop === 'תקין' ? 'text-emt-green' : 'text-emt-red'}`}>
                {log.fastFacialDroop === 'תקין' ? t('normal') : t('abnormal')}
              </span>
            </span>
          )}
          {log.fastSymptomTime && (
            <span className="text-xs text-gray-500 dark:text-emt-muted">
              {t('fastSymptomTime')}: <span className="font-bold text-gray-900 dark:text-emt-light">{log.fastSymptomTime}</span>
            </span>
          )}
        </div>
      )}

      {/* Notes — full-width below grid */}
      {log.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-emt-border">
          <p className="text-gray-500 dark:text-emt-muted text-[0.62rem] font-bold uppercase tracking-wide mb-1">{t('notesLabel')}</p>
          <p className="text-gray-900 dark:text-emt-light text-sm font-medium whitespace-pre-wrap">{log.notes}</p>
        </div>
      )}
    </div>
  );
}

export default function VitalsHistoryModal({ isOpen, onClose }: Props) {
  const t = useTranslation();
  useModalBackHandler(isOpen, onClose);
  const logs = useVitalsLogStore((s) => s.logs);
  const deleteLog = useVitalsLogStore((s) => s.deleteLog);
  const [editingLog, setEditingLog] = useState<VitalsLog | null>(null);

  if (!isOpen) return null;

  const reversed = [...logs].reverse();

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-emt-dark flex flex-col animate-fade-scale">
      <div className="ios-safe-header flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-emt-border shrink-0">
        <button onClick={onClose} className="p-2 text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light transition-colors" aria-label={t('close')}>
          <X size={24} />
        </button>
        <h1 className="text-gray-900 dark:text-emt-light font-black text-xl">{t('vitalsHistory')}</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {reversed.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 dark:text-emt-muted text-base font-medium">{t('noSavedVitals')}</p>
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
            fastMotorStrength: editingLog.fastMotorStrength ?? '',
            fastFacialDroop: editingLog.fastFacialDroop ?? '',
            fastSymptomTime: editingLog.fastSymptomTime ?? '',
            notes: editingLog.notes ?? '',
          }}
        />
      )}
    </div>
  );
}
