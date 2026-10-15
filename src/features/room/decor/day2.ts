import { colors } from '../../../theme/colors';
import type { Poly } from '../RoomScene';
import type { BoxTones, Point } from './artKit';
import { add, box, ellipse, floorAt, leaf, onWall, poly, ribbon, rounded } from './artKit';

const art = colors.roomArt;

/** day 2 stands against the right wall; pieces span `a` from here, `DEPTH` out along `b` */
const START = 0.55;
const DEPTH = 0.22;

const WOOD: BoxTones = { top: art.woodLight, left: art.wood, right: art.woodShade };
const LIP: BoxTones = { top: art.woodLight, left: art.woodLight, right: art.wood };
const PINK: BoxTones = { top: art.pinkLight, left: art.pink, right: art.pinkShade };
const PINK_LIP: BoxTones = { top: art.pinkLight, left: art.pinkLight, right: art.pink };
const PINK_LEG: BoxTones = { top: art.pink, left: art.pinkShade, right: art.pinkShade };
const TEAL: BoxTones = { top: art.tealLight, left: art.teal, right: art.tealShade };
const CREAM: BoxTones = { top: art.creamLight, left: art.cream, right: art.creamShade };
const SKY: BoxTones = { top: art.skyLight, left: art.sky, right: art.skyShade };
const RED: BoxTones = { top: art.redLight, left: art.red, right: art.redShade };

interface Tone {
  light: string;
  base: string;
  shade: string;
}

const lift = (p: Point, z: number): Point => [p[0], p[1] - z];
const at = (a: number, b: number, z: number): Point => lift(floorAt(a, b), z);
const lerp = (p: Point, q: Point, t: number): Point => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];

/** a parallelogram in the plane `b = d`, from `a0..a1`, `z0..z1` */
function panel(a0: number, a1: number, z0: number, z1: number, d: number): Point[] {
  return [at(a0, d, z0), at(a1, d, z0), at(a1, d, z1), at(a0, d, z1)];
}

/** a door or drawer on the face `b = d`: a recessed groove, then the face inset inside it */
function drawer(a0: number, a1: number, z0: number, z1: number, d: number, groove: string, face: string): Poly[] {
  const m = 1.6 / 180;
  return [poly(panel(a0, a1, z0, z1, d), groove), poly(panel(a0 + m, a1 - m, z0 + 1.6, z1 - 1.6, d), face)];
}

function knob(p: Point, base: string, light: string): Poly[] {
  return [poly(ellipse(p, 2.6, 2.6, 12), base), poly(ellipse(add(p, [-0.7, -0.8]), 1.1, 1.1, 8), light)];
}

/** a soft grain stroke along the face `b = d` */
function grain(a0: number, a1: number, z: number, d: number, f: string): Poly {
  return poly(ribbon([at(a0, d, z), at((a0 + a1) / 2, d, z + 1.2), at(a1, d, z)], 1.2), f);
}

/** a tapered pot standing on `p`, with a rim band and soil */
function pot(p: Point, r: number, h: number, t: Tone): Poly[] {
  const top = lift(p, h);
  const turn = Math.acos(0.35);
  const band = Math.max(2.2, h * 0.28);
  return [
    poly([...ellipse(p, r * 0.78, r * 0.33, 12, 0, Math.PI), ...ellipse(top, r, r * 0.42, 12, Math.PI, Math.PI * 2)], t.base),
    poly([...ellipse(p, r * 0.78, r * 0.33, 6, 0, turn), [top[0] + r * 0.35, top[1]], [top[0] + r, top[1]]], t.shade),
    poly([...ellipse(lift(p, h - band), r * 1.02, r * 0.43, 12, 0, Math.PI), ...ellipse(top, r * 1.04, r * 0.44, 12, Math.PI, Math.PI * 2)], t.light),
    poly(ellipse(top, r * 0.8, r * 0.3, 16), art.woodDeep),
  ];
}

