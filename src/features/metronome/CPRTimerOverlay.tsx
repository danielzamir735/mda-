import { useEffect, useState, useCallback } from 'react';
import { Square, Zap, Volume2, VolumeX } from 'lucide-react';
import { useMetronomeStore } from '../../store/metronomeStore';

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mm = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const ss = (totalSeconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function CPRTimerOverlay() {
  const { cprStartTime, shockLogs, isAudioMuted, incrementShock, endCPR, toggleAudio } =
    useMetronomeStore();
  const shockCount = shockLogs.length;
  const [elapsed, setElapsed] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (!cprStartTime) {
      setElapsed(0);
      return;
    }
    setElapsed(Date.now() - cprStartTime);
    const id = setInterval(() => setElapsed(Date.now() - cprStartTime), 1000);
    return () => clearInterval(id);
  }, [cprStartTime]);

  const handleShock = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 450);
    incrementShock();
  }, [incrementShock]);

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 text-white flex flex-col select-none overflow-hidden">
      {/* Electric flash overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          backgroundColor: '#ffe566',
          opacity: isFlashing ? 0.6 : 0,
          transition: isFlashing ? 'opacity 0ms' : 'opacity 400ms ease-out',
        }}
      />

      {/* ── Top: timer + End button ── */}
      <div className="relative z-20 flex flex-col items-center pt-10 pb-5 px-6 gap-2">
        <p className="text-slate-500 font-bold tracking-[0.2em] text-xs uppercase">
          זמן בהחייאה
        </p>

        <span
          className="font-mono font-black tabular-nums leading-none"
          style={{
            fontSize: 'clamp(5.5rem, 26vw, 9.5rem)',
            textShadow: '0 0 48px rgba(255, 80, 80, 0.55)',
          }}
        >
          {formatElapsed(elapsed)}
        </span>

        <button
          onClick={endCPR}
          className="mt-2 flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-base active:scale-95 transition-transform"
          style={{
            backgroundColor: '#EF233C',
            boxShadow: '0 4px 24px rgba(239,35,60,0.55)',
          }}
          aria-label="סיים החייאה"
        >
          <Square size={15} fill="white" />
          סיים החייאה
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-800 mx-6 shrink-0" />

      {/* ── Center: Shock button ── */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center gap-5 px-6">
        <button
          onClick={handleShock}
          className="relative rounded-full flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform duration-100"
          style={{
            width: 'clamp(180px, 52vw, 240px)',
            height: 'clamp(180px, 52vw, 240px)',
            background: 'radial-gradient(circle at 38% 32%, #ffe14d, #f59e0b 58%, #92400e)',
            boxShadow: isFlashing
              ? '0 0 100px rgba(255,225,0,0.95), 0 0 200px rgba(255,200,0,0.6), 0 8px 32px rgba(0,0,0,0.7)'
              : shockCount > 0
              ? '0 0 48px rgba(245,158,11,0.65), 0 8px 40px rgba(0,0,0,0.7)'
              : '0 0 24px rgba(245,158,11,0.35), 0 8px 40px rgba(0,0,0,0.7)',
            transition: 'box-shadow 300ms',
          }}
          aria-label="שוק חשמלי"
        >
          <Zap
            fill="#1a0800"
            color="#1a0800"
            style={{ width: 'clamp(48px, 14vw, 68px)', height: 'clamp(48px, 14vw, 68px)' }}
          />
          <span
            className="font-black text-[#1a0800]"
            style={{ fontSize: 'clamp(1rem, 4vw, 1.4rem)' }}
          >
            שוק חשמלי
          </span>

          {/* Shock counter badge */}
          {shockCount > 0 && (
            <span
              className="absolute -top-2 -right-2 min-w-[2.5rem] h-10 px-2 rounded-full flex items-center justify-center font-black text-lg bg-white text-amber-900"
              style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.45)' }}
            >
              {shockCount}
            </span>
          )}
        </button>

        {/* Last shock info */}
        {shockCount > 0 && shockLogs[shockCount - 1] && (
          <p className="text-slate-500 text-xs font-mono">
            שוק אחרון: {shockLogs[shockCount - 1].time} · {shockLogs[shockCount - 1].elapsed} מהתחלה
          </p>
        )}
      </div>

      {/* ── Bottom: Metronome toggle ── */}
      <div className="relative z-20 flex items-center justify-center pb-14 px-6">
        <button
          onClick={toggleAudio}
          className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm active:scale-95 transition-all"
          style={{
            backgroundColor: isAudioMuted ? 'rgba(80,80,100,0.3)' : 'rgba(245,158,11,0.14)',
            border: isAudioMuted
              ? '1.5px solid rgba(130,130,160,0.35)'
              : '1.5px solid rgba(245,158,11,0.45)',
            color: isAudioMuted ? '#6b7280' : '#f5c842',
          }}
          aria-label={isAudioMuted ? 'הפעל מטרונום' : 'הפסק מטרונום'}
        >
          {isAudioMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          {isAudioMuted ? 'הפעל מטרונום' : 'הפסק מטרונום'}
        </button>
      </div>
    </div>
  );
}
