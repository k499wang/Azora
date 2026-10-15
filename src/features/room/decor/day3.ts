import { colors } from '../../../theme/colors';
import type { Poly } from '../RoomScene';
import type { BoxTones, Point } from './artKit';
import { A, add, box, ellipse, floorAt, leaf, poly, ribbon, scale } from './artKit';

const art = colors.roomArt;

/** day 3 stands against the left wall; pieces span `b` from here, `DEPTH` out along `a` */
const START = 0.36;
const WIDTH = 0.26;
const DEPTH = 0.12;
const END = START + WIDTH;

/** screen length of one unit of `s` along the front face */
const S_PX = WIDTH * 180;

const WOOD: BoxTones = { top: art.woodLight, left: art.wood, right: art.woodShade };
const LIP: BoxTones = { top: art.woodLight, left: art.woodLight, right: art.wood };
const SKY: BoxTones = { top: art.skyLight, left: art.sky, right: art.skyShade };
const SKY_LIP: BoxTones = { top: art.skyLight, left: art.skyLight, right: art.sky };
const SKY_LEG: BoxTones = { top: art.sky, left: art.sky, right: art.skyShade };
const CREAM: BoxTones = { top: art.creamLight, left: art.cream, right: art.creamShade };

interface Tone {
  light: string;
  base: string;
  shade: string;
}

const tone = (light: string, base: string, shade: string): Tone => ({ light, base, shade });
const RED = tone(art.redLight, art.red, art.redShade);
const MUSTARD = tone(art.mustardLight, art.mustard, art.mustardShade);
const TEAL = tone(art.tealLight, art.teal, art.tealShade);
const SKY_T = tone(art.skyLight, art.sky, art.skyShade);
const CREAM_T = tone(art.creamLight, art.cream, art.creamShade);
const LILAC = tone(art.lilacLight, art.lilac, art.lilacShade);
const PINK = tone(art.pinkLight, art.pink, art.pinkShade);

const lift = (p: Point, z: number): Point => [p[0], p[1] - z];
const at = (a: number, b: number, z: number): Point => lift(floorAt(a, b), z);
const lerp = (p: Point, q: Point, t: number): Point => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];

/** a point on the front face: `s` along the wall (0..1 of WIDTH), `z` up from the floor */
function front(s: number, z: number, d = DEPTH): Point {
  return at(d, START + WIDTH * s, z);
}

/** a parallelogram lying in the front face's plane */
function panel(s0: number, s1: number, z0: number, z1: number, d = DEPTH): Point[] {
  return [front(s0, z0, d), front(s1, z0, d), front(s1, z1, d), front(s0, z1, d)];
}

/** a door or drawer: a recessed groove, then the face inset a hair inside it */
function door(s0: number, s1: number, z0: number, z1: number, groove: string, face: string): Poly[] {
  const m = 1.6 / S_PX;
  return [poly(panel(s0, s1, z0, z1), groove), poly(panel(s0 + m, s1 - m, z0 + 1.6, z1 - 1.6), face)];
}

function knob(p: Point, base: string, light: string): Poly[] {
  return [poly(ellipse(p, 2.6, 2.6, 12), base), poly(ellipse(add(p, [-0.7, -0.8]), 1.1, 1.1, 8), light)];
}