/** a cylinder standing on `p`: body, right-hand shade, top */
function can(p: Point, r: number, h: number, t: Tone): Poly[] {
  const top = lift(p, h);
  const ry = r * 0.42;
  return [
    poly([...ellipse(p, r, ry, 12, 0, Math.PI), ...ellipse(top, r, ry, 12, Math.PI, Math.PI * 2)], t.base),
    poly([...ellipse(p, r, ry, 6, 0, 1.1), [top[0] + r * Math.cos(1.1), top[1] + ry * Math.sin(1.1)], [top[0] + r, top[1]]], t.shade),
    poly(ellipse(top, r, ry, 16), t.light),
  ];
}

function sprigOf(p: Point, size: number, tips: [number, number, string][]): Poly[] {
  return tips.flatMap(([dx, dy, f]) => {
    const tip = add(p, [dx * size, dy * size]);
    const out = [poly(leaf(p, tip, 9 * size), f)];
    if (f !== art.leafShade) out.push(poly(ribbon([lerp(p, tip, 0.15), lerp(p, tip, 0.75)], 0.9), art.leafShade));
    return out;
  });
}

function studyDesk(): Poly[] {
  const a0 = START;
  const w = 0.3;
  const under = 38;
  const top = under + 6;
  const d = DEPTH - 0.01;
  const ped = a0 + 0.15;
  const lamp = at(a0 + 0.07, 0.07, top);
  const elbow = add(lamp, [-4, -18]);
  const head = add(elbow, [12, -9]);
  const mug = at(a0 + 0.25, 0.14, top);
  return [
    ...box(at(a0 + 0.01, 0.01, 0), 0.03, d - 0.01, under, WOOD, 2),
    ...box(at(ped, 0.01, 0), 0.14, d - 0.01, under, WOOD, 3),
    ...drawer(ped + 0.012, ped + 0.128, 4, 20, d, art.woodShade, art.wood),
    ...drawer(ped + 0.012, ped + 0.128, 22, 35, d, art.woodShade, art.wood),
    ...knob(at(ped + 0.07, d, 12), art.cream, art.creamLight),
    ...knob(at(ped + 0.07, d, 28.5), art.cream, art.creamLight),
    ...box(at(a0, 0, under), w, DEPTH, 6, LIP, 3),
    ...box(at(a0 + 0.13, 0.04, top), 0.07, 0.1, 4, RED, 1),
    ...box(at(a0 + 0.135, 0.045, top + 4), 0.06, 0.09, 3.5, SKY, 1),
    poly(ellipse(lift(lamp, 1.2), 8, 3.4, 16), art.mustardShade),
    poly(ellipse(lift(lamp, 2.4), 8, 3.4, 16), art.mustard),
    poly(ribbon([lift(lamp, 2), elbow, head], 2.6), art.mustardShade),
    poly(ellipse(elbow, 2.2, 2.2, 10), art.mustard),
    poly(rounded([add(head, [-10, 9]), add(head, [10, 9]), add(head, [5, -4]), add(head, [-4, -4])], [2, 2, 3, 3]), art.mustard),
    poly(rounded([add(head, [1, -4]), add(head, [5, -4]), add(head, [10, 9]), add(head, [4, 9])], [0, 3, 2, 0]), art.mustardShade),
    poly(ellipse(add(head, [0, 9]), 10, 2.6, 16), art.glow),
    ...can(mug, 4.2, 8, { light: art.creamLight, base: art.cream, shade: art.creamShade }),
    poly(ellipse(lift(mug, 8), 3.2, 1.3, 12), art.woodDeep),
    poly(ribbon([lift(add(mug, [4, 0]), 6.5), lift(add(mug, [7.4, 0]), 5), lift(add(mug, [4, 0]), 2.5)], 1.6), art.creamShade),
  ];
}

