import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

import headSvgRaw      from '../../../assets/body-parts/head-back.svg?raw';
import torsoSvgRaw     from '../../../assets/body-parts/torso-back.svg?raw';
import leftArmSvgRaw   from '../../../assets/body-parts/left-arm-back.svg?raw';
import rightArmSvgRaw  from '../../../assets/body-parts/right-arm-back.svg?raw';
import leftLegSvgRaw   from '../../../assets/body-parts/left-leg-back.svg?raw';
import rightLegSvgRaw  from '../../../assets/body-parts/right-leg-back.svg?raw';

export type AdultPartId =
  | 'head_front'  | 'head_back'
  | 'torso_front' | 'torso_back'
  | 'right_arm_front' | 'right_arm_back'
  | 'left_arm_front'  | 'left_arm_back'
  | 'right_leg_front' | 'right_leg_back'
  | 'left_leg_front'  | 'left_leg_back'
  | 'perineum';

interface AdultPartDef {
  id: AdultPartId;
  label: string;
  percentage: number;
}

// Adult Rule of Nines — front/back split
export const ADULT_PARTS: AdultPartDef[] = [
  { id: 'head_front',      label: 'ראש קדמי',     percentage: 4.5 },
  { id: 'head_back',       label: 'ראש אחורי',    percentage: 4.5 },
  { id: 'torso_front',     label: 'גוף קדמי',     percentage: 18  },
  { id: 'torso_back',      label: 'גב',           percentage: 18  },
  { id: 'right_arm_front', label: "יד י' קדמי",   percentage: 4.5 },
  { id: 'right_arm_back',  label: "יד י' אחורי",  percentage: 4.5 },
  { id: 'left_arm_front',  label: "יד ש' קדמי",   percentage: 4.5 },
  { id: 'left_arm_back',   label: "יד ש' אחורי",  percentage: 4.5 },
  { id: 'right_leg_front', label: "רגל י' קדמי",  percentage: 9   },
  { id: 'right_leg_back',  label: "רגל י' אחורי", percentage: 9   },
  { id: 'left_leg_front',  label: "רגל ש' קדמי",  percentage: 9   },
  { id: 'left_leg_back',   label: "רגל ש' אחורי", percentage: 9   },
  { id: 'perineum',        label: 'פרינאום',      percentage: 1   },
];

export const ADULT_PART_LOOKUP: Record<AdultPartId, AdultPartDef> =
  ADULT_PARTS.reduce((acc, p) => { acc[p.id] = p; return acc; }, {} as Record<AdultPartId, AdultPartDef>);

// Strip baked-in colors so currentColor controls fill, and force responsive sizing.
function normalizeSvg(raw: string): string {
  return raw
    .replace(/\swidth="[^"]+"/, ' width="100%"')
    .replace(/\sheight="[^"]+"/, ' height="100%"')
    .replace(/preserveAspectRatio="[^"]+"/g, '')
    .replace(/<svg /, '<svg preserveAspectRatio="xMidYMid meet" ')
    .replace(/fill="#[0-9A-Fa-f]+"/gi, 'fill="currentColor"')
    .replace(/fill-opacity="[\d.]+"/gi, '')
    .replace(/stroke="#[0-9A-Fa-f]+"/gi, 'stroke="currentColor"')
    .replace(/stroke-opacity="[\d.]+"/gi, 'stroke-opacity="0.25"');
}

// PartRenderer: single clickable silhouette piece. mirrored=true flips horizontally
// so the same SVG can stand in as a "front" version of the back asset.
interface PartRendererProps {
  svg: string;
  selected: boolean;
  onClick: () => void;
  width: number;
  height: number;
  ariaLabel: string;
  mirrored?: boolean;
}

