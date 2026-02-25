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

export const useVitalsLogStore = create<VitalsLogState>((set) => ({
  logs: [],
  addLog: (data) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    set((state) => ({
      logs: [...state.logs, { ...data, id: crypto.randomUUID(), timestamp }],
    }));
  },
  deleteLog: (id) => set((state) => ({
    logs: state.logs.filter((log) => log.id !== id),
  })),
}));
