import { useState, useCallback, useEffect } from 'react';
import { Hand, Video } from 'lucide-react';
import VitalsCard from './components/VitalsCard';
import CalculatorModal from './components/CalculatorModal';
import ResultPopup from './components/ResultPopup';
import VitalsHistoryModal from './components/VitalsHistoryModal';
import MetronomeCard from '../metronome/MetronomeCard';
import CPRTimerOverlay from '../metronome/CPRTimerOverlay';
import QuickToolsCard from '../quicktools/QuickToolsCard';
import { useMetronomeStore } from '../../store/metronomeStore';
import BottomNav from '../../components/BottomNav';
import GalleryModal from '../camera/GalleryModal';
import NotesModal from '../notes/NotesModal';
import { useSettingsStore } from '../../store/settingsStore';
import type { HeartDuration, BreathDuration } from '../../store/settingsStore';
import { useVitalsDraftStore } from '../../store/vitalsDraftStore';
import { useTranslation } from '../../hooks/useTranslation';
import { trackEvent, trackInteraction } from '../../utils/analytics';
import HubModal from '../hub/HubModal';
import AmbulanceChecklistModal from '../hub/components/AmbulanceChecklistModal';
import CalculatorsModal from '../hub/components/CalculatorsModal';
import SettingsModal from '../hub/components/SettingsModal';
import VitalsReferenceModal from '../hub/components/VitalsReferenceModal';
import MedicalHistoryModal from '../hub/components/MedicalHistoryModal';
import HospitalsModal from '../hub/components/HospitalsModal';
import WhatsNewModal from '../hub/components/WhatsNewModal';
import BagStandardsModal from '../hub/components/BagStandardsModal';
import MedicationsModal from '../quicktools/MedicationsModal';
import CommonMedsModal from '../hub/components/CommonMedsModal';
import MedicalTranslatorModal, { RecruitmentBanner } from '../hub/components/MedicalTranslatorModal';
import { CountUpNumber } from '../translators/LanguageBridgeModal';
import { supabase } from '../../lib/supabase';
import PoisonCentersModal from '../hub/components/PoisonCentersModal';
import AccessibilityModal from '../hub/components/AccessibilityModal';
import BreathingSynchronizer from '../hub/components/BreathingSynchronizer';
import MedicationScannerModal from '../hub/components/MedicationScannerModal';
import WelcomeModal from '../../components/WelcomeModal';
import FeedbackModal from '../../components/FeedbackModal';
import SupportModal from '../../pages/SupportPage';
import UpdateAnnouncementModal from '../../components/UpdateAnnouncementModal';
import LanguageBridgeModal from '../translators/LanguageBridgeModal';

