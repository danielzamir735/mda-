import { X, Calculator, BookOpen, Settings, Stethoscope, MessageSquare, MapPin, Pill, Building2, Share2, ClipboardList, Download, Languages, Skull, Accessibility, Wind, ScanSearch, Users, HeartPulse, ExternalLink, Brain, Trophy, Star, Rocket, Sparkles, Copy, Check, GripVertical, Pencil, GraduationCap, Bell, Gauge, Ambulance, HeartHandshake, MapPinned } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

// Resets on every page load — prevents re-showing within the same tab session
let _personalCardShown = false;
import { motion, AnimatePresence, Reorder, useDragControls, useReducedMotion } from 'framer-motion';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';
import HapticButton from '../../components/HapticButton';
import type { LucideIcon } from 'lucide-react';
import { usePwaInstall } from '../pwa/PwaInstallContext';
import { trackInteraction } from '../../utils/analytics';
import FlashcardTrainer from '../../components/FlashcardTrainer';
import ConceptsModal from './components/ConceptsModal';
import MedicalAbbreviationsModal from './components/MedicalAbbreviationsModal';
import AddressFinderModal from './components/AddressFinderModal';
import WhatsAppIcon from '../../components/WhatsAppIcon';
import { SIMULATOR_FLASHCARDS } from './data/simulatorFlashcards';
import { useTranslation, useLanguage, translate } from '../../i18n';
import type { TranslationKey } from '../../i18n';

// Analytics event names stay in Hebrew so the reports remain continuous whatever the UI language.
const TRACK = {
  addressFinder: 'איתור כתובת מהיר · פתיחה', // i18n-ok: analytics event name
  campaign: 'פתח קמפיין חנויות', // i18n-ok: analytics event name
  concepts: 'מושגים שלמדתי', // i18n-ok: analytics event name
  goldenHour: 'שעת הזהב · פתיחה מהאפליקציה', // i18n-ok: analytics event name
  whatsapp: 'הצטרפות לוואטסאפ', // i18n-ok: analytics event name
  payBox: 'תרומה לקמפיין — PayBox', // i18n-ok: analytics event name
  bit: 'תרומה לקמפיין — ביט', // i18n-ok: analytics event name
  personalPayBox: 'תרומה — בנימה אישית PayBox', // i18n-ok: analytics event name
  personalBit: 'תרומה — בנימה אישית ביט', // i18n-ok: analytics event name
  poison: 'מרכזי הרעלות', // i18n-ok: analytics event name
  breathing: 'מסנכרן נשימות', // i18n-ok: analytics event name
  waBanner: 'באנר וואטסאפ · פתיחה', // i18n-ok: analytics event name
  folderPrefix: 'תיקייה · ', // i18n-ok: analytics event name
};
const heName = (key: TranslationKey) => translate(key, undefined, 'he');

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
  onDailyPushOpen: () => void;
  onHospitalLoadOpen: () => void;
  onAfterCallOpen: () => void;
}

type HubItem = {
  id: string;
  labelKey: TranslationKey;
  subtitleKey?: TranslationKey;
  icon: LucideIcon;
  color: string;
  border: string;
  bg: string;
  href?: string;
};

const HUB_ITEMS: HubItem[] = [
  {
    id: 'address-finder',
    labelKey: 'hubItemAddressFinder',
    icon: MapPinned,
    color: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-400/40',
    bg: 'bg-rose-400/10',
  },
  {
    id: 'hospital-load',
    labelKey: 'hubItemHospitalLoad',
    icon: Gauge,
    color: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-400/30',
    bg: 'bg-cyan-400/10',
  },
  {
    id: 'concepts',
    labelKey: 'hubItemConcepts',
    icon: Sparkles,
    color: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-400/35',
    bg: 'bg-purple-400/10',
  },
  {
    id: 'calculators',
    labelKey: 'calculators',
    icon: Calculator,
    color: 'text-emt-green',
    border: 'border-emt-green/30',
    bg: 'bg-emt-green/10',
  },
  {
    id: 'medication-scanner',
    labelKey: 'hubItemMedScanner',
    icon: ScanSearch,
    color: 'text-teal-700 dark:text-teal-400',
    border: 'border-teal-400/30',
    bg: 'bg-teal-400/10',
  },
  {
    id: 'daily-challenge',
    labelKey: 'hubItemDailyChallenge',
    subtitleKey: 'hubItemDailyChallengeSub',
    icon: Trophy,
    color: 'text-yellow-800 dark:text-yellow-400',
    border: 'border-yellow-400/40',
    bg: 'bg-gradient-to-br from-yellow-500/15 via-amber-500/10 to-orange-500/5',
  },
  {
    id: 'medical-terms',
    labelKey: 'hubItemMedicalTerms',
    subtitleKey: 'hubItemMedicalTermsSub',
    icon: GraduationCap,
    color: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/10',
  },
  {
    id: 'medhistory',
    labelKey: 'hubItemMedHistory',
    icon: Stethoscope,
    color: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-400/30',
    bg: 'bg-purple-400/10',
  },
  {
    id: 'medications-classification',
    labelKey: 'hubItemMedGroups',
    icon: Pill,
    color: 'text-teal-700 dark:text-teal-400',
    border: 'border-teal-400/30',
    bg: 'bg-teal-400/10',
  },
  {
    id: 'common-meds',
    labelKey: 'hubItemCommonMeds',
    icon: Pill,
    color: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-400/10',
  },
  {
    id: 'clinical',
    labelKey: 'hubItemVitalsTable',
    icon: BookOpen,
    color: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-400/30',
    bg: 'bg-blue-400/10',
  },
  {
    id: 'hospitals',
    labelKey: 'hubItemHospitals',
    icon: Building2,
    color: 'text-cyan-700 dark:text-cyan-400',
    border: 'border-cyan-400/30',
    bg: 'bg-cyan-400/10',
  },
  {
    id: 'realtime-translate',
    labelKey: 'hubItemTranslate',
    subtitleKey: 'hubItemTranslateSub',
    icon: Languages,
    color: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-400/30',
    bg: 'bg-orange-400/10',
  },
  {
    id: 'updates',
    labelKey: 'hubItemShareApp',
    icon: Share2,
    color: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-400/30',
    bg: 'bg-blue-400/10',
  },
  {
    id: 'install-app',
    labelKey: 'hubItemInstallApp',
    icon: Download,
    color: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/10',
  },
  {
    id: 'poison-centers',
    labelKey: 'hubItemPoison',
    icon: Skull,
    color: 'text-lime-800 dark:text-lime-400',
    border: 'border-lime-400/30',
    bg: 'bg-lime-400/10',
  },
  {
    id: 'settings',
    labelKey: 'hubItemSettings',
    icon: Settings,
    color: 'text-fg-muted',
    border: 'border-line',
    bg: 'bg-surface-2',
  },
  {
    id: 'accessibility',
    labelKey: 'hubItemAccessibility',
    icon: Accessibility,
    color: 'text-violet-700 dark:text-violet-400',
    border: 'border-violet-400/30',
    bg: 'bg-violet-400/10',
  },
  {
    id: 'breathing',
    labelKey: 'hubItemBreathing',
    icon: Wind,
    color: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/10',
  },
  {
    id: 'after-call',
    labelKey: 'hubItemAfterCall',
    subtitleKey: 'hubItemAfterCallSub',
    icon: HeartHandshake,
    color: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-400/35',
    bg: 'bg-violet-400/10',
  },
  {
    id: 'kit-standards',
    labelKey: 'hubItemKitStandards',
    icon: ClipboardList,
    color: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-400/30',
    bg: 'bg-indigo-400/10',
  },
  {
    id: 'defibrillator',
    labelKey: 'hubItemDefib',
    icon: MapPin,
    color: 'text-emt-red',
    border: 'border-emt-red/30',
    bg: 'bg-emt-red/10',
    href: 'https://defi.co.il/#/map',
  },
  {
    id: 'whatsapp-community',
    labelKey: 'hubItemCommunity',
    subtitleKey: 'hubItemCommunitySub',
    icon: Users,
    color: 'text-green-800 dark:text-green-400',
    border: 'border-green-400/30',
    bg: 'bg-green-400/10',
  },
  {
    id: 'simulators',
    labelKey: 'hubItemSimulators',
    subtitleKey: 'hubItemSimulatorsSub',
    icon: HeartPulse,
    color: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-400/30',
    bg: 'bg-rose-400/10',
  },
  {
    id: 'soul-departure',
    labelKey: 'hubItemSoulDeparture',
    subtitleKey: 'hubItemSoulDepartureSub',
    icon: Star,
    color: 'text-amber-800 dark:text-amber-400',
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/10',
  },
  {
    id: 'daily-push',
    labelKey: 'hubItemDailyPush',
    subtitleKey: 'hubItemDailyPushSub',
    icon: Bell,
    color: 'text-pink-700 dark:text-pink-400',
    border: 'border-pink-400/30',
    bg: 'bg-pink-400/10',
  },
  {
    id: 'golden-hour',
    labelKey: 'hubItemGoldenHour',
    subtitleKey: 'hubItemGoldenHourSub',
    icon: Ambulance,
    color: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-400/40',
    bg: 'bg-amber-400/10',
    href: 'https://protocol-runner.vercel.app/?src=app',
  },
  {
    id: 'campaign',
    labelKey: 'hubItemCampaign',
    icon: Rocket,
    color: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/10',
  },
];

