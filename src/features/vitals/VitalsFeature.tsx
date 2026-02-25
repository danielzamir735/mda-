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
import type { ValidDuration } from '../../store/settingsStore';

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
  const [noteText, setNoteText] = useState('');

  // Counters to externally trigger timer reset in each VitalsCard
  const [heartExternalReset, setHeartExternalReset] = useState(0);
  const [breathExternalReset, setBreathExternalReset] = useState(0);

  const openModal = useCallback((multiplier: number, unit: string, cardType: 'heart' | 'breath') => {
    setActiveMultiplier(multiplier);
    setActiveUnit(unit);
    setActiveCard(cardType);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const handleResult = useCallback((value: number) => {
    setResult(value);
    if (activeCard === 'heart') setLastResultHeart(value);
    else setLastResultBreath(value);
  }, [activeCard]);

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
          onDurationChange={(d) => setHeartDuration(d as ValidDuration)}
        />
        <VitalsCard
          label="נשימות"
          duration={breathDuration}
          unit="נשימות בדקה"
          lastResult={lastResultBreath}
          externalReset={breathExternalReset}
          onOpenModal={openModal}
          onResetLastResult={handleResetLastBreath}
          onDurationChange={(d) => setBreathDuration(d as ValidDuration)}
        />
        <MetronomeCard />
        <QuickToolsCard />
      </main>

      <BottomNav
        onGalleryOpen={() => setGalleryOpen(true)}
        onNotesOpen={() => setNotesOpen(true)}
        onVitalsOpen={() => setVitalsHistoryOpen(true)}
      />

      <footer className="shrink-0 text-center text-[10px] text-emt-muted pb-1 pt-1">
        © כל הזכויות שמורות ל Daniel Zamir - Web Development
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
        noteText={noteText}
        onTextChange={setNoteText}
        onClose={() => setNotesOpen(false)}
      />

      <VitalsHistoryModal
        isOpen={vitalsHistoryOpen}
        onClose={() => setVitalsHistoryOpen(false)}
      />
    </div>
  );
}
