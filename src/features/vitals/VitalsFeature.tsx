import { useState, useCallback, useEffect } from 'react';
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
import HubModal from '../hub/HubModal';
import AmbulanceChecklistModal from '../hub/components/AmbulanceChecklistModal';
import CalculatorsModal from '../hub/components/CalculatorsModal';
import SettingsModal from '../hub/components/SettingsModal';
import VitalsReferenceModal from '../hub/components/VitalsReferenceModal';
import MedicalHistoryModal from '../hub/components/MedicalHistoryModal';
import HospitalsModal from '../hub/components/HospitalsModal';
import WhatsNewModal from '../hub/components/WhatsNewModal';
import BagStandardsModal from '../hub/components/BagStandardsModal';
import WelcomeModal from '../../components/WelcomeModal';
import FeedbackModal from '../../components/FeedbackModal';

export default function VitalsFeature() {
  const isMetronomePlaying = useMetronomeStore((s) => s.isPlaying);
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
  const [bagStandardsOpen, setBagStandardsOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

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
    setActiveMultiplier(multiplier);
    setActiveUnit(unit);
    setActiveCard(cardType);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const handleResult = useCallback((value: number) => {
    setResult(value);
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
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-gray-50 dark:bg-emt-dark">
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
      </main>

      {isMetronomePlaying && <CPRTimerOverlay />}

      <BottomNav
        onGalleryOpen={() => setGalleryOpen(true)}
        onNotesOpen={() => setNotesOpen(true)}
        onVitalsOpen={() => setVitalsHistoryOpen(true)}
        onHubOpen={() => setHubOpen(true)}
      />

      <footer className="shrink-0 text-center pb-1 pt-1">
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
        onUpdatesOpen={() => setUpdatesOpen(true)}
        onBagStandardsOpen={() => { setHubOpen(false); setBagStandardsOpen(true); }}
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
      <WhatsNewModal isOpen={updatesOpen} onClose={() => { setUpdatesOpen(false); setHubOpen(true); }} />
      <BagStandardsModal isOpen={bagStandardsOpen} onClose={() => { setBagStandardsOpen(false); setHubOpen(true); }} />
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <WelcomeModal isOpen={welcomeOpen} onClose={handleWelcomeClose} />
    </div>
  );
}
