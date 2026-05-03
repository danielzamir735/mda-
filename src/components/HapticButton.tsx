import type { ButtonHTMLAttributes, PointerEvent } from 'react';
import { useHaptics } from '../hooks/useHaptics';

interface HapticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  hapticPattern?: VibratePattern;
  pressScale?: number;
}

export default function HapticButton({
  hapticPattern = 8,
  pressScale = 0.93,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  children,
  ...props
}: HapticButtonProps) {
  const vibrate = useHaptics();

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    vibrate(hapticPattern);
    e.currentTarget.style.transform = `scale(${pressScale})`;
    onPointerDown?.(e);
  };

  const clearScale = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = '';
  };

  return (
    <button
      {...props}
      style={{ transition: 'transform 100ms ease-out', ...props.style }}
      onPointerDown={handlePointerDown}
      onPointerUp={(e) => { clearScale(e); onPointerUp?.(e); }}
      onPointerCancel={(e) => { clearScale(e); onPointerCancel?.(e); }}
      onPointerLeave={(e) => { clearScale(e); onPointerLeave?.(e); }}
    >
      {children}
    </button>
  );
}
