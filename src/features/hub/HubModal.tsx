import { X, Calculator, BookOpen, Settings, Stethoscope, MessageSquare, MapPin, Pill, Building2, Sparkles, ClipboardList, Download, Languages, Skull, Accessibility, Wind, ScanSearch, Users, HeartPulse, ExternalLink, Brain } from 'lucide-react';
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
    id: 'kit-standards',
    label: 'תקנים לתיקי כונן',
    icon: ClipboardList,
    color: 'text-indigo-400',
    border: 'border-indigo-400/30',
    bg: 'bg-indigo-400/10',
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
    id: 'defibrillator',
    label: 'מצא דפיברילטור קרוב',
    icon: MapPin,
    color: 'text-emt-red',
    border: 'border-emt-red/30',
    bg: 'bg-emt-red/10',
    href: 'https://defi.co.il/#/map',
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
    label: 'מה חדש?',
    icon: Sparkles,
    color: 'text-emt-yellow',
    border: 'border-emt-yellow/30',
    bg: 'bg-emt-yellow/10',
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
    id: 'medication-scanner',
    label: 'מידע על תרופות',
    icon: ScanSearch,
    color: 'text-teal-400',
    border: 'border-teal-400/30',
    bg: 'bg-teal-400/10',
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
];

const ENABLED = new Set(['calculators', 'settings', 'clinical', 'medhistory', 'defibrillator', 'hospitals', 'updates', 'kit-standards', 'medications-classification', 'common-meds', 'install-app', 'realtime-translate', 'poison-centers', 'accessibility', 'breathing', 'medication-scanner', 'simulators']);

export default function HubModal({
  isOpen,
  onClose,
  onCalculatorsOpen,
  onSettingsOpen,
  onVitalsReferenceOpen,
  onFeedbackOpen,
  onMedicalHistoryOpen,
  onHospitalsOpen,
  onUpdatesOpen,
  onBagStandardsOpen,
  onMedicationsOpen,
  onCommonMedsOpen,
  onTranslatorOpen,
  onPoisonCentersOpen,
  onAccessibilityOpen,
  onBreathingOpen,
  onMedicationScannerOpen,
}: Props) {
  const [hasSeenWhatsNew, setHasSeenWhatsNew] = useState(false);
  const [showSimulators, setShowSimulators] = useState(false);
  const [simFlashcardOpen, setSimFlashcardOpen] = useState(false);
  const { openFullModal } = usePwaInstall();

  useEffect(() => {
    if (localStorage.getItem('whatsNew_v2_seen') === 'true') {
      setHasSeenWhatsNew(true);
    }
  }, []);

  // Reset simulators view when hub closes so re-opening always shows the tools menu
  useEffect(() => {
    if (!isOpen) setShowSimulators(false);
  }, [isOpen]);

  useModalBackHandler(isOpen, onClose);
  // Give simulators its own back-button layer so back returns to the tools menu, not home
  useModalBackHandler(showSimulators, () => setShowSimulators(false));
  if (!isOpen) return null;

  const HUB_TRACKING: Record<string, [string, string]> = {
    calculators:                  ['calculators_section',   'calculators'],
    settings:                     ['settings',              'utility'],
    clinical:                     ['vitals_reference_table','medical_knowledge'],
    medhistory:                   ['background_illnesses',  'medical_knowledge'],
    hospitals:                    ['hospital_info',         'emergency_info'],
    updates:                      ['whats_new',             'navigation'],
    'kit-standards':              ['bag_standards',         'tools'],
    'medications-classification': ['medication_groups',     'medical_knowledge'],
    'common-meds':                ['common_medications',    'medical_knowledge'],
    'realtime-translate':         ['medical_translator',    'tools'],
    'poison-centers':             ['poison_control_center', 'emergency_info'],
    accessibility:                ['accessibility_settings','utility'],
    breathing:                    ['breathing_synchronizer','tools'],
    'medication-scanner':         ['medication_info',       'tools'],
    simulators:                   ['learning_simulators',   'community_learning'],
    'install-app':                ['pwa_install',           'utility'],
    'whatsapp-community':         ['hovesh_plus_community', 'community_learning'],
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
      localStorage.setItem('whatsNew_v2_seen', 'true');
      setHasSeenWhatsNew(true);
      onUpdatesOpen();
    }
    if (id === 'kit-standards') onBagStandardsOpen();
    if (id === 'medications-classification') onMedicationsOpen();
    if (id === 'common-meds') onCommonMedsOpen();
    if (id === 'realtime-translate') onTranslatorOpen();
    if (id === 'poison-centers') onPoisonCentersOpen();
    if (id === 'accessibility') onAccessibilityOpen();
    if (id === 'breathing') onBreathingOpen();
    if (id === 'medication-scanner') onMedicationScannerOpen();
    if (id === 'simulators') setShowSimulators(true);
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
                {id === 'updates' && !hasSeenWhatsNew && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse z-10" />
                )}
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
                  onClick={() => trackInteraction('nearest_aed', 'emergency_info')}
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
          onClick={() => { trackInteraction('send_feedback', 'utility'); onFeedbackOpen(); }}
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
                trackName: 'simulator_cpr',
                color: 'text-rose-400',
                border: 'border-rose-400/30',
                bg: 'bg-rose-400/5',
                iconBg: 'bg-rose-400/20 border-rose-400/40',
              },
              {
                label: "סימולטור אק\"ג וקצבי לב",
                sublabel: 'SkillStat — סימולטור אק"ג אינטראקטיבי',
                url: 'https://www.skillstat.com/tools/ecg-simulator/',
                trackName: 'simulator_ecg',
                color: 'text-sky-400',
                border: 'border-sky-400/30',
                bg: 'bg-sky-400/5',
                iconBg: 'bg-sky-400/20 border-sky-400/40',
              },
              {
                label: 'תרגול מקרים והחייאה',
                sublabel: 'RevivR (BHF) — תרגול בהדרכה',
                url: 'https://revivr.bhf.org.uk/',
                trackName: 'simulator_revivr',
                color: 'text-emerald-400',
                border: 'border-emerald-400/30',
                bg: 'bg-emerald-400/5',
                iconBg: 'bg-emerald-400/20 border-emerald-400/40',
              },
              {
                label: 'אימון זיהוי מחלות',
                sublabel: 'נחש את המחלה — אבחון קליני',
                url: 'https://diseaseguess.azurewebsites.net/welcome',
                trackName: 'simulator_disease_guess',
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
    </div>
  );
}
