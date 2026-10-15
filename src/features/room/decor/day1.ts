import { colors } from '../../../theme/colors';
import type { Poly } from '../RoomScene';
import { blob, floorAt, floorEllipse, poly, ribbon, rounded, type Point } from './artKit';

const art = colors.roomArt;

/** day 1 lies flat in the middle of the floor, centred on this floor point */
const MID = 0.63;
const HALF = 0.3;

/** a rectangle on the floor plane, spanning `a0..a1` and `b0..b1` */
function patch(a0: number, b0: number, a1: number, b1: number): Point[] {
  return [floorAt(a0, b0), floorAt(a1, b0), floorAt(a1, b1), floorAt(a0, b1)];
}

function drop(points: readonly Point[], by = 4): Point[] {
  return points.map(([x, y]) => [x, y + by] as Point);
}

function closed(points: Point[]): Point[] {
  return [...points, points[0]];
}

/** tassels poking out past both `a` ends, spread across `b0..b1` */
function tassels(a0: number, a1: number, b0: number, b1: number, count: number, f: string, reach = 0.045): Poly[] {
  return Array.from({ length: count }, (_, i) => b0 + ((i + 0.5) * (b1 - b0)) / count).flatMap((b) => [
    poly(ribbon([floorAt(a0 + 0.01, b), floorAt(a0 - reach, b)], 2.4), f),
    poly(ribbon([floorAt(a1 - 0.01, b), floorAt(a1 + reach, b)], 2.4), f),
  ]);
}

/** a dashed stitch running around a closed ring */
function stitches(ring: Point[], every: number, f: string): Poly[] {
  const out: Poly[] = [];
  for (let i = 0; i < ring.length; i += every) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    out.push(poly(ribbon([p, [p[0] + (q[0] - p[0]) * 0.6, p[1] + (q[1] - p[1]) * 0.6]], 1.2), f));
  }
  return out;
}

function checkerRug(): Poly[] {
  const lo = MID - HALF;
  const hi = MID + HALF;
  const n = 4;
  const inLo = lo + 0.05;
  const step = (hi - lo - 0.1) / n;
  const base = rounded(patch(lo, lo, hi, hi), 14);
  const cells: Poly[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const a = inLo + i * step;
      const b = inLo + j * step;
      cells.push(poly(patch(a, b, a + step, b + step), (i + j) % 2 ? art.creamLight : art.mustardLight));
    }
  }
  return [
    ...tassels(lo, hi, lo + 0.08, hi - 0.08, 5, art.creamShade),
    poly(drop(base), art.mustardShade),
    poly(base, art.mustard),
    poly(rounded(patch(lo + 0.025, lo + 0.025, hi - 0.025, hi - 0.025), 10), art.mustardShade),
    poly(patch(inLo, inLo, hi - 0.05, hi - 0.05), art.creamLight),
    ...cells,
    poly(ribbon(closed(patch(inLo, inLo, hi - 0.05, hi - 0.05)), 1.6), art.mustard),
    poly(rounded(patch(MID - 0.05, MID - 0.05, MID + 0.05, MID + 0.05), 6), art.red),
  ];
}

function braidedRoundRug(): Poly[] {
  const c = floorAt(MID, MID);
  const ring = (r: number, steps = 40) => floorEllipse(c, r, steps);
  return [
    poly(drop(ring(80), 5), art.redShade),
    poly(ring(80), art.red),
    ...stitches(ring(73, 36), 2, art.redShade),
    poly(ring(64), art.mustard),
    ...stitches(ring(58, 30), 2, art.mustardShade),
    poly(ring(50), art.cream),
    poly(ribbon(closed(ring(44)), 1.6), art.creamShade),
    poly(ring(34), art.redLight),
    ...stitches(ring(28, 20), 2, art.red),
    poly(ring(20), art.mustardLight),
    poly(ring(9, 20), art.mustard),
  ];
}

