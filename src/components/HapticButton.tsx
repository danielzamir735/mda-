import { motion, type HTMLMotionProps } from 'framer-motion';
import { useHaptics } from '../hooks/useHaptics';

interface HapticButtonProps extends HTMLMotionProps<'button'> {
  /** Vibration pattern in ms. Default: 8ms – subtle tap. */
  hapticPattern?: VibratePattern;
  /** Scale on press. Default: 0.93 */
  pressScale?: number;
}

/**
 * Drop-in replacement for <button> that adds:
 *  1. Spring-scale-down animation on press (whileTap)
 *  2. Haptic vibration (respects hapticsEnabled from settingsStore)
 */
export default function HapticButton({
  hapticPattern = 8,
  pressScale = 0.93,
  onPointerDown,
  children,
  ...props
}: HapticButtonProps) {
  const vibrate = useHaptics();

  return (
    <motion.button
      whileTap={{ scale: pressScale }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onPointerDown={(e) => {
        vibrate(hapticPattern);
        onPointerDown?.(e);
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