// תיקיות במרכז הכלים: כמה כלים קרובים מוצגים כאריח אחד, ולחיצה עליו פותחת רשימה של הכלים שבתוכו
// placeAtLast: the folder takes the place of its last tool instead of its first,
// so a folder of rarely used tools stays near the bottom of the list
type HubFolder = HubItem & { children: string[]; placeAtLast?: boolean };

const HUB_FOLDERS: HubFolder[] = [
  {
    id: 'folder-hospitals',
    labelKey: 'hubFolderHospitals',
    subtitleKey: 'hubFolderHospitalsSub',
    icon: Building2,
    color: 'text-cyan-300',
    border: 'border-cyan-400/30',
    bg: 'bg-cyan-400/10',
    children: ['hospital-load', 'hospitals'],
  },
  {
    id: 'folder-learning',
    labelKey: 'hubFolderLearning',
    subtitleKey: 'hubFolderLearningSub',
    icon: Trophy,
    color: 'text-yellow-400',
    border: 'border-yellow-400/40',
    bg: 'bg-gradient-to-br from-yellow-500/15 via-amber-500/10 to-orange-500/5',
    children: ['daily-challenge', 'simulators', 'golden-hour', 'concepts'],
  },
  {
    id: 'folder-meds',
    labelKey: 'hubFolderMeds',
    subtitleKey: 'hubFolderMedsSub',
    icon: Pill,
    color: 'text-teal-400',
    border: 'border-teal-400/30',
    bg: 'bg-teal-400/10',
    children: ['medication-scanner', 'medications-classification', 'common-meds'],
  },
  {
    id: 'folder-knowledge',
    labelKey: 'hubFolderKnowledge',
    subtitleKey: 'hubFolderKnowledgeSub',
    icon: BookOpen,
    color: 'text-blue-400',
    border: 'border-blue-400/30',
    bg: 'bg-blue-400/10',
    children: ['clinical', 'medhistory', 'medical-terms'],
  },
  {
    id: 'folder-app',
    labelKey: 'hubFolderApp',
    subtitleKey: 'hubFolderAppSub',
    icon: Settings,
    color: 'text-fg-muted',
    border: 'border-line',
    bg: 'bg-surface-2',
    children: ['settings', 'accessibility', 'daily-push', 'install-app', 'updates'],
    placeAtLast: true,
  },
];

const FOLDER_BY_ID = new Map(HUB_FOLDERS.map(f => [f.id, f]));
// tool inside a folder -> its folder id
const FOLDER_OF_CHILD = new Map(HUB_FOLDERS.flatMap(f => f.children.map(c => [c, f.id] as const)));
const ITEM_BY_ID = new Map(HUB_ITEMS.map(item => [item.id, item]));

// Replaces each tool that lives in a folder with that folder, once, at the
// place of its first tool (or its last one, for placeAtLast folders).
function groupIntoFolders(ids: string[]): string[] {
  const out: string[] = [];
  ids.forEach((id, i) => {
    const folderId = FOLDER_OF_CHILD.get(id);
    if (!folderId) { if (!out.includes(id)) out.push(id); return; }
    if (out.includes(folderId)) return;
    const isLastChild = !ids.slice(i + 1).some(rest => FOLDER_OF_CHILD.get(rest) === folderId);
    if (!FOLDER_BY_ID.get(folderId)!.placeAtLast || isLastChild) out.push(folderId);
  });
  return out;
}

// the main list: every tool that is not in a folder, plus the folders
const TOP_ITEMS: HubItem[] = groupIntoFolders(HUB_ITEMS.map(item => item.id))
  .map(id => FOLDER_BY_ID.get(id) ?? ITEM_BY_ID.get(id)!);

const ENABLED = new Set(['address-finder', 'golden-hour', 'campaign', 'concepts', 'medical-terms', 'daily-challenge', 'calculators', 'settings', 'clinical', 'medhistory', 'defibrillator', 'hospitals', 'updates', 'kit-standards', 'medications-classification', 'common-meds', 'install-app', 'realtime-translate', 'poison-centers', 'accessibility', 'breathing', 'medication-scanner', 'simulators', 'soul-departure', 'whatsapp-community', 'daily-push', 'hospital-load', 'after-call', ...HUB_FOLDERS.map(f => f.id)]);

