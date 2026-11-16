import { motion } from 'framer-motion';

import {
  BodyDiagramShell,
  PerineumResetBar,
  Silhouette,
  type BodyPartId,
} from './BodySilhouette';

export type AdultPartId = BodyPartId;

export interface AdultPartDef {
  id: BodyPartId;
  percentage: number;
}

// Adult Rule of Nines — front/back split. Each surface counts independently.
export const ADULT_PARTS: AdultPartDef[] = [
  { id: 'head_front',      percentage: 4.5 },
  { id: 'head_back',       percentage: 4.5 },
  { id: 'torso_front',     percentage: 18  },
  { id: 'torso_back',      percentage: 18  },
  { id: 'right_arm_front', percentage: 4.5 },
  { id: 'right_arm_back',  percentage: 4.5 },
  { id: 'left_arm_front',  percentage: 4.5 },
  { id: 'left_arm_back',   percentage: 4.5 },
  { id: 'right_leg_front', percentage: 9   },
  { id: 'right_leg_back',  percentage: 9   },
  { id: 'left_leg_front',  percentage: 9   },
  { id: 'left_leg_back',   percentage: 9   },
  { id: 'perineum',        percentage: 1   },
];

export const ADULT_PART_LOOKUP: Record<BodyPartId, AdultPartDef> =
  ADULT_PARTS.reduce((acc, p) => { acc[p.id] = p; return acc; }, {} as Record<BodyPartId, AdultPartDef>);


interface AdultBodyDiagramProps {
  selected: Set<string>;
  onToggle: (id: BodyPartId) => void;
  onReset: () => void;
}

export default function AdultBodyDiagram({ selected, onToggle, onReset }: AdultBodyDiagramProps) {
  const sel = selected as Set<BodyPartId>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="w-full"
    >
      <BodyDiagramShell>
        <div className="relative flex items-start justify-center gap-3 sm:gap-6">
          <Silhouette side="front" selected={sel} onToggle={onToggle} />
          <div className="self-stretch w-px bg-gradient-to-b from-transparent via-line-strong to-transparent" />
          <Silhouette side="back"  selected={sel} onToggle={onToggle} />
        </div>

        <PerineumResetBar
          selectedPerineum={sel.has('perineum')}
          onTogglePerineum={() => onToggle('perineum')}
          onReset={onReset}
        />
      </BodyDiagramShell>
    </motion.div>
  );
}
