import { useState, useCallback, useEffect } from 'react';
import VitalsCard from './components/VitalsCard';
import CalculatorModal from './components/CalculatorModal';
import ResultPopup from './components/ResultPopup';
import VitalsHistoryModal from './components/VitalsHistoryModal';
import MetronomeCard from '../metronome/MetronomeCard';
import QuickToolsCard from '../quicktools/QuickToolsCard';
import BottomNav from '../../components/BottomNav';
import GalleryModal from '../camera/GalleryModal';
import NotesModal from '../notes/NotesModal';
import { useSettingsStore } from '../../store/settingsStore';
import type { HeartDuration, BreathDuration } from '../../store/settingsStore';
import { useVitalsDraftStore } from '../../store/vitalsDraftStore';
import { useNotesStore } from '../../store/notesStore';
import { useTranslation } from '../../hooks/useTranslation';
import HubModal from '../hub/HubModal';
import AmbulanceChecklistModal from '../hub/components/AmbulanceChecklistModal';
import CalculatorsModal from '../hub/components/CalculatorsModal';
import SettingsModal from '../hub/components/SettingsModal';
import WelcomeModal from '../../components/WelcomeModal';

export default function VitalsFeature() {
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
  const [contactPopupOpen, setContactPopupOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('hasSeenWelcome')) {
      setWelcomeOpen(true);
    }
  }, []);

  const handleWelcomeClose = () => {
    localStorage.setItem('hasSeenWelcome', '1');
    setWelcomeOpen(false);
  };

  const noteText = useNotesStore((s) => s.noteText);
  const setNoteText = useNotesStore((s) => s.setNoteText);

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
      <main className="flex-1 grid grid-cols-2 gap-2 p-2 min-h-0">
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
        <MetronomeCard />
        <QuickToolsCard />
      </main>

      <BottomNav
        onGalleryOpen={() => setGalleryOpen(true)}
        onNotesOpen={() => setNotesOpen(true)}
        onVitalsOpen={() => setVitalsHistoryOpen(true)}
        onHubOpen={() => setHubOpen(true)}
      />

      <footer className="shrink-0 text-center pb-1 pt-1">
        <button
          type="button"
          onClick={() => setContactPopupOpen(true)}
          className="text-[10px] text-gray-400 dark:text-emt-muted underline underline-offset-2 active:opacity-60 transition-opacity"
        >
          © כל הזכויות שמורות ל Daniel Zamir - Web Development
        </button>
      </footer>

      {contactPopupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setContactPopupOpen(false)}
        >
          <div
            className="bg-white dark:bg-emt-gray border border-gray-200 dark:border-emt-border rounded-2xl p-6 mx-4 max-w-xs w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-gray-900 dark:text-emt-light font-bold text-base mb-1">יצירת קשר</p>
            <p className="text-gray-500 dark:text-emt-muted text-sm mb-5">
              להערות ולהצעות אפשר לפנות לכתובת המייל:
              <br />
              <span className="text-gray-800 dark:text-white font-mono text-xs mt-1 inline-block">
                ydbyd4723@gmail.com
              </span>
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setContactPopupOpen(false)}
                className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-emt-border text-gray-500 dark:text-emt-muted text-sm font-semibold active:scale-95 transition-transform"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={() => {
                  setContactPopupOpen(false);
                  window.location.href = 'mailto:ydbyd4723@gmail.com';
                }}
                className="flex-1 py-2 rounded-xl bg-emt-red text-white text-sm font-bold active:scale-95 transition-transform"
              >
                אישור
              </button>
            </div>
          </div>
        </div>
      )}

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
        noteText={noteText}
        onTextChange={setNoteText}
        onClose={() => setNotesOpen(false)}
      />

      <VitalsHistoryModal
        isOpen={vitalsHistoryOpen}
        onClose={() => setVitalsHistoryOpen(false)}
      />

      <HubModal
        isOpen={hubOpen}
        onClose={() => setHubOpen(false)}
        onChecklistOpen={() => setChecklistOpen(true)}
        onCalculatorsOpen={() => setCalculatorsOpen(true)}
        onSettingsOpen={() => setSettingsOpen(true)}
      />

      <AmbulanceChecklistModal
        isOpen={checklistOpen}
        onClose={() => setChecklistOpen(false)}
      />

      <CalculatorsModal
        isOpen={calculatorsOpen}
        onClose={() => setCalculatorsOpen(false)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <WelcomeModal isOpen={welcomeOpen} onClose={handleWelcomeClose} />
    </div>
  );
}