function stripedRunner(): Poly[] {
  const b0 = MID - 0.15;
  const b1 = MID + 0.15;
  const a0 = MID - HALF;
  const a1 = MID + HALF;
  const base = rounded(patch(a0, b0, a1, b1), 10);
  const stripe = (from: number, to: number, f: string) => poly(patch(from, b0 + 0.03, to, b1 - 0.03), f);
  const diamond = (a: number, f: string): Poly =>
    poly([floorAt(a - 0.035, MID), floorAt(a, MID - 0.07), floorAt(a + 0.035, MID), floorAt(a, MID + 0.07)], f);
  return [
    ...tassels(a0, a1, b0 + 0.03, b1 - 0.03, 6, art.creamShade),
    poly(drop(base), art.redShade),
    poly(base, art.red),
    poly(patch(a0 + 0.03, b0 + 0.03, a1 - 0.03, b1 - 0.03), art.cream),
    stripe(a0 + 0.07, a0 + 0.12, art.red),
    stripe(a0 + 0.14, a0 + 0.16, art.mustard),
    stripe(a1 - 0.16, a1 - 0.14, art.mustard),
    stripe(a1 - 0.12, a1 - 0.07, art.red),
    diamond(MID - 0.085, art.mustardLight),
    diamond(MID, art.red),
    diamond(MID + 0.085, art.mustardLight),
    poly([floorAt(MID - 0.02, MID), floorAt(MID, MID - 0.03), floorAt(MID + 0.02, MID), floorAt(MID, MID + 0.03)], art.creamLight),
  ];
}

function patchQuilt(): Poly[] {
  const lo = MID - HALF;
  const hi = MID + HALF;
  const n = 3;
  const inLo = lo + 0.04;
  const step = (hi - lo - 0.08) / n;
  const tones = [art.pink, art.mustardLight, art.tealLight, art.mustardLight, art.pinkLight, art.mustardLight, art.tealLight, art.mustardLight, art.pink];
  const cells = Array.from({ length: n * n }, (_, k) => {
    const i = Math.floor(k / n);
    const j = k % n;
    const a = inLo + i * step;
    const b = inLo + j * step;
    return poly(patch(a, b, a + step, b + step), tones[k]);
  });
  const seams = [1, 2].flatMap((k) => [
    poly(ribbon([floorAt(inLo + k * step, inLo), floorAt(inLo + k * step, hi - 0.04)], 1.4), art.cream),
    poly(ribbon([floorAt(inLo, inLo + k * step), floorAt(hi - 0.04, inLo + k * step)], 1.4), art.cream),
  ]);
  const centre = floorAt(MID, MID);
  return [
    poly(drop(rounded(patch(lo, lo, hi, hi), 12)), art.pinkShade),
    poly(rounded(patch(lo, lo, hi, hi), 12), art.pinkShade),
    poly(patch(lo + 0.02, lo + 0.02, hi - 0.02, hi - 0.02), art.cream),
    ...cells,
    ...seams,
    poly(floorEllipse(centre, 14, 20), art.creamLight),
    poly(floorEllipse(centre, 6, 14), art.red),
    ...[0, 1].flatMap((i) =>
      [0, 1].map((j) => poly(floorEllipse(floorAt(inLo + (i * 2 + 0.5) * step, inLo + (j * 2 + 0.5) * step), 6, 14), art.creamLight)),
    ),
    poly(ribbon(closed(patch(lo + 0.02, lo + 0.02, hi - 0.02, hi - 0.02)), 1.2), art.pinkLight),
  ];
}

function cloudRug(): Poly[] {
  const c = floorAt(MID, MID);
  const cloud = blob(c, 84, 42, 0.14, 4, 44);
  const inner = blob([c[0] - 2, c[1] - 1], 66, 31, 0.14, 4, 44);
  const dot = (dx: number, dy: number, r: number, f: string): Poly => poly(floorEllipse([c[0] + dx, c[1] + dy], r, 14), f);
  return [
    poly(drop(cloud, 5), art.pinkShade),
    poly(cloud, art.pinkLight),
    poly(inner, art.creamLight),
    ...stitches(blob([c[0] - 1, c[1]], 75, 36.5, 0.14, 4, 44), 2, art.pink),
    poly(ribbon([[c[0] - 40, c[1] + 14], [c[0] - 12, c[1] + 21], [c[0] + 20, c[1] + 19]], 1.8), art.pinkLight),
    dot(-30, -8, 6, art.mustardLight),
    dot(-30, -8, 2.4, art.glow),
    dot(28, -10, 4.5, art.pinkLight),
    dot(10, 4, 3.5, art.tealLight),
    dot(44, 6, 3, art.mustardLight),
  ];
}

export const DAY1_DECOR: Record<string, Poly[]> = {
  'day1.checker_rug': checkerRug(),
  'day1.braided_round_rug': braidedRoundRug(),
  'day1.striped_runner': stripedRunner(),
  'day1.patch_quilt': patchQuilt(),
  'day1.cloud_rug': cloudRug(),
};
