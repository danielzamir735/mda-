import { useState, useEffect, useRef } from 'react';

export type TimerState = 'idle' | 'running' | 'finished';

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 1.0; // maximize output volume
    osc.connect(gain);
    gain.connect(masterGain);
    masterGain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    const t = ctx.currentTime;
    // First beep (0–0.4s)
    gain.gain.setValueAtTime(1.5, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.4);
    // Gap (0.4–0.6s) — gain stays at 0
    // Second beep (0.6–1.0s)
    gain.gain.setValueAtTime(1.5, t + 0.6);
    gain.gain.linearRampToValueAtTime(0, t + 1.0);
    osc.start(t);
    osc.stop(t + 1.0);
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
