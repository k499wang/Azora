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

const OUTLINE_POINTS = 120;
const CURVE_STEPS = 32;

/** Where the outline gathers when the flame rolls into a ring, in the same viewBox. */
export const FLAME_RING = { x: FLAME_BASE.x, y: 64, radius: 34 } as const;

/** The silhouette as evenly spaced points, so each one has a fixed place on FLAME_RING. */
const outlinePoints = (() => {
  const [startX, startY, ...curves] = FLAME_PATH.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const dense = [[startX, startY]];
  for (let i = 0; i + 5 < curves.length; i += 6) {
    const [x0, y0] = dense[dense.length - 1];
    const [x1, y1, x2, y2, x3, y3] = curves.slice(i, i + 6);
    for (let step = 1; step <= CURVE_STEPS; step += 1) {
      const t = step / CURVE_STEPS;
      const u = 1 - t;
      dense.push([
        u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
        u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
      ]);
    }
  }
  const lengths = [0];
  for (let i = 1; i < dense.length; i += 1) {
    lengths.push(lengths[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  }
  const total = lengths[lengths.length - 1];
  const points: number[][] = [];
  let segment = 1;
  for (let k = 0; k < OUTLINE_POINTS; k += 1) {
    const at = (k * total) / OUTLINE_POINTS;
    while (lengths[segment] < at) segment += 1;
    const t = (at - lengths[segment - 1]) / (lengths[segment] - lengths[segment - 1] || 1);
    points.push([
      dense[segment - 1][0] + (dense[segment][0] - dense[segment - 1][0]) * t,
      dense[segment - 1][1] + (dense[segment][1] - dense[segment - 1][1]) * t,
    ]);
  }
  return points;
})();

const winding = Math.sign(
  outlinePoints.reduce((sum, [x, y], i) => {
    const [nextX, nextY] = outlinePoints[(i + 1) % outlinePoints.length];
    return sum + x * nextY - nextX * y;
  }, 0),
);
const startAngle = Math.atan2(outlinePoints[0][1] - FLAME_RING.y, outlinePoints[0][0] - FLAME_RING.x);
const RING_POINTS = outlinePoints.map((_, k) => {
  const angle = startAngle + (winding * 2 * Math.PI * k) / OUTLINE_POINTS;
  return [FLAME_RING.x + FLAME_RING.radius * Math.cos(angle), FLAME_RING.y + FLAME_RING.radius * Math.sin(angle)];
});

/** The silhouette as a closed polyline, in SkPath.toCmds form (move, lines, close). */
export const FLAME_OUTLINE_CMDS: number[][] = [
  ...outlinePoints.map(([x, y], k) => [k === 0 ? 0 : 1, x, y]),
  [5],
];

/** Moves each outline point toward its place on FLAME_RING; `amount` 1 is a perfect circle. */
export function ringFlameCmds(cmds: number[][], amount: number): number[][] {
  'worklet';
  if (amount <= 0) return cmds;
  return cmds.map((cmd, k) => {
    if (cmd.length < 3) return cmd;
    const [ringX, ringY] = RING_POINTS[k];
    return [cmd[0], cmd[1] + (ringX - cmd[1]) * amount, cmd[2] + (ringY - cmd[2]) * amount];
  });
}
