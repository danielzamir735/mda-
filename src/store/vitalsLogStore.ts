import { create } from 'zustand';

export interface VitalsLog {
  id: string;
  timestamp: string;
  bloodPressureSys: string;
  bloodPressureDia: string;
  heartRate: string;
  breathing: string;
  bloodSugar: string;
}

interface VitalsLogState {
  logs: VitalsLog[];
  addLog: (data: Omit<VitalsLog, 'id' | 'timestamp'>) => void;
  deleteLog: (id: string) => void;
}

function formatTimestamp(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y} ${h}:${min}`;
}

export const useVitalsLogStore = create<VitalsLogState>((set) => ({
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
}));
