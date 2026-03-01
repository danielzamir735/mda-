import { useEffect, useRef } from 'react';
import { useMetronomeStore } from '../../../store/metronomeStore';

export function useMetronome() {
  const { bpm, isPlaying } = useMetronomeStore();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playTick = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    gain.gain.setValueAtTime(1.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  };

  useEffect(() => {
    if (isPlaying) {
      // Lazily create AudioContext on first play (browser policy)
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      // Resume if suspended
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      playTick(); // immediate first tick
      intervalRef.current = setInterval(playTick, 60000 / bpm);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, bpm]);
}
