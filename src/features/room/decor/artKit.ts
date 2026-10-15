import type { Poly } from '../RoomScene';

/**
 * The drawing kit every decoration is authored with.
 *
 * The room renders flat polygons, so curves are sampled into dense rings here
 * rather than taught to every renderer. Pieces are built from soft volumes —
 * rounded boxes, blobs, ellipses — and shaded by stepping between a hue's
 * light, base and shade tones. Nothing is outlined.
 *
 * Space is the room's viewBox: the floor point `(a, b)` sits at
 * `x = 155.9 (a - b)`, `y = 90 (a + b)`. A step along `a` runs down-right, a
 * step along `b` runs down-left, and up is `-y`.
 */

export type Point = readonly [number, number];

const ISO_X = 155.9;
const ISO_Y = 90;

/** one floor-plane step along `a` (toward the right wall), in viewBox units */
export const A: Point = [ISO_X, ISO_Y];
/** one floor-plane step along `b` (toward the left wall) */
export const B: Point = [-ISO_X, ISO_Y];

export function floorAt(a: number, b: number): Point {
  return [ISO_X * (a - b), ISO_Y * (a + b)];
}

export function add(p: Point, ...steps: Point[]): Point {
  return steps.reduce<Point>((sum, [x, y]) => [sum[0] + x, sum[1] + y], p);
}

export function scale([x, y]: Point, by: number): Point {
  return [x * by, y * by];
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function poly(points: readonly Point[], f: string, o?: number): Poly {
  const p = points.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');
  return o == null ? { p, f } : { p, f, o };
}

/**
 * A polygon with every corner replaced by a sampled arc of up to `radius`.
 * Short edges cap the radius so a narrow shape never folds over itself.
 */
export function rounded(
  points: readonly Point[],
  radius: number | readonly number[],
  steps = 5,
): Point[] {

  const ring: Point[] = [];
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const at = points[i];
    const next = points[(i + 1) % n];
    const inLen = Math.hypot(at[0] - prev[0], at[1] - prev[1]);
    const outLen = Math.hypot(next[0] - at[0], next[1] - at[1]);
    const want = typeof radius === 'number' ? radius : radius[i] ?? 0;
    const r = Math.min(want, inLen * 0.45, outLen * 0.45);
    if (r <= 0) {
      ring.push(at);
      continue;
    }

    const from: Point = [
      at[0] + ((prev[0] - at[0]) * r) / inLen,
      at[1] + ((prev[1] - at[1]) * r) / inLen,
    ];
    const to: Point = [
      at[0] + ((next[0] - at[0]) * r) / outLen,
      at[1] + ((next[1] - at[1]) * r) / outLen,
    ];

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const u = 1 - t;
      ring.push([
        u * u * from[0] + 2 * u * t * at[0] + t * t * to[0],
        u * u * from[1] + 2 * u * t * at[1] + t * t * to[1],
      ]);
    }
  }

  return ring;
}

export function ellipse(
  [cx, cy]: Point,
  rx: number,
  ry: number,
  steps = 28,
  from = 0,
  to = Math.PI * 2,
): Point[] {
  const ring: Point[] = [];
  const closed = Math.abs(to - from - Math.PI * 2) < 1e-6;
  const count = closed ? steps : steps + 1;

  for (let i = 0; i < count; i++) {
    const angle = from + ((to - from) * i) / steps;
    ring.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]);
  }

  return ring;
}

/** a circle lying on the floor, seen in the room's projection */
export function floorEllipse(center: Point, radius: number, steps = 28): Point[] {
  return ellipse(center, radius, radius * (ISO_Y / ISO_X), steps);
}

/**
 * A soft organic outline — leaves, bushes, clouds. Deterministic: the same
 * `seed` always draws the same shape, so a piece never changes between renders.
 */
export function blob(
  [cx, cy]: Point,
  rx: number,
  ry: number,
  wobble = 0.12,
  seed = 1,
  steps = 32,
): Point[] {
  const ring: Point[] = [];
  const lobes = 3 + (seed % 3);

  for (let i = 0; i < steps; i++) {
    const angle = (Math.PI * 2 * i) / steps;
    const bump =
      1 +
      wobble * Math.sin(angle * lobes + seed * 1.7) +
      wobble * 0.5 * Math.sin(angle * (lobes + 2) + seed * 0.9);
    ring.push([cx + Math.cos(angle) * rx * bump, cy + Math.sin(angle) * ry * bump]);
  }

  return ring;
}

/**
 * A leaf: a pointed oval from `base` to `tip`, `width` across at its widest.
 */
