import { useState, useEffect, useRef } from 'react';

export type TimerState = 'idle' | 'running' | 'finished';

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(1.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.0);
    osc.onended = () => ctx.close();
  } catch {
    // AudioContext unavailable — silent fallback
  }
}

export function useVitalsTimer(duration: number) {
  const [state, setState] = useState<TimerState>('idle');
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync displayed time when duration changes while idle
  useEffect(() => {
    if (state === 'idle') setTimeLeft(duration);
  }, [duration, state]);

  // Beep when timer finishes
  useEffect(() => {
    if (state === 'finished') playBeep();
  }, [state]);

  useEffect(() => {
    if (state !== 'running') return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setState('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state]);

  const start = () => {
    setTimeLeft(duration);
    setState('running');
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(duration);
    setState('idle');
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(duration);
    setState('idle');
  };

  return { state, timeLeft, start, stop, reset };
}
