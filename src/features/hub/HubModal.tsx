import { X, Calculator, BookOpen, Settings, Stethoscope, MessageSquare, MapPin, Pill, Building2, Share2, ClipboardList, Download, Languages, Skull, Accessibility, Wind, ScanSearch, Users, HeartPulse, ExternalLink, Brain, Trophy, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import HapticButton from '../../components/HapticButton';
import type { LucideIcon } from 'lucide-react';
import { usePwaInstall } from '../pwa/PwaInstallContext';
import { trackInteraction } from '../../utils/analytics';
import FlashcardTrainer, { type FlashcardItem } from '../../components/FlashcardTrainer';

const SIMULATOR_FLASHCARDS: FlashcardItem[] = [
  { front: 'קצב לחיצות CPR', back: '100–120 לחיצות לדקה' },
  { front: 'עומק לחיצות CPR — מבוגר', back: '5–6 ס"מ' },
  { front: 'עומק לחיצות CPR — ילד (מעל גיל שנה)', back: '≈ 5 ס"מ (שליש עומק החזה)' },
  { front: 'יחס לחיצות:נשימות — מחייה אחד', back: '30:2' },
  { front: 'יחס לחיצות:נשימות — שני מחיים (ילד)', back: '15:2' },
  { front: 'קצבים בעלי דפיברילציה', back: 'VF · pVT (פרפור חדרים / טכיקרדיה חדרית ללא דופק)' },
  { front: 'אנרגיה ראשונה לדפיברילציה (דו-פאזי)', back: '150–200 ג\'ול (לפי הוראת היצרן)' },
  { front: 'כל כמה זמן מזריקים אדרנלין ב-CPR?', back: 'כל 3–5 דקות (1 מ"ג IV/IO)' },
  { front: 'אינדיקציה ל-RSI בשדה', back: 'חסימת דרכי אוויר, GCS ≤ 8, נשימה לא מספיקה' },
  { front: 'ציון APGAR — 5 פרמטרים', back: 'Appearance · Pulse · Grimace · Activity · Respiration' },
  { front: 'מהו שוק חסימתי (Obstructive Shock)?', back: 'חסימה פיזית לזרימת דם: טמפונדה, פנאומוטורקס מתח, תסחיף ריאתי' },
  { front: 'טריאס בק — סימני טמפונדה', back: 'צלילות לב מופחתת · ורידי צוואר נפוחים · לחץ דם נמוך' },
  { front: 'Glasgow Coma Scale — טווח', back: '3 (מינימום) עד 15 (תקין)' },
  { front: 'סימני שוק — 5 עיקריים', back: 'דופק מהיר וחלש · לחץ דם נמוך · חיוורון/הזעה · בלבול · שתן מועט' },
  { front: 'מינון אסקורין (Aspirin) ב-ACS', back: '300 מ"ג ללעיסה' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCalculatorsOpen: () => void;
  onSettingsOpen: () => void;
  onVitalsReferenceOpen: () => void;
  onFeedbackOpen: () => void;
  onMedicalHistoryOpen: () => void;
  onHospitalsOpen: () => void;
  onUpdatesOpen: () => void;
  onBagStandardsOpen: () => void;
  onMedicationsOpen: () => void;
  onCommonMedsOpen: () => void;
  onTranslatorOpen: () => void;
  onPoisonCentersOpen: () => void;
  onAccessibilityOpen: () => void;
  onBreathingOpen: () => void;
  onMedicationScannerOpen: () => void;
  onDailyChallengeOpen: () => void;
  onSoulDepartureOpen: () => void;
}

type HubItem = {
  id: string;
  label: string;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  border: string;
  bg: string;
  href?: string;
};

const HUB_ITEMS: HubItem[] = [
  {
    id: 'medication-scanner',
    label: 'מידע על תרופות',
    icon: ScanSearch,
    color: 'text-teal-400',
    border: 'border-teal-400/30',
    bg: 'bg-teal-400/10',
  },
  {
    id: 'daily-challenge',
    label: 'האתגר היומי',
    subtitle: 'BLS + ALS · שאלות יומיות',
    icon: Trophy,
    color: 'text-yellow-400',
    border: 'border-yellow-400/40',
    bg: 'bg-gradient-to-br from-yellow-500/15 via-amber-500/10 to-orange-500/5',
  },
  {
    id: 'medhistory',
    label: 'מחלות רקע נפוצות',
    icon: Stethoscope,
    color: 'text-purple-400',
    border: 'border-purple-400/30',
    bg: 'bg-purple-400/10',
  },
  {
    id: 'medications-classification',
    label: 'קבוצות תרופות',
    icon: Pill,
    color: 'text-teal-400',
    border: 'border-teal-400/30',
    bg: 'bg-teal-400/10',
  },
  {
    id: 'common-meds',
    label: 'תרופות נפוצות',
    icon: Pill,
    color: 'text-emerald-400',
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-400/10',
  },
  {
    id: 'clinical',
    label: 'טבלת מדדים',
    icon: BookOpen,
    color: 'text-blue-400',
    border: 'border-blue-400/30',
    bg: 'bg-blue-400/10',
  },
  {
    id: 'calculators',
    label: 'מחשבונים',
    icon: Calculator,
    color: 'text-emt-green',
    border: 'border-emt-green/30',
    bg: 'bg-emt-green/10',
  },
  {
    id: 'hospitals',
    label: 'מידע בתי חולים',
    icon: Building2,
    color: 'text-cyan-400',
    border: 'border-cyan-400/30',
    bg: 'bg-cyan-400/10',
  },
  {
    id: 'realtime-translate',
    label: 'תרגום רפואי',
    icon: Languages,
    color: 'text-orange-400',
    border: 'border-orange-400/30',
    bg: 'bg-orange-400/10',
  },
  {
    id: 'updates',
    label: 'שיתוף האפליקציה',
    icon: Share2,
    color: 'text-blue-400',
    border: 'border-blue-400/30',
    bg: 'bg-blue-400/10',
  },
  {
    id: 'install-app',
    label: 'התקנת האפליקציה',
    icon: Download,
    color: 'text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/10',
  },
  {
    id: 'poison-centers',
    label: 'מרכזי הרעלות',
    icon: Skull,
    color: 'text-lime-400',
    border: 'border-lime-400/30',
    bg: 'bg-lime-400/10',
  },
  {
    id: 'settings',
    label: 'הגדרות',
    icon: Settings,
    color: 'text-gray-500 dark:text-emt-muted',
    border: 'border-gray-200 dark:border-emt-border',
    bg: 'bg-gray-100 dark:bg-emt-gray',
  },
  {
    id: 'accessibility',
    label: 'נגישות',
    icon: Accessibility,
    color: 'text-violet-400',
    border: 'border-violet-400/30',
    bg: 'bg-violet-400/10',
  },
  {
    id: 'breathing',
    label: 'מסנכרן נשימות',
    icon: Wind,
    color: 'text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/10',
  },
  {
    id: 'kit-standards',
    label: 'תקנים לתיקי כונן',
    icon: ClipboardList,
    color: 'text-indigo-400',
    border: 'border-indigo-400/30',
    bg: 'bg-indigo-400/10',
  },
  {
    id: 'defibrillator',
    label: 'מצא דפיברילטור קרוב',
    icon: MapPin,
    color: 'text-emt-red',
    border: 'border-emt-red/30',
    bg: 'bg-emt-red/10',
    href: 'https://defi.co.il/#/map',
  },
  {
    id: 'whatsapp-community',
    label: 'קהילת חובש +',
    subtitle: 'הצטרפו לקהילה שלנו',
    icon: Users,
    color: 'text-green-400',
    border: 'border-green-400/30',
    bg: 'bg-green-400/10',
  },
  {
    id: 'simulators',
    label: 'סימולטורים ללמידה',
    subtitle: 'אימון ושמירה על כשירות',
    icon: HeartPulse,
    color: 'text-rose-400',
    border: 'border-rose-400/30',
    bg: 'bg-rose-400/10',
  },
  {
    id: 'soul-departure',
    label: 'תפילה ליציאת נשמה',
    subtitle: 'הנחיות ותפילות',
    icon: Star,
    color: 'text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/10',
  },
];

const ENABLED = new Set(['daily-challenge', 'calculators', 'settings', 'clinical', 'medhistory', 'defibrillator', 'hospitals', 'updates', 'kit-standards', 'medications-classification', 'common-meds', 'install-app', 'realtime-translate', 'poison-centers', 'accessibility', 'breathing', 'medication-scanner', 'simulators', 'soul-departure', 'whatsapp-community']);

export default function HubModal({
  isOpen,
  onClose,
  onCalculatorsOpen,
  onSettingsOpen,
  onVitalsReferenceOpen,
  onFeedbackOpen,
  onMedicalHistoryOpen,
  onHospitalsOpen,
  onBagStandardsOpen,
  onMedicationsOpen,
  onCommonMedsOpen,
  onTranslatorOpen,
  onPoisonCentersOpen,
  onAccessibilityOpen,
  onBreathingOpen,
  onMedicationScannerOpen,
  onDailyChallengeOpen,
  onSoulDepartureOpen,
}: Props) {
  const [showSimulators, setShowSimulators] = useState(false);
  const [simFlashcardOpen, setSimFlashcardOpen] = useState(false);
  const [showWhatsAppCommunity, setShowWhatsAppCommunity] = useState(false);
  const { openFullModal } = usePwaInstall();

  // Reset simulators view when hub closes so re-opening always shows the tools menu
  useEffect(() => {
    if (!isOpen) setShowSimulators(false);
  }, [isOpen]);

  useModalBackHandler(isOpen, onClose);
  // Give simulators its own back-button layer so back returns to the tools menu, not home
  useModalBackHandler(showSimulators, () => setShowSimulators(false));
  useModalBackHandler(showWhatsAppCommunity, () => setShowWhatsAppCommunity(false));
  if (!isOpen) return null;

  const HUB_TRACKING: Record<string, [string, string]> = {
    'daily-challenge':            ['האתגר היומי',             'learning'],
    calculators:                  ['מחשבונים',                'calculators'],
    settings:                     ['הגדרות',                  'utility'],
    clinical:                     ['טבלת מדדים',              'medical_knowledge'],
    medhistory:                   ['מחלות רקע נפוצות',        'medical_knowledge'],
    hospitals:                    ['מידע בתי חולים',           'emergency_info'],
    updates:                      ['שיתוף האפליקציה',          'utility'],
    'kit-standards':              ['תקנים לתיקי כונן',         'tools'],
    'medications-classification': ['קבוצות תרופות',            'medical_knowledge'],
    'common-meds':                ['תרופות נפוצות',            'medical_knowledge'],
    'realtime-translate':         ['תרגום רפואי',              'tools'],
    'poison-centers':             ['מרכזי הרעלות',             'emergency_info'],
    accessibility:                ['נגישות',                  'utility'],
    breathing:                    ['מסנכרן נשימות',            'tools'],
    'medication-scanner':         ['מידע על תרופות',           'tools'],
    simulators:                   ['סימולטורים ללמידה',        'community_learning'],
    'soul-departure':             ['תפילה ליציאת נשמה',        'tools'],
    'install-app':                ['התקנת האפליקציה',          'utility'],
    'whatsapp-community':         ['קהילת חובש +',             'community_learning'],
  };

  const handleItemClick = (id: string) => {
    const tracking = HUB_TRACKING[id];
    if (tracking) trackInteraction(tracking[0], tracking[1]);

    if (id === 'calculators')  onCalculatorsOpen();
    if (id === 'settings')     onSettingsOpen();
    if (id === 'clinical')     onVitalsReferenceOpen();
    if (id === 'medhistory')   onMedicalHistoryOpen();
    if (id === 'hospitals')    onHospitalsOpen();
    if (id === 'updates') {
      const shareText = `מע"ר? חובש? פרמדיק? 🚑
מצאתי את האפליקציה המושלמת לשטח - 'חובש +'. אפליקציה חינמית לחלוטין וללא פרסומות שיש בה הכל:
🔥 מחשבון כוויות, חמצן ואפגר
🗣️ תרגום רפואי בזמן אמת למטופלים
🎒 פירוט תקני ציוד (BLS וכו')
📍 ניווט מהיר ישירות לחדרי מיון
💊 מידע על תרופות, מרכזי הרעלות ועוד
⏱️ טיימרים אינטראקטיביים למדידת דופק ונשימה
🏆 האתגר היומי לשמירה על כשירות
🎵 מטרונום לקצב לחיצות CPR

ממליץ בחום שזה יהיה על הטלפון שלכם במשמרת הבאה. להורדה/כניסה:
https://chovesh-plus.vercel.app/`;
      if (navigator.share) {
        navigator.share({ title: 'חובש+', text: shareText }).catch(() => {});
      } else {
        navigator.clipboard?.writeText(shareText).catch(() => {});
      }
    }
    if (id === 'kit-standards') onBagStandardsOpen();
    if (id === 'medications-classification') onMedicationsOpen();
    if (id === 'common-meds') onCommonMedsOpen();
    if (id === 'realtime-translate') onTranslatorOpen();
    if (id === 'poison-centers') onPoisonCentersOpen();
    if (id === 'accessibility') onAccessibilityOpen();
    if (id === 'breathing') onBreathingOpen();
    if (id === 'medication-scanner') onMedicationScannerOpen();
    if (id === 'daily-challenge') onDailyChallengeOpen();
    if (id === 'soul-departure') onSoulDepartureOpen();
    if (id === 'simulators') setShowSimulators(true);
    if (id === 'whatsapp-community') setShowWhatsAppCommunity(true);
    if (id === 'install-app') { onClose(); setTimeout(openFullModal, 150); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-emt-dark overflow-hidden">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
        <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl">מרכז כלים</h2>
        <HapticButton
          onClick={onClose}
          pressScale={0.88}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                     flex items-center justify-center
                     text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
          aria-label="סגור"
        >
          <X size={20} />
        </HapticButton>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {HUB_ITEMS.map(({ id, label, subtitle, icon: Icon, color, border, bg, href }) => {
            const enabled = ENABLED.has(id);
            const sharedClass = [
              'flex flex-col items-center justify-center gap-2',
              'rounded-2xl border', border, bg,
              'h-36 transition-transform px-2',
              enabled ? 'active:scale-95 cursor-pointer' : 'opacity-60 cursor-not-allowed',
            ].join(' ');

            const content = (
              <div className="relative flex flex-col items-center justify-center gap-2 w-full h-full px-1">
                <Icon size={36} className={color} />
                <span className={`text-sm font-bold ${color} text-center leading-tight`}>{label}</span>
                {subtitle && (
                  <span className="text-xs text-gray-500 dark:text-emt-muted text-center leading-tight">{subtitle}</span>
                )}
                {id === 'install-app' && (
                  <span className="text-xs text-slate-400 text-center leading-tight">
                    גישה ללא רשת
                  </span>
                )}
                {!enabled && (
                  <span className="text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full">
                    בקרוב
                  </span>
                )}
              </div>
            );

            if (href) {
              return (
                <a
                  key={id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={sharedClass}
                  onClick={() => trackInteraction('מצא דפיברילטור קרוב', 'emergency_info')}
                >
                  {content}
                </a>
              );
            }

            return (
              <HapticButton
                key={id}
                disabled={!enabled}
                onClick={(e) => { e.stopPropagation(); handleItemClick(id); }}
                className={sharedClass}
                pressScale={enabled ? 0.93 : 1}
              >
                {content}
              </HapticButton>
            );
          })}
        </div>

        {/* Feedback button */}
        <HapticButton
          onClick={() => { trackInteraction('שליחת משוב', 'utility'); onFeedbackOpen(); }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl
                     border border-emt-red/30 bg-emt-red/10
                     text-emt-red font-bold text-base"
        >
          <MessageSquare size={22} />
          שליחת משוב
        </HapticButton>

      </div>

      {/* Simulators Modal */}
      {showSimulators && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-emt-dark">
          {/* Header */}
          <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
            <div className="flex items-center gap-2">
              <HeartPulse size={22} className="text-rose-400" />
              <div>
                <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl leading-tight">סימולטורים ללמידה</h2>
                <p className="text-gray-500 dark:text-emt-muted text-xs">אימון ושמירה על כשירות</p>
              </div>
            </div>
            <HapticButton
              onClick={() => setShowSimulators(false)}
              pressScale={0.88}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                         flex items-center justify-center
                         text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
              aria-label="סגור"
            >
              <X size={20} />
            </HapticButton>
          </div>

          {/* Simulator list */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

            {/* Flashcard trainer */}
            <HapticButton
              pressScale={0.97}
              onClick={() => setSimFlashcardOpen(true)}
              className="w-full rounded-2xl border border-rose-400/30 bg-rose-500/8 dark:bg-rose-500/10
                         backdrop-blur-sm px-4 py-3.5 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center shrink-0">
                <Brain size={20} className="text-rose-400" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-rose-200 font-bold text-base leading-tight">אימון שינון — פרוטוקולים</span>
                <span className="text-rose-300/50 text-xs mt-0.5">{SIMULATOR_FLASHCARDS.length} כרטיסיות · CPR, שוק, תרופות</span>
              </div>
              <div className="mr-auto text-rose-400/40 text-lg">←</div>
            </HapticButton>

            {[
              {
                label: 'סימולטור החייאה',
                sublabel: 'Lifesaver — תרגול CPR אינטראקטיבי',
                url: 'https://life-saver.org.uk/',
                trackName: 'סימולטור החייאה',
                color: 'text-rose-400',
                border: 'border-rose-400/30',
                bg: 'bg-rose-400/5',
                iconBg: 'bg-rose-400/20 border-rose-400/40',
              },
              {
                label: "סימולטור אק\"ג וקצבי לב",
                sublabel: 'SkillStat — סימולטור אק"ג אינטראקטיבי',
                url: 'https://www.skillstat.com/tools/ecg-simulator/',
                trackName: 'סימולטור אק"ג וקצבי לב',
                color: 'text-sky-400',
                border: 'border-sky-400/30',
                bg: 'bg-sky-400/5',
                iconBg: 'bg-sky-400/20 border-sky-400/40',
              },
              {
                label: 'תרגול מקרים והחייאה',
                sublabel: 'RevivR (BHF) — תרגול בהדרכה',
                url: 'https://revivr.bhf.org.uk/',
                trackName: 'תרגול מקרים והחייאה',
                color: 'text-emerald-400',
                border: 'border-emerald-400/30',
                bg: 'bg-emerald-400/5',
                iconBg: 'bg-emerald-400/20 border-emerald-400/40',
              },
              {
                label: 'אימון זיהוי מחלות',
                sublabel: 'נחש את המחלה — אבחון קליני',
                url: 'https://diseaseguess.azurewebsites.net/welcome',
                trackName: 'אימון זיהוי מחלות',
                color: 'text-violet-400',
                border: 'border-violet-400/30',
                bg: 'bg-violet-400/5',
                iconBg: 'bg-violet-400/20 border-violet-400/40',
              },
            ].map(({ label, sublabel, url, trackName, color, border, bg, iconBg }) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-4 w-full rounded-2xl border ${border} ${bg} p-4 active:scale-95 transition-transform text-right`}
                onClick={() => trackInteraction(trackName, 'community_learning')}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${iconBg}`}>
                  <HeartPulse size={22} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`${color} font-bold text-base leading-tight`}>{label}</p>
                  <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5 leading-tight">{sublabel}</p>
                </div>
                <ExternalLink size={16} className="text-gray-400 dark:text-emt-muted shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {simFlashcardOpen && (
        <FlashcardTrainer data={SIMULATOR_FLASHCARDS} onClose={() => setSimFlashcardOpen(false)} />
      )}

      {/* WhatsApp Community — full-screen page */}
      {showWhatsAppCommunity && (
        <div
          className="fixed inset-0 z-[70] flex flex-col overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #071207 0%, #040a04 55%, #020602 100%)' }}
        >
          {/* Ambient glows — decorative, non-interactive */}
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-green-500/12 blur-3xl" />
          <div className="pointer-events-none absolute bottom-32 -right-16 w-56 h-56 rounded-full bg-green-600/8 blur-3xl" />

          {/* Header */}
          <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3">
            <div />
            <HapticButton
              onClick={() => setShowWhatsAppCommunity(false)}
              pressScale={0.88}
              className="w-10 h-10 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-gray-400"
              aria-label="סגור"
            >
              <X size={20} />
            </HapticButton>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto pb-36">

            {/* Hero */}
            <div className="flex flex-col items-center text-center px-6 pt-2 pb-8">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center border border-green-400/35 mb-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(37,211,102,0.18) 0%, rgba(18,140,126,0.10) 100%)',
                  boxShadow: '0 0 48px rgba(37,211,102,0.22), 0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <Users size={46} className="text-green-400" />
              </div>
              <h1 className="text-white font-bold text-2xl leading-tight mb-1">
                קהילת חובש + 🚑
              </h1>
              <p className="text-green-400/75 text-sm font-medium tracking-wide">
                ערוץ עדכונים רשמי · WhatsApp
              </p>
            </div>

            {/* Intro banner */}
            <div
              className="mx-4 mb-4 rounded-2xl border border-green-400/18 p-4"
              style={{ background: 'rgba(37,211,102,0.055)' }}
            >
              <p className="text-gray-200 text-sm leading-relaxed text-center">
                הצטרפו לערוץ העדכונים הרשמי של אפליקציית{' '}
                <span className="text-green-400 font-bold">חובש +</span>
                {' '}— המקום שבו חובשים, פרמדיקים ומע"רים מכל הארגונים מקבלים ערך מוסף ישירות לטלפון.
              </p>
            </div>

            {/* Benefit cards */}
            <div className="px-4 flex flex-col gap-3">
              {[
                {
                  emoji: '💡',
                  title: 'טיפים מקצועיים לשטח',
                  desc: 'פרוטוקולים, תזכורות קליניות ועצות מניסיון שיחסכו לכם שניות קריטיות בשטח',
                  glow: 'rgba(250,204,21,0.06)',
                  border: 'rgba(250,204,21,0.15)',
                },
                {
                  emoji: '🆕',
                  title: 'עדכונים לפני כולם',
                  desc: 'גלו כלים ומחשבונים חדשים ראשונים, עם הסברים ודוגמאות שימוש מיד בשחרור',
                  glow: 'rgba(56,189,248,0.06)',
                  border: 'rgba(56,189,248,0.15)',
                },
                {
                  emoji: '🛒',
                  title: 'מבצעים בלעדיים לחברי הקהילה',
                  desc: 'הנחות ועסקאות על ציוד רפואי ואביזרי שטח — רק דרך הערוץ שלנו',
                  glow: 'rgba(52,211,153,0.06)',
                  border: 'rgba(52,211,153,0.15)',
                },
                {
                  emoji: '📢',
                  title: 'פרסומים חשובים בזמן אמת',
                  desc: 'שינויי פרוטוקול, עדכוני קורסים ומידע שכל איש צוות חייב לדעת',
                  glow: 'rgba(251,146,60,0.06)',
                  border: 'rgba(251,146,60,0.15)',
                },
                {
                  emoji: '🤝',
                  title: 'קהילה מכל הארגונים',
                  desc: 'מד"א · איחוד הצלה · צה"ל · מתנדבים — כולם במקום אחד',
                  glow: 'rgba(167,139,250,0.06)',
                  border: 'rgba(167,139,250,0.15)',
                },
              ].map(({ emoji, title, desc, glow, border }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-2xl p-4"
                  style={{ background: glow, border: `1px solid ${border}` }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-2xl bg-white/5 border border-white/8">
                    {emoji}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-white font-bold text-sm leading-tight">{title}</span>
                    <span className="text-gray-400 text-xs leading-relaxed">{desc}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Sticky CTA — floats above scroll with gradient fade */}
          <div
            className="absolute bottom-0 inset-x-0 px-4 pb-8 pt-6"
            style={{ background: 'linear-gradient(to top, #020602 65%, transparent)' }}
          >
            <a
              href="https://whatsapp.com/channel/0029VbC2u2l1CYoaUdUhCv2N"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackInteraction('הצטרפות לוואטסאפ', 'community_learning')}
              className="block w-full py-4 rounded-2xl text-white font-bold text-lg text-center active:scale-95 transition-transform"
              style={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                boxShadow: '0 4px 30px rgba(37,211,102,0.45)',
              }}
            >
              הצטרפות לערוץ הוואטסאפ
            </a>
            <p className="text-center text-gray-600 text-xs mt-2">
              ערוץ חד-כיווני · ללא ספאם · ניתן לעזוב בכל עת
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
