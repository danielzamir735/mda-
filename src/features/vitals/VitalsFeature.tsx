import { useState, useCallback } from 'react';
import VitalsCard from './components/VitalsCard';
import CalculatorModal from './components/CalculatorModal';
import ResultPopup from './components/ResultPopup';
import MetronomeCard from '../metronome/MetronomeCard';
import QuickToolsCard from '../quicktools/QuickToolsCard';
import BottomNav from '../../components/BottomNav';
import GalleryModal from '../camera/GalleryModal';
import NotesModal from '../notes/NotesModal';

export default function VitalsFeature() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMultiplier, setActiveMultiplier] = useState(4);
  const [activeUnit, setActiveUnit] = useState('פעימות בדקה');
  const [activeCard, setActiveCard] = useState<'heart' | 'breath'>('heart');
  const [result, setResult] = useState<number | null>(null);
  const [lastResultHeart, setLastResultHeart] = useState<number | null>(null);
  const [lastResultBreath, setLastResultBreath] = useState<number | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Counters incremented to externally trigger timer reset on each VitalsCard
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

  // Called when the user taps "חזור / הפעל שוב" in the ResultPopup
  const handleResultReset = useCallback(() => {
    setResult(null);
    if (activeCard === 'heart') setHeartExternalReset(n => n + 1);
    else setBreathExternalReset(n => n + 1);
  }, [activeCard]);

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
          sublabel="15 שניות"
          duration={15}
          multiplier={4}
          unit="פעימות בדקה"
          isHeartRate
          lastResult={lastResultHeart}
          externalReset={heartExternalReset}
          onOpenModal={openModal}
        />
        <VitalsCard
          label="נשימות"
          sublabel="30 שניות"
          duration={30}
          multiplier={2}
          unit="נשימות בדקה"
          lastResult={lastResultBreath}
          externalReset={breathExternalReset}
          onOpenModal={openModal}
        />
        <MetronomeCard />
        <QuickToolsCard />
      </main>

      <BottomNav
        onGalleryOpen={() => setGalleryOpen(true)}
        onNotesOpen={() => setNotesOpen(true)}
      />

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
        onClose={handleResultReset}
      />

      <GalleryModal isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} />

      <NotesModal
        isOpen={notesOpen}
        noteText={noteText}
        onTextChange={setNoteText}
        onClose={() => setNotesOpen(false)}
      />
    </div>
  );
}
