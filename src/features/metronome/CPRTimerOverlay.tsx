import { useEffect, useState } from 'react';
import { Square, Zap } from 'lucide-react';
import { useMetronomeStore } from '../../store/metronomeStore';

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mm = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const ss = (totalSeconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function CPRTimerOverlay() {
  const { cprStartTime, lastCPRTime, shockLogs, incrementShock, endCPR } = useMetronomeStore();
  const shockCount = shockLogs.length;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!cprStartTime) {
      setElapsed(0);
      return;
    }
    setElapsed(Date.now() - cprStartTime);
    const id = setInterval(() => setElapsed(Date.now() - cprStartTime), 1000);
    return () => clearInterval(id);
  }, [cprStartTime]);

  return (
    <div
      className="col-span-2 rounded-3xl flex flex-col items-center justify-center gap-2 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #6b0000 0%, #9b0000 50%, #6b0000 100%)',
        boxShadow: '0 0 40px rgba(200,0,0,0.45), inset 0 0 50px rgba(0,0,0,0.4)',
        border: '2px solid rgba(239,68,68,0.6)',
        animation: 'cpr-glow 2s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes cpr-glow {
          0%, 100% { border-color: rgba(239,68,68,0.4); box-shadow: 0 0 30px rgba(200,0,0,0.35), inset 0 0 50px rgba(0,0,0,0.4); }
          50% { border-color: rgba(239,68,68,0.9); box-shadow: 0 0 60px rgba(220,0,0,0.7), inset 0 0 50px rgba(0,0,0,0.4); }
        }
      `}</style>

      <p className="text-red-200/80 font-bold tracking-widest text-sm uppercase z-10">
        זמן בהחייאה
      </p>

      <span
        className="font-mono font-black text-white tabular-nums leading-none z-10"
        style={{ fontSize: 'clamp(5rem, 22vw, 8rem)', textShadow: '0 0 30px rgba(255,100,100,0.6)' }}
      >
        {formatElapsed(elapsed)}
      </span>

      {lastCPRTime && (
        <p className="text-white/40 text-xs z-10">
          סשן קודם: {lastCPRTime}
        </p>
      )}

      {/* Electric Shock button */}
      <button
        onClick={incrementShock}
        className="z-10 flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-base active:scale-95 transition-all duration-150"
        style={{
          backgroundColor: shockCount > 0 ? 'rgba(251,146,60,0.35)' : 'rgba(245,158,11,0.2)',
          border: shockCount > 0 ? '2px solid rgba(251,146,60,0.9)' : '2px solid rgba(245,158,11,0.6)',
          color: shockCount > 0 ? '#fb923c' : '#fbbf24',
          boxShadow: shockCount > 0 ? '0 0 16px rgba(251,146,60,0.5)' : 'none',
        }}
        aria-label="שוק חשמלי"
      >
        <Zap size={20} fill="currentColor" />
        שוק חשמלי
        {shockCount > 0 && (
          <span
            className="rounded-full w-7 h-7 flex items-center justify-center text-sm font-black"
            style={{ backgroundColor: '#fb923c', color: '#1a0a00' }}
          >
            {shockCount}
          </span>
        )}
      </button>

      <button
        onClick={endCPR}
        className="flex items-center gap-2 px-5 py-2 rounded-full z-10 font-bold text-sm active:scale-95 transition-transform"
        style={{
          backgroundColor: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: 'white',
        }}
        aria-label="סיים החייאה"
      >
        <Square size={14} fill="white" />
        סיים החייאה
      </button>
    </div>
  );
}
