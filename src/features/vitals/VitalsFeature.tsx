import VitalsCard from './components/VitalsCard';

export default function VitalsFeature() {
  return (
    <div className="min-h-screen w-full bg-emt-dark flex flex-col p-4 pt-8 gap-6">
      <h1 className="text-emt-light/90 text-2xl font-semibold text-center tracking-wide">
        האם סדיר ונימוש?
      </h1>

      <div className="grid grid-cols-2 gap-4">
        {/* RTL: first item renders on the right — Heart Rate */}
        <VitalsCard label="דופק (15 שניות)" duration={15} multiplier={4} />
        {/* Second item on the left — Breathing */}
        <VitalsCard label="נשימות (30 שניות)" duration={30} multiplier={2} />
      </div>
    </div>
  );
}