/** a soft grain stroke up the front face */
function grain(s: number, z0: number, z1: number, f: string): Poly {
  const sway = 1.2 / S_PX;
  return poly(ribbon([front(s, z0), front(s + sway, (z0 + z1) / 2), front(s, z1)], 1.2), f);
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

/** leaves fanning from a soil point, light ones veined */
function sprig(p: Point, size: number, flip = 1): Poly[] {
  const spec: [number, number, string][] = [
    [-11, -7, art.leafShade],
    [11, -8, art.leafShade],
    [-6, -14, art.leaf],
    [6, -15, art.leaf],
    [flip * 1, -18, art.leafLight],
  ];
  return spec.flatMap(([dx, dy, f]) => {
    const tip = add(p, [dx * size * flip, dy * size]);
    const out = [poly(leaf(p, tip, 7 * size), f)];
    if (f !== art.leafShade) out.push(poly(ribbon([lerp(p, tip, 0.15), lerp(p, tip, 0.75)], 0.9), art.leafShade));
    return out;
  });
}

/** a small glass jar with a lid, standing on `p` */
function jar(p: Point, lid: Tone): Poly[] {
  return [
    poly([...ellipse(p, 5, 2, 10, 0, Math.PI), ...ellipse(lift(p, 11), 5, 2, 10, Math.PI, Math.PI * 2)], art.glass),
    poly(ribbon([lift(add(p, [-2.6, 0]), 3), lift(add(p, [-2.6, 0]), 8.5)], 1.4), art.glassLight),
    poly([...ellipse(lift(p, 11), 5.4, 2.2, 10, 0, Math.PI), ...ellipse(lift(p, 14), 5.4, 2.2, 10, Math.PI, Math.PI * 2)], lid.base),
    poly(ellipse(lift(p, 14), 5.4, 2.2, 12), lid.light),
  ];
}

/** books standing along `b` from `b0` on a shelf at `z`, spines on the front face */
function bookRow(a0: number, b0: number, z: number, spec: [number, number, Tone][]): Poly[] {
  const depth = DEPTH - a0 - 0.02;
  let b = b0;
  return spec.flatMap(([thick, h, t]) => {
    const from = b;
    b += thick;
    const spine = (z0: number, z1: number): Point[] => [
      at(a0 + depth, from, z0),
      at(a0 + depth, from + thick, z0),
      at(a0 + depth, from + thick, z1),
      at(a0 + depth, from, z1),
    ];
    return [
      ...box(at(a0, from, z), depth, thick, h, { top: t.light, left: t.base, right: t.shade }, 0.8),
      poly(spine(z + h * 0.68, z + h * 0.68 + 1.8), t.light),
    ];
  });
}

function etagere(): Poly[] {
  const h = 92;
  const pw = 0.02;
  const levels = [10, 48, 86];
  const post = (a: number, b: number): Poly[] => box(at(a, b, 0), pw, pw, h, WOOD, 1);
  const board = (z: number): Poly[] => box(at(0, START + pw, z), DEPTH, WIDTH - pw * 2, 6, LIP, 1.5);
  const top = (z: number) => z + 6;
  const things: Poly[][] = [
    [
      ...jar(at(DEPTH * 0.5, START + 0.07, top(levels[0])), TEAL),
      ...pot(at(DEPTH * 0.5, START + 0.17, top(levels[0])), 7, 10, MUSTARD),
      ...sprig(at(DEPTH * 0.5, START + 0.17, top(levels[0]) + 10), 0.75),
    ],
    bookRow(0.02, START + 0.05, top(levels[1]), [
      [0.028, 21, RED],
      [0.022, 17, CREAM_T],
      [0.03, 23, SKY_T],
      [0.024, 19, MUSTARD],
    ]),
    [
      ...pot(at(DEPTH * 0.5, START + 0.15, top(levels[2])), 8, 12, RED),
      ...sprig(at(DEPTH * 0.5, START + 0.15, top(levels[2]) + 12), 1.05),
    ],
  ];
  return [
    ...post(0, START),
    ...post(DEPTH - pw, START),
    ...levels.flatMap((z, i) => [...board(z), ...things[i]]),
    ...post(0, END - pw),
    ...post(DEPTH - pw, END - pw),
  ];
}

function bookcase(): Poly[] {
  const h = 92;
  const m = 6 / S_PX;
  const shelves = [34, 62];
  const spines = (s0: number, z: number, spec: [number, number, Tone][]): Poly[] => {
    let s = s0;
    return spec.flatMap(([w, tall, t]) => {
      const from = s;
      s += w;
      return [poly(panel(from, s - 0.004, z, z + tall), t.base), poly(panel(from, s - 0.004, z + tall * 0.7, z + tall * 0.7 + 1.8), t.light)];
    });
  };
  return [
    ...box(at(0, START, 0), DEPTH, WIDTH, h - 5, WOOD, 5),
    poly(ribbon([at(0.03, END, 10), at(0.034, END, 45), at(0.03, END, 78)], 1.2), art.woodShade),
    poly(panel(m, 1 - m, 6, h - 11), art.woodDeep),
    ...shelves.map((z) => poly(panel(m, 1 - m, z, z + 3), art.wood)),
    ...spines(m + 0.04, 6, [
      [0.1, 22, RED],
      [0.08, 18, CREAM_T],
      [0.11, 24, SKY_T],
      [0.08, 20, MUSTARD],
    ]),
    ...jar(front(0.68, 37), MUSTARD),
    ...pot(front(0.3, 37), 7, 9, SKY_T),
    ...sprig(front(0.3, 46), 0.7),
    ...spines(0.56, 65, [
      [0.09, 17, TEAL],
      [0.11, 19, LILAC],
      [0.08, 15, PINK],
    ]),
    ...box(at(0, START - 0.006, h - 5), DEPTH + 0.008, WIDTH + 0.014, 5, LIP, 2),
  ];
}

function plantLadder(): Poly[] {
  const top = 100;
  const rungs = [10, 42, 74];
  const depthAt = (z: number) => DEPTH - (z / top) * (DEPTH - 0.02);
  const rail = (s: number): Poly[] => {
    const foot = front(s, 0, DEPTH);
    const head = front(s, top, 0.02);
    return [poly(ribbon([foot, head], 5), art.wood), poly(ribbon([add(foot, [-1.3, 0]), add(head, [-1.3, 0])], 1.4), art.woodLight)];
  };
  const rung = (z: number): Poly[] => box(at(depthAt(z) - 0.012, START + WIDTH * 0.06, z - 1.5), 0.024, WIDTH * 0.88, 4, WOOD, 1);
  const seat = (i: number, s: number) => {
    const z = rungs[i] + 2.5;
    return front(s, z, depthAt(rungs[i]));
  };
  const trail = (p: Point): Poly[] =>
    [-1, 1].flatMap((side, i) => {
      const vine = [add(p, [side * 4, -1]), add(p, [side * 9, 6]), add(p, [side * 8, 16])];
      return [
        poly(ribbon(vine, 1.2), art.leafDeep),
        poly(leaf(vine[1], add(vine[1], [side * 6, 3]), 5), i ? art.leaf : art.leafShade),
        poly(leaf(vine[2], add(vine[2], [side * -1, 7]), 5), art.leafLight),
      ];
    });
  return [
    ...rungs.flatMap(rung),
    ...rail(0.06),
    ...rail(0.94),
    ...pot(seat(0, 0.34), 7, 9, RED),
    ...sprig(lift(seat(0, 0.34), 9), 0.8),
    ...pot(seat(1, 0.66), 7, 9, CREAM_T),
    ...trail(lift(seat(1, 0.66), 9)),
    ...sprig(lift(seat(1, 0.66), 9), 0.55, -1),
    ...pot(seat(2, 0.36), 7, 9, TEAL),
    ...sprig(lift(seat(2, 0.36), 9), 0.85, -1),
  ];
}

function recordConsole(): Poly[] {
  const h = 36;
  const leg = 5;
  const lipTop = h + 4;
  const turntable = at(DEPTH * 0.5, START + WIDTH * 0.34, lipTop + 6);
  return [
    ...box(at(DEPTH - 0.028, START + 0.012, 0), 0.016, 0.016, leg, WOOD, 1),
    ...box(at(0.004, END - 0.028, 0), 0.016, 0.016, leg, WOOD, 1),
    ...box(at(DEPTH - 0.028, END - 0.028, 0), 0.016, 0.016, leg, WOOD, 1),
    ...box(at(0, START, leg), DEPTH, WIDTH, h - leg, WOOD, 4),
    poly(ribbon([at(0.03, END, leg + 6), at(0.034, END, 20), at(0.03, END, h - 4)], 1.2), art.woodShade),
    ...door(0.06, 0.48, leg + 4, h - 4, art.woodDeep, art.woodShade),
    ...door(0.52, 0.94, leg + 4, h - 4, art.woodDeep, art.woodShade),
    grain(0.2, leg + 8, h - 9, art.woodDeep),
    grain(0.8, leg + 8, h - 9, art.woodDeep),
    ...knob(front(0.43, 21), art.mustard, art.mustardLight),
    ...knob(front(0.57, 21), art.mustard, art.mustardLight),
    ...box(at(0, START - 0.006, h), DEPTH + 0.008, WIDTH + 0.014, 4, LIP, 2),
    ...box(at(0.015, START + 0.03, lipTop), DEPTH - 0.03, WIDTH * 0.58, 6, CREAM, 3),
    poly(ellipse(turntable, 13, 7.5, 24), art.ink),
    poly(ribbon(ellipse(turntable, 9, 5.2, 24).concat([ellipse(turntable, 9, 5.2, 24)[0]]), 0.8), art.stoneShade),
    poly(ellipse(turntable, 4.5, 2.6, 14), art.red),
    poly(ellipse(add(turntable, [16, 1]), 2.2, 1.3, 10), art.stoneShade),
    poly(ribbon([add(turntable, [16, 0]), add(turntable, [12, -3]), add(turntable, [4, -1])], 2), art.stone),
    ...pot(at(DEPTH * 0.5, START + WIDTH * 0.85, lipTop), 8, 11, MUSTARD),
    ...sprig(at(DEPTH * 0.5, START + WIDTH * 0.85, lipTop + 11), 1.1),
  ];
}

function wardrobe(): Poly[] {
  const h = 96;
  const leg = 7;
  const body = h - 4;
  const legAt = (a: number, b: number): Poly[] => box(at(a, b, 0), 0.02, 0.02, leg, SKY_LEG, 1);
  return [
    ...legAt(0.004, END - 0.03),
    ...legAt(DEPTH - 0.03, START + 0.01),
    ...legAt(DEPTH - 0.03, END - 0.03),
    ...box(at(0, START, leg), DEPTH, WIDTH, body - leg, SKY, 4),
    ...door(0.06, 0.48, leg + 12, body - 5, art.skyShade, art.sky),
    ...door(0.52, 0.94, leg + 12, body - 5, art.skyShade, art.sky),
    ...door(0.06, 0.94, leg + 3, leg + 10, art.skyShade, art.sky),
    poly(panel(0.1, 0.44, body - 22, body - 8.6), art.skyLight),
    poly(panel(0.56, 0.9, body - 22, body - 8.6), art.skyLight),
    ...knob(front(0.43, 52), art.cream, art.creamLight),
    ...knob(front(0.57, 52), art.cream, art.creamLight),
    ...knob(front(0.5, leg + 6.5), art.cream, art.creamLight),
    ...box(at(0, START - 0.006, body), DEPTH + 0.008, WIDTH + 0.014, 4, SKY_LIP, 2),
    ...box(at(0.02, START + 0.04, h), 0.08, 0.12, 13, CREAM, 3),
    poly(
      [at(0.02, START + 0.04, h + 5), at(0.02, START + 0.16, h + 5), at(0.02, START + 0.16, h + 7.5), at(0.02, START + 0.04, h + 7.5)].map((p) =>
        add(p, scale(A, 0.08)),
      ),
      art.red,
    ),
    poly(
      [at(0.1, START + 0.16, h + 5), at(0.02, START + 0.16, h + 5), at(0.02, START + 0.16, h + 7.5), at(0.1, START + 0.16, h + 7.5)],
      art.redShade,
    ),
  ];
}

export const DAY3_DECOR: Record<string, Poly[]> = {
  'day3.etagere': etagere(),
  'day3.bookcase': bookcase(),
  'day3.plant_ladder': plantLadder(),
  'day3.record_console': recordConsole(),
  'day3.wardrobe': wardrobe(),
};