function vanity(): Poly[] {
  const a0 = START + 0.03;
  const w = 0.26;
  const h = 40;
  const leg = 8;
  const body = h - 4;
  const anchor = at(a0 + 0.04, 0, h + 62);
  const glass = (c: Point, rx: number, ry: number, f: string): Poly => poly(onWall('right', anchor, ellipse(c, rx, ry, 32)), f);
  const bottle = at(a0 + 0.07, 0.1, h);
  const legAt = (a: number, b: number): Poly[] => box(at(a, b, 0), 0.02, 0.02, leg, PINK_LEG, 1);
  return [
    poly(onWall('right', anchor, ribbon([[13, 6], [20, -8], [27, 6]], 1.2)), art.ink),
    poly(onWall('right', anchor, ellipse([20, -8], 1.8, 1.8, 10)), art.mustardShade),
    glass([21, 31], 20, 28, art.pinkShade),
    glass([19, 29], 20, 28, art.pinkLight),
    glass([20, 30], 19, 27, art.pink),
    glass([20, 30], 15, 22, art.pinkShade),
    glass([20.6, 30.6], 14.4, 21.4, art.glass),
    poly(onWall('right', anchor, ribbon([[10, 28], [11, 20], [15, 13]], 3.2)), art.glassLight, 0.85),
    poly(onWall('right', anchor, ribbon([[13, 33], [14, 30]], 2.2)), art.glassLight, 0.85),
    ...legAt(a0 + w - 0.03, 0.01),
    ...legAt(a0 + 0.01, DEPTH - 0.03),
    ...legAt(a0 + w - 0.03, DEPTH - 0.03),
    ...box(at(a0, 0, leg), w, DEPTH, body - leg, PINK, 4),
    ...drawer(a0 + 0.02, a0 + w - 0.02, leg + 4, body - 4, DEPTH, art.pinkShade, art.pink),
    poly(ribbon([at(a0 + 0.11, DEPTH, leg + 14), at(a0 + 0.15, DEPTH, leg + 14)], 2.6), art.cream),
    poly(ribbon([at(a0 + 0.11, DEPTH, leg + 14.6), at(a0 + 0.15, DEPTH, leg + 14.6)], 1), art.creamLight),
    ...box(at(a0, 0, body), w + 0.006, DEPTH + 0.006, 4, PINK_LIP, 2),
    poly(rounded([add(bottle, [-5, 0]), add(bottle, [5, 0]), add(bottle, [5, -13]), add(bottle, [-5, -13])], [3, 3, 2, 2]), art.glass),
    poly(rounded([add(bottle, [-3, -1]), add(bottle, [5, -1]), add(bottle, [5, -8]), add(bottle, [-3, -8])], [2, 0, 0, 1]), art.pinkLight),
    poly(ribbon([add(bottle, [-2.6, -3]), add(bottle, [-2.6, -10])], 1.3), art.glassLight),
    poly(rounded([add(bottle, [-2.5, -13]), add(bottle, [2.5, -13]), add(bottle, [2.5, -18]), add(bottle, [-2.5, -18])], [0, 0, 1.2, 1.2]), art.pinkShade),
    ...pot(at(a0 + 0.19, 0.11, h), 7, 8, { light: art.creamLight, base: art.cream, shade: art.creamShade }),
    ...sprigOf(at(a0 + 0.19, 0.11, h + 8), 1, [
      [-9, -10, art.leafShade],
      [9, -11, art.leafShade],
      [-3, -16, art.leaf],
      [4, -15, art.leafLight],
    ]),
    poly(ellipse(at(a0 + 0.195, 0.11, h + 22), 3.6, 3.6, 12), art.pinkLight),
    poly(ellipse(at(a0 + 0.195, 0.11, h + 22), 1.4, 1.4, 8), art.mustard),
  ];
}

