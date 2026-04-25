import { motion } from 'framer-motion';

import {
  BodyDiagramShell,
  PerineumResetBar,
  Silhouette,
  type BodyPartId,
} from './BodySilhouette';

export interface ChildPartDef {
  id: BodyPartId;
  label: string;
  percentage: number;
}

// Pediatric Lund-Browder simplified mapping (per task spec):
//   Head: 18% (9/9 front+back) — proportionally larger than adult
//   Torso: 36% (18/18) — same as adult
//   Each arm: 9% (4.5/4.5) — same as adult
//   Each leg: 14% (7/7) — proportionally smaller than adult
//   Perineum: 1%
// Sums to 101% by spec; the extra 1% comes from perineum being additive
// (matches Lund-Browder convention — selecting all parts is not clinically meaningful).
export const CHILD_PARTS: ChildPartDef[] = [
  { id: 'head_front',      label: 'ראש קדמי',     percentage: 9   },
  { id: 'head_back',       label: 'ראש אחורי',    percentage: 9   },
  { id: 'torso_front',     label: 'גוף קדמי',     percentage: 18  },
  { id: 'torso_back',      label: 'גב',           percentage: 18  },
  { id: 'right_arm_front', label: "יד י' קדמי",   percentage: 4.5 },
  { id: 'right_arm_back',  label: "יד י' אחורי",  percentage: 4.5 },
  { id: 'left_arm_front',  label: "יד ש' קדמי",   percentage: 4.5 },
  { id: 'left_arm_back',   label: "יד ש' אחורי",  percentage: 4.5 },
  { id: 'right_leg_front', label: "רגל י' קדמי",  percentage: 7   },
  { id: 'right_leg_back',  label: "רגל י' אחורי", percentage: 7   },
  { id: 'left_leg_front',  label: "רגל ש' קדמי",  percentage: 7   },
  { id: 'left_leg_back',   label: "רגל ש' אחורי", percentage: 7   },
  { id: 'perineum',        label: 'פרינאום',      percentage: 1   },
];

export const CHILD_PART_LOOKUP: Record<BodyPartId, ChildPartDef> =
  CHILD_PARTS.reduce((acc, p) => { acc[p.id] = p; return acc; }, {} as Record<BodyPartId, ChildPartDef>);

const LABELS: Record<string, string> = CHILD_PARTS.reduce((acc, p) => {
  acc[p.id] = p.label; return acc;
}, {} as Record<string, string>);

// Visual scale applied to the silhouette. Children are rendered ~80% of the
// adult diagram size so the age difference is immediately obvious at a glance.
const CHILD_SCALE = 0.8;

interface ChildBodyDiagramProps {
  selected: Set<string>;
  onToggle: (id: BodyPartId) => void;
  onReset: () => void;
}

export default function ChildBodyDiagram({ selected, onToggle, onReset }: ChildBodyDiagramProps) {
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
          <Silhouette side="front" selected={sel} onToggle={onToggle} labelLookup={LABELS} scale={CHILD_SCALE} />
          <div className="self-stretch w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-emt-border to-transparent" />
          <Silhouette side="back"  selected={sel} onToggle={onToggle} labelLookup={LABELS} scale={CHILD_SCALE} />
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
