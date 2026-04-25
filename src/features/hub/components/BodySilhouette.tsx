import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';

import headSvgRaw      from '../../../assets/body-parts/head-back.svg?raw';
import torsoSvgRaw     from '../../../assets/body-parts/torso-back.svg?raw';
import leftArmSvgRaw   from '../../../assets/body-parts/left-arm-back.svg?raw';
import rightArmSvgRaw  from '../../../assets/body-parts/right-arm-back.svg?raw';
import leftLegSvgRaw   from '../../../assets/body-parts/left-leg-back.svg?raw';
import rightLegSvgRaw  from '../../../assets/body-parts/right-leg-back.svg?raw';

export type BodyPartId =
  | 'head_front'  | 'head_back'
  | 'torso_front' | 'torso_back'
  | 'right_arm_front' | 'right_arm_back'
  | 'left_arm_front'  | 'left_arm_back'
  | 'right_leg_front' | 'right_leg_back'
  | 'left_leg_front'  | 'left_leg_back'
  | 'perineum';

// Strip baked-in colors so currentColor controls fill, and force responsive sizing.
function normalizeSvg(raw: string): string {
  return raw
    .replace(/\swidth="[^"]+"/, ' width="100%"')
    .replace(/\sheight="[^"]+"/, ' height="100%"')
    .replace(/preserveAspectRatio="[^"]+"/g, '')
    .replace(/<svg /, '<svg preserveAspectRatio="xMidYMid meet" style="display:block" ')
    .replace(/fill="#[0-9A-Fa-f]+"/gi, 'fill="currentColor"')
    .replace(/fill-opacity="[\d.]+"/gi, '')
    .replace(/stroke="#[0-9A-Fa-f]+"/gi, 'stroke="currentColor"')
    .replace(/stroke-opacity="[\d.]+"/gi, 'stroke-opacity="0.25"');
}

interface PartProps {
  svg: string;
  selected: boolean;
  onClick: () => void;
  width: number;
  height: number;
  ariaLabel: string;
  mirrored?: boolean;
}

