import { useState } from 'react';
import { X, Wind } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type PressureUnit = 'bar' | 'psi';

export default function OxygenCalculatorModal({ isOpen, onClose }: Props) {
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>('bar');
  const [pressure, setPressure] = useState('');
  const [volume, setVolume] = useState('');
  const [flow, setFlow] = useState('');

  if (!isOpen) return null;

  const pressureNum = parseFloat(pressure);
  const volumeNum = parseFloat(volume);
  const flowNum = parseFloat(flow);

  const allFilled = pressure !== '' && volume !== '' && flow !== ''
    && !isNaN(pressureNum) && !isNaN(volumeNum) && !isNaN(flowNum)
    && flowNum > 0 && volumeNum > 0 && pressureNum > 0;

  let minutes: number | null = null;
  if (allFilled) {
    if (pressureUnit === 'bar') {
      minutes = (pressureNum * volumeNum) / flowNum;
    } else {
      minutes = ((pressureNum / 15) * volumeNum) / flowNum;
    }
    minutes = Math.floor(minutes);
  }

  const handleReset = () => {
    setPressure('');
    setVolume('');
    setFlow('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white
                   shadow-2xl overflow-hidden animate-fade-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center px-5 pt-5 pb-4
                        border-b border-slate-100">
          <button
            onClick={onClose}
            className="absolute right-4 w-9 h-9 rounded-full bg-slate-100
                       flex items-center justify-center
                       text-slate-400 hover:text-slate-700 hover:bg-slate-200
                       active:scale-90 transition-all"
            aria-label="סגור"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Wind size={20} className="text-emt-blue" />
            <p className="text-emt-light font-bold text-lg">מחשבון חמצן</p>
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">

          {/* Pressure row: input + Bar/PSI toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-emt-muted uppercase tracking-wide">
              לחץ בבלון
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={pressure}
                onChange={e => setPressure(e.target.value)}
                placeholder="0"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl
                           px-4 py-3 text-slate-900 text-lg font-semibold
                           placeholder:text-slate-300 focus:outline-none
                           focus:border-emt-blue focus:ring-2 focus:ring-emt-blue/20"
              />
              {/* Bar / PSI toggle */}
              <div className="flex rounded-xl border border-slate-200 overflow-hidden shrink-0">
                <button
                  onClick={() => setPressureUnit('bar')}
                  className={[
                    'px-4 py-2 text-sm font-bold transition-colors duration-150',
                    pressureUnit === 'bar'
                      ? 'bg-emt-blue text-white'
                      : 'bg-white text-slate-500 hover:bg-slate-50',
                  ].join(' ')}
                >
                  Bar
                </button>
                <button
                  onClick={() => setPressureUnit('psi')}
                  className={[
                    'px-4 py-2 text-sm font-bold transition-colors duration-150',
                    pressureUnit === 'psi'
                      ? 'bg-emt-blue text-white'
                      : 'bg-white text-slate-500 hover:bg-slate-50',
                  ].join(' ')}
                >
                  PSI
                </button>
              </div>
            </div>
          </div>

          {/* Volume */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-emt-muted uppercase tracking-wide">
              נפח הבלון (ליטר)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={volume}
              onChange={e => setVolume(e.target.value)}
              placeholder="0"
              className="bg-slate-50 border border-slate-200 rounded-xl
                         px-4 py-3 text-slate-900 text-lg font-semibold
                         placeholder:text-slate-300 focus:outline-none
                         focus:border-emt-blue focus:ring-2 focus:ring-emt-blue/20"
            />
          </div>

          {/* Flow rate */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-emt-muted uppercase tracking-wide">
              קצב זרימה (ליטר/דקה)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={flow}
              onChange={e => setFlow(e.target.value)}
              placeholder="0"
              className="bg-slate-50 border border-slate-200 rounded-xl
                         px-4 py-3 text-slate-900 text-lg font-semibold
                         placeholder:text-slate-300 focus:outline-none
                         focus:border-emt-blue focus:ring-2 focus:ring-emt-blue/20"
            />
          </div>

          {/* Result display */}
          <div
            className={[
              'rounded-2xl border px-5 py-4 text-center transition-all duration-300',
              minutes !== null
                ? 'bg-blue-50 border-blue-200'
                : 'bg-slate-50 border-slate-200',
            ].join(' ')}
          >
            {minutes !== null ? (
              <>
                <p className="text-emt-muted text-xs font-semibold uppercase tracking-wide mb-1">
                  זמן חמצן משוער
                </p>
                <p
                  className="font-black tabular-nums text-emt-blue leading-none"
                  style={{ fontSize: 'clamp(3rem, 14vw, 5rem)' }}
                >
                  {minutes}
                </p>
                <p className="text-emt-muted text-sm font-medium mt-1">דקות</p>
              </>
            ) : (
              <p className="text-slate-300 text-sm font-medium py-2">
                מלא את כל השדות לחישוב
              </p>
            )}
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="w-full py-3 rounded-xl bg-slate-100 border border-slate-200
                       text-slate-600 font-semibold text-sm
                       active:scale-95 transition-transform duration-150
                       hover:bg-slate-200"
          >
            אפס
          </button>
        </div>
      </div>
    </div>
  );
}
