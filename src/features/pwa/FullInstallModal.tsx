import { useState } from 'react';
import {
  MoreVertical, CheckCircle, ExternalLink, ListChecks,
  PlusCircle, ChevronRight, Download, Smartphone, Apple, AlertTriangle,
  X, ShieldPlus, Activity,
} from 'lucide-react';
import { usePwaInstall } from './PwaInstallContext';

type Tab = 'android' | 'ios';

/* ── Premium EMS app icon ── */
const AppIcon = () => (
  <div className="relative flex items-center justify-center">
    <ShieldPlus className="w-9 h-9 text-white drop-shadow-lg" strokeWidth={1.5} />
    <Activity
      className="absolute bottom-0 right-0 w-4 h-4 text-blue-200 opacity-90"
      strokeWidth={2}
    />
  </div>
);

/* ── Step card ── */
function StepCard({
  index, icon, title, desc,
}: { index: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/8">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs
                       font-bold flex items-center justify-center mt-0.5">
        {index}
      </span>
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30
                      flex items-center justify-center text-blue-400 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 text-right">
        <p className="text-white font-semibold text-sm leading-snug">{title}</p>
        <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ── Android tab content ── */
function AndroidContent({
  deferredPrompt,
  onInstall,
}: {
  deferredPrompt: ReturnType<typeof usePwaInstall>['deferredPrompt'];
  onInstall: () => Promise<void>;
}) {
  const steps = [
    {
      icon: <MoreVertical className="w-4 h-4 rotate-90" />,
      title: 'פתח את התפריט',
      desc: 'לחץ על סמל שלוש הנקודות (⋮) בפינה העליונה של הדפדפן.',
    },
    {
      icon: <Download className="w-4 h-4" />,
      title: 'בחר בהתקנה',
      desc: "חפש ולחץ על 'התקנת אפליקציה' או 'הוסף למסך הבית'.",
    },
    {
      icon: <CheckCircle className="w-4 h-4" />,
      title: 'אשר את ההתקנה',
      desc: "בחלון שנפתח, לחץ על 'התקן'.",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {deferredPrompt ? (
        /* One-tap install available */
        <button
          onClick={onInstall}
          className="w-full py-5 rounded-2xl bg-gradient-to-l from-blue-500 to-blue-600
                     text-white font-extrabold text-xl shadow-xl shadow-blue-500/40
                     active:scale-95 transition-all duration-200 hover:from-blue-400 hover:to-blue-500
                     flex items-center justify-center gap-3"
        >
          <Download className="w-6 h-6" />
          התקן אפליקציה בלחיצה
        </button>
      ) : (
        /* Native prompt unavailable — show manual steps only */
        <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
          <p className="text-slate-300 text-sm font-semibold text-right">התקנה ידנית</p>
          <p className="text-slate-400 text-xs mt-1 text-right leading-relaxed">
            עקוב אחר השלבים הבאים כדי להוסיף את האפליקציה למסך הבית שלך.
          </p>
        </div>
      )}

      {steps.map((s, i) => (
        <StepCard key={i} index={i + 1} icon={s.icon} title={s.title} desc={s.desc} />
      ))}
    </div>
  );
}

/* ── iOS tab content ── */
function IosContent() {
  const steps = [
    {
      icon: <ExternalLink className="w-4 h-4" />,
      title: 'כפתור השיתוף',
      desc: 'לחץ על כפתור השיתוף (ריבוע עם חץ) בתחתית המסך.',
    },
    {
      icon: <ListChecks className="w-4 h-4" />,
      title: 'הוסף למסך הבית',
      desc: "גלול בתפריט למטה עד שתמצא את האפשרות 'הוסף למסך הבית' (Add to Home Screen).",
    },
    {
      icon: <PlusCircle className="w-4 h-4" />,
      title: 'סיום',
      desc: "לחץ על הוסף (Add) בפינה העליונה.",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-amber-500/15 border border-amber-500/35 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-amber-300 text-sm font-medium leading-snug text-right">
          שים לב: ההתקנה אפשרית רק דרך דפדפן Safari.
        </p>
      </div>

      {steps.map((s, i) => (
        <StepCard key={i} index={i + 1} icon={s.icon} title={s.title} desc={s.desc} />
      ))}
    </div>
  );
}

/* ── Main modal ── */
export default function FullInstallModal() {
  const { showFullModal, closeFullModal, deferredPrompt, handleInstall, isIOS } = usePwaInstall();
  const [tab, setTab] = useState<Tab>(isIOS ? 'ios' : 'android');

  if (!showFullModal) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col overflow-y-auto" style={{ direction: 'rtl' }}>
      {/* Midnight-blue gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#080b1c] via-[#0a0e22] to-[#060816]" />
      {/* Glow accents */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 30% 15%, rgba(59,130,246,0.12) 0%, transparent 70%), ' +
            'radial-gradient(ellipse 50% 40% at 75% 80%, rgba(99,102,241,0.09) 0%, transparent 70%)',
        }}
      />

      {/* X close button — top-left */}
      <button
        onClick={closeFullModal}
        className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white transition-colors z-10"
        aria-label="סגור"
      >
        <X size={24} />
      </button>

      {/* Content container */}
      <div className="relative flex flex-col min-h-full w-full max-w-md mx-auto px-5 py-8 gap-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700
                          flex items-center justify-center shadow-2xl shadow-blue-500/50
                          border-2 border-blue-400/30 ring-4 ring-blue-500/10">
            {/* Outer glow pulse ring */}
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '2.5s' }} />
            <AppIcon />
          </div>
          <div className="text-center">
            <h1 className="text-white font-extrabold text-2xl tracking-tight">התקן את חובש+</h1>
            <p className="text-slate-400 text-sm mt-1">גישה מהירה · עבודה במצב לא מקוון</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl bg-white/6 border border-white/8 p-1 gap-1">
          {([
            { id: 'android' as Tab, label: 'אנדרואיד', Icon: Smartphone },
            { id: 'ios' as Tab, label: 'אייפון (iOS)', Icon: Apple },
          ]).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                          flex items-center justify-center gap-2 ${
                tab === id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1">
          {tab === 'android' ? (
            <AndroidContent deferredPrompt={deferredPrompt} onInstall={handleInstall} />
          ) : (
            <IosContent />
          )}
        </div>

        {/* Back button footer */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); closeFullModal(); }}
          className="w-full py-4 rounded-2xl border border-white/12 text-slate-300
                     hover:text-white hover:bg-white/6 active:scale-95 transition-all duration-200
                     flex items-center justify-center gap-2 font-semibold text-base mt-2"
        >
          <ChevronRight className="w-5 h-5" />
          חזור אחורה
        </button>
      </div>
    </div>
  );
}