function dresser(): Poly[] {
  const a0 = START;
  const w = 0.3;
  const h = 62;
  const body = h - 4;
  const rows: [number, number][] = [
    [6, 21],
    [23, 38],
    [40, 54],
  ];
  const potAt = at(a0 + 0.21, 0.1, h);
  const stem = lift(potAt, 13);
  return [
    ...box(at(a0, 0, 0), w, DEPTH, body, WOOD, 4),
    poly(panel(a0 + 0.02, a0 + w - 0.02, 0, 4, DEPTH), art.woodShade),
    ...rows.flatMap(([z0, z1]) => [
      ...drawer(a0 + 0.02, a0 + w - 0.02, z0, z1, DEPTH, art.woodShade, art.wood),
      ...knob(at(a0 + 0.09, DEPTH, (z0 + z1) / 2), art.cream, art.creamLight),
      ...knob(at(a0 + w - 0.09, DEPTH, (z0 + z1) / 2), art.cream, art.creamLight),
    ]),
    grain(a0 + 0.12, a0 + 0.2, 13, DEPTH, art.woodShade),
    grain(a0 + 0.1, a0 + 0.19, 47, DEPTH, art.woodShade),
    ...box(at(a0, 0, body), w + 0.006, DEPTH + 0.006, 4, LIP, 2.5),
    ...box(at(a0 + 0.04, 0.05, h), 0.08, 0.1, 18, { top: art.woodLight, left: art.woodLight, right: art.wood }, 1),
    poly(panel(a0 + 0.048, a0 + 0.112, h + 2.5, h + 15.5, 0.15), art.skyLight),
    poly(panel(a0 + 0.048, a0 + 0.112, h + 2.5, h + 7, 0.15), art.leafLight),
    poly(ellipse(at(a0 + 0.095, 0.15, h + 12), 2, 2, 10), art.mustardLight),
    ...pot(potAt, 9, 14, { light: art.redLight, base: art.red, shade: art.redShade }),
    ...sprigOf(stem, 1, [
      [-15, -22, art.leafShade],
      [14, -23, art.leaf],
      [0, -30, art.leafLight],
    ]),
  ];
}

function uprightPiano(): Poly[] {
  const a0 = START;
  const w = 0.3;
  const back = 0.13;
  const h = 72;
  const keyZ = 43;
  const keyEnd = back + 0.055;
  const candle = at(a0 + 0.07, 0.065, h);
  const keyStrip = (a: number, a1: number, b1: number, z: number): Point[] => [at(a, back, z), at(a1, back, z), at(a1, b1, z), at(a, b1, z)];
  const ivory = Array.from({ length: 9 }, (_, i) => a0 + 0.03 + ((i + 1) * (w - 0.06)) / 10);
  return [
    ...box(at(a0, 0, 0), w, back, h - 4, WOOD, 5),
    ...drawer(a0 + 0.03, a0 + w - 0.03, keyZ + 6, h - 9, back, art.woodShade, art.wood),
    poly(panel(a0 + 0.11, a0 + 0.19, keyZ + 8, keyZ + 19, back), art.creamLight),
    poly(ribbon([at(a0 + 0.12, back, keyZ + 15), at(a0 + 0.18, back, keyZ + 15)], 0.9), art.creamShade),
    poly(ribbon([at(a0 + 0.12, back, keyZ + 12), at(a0 + 0.17, back, keyZ + 12)], 0.9), art.creamShade),
    ...box(at(a0, 0, h - 4), w + 0.006, back + 0.006, 4, LIP, 2),
    ...box(at(a0, back, 0), w, DEPTH - back, keyZ, WOOD, 4),
    ...drawer(a0 + 0.03, a0 + w - 0.03, 8, keyZ - 7, DEPTH, art.woodShade, art.wood),
    grain(a0 + 0.08, a0 + 0.2, 24, DEPTH, art.woodShade),
    poly(keyStrip(a0 + 0.03, a0 + w - 0.03, keyEnd, keyZ), art.creamLight),
    poly(panel(a0 + 0.03, a0 + w - 0.03, keyZ - 2.4, keyZ, keyEnd), art.creamShade),
    ...ivory.map((a) => poly(ribbon([at(a, back + 0.002, keyZ), at(a, keyEnd, keyZ)], 0.7), art.creamShade)),
    ...[0, 1, 3, 4, 5, 7, 8].map((i) => {
      const a = ivory[i];
      return poly(keyStrip(a - 0.006, a + 0.006, back + 0.032, keyZ + 0.5), art.ink);
    }),
    poly(ellipse(at(a0 + 0.13, DEPTH, 3), 3.2, 1.6, 10), art.mustard),
    poly(ellipse(at(a0 + 0.17, DEPTH, 3), 3.2, 1.6, 10), art.mustard),
    poly(ellipse(lift(candle, 1), 6, 2.4, 14), art.mustardShade),
    poly(ellipse(lift(candle, 2), 6, 2.4, 14), art.mustard),
    poly(rounded([add(candle, [-3.5, -2]), add(candle, [3.5, -2]), add(candle, [3.5, -14]), add(candle, [-3.5, -14])], [0, 0, 1.5, 1.5]), art.cream),
    poly(rounded([add(candle, [1, -2]), add(candle, [3.5, -2]), add(candle, [3.5, -14]), add(candle, [1, -14])], [0, 0, 1.5, 0]), art.creamShade),
    poly(ellipse(add(candle, [0, -20]), 3, 5, 12), art.mustard),
    poly(ellipse(add(candle, [0, -19]), 1.6, 2.8, 10), art.glow),
  ];
}