export function leaf(base: Point, tip: Point, width: number, steps = 10): Point[] {
  const dx = tip[0] - base[0];
  const dy = tip[1] - base[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const side = (sign: 1 | -1): Point[] =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps;
      const swell = Math.sin(Math.PI * t) * (width / 2) * (1 - 0.25 * t);
      return [base[0] + dx * t + nx * swell * sign, base[1] + dy * t + ny * swell * sign];
    });

  return [...side(1), ...side(-1).reverse().slice(1, -1)];
}

/** a thick stroke along a path, with round caps — strings, stems, handles */
export function ribbon(path: readonly Point[], width: number): Point[] {
  const half = width / 2;
  const left: Point[] = [];
  const right: Point[] = [];

  path.forEach((at, i) => {
    const prev = path[Math.max(0, i - 1)];
    const next = path[Math.min(path.length - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    left.push([at[0] - (dy / len) * half, at[1] + (dx / len) * half]);
    right.push([at[0] + (dy / len) * half, at[1] - (dx / len) * half]);
  });

  const cap = (at: Point, toward: Point, steps = 6): Point[] => {
    const angle = Math.atan2(at[1] - toward[1], at[0] - toward[0]);
    return Array.from({ length: steps + 1 }, (_, i) => {
      const a = angle - Math.PI / 2 + (Math.PI * i) / steps;
      return [at[0] + Math.cos(a) * half, at[1] + Math.sin(a) * half] as Point;
    });
  };

  const end = path[path.length - 1];
  const start = path[0];
  return [
    ...left,
    ...cap(end, path[path.length - 2] ?? start).slice(1, -1),
    ...right.reverse(),
    ...cap(start, path[1] ?? end).slice(1, -1),
  ];
}

/** a sagging curve between two points — bunting strings, garlands */
export function sag(from: Point, to: Point, depth: number, steps = 24): Point[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return [
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t + Math.sin(Math.PI * t) * depth,
    ];
  });
}

/** a parallelogram from `origin` spanned by two edge vectors */
export function quad(origin: Point, u: Point, v: Point): Point[] {
  return [origin, add(origin, u), add(origin, u, v), add(origin, v)];
}

export interface BoxTones {
  top: string;
  left: string;
  right: string;
}

/**
 * A soft upright box standing on the floor: `origin` is its back-bottom corner
 * on the floor plane, `w` its extent along `a`, `d` along `b`, `h` its height.
 * Returns the three visible faces, back to front.
 *
 * Only the outer silhouette is rounded. Corners two faces share stay sharp, so
 * every face meets its neighbour exactly and the box reads as one solid.
 */
export function box(
  origin: Point,
  w: number,
  d: number,
  h: number,
  tones: BoxTones,
  radius = 5,
): Poly[] {
  const up: Point = [0, -h];
  const wa = scale(A, w);
  const db = scale(B, d);
  const front = add(origin, wa, db);
  const r = radius;

  return [
    poly(rounded([add(origin, db), front, add(front, up), add(origin, db, up)], [r, r, 0, r]), tones.left),
    poly(rounded([add(origin, wa), front, add(front, up), add(origin, wa, up)], [r, r, 0, r]), tones.right),
    poly(rounded([add(origin, up), add(origin, wa, up), add(front, up), add(origin, db, up)], [r, r, 0, r]), tones.top),
  ];
}

/** the left wall: `h` runs out from the back seam (0..1), `v` down from the top (0..1) */
export function leftWallAt(h: number, v: number): Point {
  return [-ISO_X * h, -180 + ISO_Y * h + 180 * v];
}

/** the right wall: as `leftWallAt`, mirrored */
export function rightWallAt(h: number, v: number): Point {
  return [ISO_X * h, -180 + ISO_Y * h + 180 * v];
}

/**
 * A shape drawn flat on a wall: `shape` is authored in the wall's own 2D
 * space — `u` is horizontal screen distance out from `anchor` toward the
 * wall's outer edge, `v` is straight down — and sheared onto the wall.
 */
export function onWall(side: 'left' | 'right', anchor: Point, shape: readonly Point[]): Point[] {
  const sign = side === 'left' ? -1 : 1;
  return shape.map(([u, v]) => [anchor[0] + sign * u, anchor[1] + v + u * (ISO_Y / ISO_X)]);
}

/** a rectangle in wall space, with rounded corners, ready for `onWall` */
export function wallRect(x: number, y: number, w: number, h: number, radius = 3): Point[] {
  return rounded(
    [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    radius,
  );
}
