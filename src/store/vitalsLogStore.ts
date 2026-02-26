import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VitalsLog {
  id: string;
  timestamp: string;
  bloodPressure: string;
  heartRate: string;
  breathing: string;
  bloodSugar: string;
  saturation: string;
  fastTest: string;
  notes: string;
}

interface VitalsLogState {
  logs: VitalsLog[];
  addLog: (data: Omit<VitalsLog, 'id' | 'timestamp'>) => void;
  deleteLog: (id: string) => void;
  updateLog: (id: string, data: Omit<VitalsLog, 'id' | 'timestamp'>) => void;
}

function formatTimestamp(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y} ${h}:${min}`;
}

export const useVitalsLogStore = create<VitalsLogState>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (data) => {
        const timestamp = formatTimestamp(new Date());
        set((state) => ({
          logs: [...state.logs, { ...data, id: crypto.randomUUID(), timestamp }],
        }));
      },
      deleteLog: (id) => set((state) => ({
        logs: state.logs.filter((log) => log.id !== id),
      })),
      updateLog: (id, data) => set((state) => ({
        logs: state.logs.map((log) => log.id === id ? { ...log, ...data } : log),
      })),
    }),
    { name: 'vitals-storage' },
  ),
);
