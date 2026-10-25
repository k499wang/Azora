/** The "Gumdrop" streak flame, in a 100×112 viewBox: outer silhouette and inner core. */
export const FLAME_PATH = 'M50 104C25 104 12 90 12 72C12 58 20 50 28 44C28 52 32 56 36 57C34 44 40 30 54 20C54 32 60 38 68 44C78 52 88 60 88 74C88 92 74 104 50 104Z';
export const INNER_PATH = 'M50 100C41 100 35 95 35 88C35 80 42 76 48 70C50 76 54 78 58 80C62 82 65 85 65 89C65 96 58 100 50 100Z';

/** The silhouette's extent; its base centre (50, 104) is where the flame stands. */
export const FLAME_BOUNDS = { x: 12, y: 20, width: 76, height: 84 } as const;
export const FLAME_BASE = { x: 50, y: FLAME_BOUNDS.y + FLAME_BOUNDS.height } as const;

const MIDDLE_SCALE = 0.7;
const middleX = FLAME_BASE.x * (1 - MIDDLE_SCALE);
const middleY = FLAME_BASE.y * (1 - MIDDLE_SCALE);

/** The flame's middle layer: the silhouette scaled about its base. */
export const MIDDLE_TRANSFORM = {
  scale: MIDDLE_SCALE,
  top: FLAME_BASE.y - FLAME_BOUNDS.height * MIDDLE_SCALE,
  matrix: [MIDDLE_SCALE, 0, middleX, 0, MIDDLE_SCALE, middleY, 0, 0, 1],
  svg: `translate(${middleX} ${middleY}) scale(${MIDDLE_SCALE})`,
} as const;

/** A live deformation of the flame, in flame heights; all zeros leaves the art untouched. */
export interface FlameWarp {
  /** Sideways offset of the tip, fading to nothing at the planted base. */
  bend: number;
  /** Width change through the middle; negative pinches the waist. */
  bulge: number;
  /** Extra height at the tip. */
  reach: number;
  /** Size of the ripple that runs up the sides. */
  lick: number;
  /** The ripple's phase, in radians. */
  lickPhase: number;
}

const RIPPLE_SPAN = 5;
const RIPPLE_SKEW = 0.8;

/** Absolute path commands (as SkPath.toCmds returns them) with `warp` applied to every point. */
export function warpFlameCmds(cmds: number[][], warp: FlameWarp): number[][] {
  'worklet';
  const halfWidth = FLAME_BOUNDS.width / 2;
  return cmds.map(cmd => {
    const next = [cmd[0]];
    for (let i = 1; i + 1 < cmd.length; i += 2) {
      const dx = cmd[i] - FLAME_BASE.x;
      const y = cmd[i + 1];
      const h = Math.min(1, Math.max(0, (FLAME_BASE.y - y) / FLAME_BOUNDS.height));
      const ripple = warp.lick * h * Math.sin(warp.lickPhase - RIPPLE_SPAN * h + (RIPPLE_SKEW * dx) / halfWidth);
      const width = 1 + warp.bulge * Math.sin(Math.PI * h) + ripple;
      next.push(
        FLAME_BASE.x + dx * width + warp.bend * h * h * FLAME_BOUNDS.height,
        y - warp.reach * h * h * FLAME_BOUNDS.height,
      );
    }
    return next;
  });
}