function teaCart(): Poly[] {
  const a0 = START + 0.04;
  const w = 0.24;
  const b0 = 0.01;
  const d = DEPTH - 0.02;
  const pw = 0.02;
  const topZ = 43;
  const trays = [6, 36];
  const post = (a: number, b: number): Poly[] => [
    poly(ellipse(at(a + pw / 2, b + pw / 2, 1.6), 2.6, 2.6, 10), art.ink),
    ...box(at(a, b, 2), pw, pw, topZ - 2, TEAL, 1),
  ];
  const tray = (z: number): Poly[] => [
    ...box(at(a0 + pw, b0, z), w - pw * 2, d, 7, TEAL, 2),
    poly(panel(a0 + pw + 0.01, a0 + w - pw - 0.01, z + 2.2, z + 4.6, b0 + d), art.tealLight),
  ];
  const spot = at(a0 + 0.1, 0.11, topZ);
  const body = lift(spot, 10);
  const cup = (p: Point): Poly[] => [
    poly(ellipse(p, 6, 2.5, 14), art.creamShade),
    ...can(lift(p, 0.6), 3.4, 4.6, { light: art.creamLight, base: art.cream, shade: art.creamShade }),
    poly(ellipse(lift(p, 5.2), 2.6, 1, 10), art.woodShade),
  ];
  const jarAt = at(a0 + 0.08, 0.11, trays[0] + 7);
  return [
    ...post(a0, b0),
    ...post(a0, b0 + d - pw),
    ...tray(trays[0]),
    ...can(jarAt, 5, 10, { light: art.glassLight, base: art.glass, shade: art.stone }),
    poly(ellipse(lift(jarAt, 10), 5.4, 2.3, 12), art.red),
    ...box(at(a0 + 0.13, 0.06, trays[0] + 7), 0.06, 0.1, 4, CREAM, 1),
    ...box(at(a0 + 0.135, 0.065, trays[0] + 11), 0.05, 0.09, 3.5, RED, 1),
    ...tray(trays[1]),
    poly(ribbon([add(body, [9, -2]), add(body, [15, -7]), add(body, [17, -12])], 3.4), art.creamShade),
    poly(ribbon([add(body, [-9, -6]), add(body, [-15, -3]), add(body, [-9, 4])], 2.2), art.creamShade),
    poly(ellipse(body, 12, 10, 26), art.cream),
    poly(ellipse(add(body, [3, 1]), 9, 9, 22, -1.2, 1.6), art.creamShade),
    poly(ribbon(ellipse(body, 11.5, 3.2, 18, 0, Math.PI), 1.6), art.tealLight),
    poly(ellipse(add(body, [0, -9]), 6, 2.2, 14), art.creamShade),
    poly(ellipse(add(body, [0, -12]), 2, 2, 10), art.teal),
    poly(ellipse(add(body, [-5, -3]), 2.2, 3.2, 10), art.creamLight),
    ...cup(at(a0 + 0.18, 0.1, topZ)),
    ...post(a0 + w - pw, b0),
    ...post(a0 + w - pw, b0 + d - pw),
  ];
}

export const DAY2_DECOR: Record<string, Poly[]> = {
  'day2.study_desk': studyDesk(),
  'day2.vanity': vanity(),
  'day2.dresser': dresser(),
  'day2.upright_piano': uprightPiano(),
  'day2.tea_cart': teaCart(),
};
