import { useState, useEffect } from 'react';
import { X, Share, Plus, MoreVertical, ChevronLeft, Smartphone, Download, CheckCircle2 } from 'lucide-react';
import { usePwaInstall } from './PwaInstallContext';

type Tab = 'android' | 'ios';

function AndroidSteps({ deferredPrompt, onInstall }: {
  deferredPrompt: ReturnType<typeof usePwaInstall>['deferredPrompt'];
  onInstall: () => Promise<void>;
}) {
  const [status, setStatus] = useState<'idle' | 'preparing' | 'ready'>('idle');

  useEffect(() => {
    if (deferredPrompt) {
      setStatus('preparing');
      const t = setTimeout(() => setStatus('ready'), 1400);
      return () => clearTimeout(t);
    }
  }, [deferredPrompt]);

  if (deferredPrompt) {
    return (
      <div className="flex flex-col items-center gap-6 py-4">
        {status !== 'ready' ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Smartphone className="w-7 h-7 text-blue-400 animate-pulse" />
            </div>
            <p className="text-emt-muted text-sm">מכין את ההתקנה...</p>
            <div className="flex gap-1.5 mt-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.18}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full text-center animate-fade-scale">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-emt-light font-medium">האפליקציה מוכנה להתקנה!</p>
            <button
              onClick={onInstall}
              className="w-full py-4 rounded-2xl bg-blue-500 hover:bg-blue-400 active:scale-95
                         text-white font-bold text-lg transition-all duration-200 shadow-lg shadow-blue-500/30"
            >
              התקן עכשיו
            </button>
          </div>
        )}
      </div>
    );
  }

  // Manual steps for Android (no native prompt yet)
  const steps = [
    { icon: <MoreVertical className="w-5 h-5" />, text: 'פתח את תפריט הדפדפן (שלוש הנקודות)' },
    { icon: <Download className="w-5 h-5" />, text: 'בחר "הוסף למסך הבית" או "התקן אפליקציה"' },
    { icon: <CheckCircle2 className="w-5 h-5" />, text: 'לחץ "הוסף" לאישור' },
  ];

  return <StepList steps={steps} />;
}

function IOSSteps() {
  const steps = [
    { icon: <Share className="w-5 h-5" />, text: 'לחץ על כפתור השיתוף בתחתית Safari' },
    { icon: <Plus className="w-5 h-5" />, text: 'גלול ובחר "הוסף למסך הבית"' },
    { icon: <CheckCircle2 className="w-5 h-5" />, text: 'לחץ "הוסף" בפינה הימנית העליונה' },
  ];
  return <StepList steps={steps} />;
}

function StepList({ steps }: { steps: { icon: React.ReactNode; text: string }[] }) {
  return (
    <div className="flex flex-col gap-4 py-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-4 rtl:flex-row-reverse">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25
                          flex items-center justify-center text-blue-400">
            {step.icon}
          </div>
          <div className="flex-1 flex items-center gap-3 rtl:flex-row-reverse">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs
                             font-bold flex items-center justify-center">{i + 1}</span>
            <p className="text-emt-light text-sm leading-relaxed text-right">{step.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FullInstallModal() {
  const { showFullModal, closeFullModal, deferredPrompt, handleInstall, isIOS } = usePwaInstall();
  const [tab, setTab] = useState<Tab>(isIOS ? 'ios' : 'android');

  if (!showFullModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{ direction: 'rtl' }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeFullModal} />

      {/* Card */}
      <div className="relative w-full sm:max-w-md mx-auto bg-gradient-to-b from-[#13131a] to-[#0d0d12]
                      border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl
                      overflow-hidden animate-slide-up sm:animate-fade-scale">
        {/* Header */}
        <div className="relative px-5 pt-6 pb-4">
          <button onClick={closeFullModal}
            className="absolute top-5 left-4 p-2 rounded-xl hover:bg-white/10 transition-colors text-emt-muted hover:text-emt-light">
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700
                            flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
                <path d="M24 6L28 18H40L30 26L34 38L24 30L14 38L18 26L8 18H20L24 6Z"
                  fill="white" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-emt-light font-bold text-xl">התקן את חובש+</h2>
              <p className="text-emt-muted text-sm mt-1">גישה מהירה, עבודה במצב לא מקוון</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mx-5 mb-5 rounded-xl bg-white/5 p-1 gap-1">
          {(['android', 'ios'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === t
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-emt-muted hover:text-emt-light'
              }`}>
              {t === 'android' ? 'אנדרואיד' : 'אייפון (iOS)'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-5 pb-2 min-h-[200px]">
          {tab === 'android'
            ? <AndroidSteps deferredPrompt={deferredPrompt} onInstall={handleInstall} />
            : <IOSSteps />}
        </div>

        {/* Footer */}
        <div className="px-5 pb-8 pt-4">
          <button onClick={closeFullModal}
            className="w-full py-3.5 rounded-2xl border border-white/10 text-emt-muted
                       hover:text-emt-light hover:bg-white/5 transition-all duration-200
                       flex items-center justify-center gap-2 font-medium">
            <ChevronLeft className="w-4 h-4 rotate-180" />
            חזור אחורה
          </button>
        </div>
      </div>
    </div>
  );
}
