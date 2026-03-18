import { useState } from 'react';
import {
  MoreVertical, CheckCircle, ExternalLink, ListChecks,
  PlusCircle, ChevronRight, Download,
} from 'lucide-react';
import { usePwaInstall } from './PwaInstallContext';

type Tab = 'android' | 'ios';

/* ── Star SVG icon ── */
const StarIcon = ({ size = 28 }: { size?: number }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
    <path d="M24 4L29 17H43L32 26L36 39L24 31L12 39L16 26L5 17H19L24 4Z" fill="white" />
  </svg>
);

/* ── Step card ── */
function StepCard({
  index, icon, title, desc,
}: { index: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/8">
      {/* Number badge */}
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs
                       font-bold flex items-center justify-center mt-0.5">
        {index}
      </span>
      {/* Icon */}
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30
                      flex items-center justify-center text-blue-400 mt-0.5">
        {icon}
      </div>
      {/* Text */}
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
      {/* Dynamic status / install box */}
      {deferredPrompt ? (
        <button
          onClick={onInstall}
          className="w-full py-4 rounded-2xl bg-gradient-to-l from-blue-500 to-blue-600
                     text-white font-bold text-lg shadow-lg shadow-blue-500/40
                     active:scale-95 transition-all duration-200 hover:from-blue-400 hover:to-blue-500"
        >
          התקן עכשיו
        </button>
      ) : (
        <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/35 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-400 font-bold text-sm">מכין התקנה... ⌛</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </div>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            ⌛ אם הסטטוס לא משתנה, בצע את ההתקנה הידנית לפי השלבים למטה:
          </p>
        </div>
      )}

      {/* Manual steps */}
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
      {/* Safari alert */}
      <div className="rounded-2xl bg-amber-500/15 border border-amber-500/35 px-4 py-3 flex items-start gap-2">
        <span className="text-amber-400 text-base mt-0.5">⚠️</span>
        <p className="text-amber-300 text-sm font-medium leading-snug">
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
    <div className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto" style={{ direction: 'rtl' }}>
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

      {/* Content container */}
      <div className="relative flex flex-col min-h-full w-full max-w-md mx-auto px-5 py-8 gap-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700
                          flex items-center justify-center shadow-xl shadow-blue-600/40
                          border border-blue-400/20">
            <StarIcon size={36} />
          </div>
          <div className="text-center">
            <h1 className="text-white font-extrabold text-2xl tracking-tight">התקן את חובש+</h1>
            <p className="text-slate-400 text-sm mt-1">גישה מהירה · עבודה במצב לא מקוון</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl bg-white/6 border border-white/8 p-1 gap-1">
          {(['android', 'ios'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                tab === t
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'android' ? '🤖 אנדרואיד' : '🍎 אייפון (iOS)'}
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
          onClick={closeFullModal}
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