export default function VitalsFeature() {
  const isMetronomePlaying = useMetronomeStore((s) => s.isPlaying);
  const bgColor = useSettingsStore((s) => s.bgColor);
  const heartDuration = useSettingsStore((s) => s.heartDuration);
  const breathDuration = useSettingsStore((s) => s.breathDuration);
  const setHeartDuration = useSettingsStore((s) => s.setHeartDuration);
  const setBreathDuration = useSettingsStore((s) => s.setBreathDuration);
  const t = useTranslation();

  const [modalOpen, setModalOpen] = useState(false);
  const [activeMultiplier, setActiveMultiplier] = useState(4);
  const [activeUnit, setActiveUnit] = useState('');
  const [activeCard, setActiveCard] = useState<'heart' | 'breath'>('heart');
  const [result, setResult] = useState<number | null>(null);
  const [lastResultHeart, setLastResultHeart] = useState<number | null>(null);
  const [lastResultBreath, setLastResultBreath] = useState<number | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [vitalsHistoryOpen, setVitalsHistoryOpen] = useState(false);
  const [hubOpen, setHubOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [calculatorsOpen, setCalculatorsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [vitalsRefOpen, setVitalsRefOpen] = useState(false);
  const [medicalHistoryOpen, setMedicalHistoryOpen] = useState(false);
  const [hospitalsOpen, setHospitalsOpen] = useState(false);
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [updatesFromHub, setUpdatesFromHub] = useState(false);
  const [hasSeenWhatsNew, setHasSeenWhatsNew] = useState(() => localStorage.getItem('whatsNew_v2_seen') === 'true');
  const [bagStandardsOpen, setBagStandardsOpen] = useState(false);
  const [medicationsOpen, setMedicationsOpen] = useState(false);
  const [commonMedsOpen, setCommonMedsOpen] = useState(false);
  const [translatorOpen, setTranslatorOpen] = useState(false);
  const [poisonCentersOpen, setPoisonCentersOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [medicationScannerOpen, setMedicationScannerOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [languageBridgeOpen, setLanguageBridgeOpen] = useState(false);
  const [translatorInitialLang, setTranslatorInitialLang] = useState<'sl' | undefined>(undefined);
  const [assistCount, setAssistCount] = useState(0);

  useEffect(() => {
    supabase
      .from('global_counters')
      .select('count')
      .eq('id', 'translation_assists')
      .single()
      .then(({ data }) => { if (data) setAssistCount(data.count as number); });
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('hasSeenWelcome_v2')) {
      setWelcomeOpen(true);
    }
  }, []);

  const handleWelcomeClose = () => {
    localStorage.setItem('hasSeenWelcome_v2', '1');
    setWelcomeOpen(false);
  };

  const [heartExternalReset, setHeartExternalReset] = useState(0);
  const [breathExternalReset, setBreathExternalReset] = useState(0);

  const setDraftHeartRate = useVitalsDraftStore((s) => s.setDraftHeartRate);
  const setDraftBreathing = useVitalsDraftStore((s) => s.setDraftBreathing);

  const openModal = useCallback((multiplier: number, unit: string, cardType: 'heart' | 'breath') => {
    trackInteraction(cardType === 'heart' ? 'heart_rate_measure' : 'breathing_measure', 'main_tools');
    setActiveMultiplier(multiplier);
    setActiveUnit(unit);
    setActiveCard(cardType);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const handleResult = useCallback((value: number) => {
    setResult(value);
    trackEvent('vitals_recorded', { type: activeCard, value });
    if (activeCard === 'heart') {
      setLastResultHeart(value);
      setDraftHeartRate(String(value));
    } else {
      setLastResultBreath(value);
      setDraftBreathing(String(value));
    }
  }, [activeCard, setDraftHeartRate, setDraftBreathing]);

  const handleResultClose = useCallback(() => {
    setResult(null);
    if (activeCard === 'heart') setHeartExternalReset(n => n + 1);
    else setBreathExternalReset(n => n + 1);
  }, [activeCard]);

  const handleResetLastHeart = useCallback(() => setLastResultHeart(null), []);
  const handleResetLastBreath = useCallback(() => setLastResultBreath(null), []);

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-gray-50 dark:bg-emt-dark safe-area-top" style={bgColor ? { backgroundColor: bgColor } : {}}>

      {/* ── Recruitment Banner ── */}
      <RecruitmentBanner />

      {/* ── Community Counter ── */}
      {assistCount > 0 && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" style={{ boxShadow: '0 0 5px rgba(52,211,153,0.9)' }} />
          </span>
          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">קהילת חובש+ בתנופה</span>
          <CountUpNumber
            value={assistCount}
            className="text-sm font-black tabular-nums"
            style={{ background: 'linear-gradient(135deg,#34d399 0%,#38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          />
          <span className="text-gray-400 text-[9px] font-semibold">אינטראקציות רפואיות מצילות חיים</span>
        </div>
      )}

      <main className="flex-1 grid grid-cols-2 gap-1.5 p-2 min-h-0 overflow-y-auto">
        {!isMetronomePlaying && (
          <>
            <VitalsCard
              label={t('heartRate')}
              duration={heartDuration}
              unit={t('bpmUnit')}
              isHeartRate
              lastResult={lastResultHeart}
              externalReset={heartExternalReset}
              onOpenModal={openModal}
              onResetLastResult={handleResetLastHeart}
              onDurationChange={(d) => setHeartDuration(d as HeartDuration)}
            />
            <VitalsCard
              label={t('breathing')}
              duration={breathDuration}
              unit={t('breathUnit')}
              lastResult={lastResultBreath}
              externalReset={breathExternalReset}
              onOpenModal={openModal}
              onResetLastResult={handleResetLastBreath}
              onDurationChange={(d) => setBreathDuration(d as BreathDuration)}
            />
          </>
        )}
        <MetronomeCard />
        <QuickToolsCard />

        {/* ── Sign Language Quick Access ── */}
        <button
          type="button"
          onClick={() => {
            trackInteraction('sign_language_shortcut', 'main_screen');
            setTranslatorInitialLang('sl');
            setTranslatorOpen(true);
          }}
          className="col-span-2 flex items-center gap-3 rounded-2xl border-2 border-emerald-400/40
                     bg-emerald-400/5 dark:bg-emerald-400/10 px-5 py-3 active:scale-[0.97] transition-transform"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 shrink-0">
            <Video size={20} className="text-white" />
          </div>
          <div className="flex flex-col items-start flex-1 min-w-0" dir="rtl">
            <span className="text-gray-900 dark:text-white font-black text-base">שפת סימנים</span>
            <span className="text-emerald-500 dark:text-emerald-400 text-xs font-semibold">שיחת וידאו ישירה למטופל חירש</span>
          </div>
          <Hand size={22} className="text-emerald-400 shrink-0" />
        </button>
      </main>

      {isMetronomePlaying && <CPRTimerOverlay />}

      <BottomNav
        onGalleryOpen={() => { trackInteraction('gallery', 'navigation'); setGalleryOpen(true); }}
        onNotesOpen={() => { trackInteraction('notes', 'navigation'); setNotesOpen(true); }}
        onVitalsOpen={() => { trackInteraction('vitals_history', 'navigation'); setVitalsHistoryOpen(true); }}
        onHubOpen={() => { trackInteraction('tools_hub', 'navigation'); setHubOpen(true); }}
        onSupportOpen={() => { trackInteraction('support_open', 'navigation'); setSupportOpen(true); }}
        onLanguageBridgeOpen={() => { trackInteraction('language_bridge', 'navigation'); setLanguageBridgeOpen(true); }}
      />

      <footer className="shrink-0 text-center pt-1" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)' }}>
        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 underline underline-offset-2 active:opacity-60 transition-opacity"
        >
          © כל הזכויות שמורות ל Daniel Zamir - Web Development
        </button>
      </footer>

      <CalculatorModal
        isOpen={modalOpen}
        multiplier={activeMultiplier}
        unit={activeUnit}
        onClose={closeModal}
        onResult={handleResult}
      />

      <ResultPopup
        result={result}
        unit={activeUnit}
        onClose={handleResultClose}
      />

      <GalleryModal isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} />

      <NotesModal
        isOpen={notesOpen}
        onClose={() => setNotesOpen(false)}
      />

      <VitalsHistoryModal
        isOpen={vitalsHistoryOpen}
        onClose={() => setVitalsHistoryOpen(false)}
      />

      <HubModal
        isOpen={hubOpen}
        onClose={() => setHubOpen(false)}
        onCalculatorsOpen={() => setCalculatorsOpen(true)}
        onSettingsOpen={() => setSettingsOpen(true)}
        onVitalsReferenceOpen={() => setVitalsRefOpen(true)}
        onFeedbackOpen={() => setFeedbackOpen(true)}
        onMedicalHistoryOpen={() => setMedicalHistoryOpen(true)}
        onHospitalsOpen={() => setHospitalsOpen(true)}
        onUpdatesOpen={() => { setUpdatesFromHub(true); setUpdatesOpen(true); }}
        onBagStandardsOpen={() => setBagStandardsOpen(true)}
        onMedicationsOpen={() => setMedicationsOpen(true)}
        onCommonMedsOpen={() => setCommonMedsOpen(true)}
        onTranslatorOpen={() => setTranslatorOpen(true)}
        onPoisonCentersOpen={() => setPoisonCentersOpen(true)}
        onAccessibilityOpen={() => setAccessibilityOpen(true)}
        onBreathingOpen={() => setBreathingOpen(true)}
        onMedicationScannerOpen={() => setMedicationScannerOpen(true)}
      />

      <AmbulanceChecklistModal
        isOpen={checklistOpen}
        onClose={() => { setChecklistOpen(false); setHubOpen(true); }}
      />

      <CalculatorsModal
        isOpen={calculatorsOpen}
        onClose={() => { setCalculatorsOpen(false); setHubOpen(true); }}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => { setSettingsOpen(false); setHubOpen(true); }}
      />

      <VitalsReferenceModal isOpen={vitalsRefOpen} onClose={() => { setVitalsRefOpen(false); setHubOpen(true); }} />
      <MedicalHistoryModal isOpen={medicalHistoryOpen} onClose={() => { setMedicalHistoryOpen(false); setHubOpen(true); }} />
      <HospitalsModal isOpen={hospitalsOpen} onClose={() => { setHospitalsOpen(false); setHubOpen(true); }} />
      <WhatsNewModal
        isOpen={updatesOpen}
        isRead={hasSeenWhatsNew}
        onClose={() => {
          localStorage.setItem('whatsNew_v2_seen', 'true');
          setHasSeenWhatsNew(true);
          setUpdatesOpen(false);
          if (updatesFromHub) setHubOpen(true);
        }}
      />
      <BagStandardsModal isOpen={bagStandardsOpen} onClose={() => { setBagStandardsOpen(false); setHubOpen(true); }} />
      <MedicationsModal isOpen={medicationsOpen} onClose={() => setMedicationsOpen(false)} />
      <CommonMedsModal isOpen={commonMedsOpen} onClose={() => { setCommonMedsOpen(false); setHubOpen(true); }} />
      <MedicalTranslatorModal
        isOpen={translatorOpen}
        initialLang={translatorInitialLang}
        onClose={() => { setTranslatorOpen(false); setTranslatorInitialLang(undefined); setHubOpen(true); }}
      />
      <PoisonCentersModal isOpen={poisonCentersOpen} onClose={() => { setPoisonCentersOpen(false); setHubOpen(true); }} />
      <AccessibilityModal isOpen={accessibilityOpen} onClose={() => { setAccessibilityOpen(false); setHubOpen(true); }} />
      <BreathingSynchronizer isOpen={breathingOpen} onClose={() => { setBreathingOpen(false); setHubOpen(true); }} />
      <MedicationScannerModal isOpen={medicationScannerOpen} onClose={() => { setMedicationScannerOpen(false); setHubOpen(true); }} />
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <WelcomeModal isOpen={welcomeOpen} onClose={handleWelcomeClose} />
      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
      <LanguageBridgeModal isOpen={languageBridgeOpen} onClose={() => setLanguageBridgeOpen(false)} />
      <UpdateAnnouncementModal />
    </div>
  );
}