function PartRenderer({ svg, selected, onClick, width, height, ariaLabel, mirrored }: PartRendererProps) {
  const html = useMemo(() => normalizeSvg(svg), [svg]);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={selected}
      whileTap={{ scale: 0.92 }}
      style={{
        width,
        height,
        transform: mirrored ? 'scaleX(-1)' : undefined,
        color: selected ? 'rgba(239, 68, 68, 0.85)' : 'rgba(148, 163, 184, 0.55)',
      }}
      className={[
        'relative block p-0 bg-transparent border-0 outline-none cursor-pointer',
        'transition-colors duration-200',
        selected
          ? 'drop-shadow-[0_0_6px_rgba(239,68,68,0.65)]'
          : 'hover:opacity-80',
      ].join(' ')}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// One full silhouette (front OR back) made of head+torso+arms+legs.
// Layout uses absolute positioning inside a fixed-aspect frame so anatomical
// proportions stay consistent across screens.
interface SilhouetteProps {
  side: 'front' | 'back';
  selected: Set<AdultPartId>;
  onToggle: (id: AdultPartId) => void;
}

function Silhouette({ side, selected, onToggle }: SilhouetteProps) {
  // Logical canvas size — every body part is positioned in this coord space.
  // The container scales the whole thing to fit available width.
  const W = 160;
  const H = 360;

  const idHead  = (`head_${side}`)  as AdultPartId;
  const idTorso = (`torso_${side}`) as AdultPartId;
  const idRArm  = (`right_arm_${side}`) as AdultPartId;
  const idLArm  = (`left_arm_${side}`)  as AdultPartId;
  const idRLeg  = (`right_leg_${side}`) as AdultPartId;
  const idLLeg  = (`left_leg_${side}`)  as AdultPartId;

  // For the front silhouette, mirror so it doesn't look identical to the back.
  const mirror = side === 'front';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-emt-muted">
        {side === 'front' ? 'קדמי' : 'אחורי'}
      </p>

      <div
        className="relative"
        style={{ width: W, height: H }}
        dir="ltr"
      >
        {/* HEAD — top center */}
        <div className="absolute" style={{ left: W / 2 - 22, top: 0, width: 44, height: 60 }}>
          <PartRenderer
            svg={headSvgRaw}
            selected={selected.has(idHead)}
            onClick={() => onToggle(idHead)}
            width={44}
            height={60}
            ariaLabel={ADULT_PART_LOOKUP[idHead].label}
            mirrored={mirror}
          />
        </div>

        {/* RIGHT ARM — patient's right (left side of diagram) */}
        <div className="absolute" style={{ left: 4, top: 70, width: 34, height: 150 }}>
          <PartRenderer
            svg={rightArmSvgRaw}
            selected={selected.has(idRArm)}
            onClick={() => onToggle(idRArm)}
            width={34}
            height={150}
            ariaLabel={ADULT_PART_LOOKUP[idRArm].label}
            mirrored={mirror}
          />
        </div>

        {/* TORSO — center */}
        <div className="absolute" style={{ left: W / 2 - 36, top: 60, width: 72, height: 150 }}>
          <PartRenderer
            svg={torsoSvgRaw}
            selected={selected.has(idTorso)}
            onClick={() => onToggle(idTorso)}
            width={72}
            height={150}
            ariaLabel={ADULT_PART_LOOKUP[idTorso].label}
            mirrored={mirror}
          />
        </div>

        {/* LEFT ARM — patient's left (right side of diagram) */}
        <div className="absolute" style={{ right: 4, top: 70, width: 34, height: 150 }}>
          <PartRenderer
            svg={leftArmSvgRaw}
            selected={selected.has(idLArm)}
            onClick={() => onToggle(idLArm)}
            width={34}
            height={150}
            ariaLabel={ADULT_PART_LOOKUP[idLArm].label}
            mirrored={mirror}
          />
        </div>

        {/* RIGHT LEG */}
        <div className="absolute" style={{ left: W / 2 - 38, top: 200, width: 38, height: 160 }}>
          <PartRenderer
            svg={rightLegSvgRaw}
            selected={selected.has(idRLeg)}
            onClick={() => onToggle(idRLeg)}
            width={38}
            height={160}
            ariaLabel={ADULT_PART_LOOKUP[idRLeg].label}
            mirrored={mirror}
          />
        </div>

        {/* LEFT LEG */}
        <div className="absolute" style={{ left: W / 2, top: 200, width: 38, height: 160 }}>
          <PartRenderer
            svg={leftLegSvgRaw}
            selected={selected.has(idLLeg)}
            onClick={() => onToggle(idLLeg)}
            width={38}
            height={160}
            ariaLabel={ADULT_PART_LOOKUP[idLLeg].label}
            mirrored={mirror}
          />
        </div>
      </div>
    </div>
  );
}

interface AdultBodyDiagramProps {
  selected: Set<string>;
  onToggle: (id: AdultPartId) => void;
  onReset: () => void;
}

export default function AdultBodyDiagram({ selected, onToggle, onReset }: AdultBodyDiagramProps) {
  const sel = selected as Set<AdultPartId>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="w-full"
    >
      {/* Glassmorphism container */}
      <div
        className={[
          'relative w-full rounded-3xl p-4',
          'bg-white/40 dark:bg-white/[0.04]',
          'backdrop-blur-xl backdrop-saturate-150',
          'border border-white/60 dark:border-white/10',
          'shadow-[0_8px_32px_rgba(15,23,42,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
        ].join(' ')}
      >
        {/* Subtle medical grid backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.06] dark:opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '14px 14px',
            color: '#0f172a',
          }}
        />

        {/* Twin silhouettes */}
        <div className="relative flex items-start justify-center gap-3 sm:gap-6">
          <Silhouette side="front" selected={sel} onToggle={onToggle} />
          <div className="self-stretch w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-emt-border to-transparent" />
          <Silhouette side="back"  selected={sel} onToggle={onToggle} />
        </div>

        {/* Perineum + Reset */}
        <div className="relative mt-4 flex items-center justify-center gap-2 flex-wrap" dir="rtl">
          <button
            type="button"
            onClick={() => onToggle('perineum')}
            aria-pressed={sel.has('perineum')}
            className={[
              'px-3 py-2 rounded-xl border font-bold text-sm transition-all active:scale-95',
              sel.has('perineum')
                ? 'border-emt-red/50 bg-emt-red/10 text-emt-red'
                : 'border-gray-200 dark:border-emt-border bg-gray-100 dark:bg-emt-gray text-gray-600 dark:text-emt-muted',
            ].join(' ')}
          >
            פרינאום <span className="text-xs opacity-60">(1%)</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-emt-border bg-gray-100 dark:bg-emt-gray text-gray-600 dark:text-emt-muted font-bold text-sm active:scale-95 transition-all"
          >
            <RotateCcw size={14} />
            נקה הכל
          </button>
        </div>
      </div>
    </motion.div>
  );
}