// Clickable silhouette piece. Tapping ONLY toggles the fill color via currentColor —
// no scale, translate, or layout shift. The bounding box is fixed.
function PartButton({ svg, selected, onClick, width, height, ariaLabel, mirrored }: PartProps) {
  const html = useMemo(() => normalizeSvg(svg), [svg]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={selected}
      style={{
        width,
        height,
        transform: mirrored ? 'scaleX(-1)' : undefined,
        color: selected ? 'rgba(239, 68, 68, 0.85)' : 'rgba(148, 163, 184, 0.55)',
        transition: 'color 200ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
      className={[
        'relative block p-0 m-0 bg-transparent border-0 outline-none cursor-pointer',
        selected
          ? 'drop-shadow-[0_0_6px_rgba(239,68,68,0.65)]'
          : 'hover:opacity-80',
      ].join(' ')}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

interface SilhouetteProps {
  side: 'front' | 'back';
  selected: Set<BodyPartId>;
  onToggle: (id: BodyPartId) => void;
  labelLookup: Record<string, string>;
  scale?: number;
}

// One full silhouette (front OR back), absolute-positioned in a logical 160×380
// canvas. Each part's width × height matches the SVG viewBox aspect ratio so the
// path fills the container edge-to-edge — that's what eliminates the gaps.
export function Silhouette({ side, selected, onToggle, labelLookup, scale = 1 }: SilhouetteProps) {
  const W = 160;
  const H = 380;

  const idHead  = `head_${side}`      as BodyPartId;
  const idTorso = `torso_${side}`     as BodyPartId;
  const idRArm  = `right_arm_${side}` as BodyPartId;
  const idLArm  = `left_arm_${side}`  as BodyPartId;
  const idRLeg  = `right_leg_${side}` as BodyPartId;
  const idLLeg  = `left_leg_${side}`  as BodyPartId;

  // Mirror the front view so it doesn't read identical to the back.
  const mirror = side === 'front';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-emt-muted">
        {side === 'front' ? 'קדמי' : 'אחורי'}
      </p>

      {/* Outer wrapper takes the post-scale layout space so the parent flex layout collapses correctly. */}
      <div style={{ width: W * scale, height: H * scale }} dir="ltr">
        {/* Inner wrapper renders at natural coords, scaled visually from top-left. */}
        <div
          className="relative"
          style={{
            width: W,
            height: H,
            transform: scale === 1 ? undefined : `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {/* HEAD — top center. h derived from 370×552 viewBox aspect (≈0.67). */}
          <div className="absolute" style={{ left: 58, top: 0, width: 44, height: 66 }}>
            <PartButton svg={headSvgRaw} selected={selected.has(idHead)} onClick={() => onToggle(idHead)} width={44} height={66} ariaLabel={labelLookup[idHead]} mirrored={mirror} />
          </div>

          {/* TORSO — overlaps head at neck (top) and pelvis at hips (bottom). 798×1443 aspect. */}
          <div className="absolute" style={{ left: 44, top: 60, width: 72, height: 130 }}>
            <PartButton svg={torsoSvgRaw} selected={selected.has(idTorso)} onClick={() => onToggle(idTorso)} width={72} height={130} ariaLabel={labelLookup[idTorso]} mirrored={mirror} />
          </div>

          {/* RIGHT ARM — patient's right (viewer's left). Right edge meets torso left edge. */}
          <div className="absolute" style={{ left: 10, top: 70, width: 34, height: 111 }}>
            <PartButton svg={rightArmSvgRaw} selected={selected.has(idRArm)} onClick={() => onToggle(idRArm)} width={34} height={111} ariaLabel={labelLookup[idRArm]} mirrored={mirror} />
          </div>

          {/* LEFT ARM — patient's left (viewer's right). Left edge meets torso right edge. */}
          <div className="absolute" style={{ left: 116, top: 70, width: 34, height: 111 }}>
            <PartButton svg={leftArmSvgRaw} selected={selected.has(idLArm)} onClick={() => onToggle(idLArm)} width={34} height={111} ariaLabel={labelLookup[idLArm]} mirrored={mirror} />
          </div>

          {/* RIGHT LEG — left half under torso. 359×1749 aspect. */}
          <div className="absolute" style={{ left: 42, top: 185, width: 38, height: 185 }}>
            <PartButton svg={rightLegSvgRaw} selected={selected.has(idRLeg)} onClick={() => onToggle(idRLeg)} width={38} height={185} ariaLabel={labelLookup[idRLeg]} mirrored={mirror} />
          </div>

          {/* LEFT LEG — right half under torso. */}
          <div className="absolute" style={{ left: 80, top: 185, width: 38, height: 185 }}>
            <PartButton svg={leftLegSvgRaw} selected={selected.has(idLLeg)} onClick={() => onToggle(idLLeg)} width={38} height={185} ariaLabel={labelLookup[idLLeg]} mirrored={mirror} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ShellProps {
  children: React.ReactNode;
}

// Glassmorphism container shared by Adult + Child diagrams.
export function BodyDiagramShell({ children }: ShellProps) {
  return (
    <div
      className={[
        'relative w-full rounded-3xl p-4',
        'bg-white/40 dark:bg-white/[0.04]',
        'backdrop-blur-xl backdrop-saturate-150',
        'border border-white/60 dark:border-white/10',
        'shadow-[0_8px_32px_rgba(15,23,42,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
      ].join(' ')}
    >
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
      {children}
    </div>
  );
}

interface PerineumResetBarProps {
  selectedPerineum: boolean;
  onTogglePerineum: () => void;
  onReset: () => void;
}

export function PerineumResetBar({ selectedPerineum, onTogglePerineum, onReset }: PerineumResetBarProps) {
  return (
    <div className="relative mt-4 flex items-center justify-center gap-2 flex-wrap" dir="rtl">
      <button
        type="button"
        onClick={onTogglePerineum}
        aria-pressed={selectedPerineum}
        className={[
          'px-3 py-2 rounded-xl border font-bold text-sm transition-colors active:scale-95',
          selectedPerineum
            ? 'border-emt-red/50 bg-emt-red/10 text-emt-red'
            : 'border-gray-200 dark:border-emt-border bg-gray-100 dark:bg-emt-gray text-gray-600 dark:text-emt-muted',
        ].join(' ')}
      >
        פרינאום <span className="text-xs opacity-60">(1%)</span>
      </button>

      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-emt-border bg-gray-100 dark:bg-emt-gray text-gray-600 dark:text-emt-muted font-bold text-sm active:scale-95 transition-colors"
      >
        <RotateCcw size={14} />
        נקה הכל
      </button>
    </div>
  );
}
