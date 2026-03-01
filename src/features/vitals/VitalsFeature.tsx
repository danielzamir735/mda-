import { useState, useCallback } from 'react';
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
import HubModal from '../hub/HubModal';
import AmbulanceChecklistModal from '../hub/components/AmbulanceChecklistModal';
import CalculatorsModal from '../hub/components/CalculatorsModal';
import SettingsModal from '../hub/components/SettingsModal';

export default function VitalsFeature() {
  const heartDuration = useSettingsStore((s) => s.heartDuration);
  const breathDuration = useSettingsStore((s) => s.breathDuration);
  const setHeartDuration = useSettingsStore((s) => s.setHeartDuration);
  const setBreathDuration = useSettingsStore((s) => s.setBreathDuration);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeMultiplier, setActiveMultiplier] = useState(4);
  const [activeUnit, setActiveUnit] = useState('פעימות בדקה');
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

  const noteText = useNotesStore((s) => s.noteText);
  const setNoteText = useNotesStore((s) => s.setNoteText);

  // Counters to externally trigger timer reset in each VitalsCard
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

  // Closes the result popup and resets the timer to idle — KEEPS lastResult in the card
  const handleResultClose = useCallback(() => {
    setResult(null);
    if (activeCard === 'heart') setHeartExternalReset(n => n + 1);
    else setBreathExternalReset(n => n + 1);
  }, [activeCard]);

  const handleResetLastHeart = useCallback(() => setLastResultHeart(null), []);
  const handleResetLastBreath = useCallback(() => setLastResultBreath(null), []);

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-emt-dark">
      {/*
        2×2 grid — flex-1 fills all space above the bottom nav.
        In RTL layout, col-1 renders visually on the RIGHT.
          Row 1, col-1 (right) → Heart Rate
          Row 1, col-2 (left)  → Breathing
          Row 2, col-1 (right) → Metronome
          Row 2, col-2 (left)  → Quick Tools
      */}
      <main className="flex-1 grid grid-cols-2 gap-2 p-2 min-h-0">
        <VitalsCard
          label="דופק"
          duration={heartDuration}
          unit="פעימות בדקה"
          isHeartRate
          lastResult={lastResultHeart}
          externalReset={heartExternalReset}
          onOpenModal={openModal}
          onResetLastResult={handleResetLastHeart}
          onDurationChange={(d) => setHeartDuration(d as HeartDuration)}
        />
        <VitalsCard
          label="נשימות"
          duration={breathDuration}
          unit="נשימות בדקה"
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
          className="text-[10px] text-emt-muted underline underline-offset-2 active:opacity-60 transition-opacity"
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
            className="bg-emt-gray border border-emt-border rounded-2xl p-6 mx-4 max-w-xs w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-emt-light font-bold text-base mb-1">יצירת קשר</p>
            <p className="text-emt-muted text-sm mb-5">
              להערות ולהצעות אפשר לפנות לכתובת המייל:
              <br />
              <span className="text-white font-mono text-xs mt-1 inline-block">
                ydbyd4723@gmail.com
              </span>
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setContactPopupOpen(false)}
                className="flex-1 py-2 rounded-xl border border-emt-border text-emt-muted text-sm font-semibold active:scale-95 transition-transform"
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
    </div>
  );
}