// v4: tools grouped into folders. A v3 order is migrated by replacing each
// grouped tool with its folder, at the place of the first one.
const HUB_STORAGE_KEY = 'hub_order_v4';
const LEGACY_HUB_STORAGE_KEY = 'hub_order_v3';
const DEFAULT_HUB_ORDER = TOP_ITEMS.map(item => item.id);

const NEW_ON_TOP = ['address-finder'];

// The WhatsApp banner at the top of the hub disappears once the viewer joins or hides it.
const WA_BANNER_KEY = 'hub_wa_banner_hidden_v1';
function loadWaBannerHidden(): boolean {
  try { return localStorage.getItem(WA_BANNER_KEY) === '1'; } catch { return false; }
}
function saveWaBannerHidden() {
  try { localStorage.setItem(WA_BANNER_KEY, '1'); } catch { /* storage unavailable */ }
}
// tools moved down once for users who already have a saved order (golden hour gave its top spot to the address finder)
const DEMOTED_ONCE: { key: string; ids: string[] } = { key: 'hub_demoted_v1', ids: ['golden-hour'] };

function migrateLegacyOrder(ids: string[]): string[] {
  return groupIntoFolders(ids);
}

function loadHubOrder(): string[] {
  try {
    let saved = localStorage.getItem(HUB_STORAGE_KEY);
    if (!saved) {
      const legacy = localStorage.getItem(LEGACY_HUB_STORAGE_KEY);
      if (legacy) {
        saved = JSON.stringify(migrateLegacyOrder(JSON.parse(legacy)));
        localStorage.setItem(HUB_STORAGE_KEY, saved);
      }
    }
    if (saved) {
      const parsed: string[] = JSON.parse(saved);
      const valid = parsed.filter(id => DEFAULT_HUB_ORDER.includes(id));
      let valid2 = valid;
      if (!localStorage.getItem(DEMOTED_ONCE.key)) {
        const moved = valid.filter(id => DEMOTED_ONCE.ids.includes(id));
        valid2 = [...valid.filter(id => !DEMOTED_ONCE.ids.includes(id)), ...moved];
        localStorage.setItem(DEMOTED_ONCE.key, '1');
        localStorage.setItem(HUB_STORAGE_KEY, JSON.stringify(valid2));
      }
      const missing = DEFAULT_HUB_ORDER.filter(id => !valid2.includes(id));
      // כלי חדש שנוסף אחרי שהמשתמש כבר סידר את הרשימה: רוב הכלים נכנסים בסוף, ואלה שב־NEW_ON_TOP נכנסים בראש
      return [...missing.filter(id => NEW_ON_TOP.includes(id)), ...valid2, ...missing.filter(id => !NEW_ON_TOP.includes(id))];
    }
    else localStorage.setItem(DEMOTED_ONCE.key, '1'); // a fresh order already has them in place
  } catch {}
  return DEFAULT_HUB_ORDER;
}

