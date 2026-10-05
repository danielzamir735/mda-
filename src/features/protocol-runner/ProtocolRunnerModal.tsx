import { useEffect, useRef } from 'react';
import { X, Ambulance } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import HapticButton from '../../components/HapticButton';
import { createProtocolRunner } from './engine.js';
import './runner.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProtocolRunnerModal({ isOpen, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useModalBackHandler(isOpen, onClose);

  useEffect(() => {
    if (!isOpen || !rootRef.current) return;
    const game = createProtocolRunner(rootRef.current);
    return () => game.destroy();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[75] flex flex-col bg-emt-dark" dir="rtl">
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-emt-border">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-emt-red/20 border border-emt-red/30 flex items-center justify-center shrink-0">
            <Ambulance size={18} className="text-emt-red" />
          </div>
          <div className="min-w-0">
            <p className="text-emt-light font-bold text-base leading-tight">ריצת פרוטוקול</p>
            <p className="text-emt-muted text-xs">קוצר נשימה</p>
          </div>
        </div>
        <HapticButton
          onClick={onClose}
          hapticPattern={8}
          pressScale={0.9}
          aria-label="סגור"
          className="w-9 h-9 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center text-emt-muted shrink-0"
        >
          <X size={18} />
        </HapticButton>
      </div>
      <div className="relative flex-1 min-h-0">
        <div ref={rootRef} />
      </div>
    </div>
  );
}