function DraggableHubRow({ item }: { item: HubItem }) {
  const controls = useDragControls();
  const t = useTranslation();
  const { icon: Icon, labelKey, subtitleKey, color, border, bg } = item;
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className={`flex items-center gap-4 w-full rounded-2xl border ${border} ${bg} p-4 select-none`}
      // theme-ok: drop shadow while dragging
      whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 10 }}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bg} border ${border}`}>
        <Icon size={22} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`${color} font-bold text-base`}>{t(labelKey)}</p>
        {subtitleKey && <p className="text-fg-muted text-xs mt-0.5">{t(subtitleKey)}</p>}
      </div>
      <div
        onPointerDown={(e) => controls.start(e)}
        className="p-2 -m-2 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical size={22} className="text-fg-subtle" />
      </div>
    </Reorder.Item>
  );
}

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
  onDailyPushOpen,
  onHospitalLoadOpen,
  onAfterCallOpen,
}: Props) {
  const [showSimulators, setShowSimulators] = useState(false);
  const [showAddressFinder, setShowAddressFinder] = useState(false);
  const [simFlashcardOpen, setSimFlashcardOpen] = useState(false);
  const [showWhatsAppCommunity, setShowWhatsAppCommunity] = useState(false);
  const [waBannerHidden, setWaBannerHidden] = useState(loadWaBannerHidden);
  const hideWaBanner = () => { saveWaBannerHidden(); setWaBannerHidden(true); };
  const reduceMotion = useReducedMotion();
  const [editMode, setEditMode] = useState(false);
  const [hubOrder, setHubOrder] = useState<string[]>(() => loadHubOrder());

  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const openFolder = openFolderId ? FOLDER_BY_ID.get(openFolderId) ?? null : null;

  const orderedItems = hubOrder.map(id => TOP_ITEMS.find(item => item.id === id)!).filter(Boolean);

  const handleHubReorder = (newItems: HubItem[]) => {
    const newOrder = newItems.map(item => item.id);
    setHubOrder(newOrder);
    localStorage.setItem(HUB_STORAGE_KEY, JSON.stringify(newOrder));
  };
  const [showCampaign, setShowCampaign] = useState(false);
  const [showConcepts, setShowConcepts] = useState(false);
  const [showMedicalTerms, setShowMedicalTerms] = useState(false);
  const [showPersonalCard, setShowPersonalCard] = useState(false);
  const [campaignBitCopied, setCampaignBitCopied] = useState(false);
  const [showBitSheet, setShowBitSheet] = useState(false);
  const [showBitThankYou, setShowBitThankYou] = useState(false);
  const campaignScrollRef = useRef<HTMLDivElement>(null);
  const { openFullModal } = usePwaInstall();
  const t = useTranslation();
  const { isEn } = useLanguage();

  const handleCampaignScroll = useCallback(() => {
    if (_personalCardShown) return;
    const el = campaignScrollRef.current;
    if (!el) return;
    // pb-40 adds 160px of padding; trigger when the last card row first becomes visible
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      _personalCardShown = true;
      setShowPersonalCard(true);
    }
  }, []);

  // Reset simulators view when hub closes so re-opening always shows the tools menu
  useEffect(() => {
    if (!isOpen) { setShowSimulators(false); setShowAddressFinder(false); setOpenFolderId(null); }
  }, [isOpen]);

  useModalBackHandler(isOpen, onClose);
  // Back from a folder returns to the tools menu
  useModalBackHandler(openFolderId !== null, () => setOpenFolderId(null));
  // Give simulators its own back-button layer so back returns to the tools menu, not home
  useModalBackHandler(showSimulators, () => setShowSimulators(false));
  useModalBackHandler(showWhatsAppCommunity, () => setShowWhatsAppCommunity(false));
  useModalBackHandler(showCampaign, () => setShowCampaign(false));
  if (!isOpen) return null;

  const HUB_TRACKING: Record<string, string> = {
    'daily-challenge':            'learning',
    calculators:                  'calculators',
    settings:                     'utility',
    clinical:                     'medical_knowledge',
    medhistory:                   'medical_knowledge',
    'medical-terms':              'medical_knowledge',
    hospitals:                    'emergency_info',
    updates:                      'utility',
    'kit-standards':              'tools',
    'medications-classification': 'medical_knowledge',
    'common-meds':                'medical_knowledge',
    'realtime-translate':         'tools',
    'poison-centers':             'emergency_info',
    accessibility:                'utility',
    breathing:                    'tools',
    'medication-scanner':         'tools',
    simulators:                   'community_learning',
    'soul-departure':             'tools',
    'install-app':                'utility',
    'whatsapp-community':         'community_learning',
    'daily-push':                 'utility',
    'hospital-load':              'emergency_info',
    'after-call':                 'wellness',
  };
  const trackName = (id: string) => {
    if (id === 'poison-centers') return TRACK.poison;
    if (id === 'breathing') return TRACK.breathing;
    const item = HUB_ITEMS.find(i => i.id === id);
    return item ? heName(item.labelKey) : id;
  };

  const handleItemClick = (id: string) => {
    const folder = FOLDER_BY_ID.get(id);
    if (folder) { trackInteraction(TRACK.folderPrefix + heName(folder.labelKey), 'hub_folder'); setOpenFolderId(id); return; }

    const category = HUB_TRACKING[id];
    if (category) trackInteraction(trackName(id), category);

    if (id === 'address-finder') { trackInteraction(TRACK.addressFinder, 'emergency_info'); setShowAddressFinder(true); return; }
    if (id === 'campaign')     { trackInteraction(TRACK.campaign, 'support'); setShowCampaign(true); return; }
    if (id === 'concepts')     { trackInteraction(TRACK.concepts, 'learning'); setShowConcepts(true); return; }
    if (id === 'medical-terms') { setShowMedicalTerms(true); return; }
    if (id === 'calculators')  onCalculatorsOpen();
    if (id === 'settings')     onSettingsOpen();
    if (id === 'clinical')     onVitalsReferenceOpen();
    if (id === 'medhistory')   onMedicalHistoryOpen();
    if (id === 'hospitals')    onHospitalsOpen();
    if (id === 'updates') {
      const shareText = t('hubShareText', { url: 'https://hovesh-plus.vercel.app/' });
      if (navigator.share) {
        navigator.share({ title: t('hubShareTitle'), text: shareText }).catch(() => {});
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
    if (id === 'daily-push') onDailyPushOpen();
    if (id === 'hospital-load') onHospitalLoadOpen();
    if (id === 'after-call') onAfterCallOpen();
    if (id === 'simulators') setShowSimulators(true);
    if (id === 'whatsapp-community') setShowWhatsAppCommunity(true);
    if (id === 'install-app') { onClose(); setTimeout(openFullModal, 150); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-page overflow-hidden">
      {/* Header */}
      <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
        <h2 className="text-fg font-bold text-xl">{t('hubTitle')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditMode(e => !e)}
            className={`w-10 h-10 rounded-full border flex items-center justify-center active:scale-90 transition-all
              ${editMode
                ? 'bg-emt-green/15 border-emt-green/40 text-emt-green'
                : 'bg-emt-green/5 dark:bg-emt-green/10 border-emt-green/40 text-emt-green/70 hover:text-emt-green'
              }`}
            aria-label={editMode ? t('hubEditDone') : t('hubReorder')}
          >
            {editMode ? <Check size={18} /> : <Pencil size={18} />}
          </button>
          <HapticButton
            onClick={onClose}
            pressScale={0.88}
            className="w-10 h-10 rounded-full bg-surface-2 border border-line
                       flex items-center justify-center
                       text-fg-muted hover:text-fg"
            aria-label={t('close')}
          >
            <X size={20} />
          </HapticButton>
        </div>
      </div>

      {/* Edit mode hint */}
      {editMode && (
        <div className="shrink-0 px-4 py-2 bg-emt-green/5 border-b border-emt-green/20">
          <p className="text-xs text-emt-green text-center font-medium">{t('hubDragHint')}</p>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

        {/* WhatsApp channel banner */}
        {!editMode && !waBannerHidden && (
          <div
            className="relative shrink-0 rounded-2xl overflow-hidden flex items-stretch"
            style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', boxShadow: '0 4px 20px rgba(37,211,102,0.30)' }}
          >
            {/* one light sweep when the hub opens, so the eye lands on the banner */}
            {!reduceMotion && (
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 w-1/3"
                // theme-ok: white light sweep over the green WhatsApp banner
                style={{ background: 'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)' }}
                initial={{ left: '-40%' }}
                animate={{ left: '110%' }}
                transition={{ duration: 1.1, delay: 0.5, ease: 'easeInOut' }}
              />
            )}
            <button
              onClick={() => { trackInteraction(TRACK.waBanner, 'community_learning'); setShowWhatsAppCommunity(true); }}
              // theme-ok: white text on the green WhatsApp gradient banner
              className="relative flex-1 min-w-0 flex items-center gap-3 ps-3 pe-2 py-3 text-start text-white active:scale-[0.98] transition-transform"
            >
              <div
                // theme-ok: translucent white circle on the green WhatsApp gradient
                className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0"
              >
                <WhatsAppIcon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[0.95rem] leading-tight">{t('hubWaBannerTitle')}</p>
                <p
                  // theme-ok: white text on the green WhatsApp gradient
                  className="text-white/85 text-xs mt-0.5 leading-tight"
                >{t('hubWaBannerSub')}</p>
              </div>
              <span
                // theme-ok: white pill with WhatsApp-green text, a button on the green banner
                className="shrink-0 rounded-full bg-white text-[#128C7E] font-black text-sm px-3 py-1.5 shadow-sm"
              >
                {t('hubWaBannerCta')} {isEn ? '→' : '←'}
              </span>
            </button>
            {/* Close: its own full-height column (44px wide), so a tap on it can't
                land on the join area. One tap hides the banner for good. */}
            <button
              onClick={hideWaBanner}
              // theme-ok: white icon on the green WhatsApp gradient banner, divided by a white hairline
              className="relative shrink-0 w-11 flex items-center justify-center text-white/80 hover:text-white active:bg-white/15 border-s border-white/20"
              aria-label={t('hubWaBannerDismiss')}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {editMode ? (
          <Reorder.Group
            axis="y"
            values={orderedItems}
            onReorder={handleHubReorder}
            className="flex flex-col gap-3 list-none m-0 p-0"
          >
            {orderedItems.map(item => (
              <DraggableHubRow key={item.id} item={item} />
            ))}
          </Reorder.Group>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {orderedItems.map(({ id, labelKey, subtitleKey, icon: Icon, color, border, bg, href }) => {
              if (id === 'folder-hospitals') {
                return (
                  <div key={id} className="relative">
                    <motion.div
                      className="pointer-events-none absolute rounded-2xl"
                      style={{ inset: -3 }}
                      animate={{
                        boxShadow: [
                          '0 0 6px 1px rgba(6,182,212,0.20)',
                          '0 0 12px 3px rgba(56,189,248,0.25)',
                          '0 0 8px 2px rgba(14,165,233,0.20)',
                          '0 0 6px 1px rgba(6,182,212,0.20)',
                        ],
                      }}
                      transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.button
                      onClick={() => handleItemClick('folder-hospitals')}
                      className="relative overflow-hidden rounded-2xl active:scale-95 transition-transform w-full min-h-36"
                    >
                      <motion.div
                        className="pointer-events-none absolute"
                        style={{
                          inset: -80,
                          background: 'conic-gradient(from 0deg, rgba(6,182,212,0.55) 0%, rgba(56,189,248,0.55) 33%, rgba(14,165,233,0.55) 66%, rgba(6,182,212,0.55) 100%)',
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
                      />
                      <div
                        className="absolute inset-[2px] z-10 flex flex-col items-center justify-center gap-2 rounded-[14px] p-3 text-center"
                        style={{
                          background: 'linear-gradient(160deg, rgb(var(--surface) / 0.93) 0%, rgba(14,165,233,0.15) 100%)',
                          backdropFilter: 'blur(14px)',
                          WebkitBackdropFilter: 'blur(14px)',
                        }}
                      >
                        <Building2 size={28} className="text-cyan-700 dark:text-cyan-300" />
                        <span className="text-cyan-800 dark:text-cyan-200 font-bold text-sm leading-tight">{t(labelKey)}</span>
                        {subtitleKey && <span className="text-cyan-900/60 dark:text-cyan-100/60 text-xs leading-tight">{t(subtitleKey)}</span>}
                      </div>
                    </motion.button>
                  </div>
                );
              }

              const enabled = ENABLED.has(id);
              const sharedClass = [
                'flex flex-col items-center justify-center gap-2',
                'rounded-2xl border', border, bg,
                'h-36 transition-transform px-2',
                enabled ? 'active:scale-95 cursor-pointer' : 'opacity-60 cursor-not-allowed',
                id === 'address-finder' ? 'relative overflow-hidden' : '',
              ].join(' ');

              const content = (
                <div className="relative flex flex-col items-center justify-center gap-2 w-full h-full px-1">
                  <Icon size={36} className={color} />
                  <span className={`text-sm font-bold ${color} text-center leading-tight`}>{t(labelKey)}</span>
                  {subtitleKey && (
                    <span className="text-xs text-fg-muted text-center leading-tight">{t(subtitleKey)}</span>
                  )}
                  {id === 'address-finder' && (
                    // diagonal "beta" ribbon across the top-left corner of the tile
                    <span
                      aria-label={t('hubBeta')}
                      className="pointer-events-none absolute top-[14px] -left-[30px] w-[110px] -rotate-45 text-center text-[11px] font-extrabold tracking-wider py-[3px] text-amber-950"
                      style={{ background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)', boxShadow: '0 2px 8px rgba(245,158,11,0.45)' }}
                    >
                      {t('hubBeta')}
                    </span>
                  )}
                  {id === 'install-app' && (
                    <span className="text-xs text-fg-subtle text-center leading-tight">
                      {t('hubOfflineAccess')}
                    </span>
                  )}
                  {!enabled && (
                    <span className="text-xs font-semibold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full">
                      {t('hubComingSoon')}
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
                    onClick={() => id === 'golden-hour' ? trackInteraction(TRACK.goldenHour, 'learning') : trackInteraction(heName('hubItemDefib'), 'emergency_info')}
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
        )}

        {/* Feedback button */}
        <HapticButton
          onClick={() => { trackInteraction(heName('hubSendFeedback'), 'utility'); onFeedbackOpen(); }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl
                     border border-emt-red/30 bg-emt-red/10
                     text-emt-red font-bold text-base"
        >
          <MessageSquare size={22} />
          {t('hubSendFeedback')}
        </HapticButton>

      </div>

      {/* Folder — list of the tools grouped under one tile */}
      {openFolder && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-emt-dark">
          <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-emt-border">
            <div className="flex items-center gap-2 min-w-0">
              <openFolder.icon size={22} className={`${openFolder.color} shrink-0`} />
              <div className="min-w-0">
                <h2 className="text-gray-900 dark:text-emt-light font-bold text-xl leading-tight">{t(openFolder.labelKey)}</h2>
                <p className="text-gray-500 dark:text-emt-muted text-xs truncate">{openFolder.subtitleKey && t(openFolder.subtitleKey)}</p>
              </div>
            </div>
            <HapticButton
              onClick={() => setOpenFolderId(null)}
              pressScale={0.88}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-emt-gray border border-gray-200 dark:border-emt-border
                         flex items-center justify-center shrink-0
                         text-gray-500 dark:text-emt-muted hover:text-gray-900 dark:hover:text-emt-light"
              aria-label={t('hubFolderBack')}
            >
              <X size={20} />
            </HapticButton>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {openFolder.children.map(childId => {
              const child = ITEM_BY_ID.get(childId);
              if (!child) return null;
              const { icon: Icon, labelKey, subtitleKey, color, border, bg, href } = child;
              const rowClass = `flex items-center gap-4 w-full rounded-2xl border ${border} ${bg} p-4 active:scale-[0.98] transition-transform text-start`;
              const rowContent = (
                <>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bg} border ${border}`}>
                    <Icon size={22} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`${color} font-bold text-base leading-tight`}>{t(labelKey)}</p>
                    {subtitleKey && <p className="text-gray-500 dark:text-emt-muted text-xs mt-0.5 leading-tight">{t(subtitleKey)}</p>}
                  </div>
                  {href
                    ? <ExternalLink size={16} className="text-gray-400 dark:text-emt-muted shrink-0" />
                    : <span className="text-gray-400 dark:text-emt-muted text-lg shrink-0">{isEn ? '→' : '←'}</span>}
                </>
              );
              if (href) {
                return (
                  <a
                    key={childId}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={rowClass}
                    onClick={() => trackInteraction(childId === 'golden-hour' ? TRACK.goldenHour : heName(labelKey), 'learning')}
                  >
                    {rowContent}
                  </a>
                );
              }
              return (
                <HapticButton key={childId} pressScale={0.97} onClick={() => handleItemClick(childId)} className={rowClass}>
                  {rowContent}
                </HapticButton>
              );
            })}
          </div>
        </div>
      )}

      {/* Simulators Modal */}
      {showSimulators && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-page">
          {/* Header */}
          <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <HeartPulse size={22} className="text-rose-700 dark:text-rose-400" />
              <div>
                <h2 className="text-fg font-bold text-xl leading-tight">{t('hubItemSimulators')}</h2>
                <p className="text-fg-muted text-xs">{t('hubItemSimulatorsSub')}</p>
              </div>
            </div>
            <HapticButton
              onClick={() => setShowSimulators(false)}
              pressScale={0.88}
              className="w-10 h-10 rounded-full bg-surface-2 border border-line
                         flex items-center justify-center
                         text-fg-muted hover:text-fg"
              aria-label={t('close')}
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
                <Brain size={20} className="text-rose-700 dark:text-rose-400" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-rose-700 dark:text-rose-200 font-bold text-base leading-tight">{t('hubSimFlashTitle')}</span>
                <span className="text-rose-700 dark:text-rose-300/50 text-xs mt-0.5">{t('hubSimFlashSub', { count: SIMULATOR_FLASHCARDS.length })}</span>
              </div>
              <div className="ms-auto text-rose-700 dark:text-rose-400/40 text-lg">{isEn ? '→' : '←'}</div>
            </HapticButton>

            {[
              {
                labelKey: 'hubSimCpr' as TranslationKey,
                subKey: 'hubSimCprSub' as TranslationKey,
                url: 'https://life-saver.org.uk/',
                color: 'text-rose-700 dark:text-rose-400',
                border: 'border-rose-400/30',
                bg: 'bg-rose-400/5',
                iconBg: 'bg-rose-400/20 border-rose-400/40',
              },
              {
                labelKey: 'hubSimEcg' as TranslationKey,
                subKey: 'hubSimEcgSub' as TranslationKey,
                url: 'https://www.skillstat.com/tools/ecg-simulator/',
                color: 'text-sky-700 dark:text-sky-400',
                border: 'border-sky-400/30',
                bg: 'bg-sky-400/5',
                iconBg: 'bg-sky-400/20 border-sky-400/40',
              },
              {
                labelKey: 'hubSimCases' as TranslationKey,
                subKey: 'hubSimCasesSub' as TranslationKey,
                url: 'https://revivr.bhf.org.uk/',
                color: 'text-emerald-700 dark:text-emerald-400',
                border: 'border-emerald-400/30',
                bg: 'bg-emerald-400/5',
                iconBg: 'bg-emerald-400/20 border-emerald-400/40',
              },
              {
                labelKey: 'hubSimDisease' as TranslationKey,
                subKey: 'hubSimDiseaseSub' as TranslationKey,
                url: 'https://diseaseguess.azurewebsites.net/welcome',
                color: 'text-violet-700 dark:text-violet-400',
                border: 'border-violet-400/30',
                bg: 'bg-violet-400/5',
                iconBg: 'bg-violet-400/20 border-violet-400/40',
              },
            ].map(({ labelKey, subKey, url, color, border, bg, iconBg }) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-4 w-full rounded-2xl border ${border} ${bg} p-4 active:scale-95 transition-transform text-start`}
                onClick={() => trackInteraction(heName(labelKey), 'community_learning')}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${iconBg}`}>
                  <HeartPulse size={22} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`${color} font-bold text-base leading-tight`}>{t(labelKey)}</p>
                  <p className="text-fg-muted text-xs mt-0.5 leading-tight">{t(subKey)}</p>
                </div>
                <ExternalLink size={16} className="text-fg-subtle shrink-0" />
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
          className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-page"
          style={{ backgroundImage: 'linear-gradient(160deg, rgba(37,211,102,0.10) 0%, rgba(37,211,102,0.03) 55%, transparent 100%)' }}
        >
          {/* Ambient glows — decorative, non-interactive */}
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-green-500/12 blur-3xl" />
          <div className="pointer-events-none absolute bottom-32 -end-16 w-56 h-56 rounded-full bg-green-600/8 blur-3xl" />

          {/* Header */}
          <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3">
            <div />
            <HapticButton
              onClick={() => setShowWhatsAppCommunity(false)}
              pressScale={0.88}
              className="w-10 h-10 rounded-full bg-fg/5 border border-fg/10 flex items-center justify-center text-fg-muted"
              aria-label={t('close')}
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
                  boxShadow: '0 0 48px rgba(37,211,102,0.22)',
                }}
              >
                <Users size={46} className="text-green-800 dark:text-green-400" />
              </div>
              <h1 className="text-fg font-bold text-2xl leading-tight mb-1">
                {t('hubWaTitle')}
              </h1>
              <p className="text-green-800 dark:text-green-400/75 text-sm font-medium tracking-wide">
                {t('hubWaSub')}
              </p>
            </div>

            {/* Intro banner */}
            <div
              className="mx-4 mb-4 rounded-2xl border border-green-500/25 p-4"
              style={{ background: 'rgba(37,211,102,0.055)' }}
            >
              <p className="text-fg/85 text-sm leading-relaxed text-center">
                {t('hubWaIntroBefore')}{' '}
                <span className="text-green-800 dark:text-green-400 font-bold">{t('hubAppName')}</span>
                {' '}{t('hubWaIntroAfter')}
              </p>
            </div>

            {/* Benefit cards */}
            <div className="px-4 flex flex-col gap-3">
              {([
                {
                  emoji: '💡',
                  titleKey: 'hubWaTipsTitle',
                  descKey: 'hubWaTipsDesc',
                  glow: 'rgba(250,204,21,0.07)',
                  border: 'rgba(234,179,8,0.25)',
                },
                {
                  emoji: '🆕',
                  titleKey: 'hubWaFirstTitle',
                  descKey: 'hubWaFirstDesc',
                  glow: 'rgba(56,189,248,0.07)',
                  border: 'rgba(56,189,248,0.25)',
                },
                {
                  emoji: '🤝',
                  titleKey: 'hubWaOrgsTitle',
                  descKey: 'hubWaOrgsDesc',
                  glow: 'rgba(167,139,250,0.07)',
                  border: 'rgba(167,139,250,0.25)',
                },
              ] as const).map(({ emoji, titleKey, descKey, glow, border }) => (
                <div
                  key={titleKey}
                  className="flex items-start gap-3 rounded-2xl p-4"
                  style={{ background: glow, border: `1px solid ${border}` }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-2xl bg-fg/5 border border-fg/10">
                    {emoji}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-fg font-bold text-sm leading-tight">{t(titleKey)}</span>
                    <span className="text-fg-muted text-xs leading-relaxed">{t(descKey)}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Sticky CTA — floats above scroll with gradient fade */}
          <div
            className="absolute bottom-0 inset-x-0 px-4 pb-8 pt-6"
            style={{ background: 'linear-gradient(to top, rgb(var(--page)) 65%, transparent)' }}
          >
            <a
              href="https://whatsapp.com/channel/0029Vb83OlqCBtxAbvGHzH1J"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { trackInteraction(TRACK.whatsapp, 'community_learning'); hideWaBanner(); }}
              // theme-ok: white text on the green WhatsApp gradient button
              className="block w-full py-4 rounded-2xl text-white font-bold text-lg text-center active:scale-95 transition-transform"
              style={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                boxShadow: '0 4px 30px rgba(37,211,102,0.45)',
              }}
            >
              {t('hubWaJoin')}
            </a>
          </div>
        </div>
      )}

      {/* Campaign Landing Page */}
      {showCampaign && (
        <div
          className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-page"
          style={{ backgroundImage: 'linear-gradient(160deg, rgba(14,165,233,0.10) 0%, rgba(37,99,235,0.04) 50%, transparent 100%)' }}
        >
          {/* Ambient glows */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-40 -end-20 w-64 h-64 rounded-full bg-blue-600/8 blur-3xl" />

          {/* Header */}
          <div className="ios-safe-header shrink-0 flex items-center justify-between px-4 py-3">
            <div />
            <HapticButton
              onClick={() => setShowCampaign(false)}
              pressScale={0.88}
              className="w-10 h-10 rounded-full bg-fg/5 border border-fg/10 flex items-center justify-center text-fg-muted"
              aria-label={t('close')}
            >
              <X size={20} />
            </HapticButton>
          </div>

          {/* Scrollable body */}
          <div
            ref={campaignScrollRef}
            onScroll={handleCampaignScroll}
            className="flex-1 overflow-y-auto pb-40"
          >

            {/* Hero */}
            <div className="flex flex-col items-center text-center px-6 pt-2 pb-8">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="w-24 h-24 rounded-3xl flex items-center justify-center border border-sky-400/35 mb-5 relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(14,165,233,0.22) 0%, rgba(37,99,235,0.12) 100%)',
                  boxShadow: '0 0 56px rgba(56,189,248,0.30)',
                }}
              >
                <motion.span
                  className="absolute inset-0 rounded-3xl"
                  animate={{
                    boxShadow: [
                      '0 0 12px 3px rgba(56,189,248,0.20)',
                      '0 0 30px 10px rgba(56,189,248,0.50)',
                      '0 0 12px 3px rgba(56,189,248,0.20)',
                    ],
                  }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <Rocket size={46} className="text-sky-700 dark:text-sky-300" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-fg font-bold text-2xl leading-tight mb-1"
              >
                {t('hubCampaignTitle')}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sky-700 dark:text-sky-400/80 text-sm font-medium tracking-wide"
              >
                {t('hubCampaignSub')}
              </motion.p>
            </div>

            {/* Intro banner */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mx-4 mb-4 rounded-2xl border border-sky-400/25 p-4"
              style={{ background: 'rgba(14,165,233,0.07)' }}
            >
              <p className="text-fg/85 text-sm leading-relaxed text-center">
                {t('hubCampaignIntroBefore')}{' '}
                <span className="text-sky-700 dark:text-sky-300 font-bold">{t('hubCampaignIntroHighlight')}</span>
                {' '}{t('hubCampaignIntroAfter')}
              </p>
            </motion.div>

            {/* Reason cards */}
            <div className="px-4 flex flex-col gap-3">
              {([
                {
                  emoji: '📱',
                  titleKey: 'hubCampaignAccessTitle',
                  descKey: 'hubCampaignAccessDesc',
                  glow: 'rgba(14,165,233,0.07)',
                  border: 'rgba(56,189,248,0.25)',
                },
                {
                  emoji: '🔔',
                  titleKey: 'hubCampaignUpdatesTitle',
                  descKey: 'hubCampaignUpdatesDesc',
                  glow: 'rgba(37,99,235,0.07)',
                  border: 'rgba(99,102,241,0.25)',
                },
                {
                  emoji: '💰',
                  titleKey: 'hubCampaignCostsTitle',
                  descKey: 'hubCampaignCostsDesc',
                  glow: 'rgba(250,204,21,0.06)',
                  border: 'rgba(234,179,8,0.25)',
                },
                {
                  emoji: '💚',
                  titleKey: 'hubCampaignFreeTitle',
                  descKey: 'hubCampaignFreeDesc',
                  glow: 'rgba(52,211,153,0.06)',
                  border: 'rgba(16,185,129,0.25)',
                },
                {
                  emoji: '🏆',
                  titleKey: 'hubCampaignImpactTitle',
                  descKey: 'hubCampaignImpactDesc',
                  glow: 'rgba(244,114,182,0.06)',
                  border: 'rgba(236,72,153,0.25)',
                },
              ] as const).map(({ emoji, titleKey, descKey, glow, border }, i) => (
                <motion.div
                  key={titleKey}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.07 }}
                  className="flex items-start gap-3 rounded-2xl p-4"
                  style={{ background: glow, border: `1px solid ${border}` }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-2xl bg-fg/5 border border-fg/10">
                    {emoji}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-fg font-bold text-sm leading-tight">{t(titleKey)}</span>
                    <span className="text-fg-muted text-xs leading-relaxed">{t(descKey)}</span>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>

          {/* Sticky CTA */}
          <div
            className="absolute bottom-0 inset-x-0 px-4 pb-8 pt-6"
            style={{ background: 'linear-gradient(to top, rgb(var(--page)) 65%, transparent)' }}
          >
            <div className="flex gap-2">
              <a
                href="https://links.payboxapp.com/ikLxTdoky1b"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackInteraction(TRACK.payBox, 'support')}
                // theme-ok: white text on a coloured gradient button
                className="flex-1 py-4 rounded-2xl text-white font-bold text-base text-center active:scale-95 transition-transform"
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                  boxShadow: '0 4px 32px rgba(14,165,233,0.50)',
                }}
              >
                PayBox
              </a>
              <button
                onClick={() => {
                  trackInteraction(TRACK.bit, 'support');
                  setShowBitSheet(true);
                }}
                // theme-ok: white text on a coloured gradient button
                className="flex-1 py-4 rounded-2xl text-white font-bold text-base text-center active:scale-95 transition-transform"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  boxShadow: '0 4px 24px rgba(124,58,237,0.45)',
                }}
              >
                {t('hubBit')}
              </button>
            </div>
            <p className="text-center text-fg-muted text-xs mt-2">
              {t('hubCampaignFooter')}
            </p>
          </div>

          {/* Personal Appeal Card — slides up once when user reaches the bottom */}
          <AnimatePresence>
            {showPersonalCard && (
              <motion.div
                initial={{ y: 120, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 120, opacity: 0 }}
                transition={{ type: 'spring', damping: 16, stiffness: 260, mass: 0.9 }}
                className="absolute bottom-0 inset-x-0 z-20 rounded-t-3xl px-5 pt-6 pb-10 bg-surface"
                style={{
                  borderTop: '1px solid rgba(234, 179, 8, 0.45)',
                  borderLeft: '1px solid rgba(234, 179, 8, 0.2)',
                  borderRight: '1px solid rgba(234, 179, 8, 0.2)',
                  boxShadow: '0 -8px 48px rgba(234, 179, 8, 0.18), 0 -1px 0 rgba(234, 179, 8, 0.3)',
                }}
              >
                {/* Close button */}
                <button
                  onClick={() => setShowPersonalCard(false)}
                  className="absolute top-4 end-4 w-8 h-8 rounded-full bg-fg/5 border border-fg/10 flex items-center justify-center text-fg-muted active:scale-90 transition-transform"
                  aria-label={t('close')}
                >
                  <X size={15} />
                </button>

                {/* Gold accent line */}
                <div
                  className="mx-auto mb-4 rounded-full"
                  style={{ width: 40, height: 3, background: 'rgba(234, 179, 8, 0.7)' }}
                />

                <h2 className="text-fg font-bold text-xl text-center mb-3 leading-tight">
                  {t('hubPersonalTitle')}
                </h2>

                <p className="text-fg/80 text-sm leading-relaxed text-center mb-5 px-1">
                  {t('hubPersonalBody')}
                </p>

                <div className="flex gap-2">
                  <a
                    href="https://links.payboxapp.com/ikLxTdoky1b"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackInteraction(TRACK.personalPayBox, 'support')}
                    // theme-ok: white text on a coloured gradient button
                    className="flex-1 py-4 rounded-2xl text-white font-bold text-base text-center active:scale-95 transition-transform"
                    style={{
                      background: 'linear-gradient(135deg, #b45309 0%, #ca8a04 50%, #d97706 100%)',
                      boxShadow: '0 4px 28px rgba(202, 138, 4, 0.50)',
                    }}
                  >
                    PayBox
                  </a>
                  <button
                    onClick={() => {
                      trackInteraction(TRACK.personalBit, 'support');
                      setShowBitSheet(true);
                    }}
                    // theme-ok: white text on a coloured gradient button
                    className="flex-1 py-4 rounded-2xl text-white font-bold text-base text-center active:scale-95 transition-transform"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                      boxShadow: '0 4px 24px rgba(124,58,237,0.45)',
                    }}
                  >
                    {t('hubBit')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bit Sheet */}
          <AnimatePresence>
            {showBitSheet && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  // theme-ok: backdrop dims the page in both modes
                  className="absolute inset-0 z-30 bg-black/50"
                  onClick={() => setShowBitSheet(false)}
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                  className="absolute inset-x-0 bottom-0 z-40 rounded-t-3xl px-6 pt-6 pb-10 bg-surface"
                  style={{
                    backgroundImage: 'linear-gradient(160deg, rgba(124,58,237,0.16) 0%, rgba(79,70,229,0.06) 50%, transparent 100%)',
                    borderTop: '1px solid rgba(167,139,250,0.45)',
                  }}
                >
                  <div className="mx-auto mb-5 w-10 h-1 rounded-full bg-fg/20" />
                  <button
                    onClick={() => setShowBitSheet(false)}
                    className="absolute top-5 end-5 w-8 h-8 rounded-full bg-fg/10 flex items-center justify-center"
                    aria-label={t('close')}
                  >
                    <X size={16} className="text-fg/70" />
                  </button>

                  <h2 className="text-fg font-bold text-xl text-center mb-1">{t('hubBitSheetTitle')}</h2>
                  <p className="text-violet-700 dark:text-violet-300 text-sm text-center mb-4">
                    {t('hubBitSheetSub')}
                  </p>

                  <div
                    className="rounded-2xl flex items-center justify-between px-5 py-4 mb-4"
                    style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}
                  >
                    <span className="text-fg font-black text-2xl tracking-widest shrink-0" dir="ltr">
                      054-932-2310
                    </span>
                    <button
                      onClick={async () => {
                        try { await navigator.clipboard.writeText('0549322310'); } catch { /* ignore */ }
                        setCampaignBitCopied(true);
                        setTimeout(() => setCampaignBitCopied(false), 2500);
                        setShowBitThankYou(true);
                        setTimeout(() => setShowBitThankYou(false), 4500);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                        campaignBitCopied
                          ? 'bg-green-500/20 border-green-500/40 text-green-800 dark:text-green-300'
                          : 'bg-violet-500/25 border-violet-400/40 text-violet-700 dark:text-violet-200'
                      }`}
                    >
                      {campaignBitCopied ? <Check size={15} /> : <Copy size={15} />}
                      {campaignBitCopied ? t('hubBitCopied') : t('copy')}
                    </button>
                  </div>

                  <button
                    onClick={() => { window.location.href = 'bit://'; }}
                    // theme-ok: white text on a coloured gradient button
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-base text-center active:scale-95 transition-transform mb-4"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
                      boxShadow: '0 4px 20px rgba(124,58,237,0.45)',
                    }}
                  >
                    {t('hubOpenBit')}
                  </button>

                  <p className="text-fg/50 text-xs text-center leading-relaxed">
                    {t('hubAnyAmount')}
                  </p>

                  {/* Thank-you toast after copy */}
                  <AnimatePresence>
                    {showBitThankYou && (
                      <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.96 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="mt-4 rounded-2xl px-5 py-4 text-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(16,185,129,0.12) 100%)',
                          border: '1px solid rgba(34,197,94,0.35)',
                        }}
                      >
                        <p className="text-green-800 dark:text-green-300 font-semibold text-sm leading-relaxed">
                          {t('hubThanks1')}<br />
                          {t('hubThanks2')}<br />
                          <span className="text-green-800 dark:text-green-400/80 font-normal text-xs">{t('hubThanks3')}</span>
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}


      {/* Address finder (beta) */}
      {showAddressFinder && <AddressFinderModal isOpen onClose={() => setShowAddressFinder(false)} />}

      {/* Concepts Modal */}
      <ConceptsModal isOpen={showConcepts} onClose={() => setShowConcepts(false)} />

      {/* Medical Terms / Abbreviations Modal */}
      <MedicalAbbreviationsModal isOpen={showMedicalTerms} onClose={() => setShowMedicalTerms(false)} />
    </div>
  );
}
