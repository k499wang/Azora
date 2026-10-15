import { colors } from '../../../theme/colors';
import type { Poly } from '../RoomScene';
import { blob, ellipse, leaf, poly, ribbon, floorAt, type Point } from './artKit';

const art = colors.roomArt;

/** day 4 stands on the floor at the front right; its pot sits on this spot */
const SPOT = floorAt(0.95, 0.66);

interface Tone {
  light: string;
  base: string;
  shade: string;
}

const CREAM: Tone = { light: art.creamLight, base: art.cream, shade: art.creamShade };

const lerp = (p: Point, q: Point, t: number): Point => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];

/** a tapered pot: base body, its right side in shade, a rim band and the soil inside */
function pot(rim: number, height: number, tone: Tone, band = 5): Poly[] {
  const [x, y] = SPOT;
  const top = y - height;
  const turn = Math.acos(0.35);
  const bottom = (from: number, to: number, steps = 14) => ellipse([x, y], rim * 0.82, rim * 0.36, steps, from, to);
  const bandY = top + band;
  const bandR = rim * (0.82 + 0.18 * (1 - band / height));
  return [
    poly([...bottom(0, Math.PI), ...ellipse([x, top], rim, rim * 0.42, 14, Math.PI, Math.PI * 2)], tone.base),
    poly([...bottom(0, turn, 6), [x + rim * 0.35, top], [x + rim, top]], tone.shade),
    poly([...ellipse([x, bandY], bandR * 1.04, rim * 0.44, 14, 0, Math.PI), ...ellipse([x, top], rim * 1.06, rim * 0.46, 14, Math.PI, Math.PI * 2)], tone.light),
    poly([...ellipse([x, bandY], bandR * 1.04, rim * 0.44, 6, 0, turn), [x + rim * 0.37, top], [x + rim * 1.06, top]], tone.base),
    poly(ellipse([x, top], rim * 0.86, rim * 0.34, 24), art.woodDeep),
    poly(ellipse([x - rim * 0.2, top - 0.6], rim * 0.4, rim * 0.14, 14), art.woodShade),
  ];
}

/** a leaf with a centre vein */
function veined(base: Point, tip: Point, width: number, f: string, vein: string): Poly[] {
  return [poly(leaf(base, tip, width, 12), f), poly(ribbon([lerp(base, tip, 0.1), lerp(base, tip, 0.82)], 1.1), vein)];
}

/** two short side veins off the middle of a leaf */
function sideVeins(base: Point, tip: Point, width: number, f: string): Poly[] {
  const len = Math.hypot(tip[0] - base[0], tip[1] - base[1]) || 1;
  const d: Point = [(tip[0] - base[0]) / len, (tip[1] - base[1]) / len];
  return [0.4, 0.62].flatMap((t, i) => {
    const m = lerp(base, tip, t);
    return [1, -1].map((side) => {
      const reach = width * (i ? 0.24 : 0.32);
      const end: Point = [m[0] + (-d[1] * side + d[0] * 0.6) * reach, m[1] + (d[0] * side + d[1] * 0.6) * reach];
      return poly(ribbon([m, end], 0.9), f);
    });
  });
}

function monstera(): Poly[] {
  const [x, y] = SPOT;
  const soil = y - 20;
  const leaves: [number, number, number, string, string][] = [
    [-30, -22, 20, art.leafShade, art.leafDeep],
    [30, -26, 20, art.leafShade, art.leafDeep],
    [-24, -40, 24, art.leaf, art.leafShade],
    [22, -44, 24, art.leaf, art.leafShade],
    [-2, -54, 24, art.leafLight, art.leaf],
  ];
  return [
    ...pot(20, 20, { light: art.tealLight, base: art.teal, shade: art.tealShade }),
    ...leaves.flatMap(([dx, dy, w, tone, vein]) => {
      const tip: Point = [x + dx, soil + dy];
      const from: Point = lerp([x, soil], tip, 0.32);
      return [
        poly(ribbon([[x, soil + 1], from], 2), art.leafDeep),
        ...veined(from, tip, w, tone, vein),
        ...sideVeins(from, tip, w, vein),
      ];
    }),
  ];
}

function cactusDuo(): Poly[] {
  const [x, y] = SPOT;
  const soil = y - 18;
  const tall: Point = [x - 7, soil - 22];
  const round: Point = [x + 10, soil - 10];
  const spines = (pts: Point[]): Poly[] => pts.map(([px, py]) => poly(ellipse([px, py], 0.9, 0.9, 6), art.creamLight));
  return [
    ...pot(20, 18, CREAM),
    poly(ellipse(tall, 10, 23, 28), art.leaf),
    poly(ellipse([tall[0] + 3, tall[1]], 7, 22, 24, -Math.PI / 2, Math.PI / 2), art.leafShade),
    poly(ribbon([[tall[0] - 4, tall[1] - 18], [tall[0] - 5, tall[1]], [tall[0] - 4, tall[1] + 18]], 1.2), art.leafShade),
    poly(ribbon([[tall[0] + 1, tall[1] - 21], [tall[0] + 1, tall[1] + 20]], 1.2), art.leafDeep),
    poly(ellipse([tall[0] - 5, tall[1] - 6], 2.2, 8, 10), art.leafLight, 0.85),
    poly(ellipse(round, 11, 11, 24), art.leafShade),
    poly(ellipse([round[0] - 1.5, round[1] - 1.5], 8, 8, 20), art.leaf),
    poly(ribbon([[round[0], round[1] - 10], [round[0] - 1, round[1] + 9]], 1.1), art.leafDeep),
    poly(ribbon([[round[0] - 5, round[1] - 8], [round[0] - 6.5, round[1] + 7]], 1.1), art.leafShade),
    ...spines([
      [tall[0] - 7, tall[1] - 10],
      [tall[0] - 2, tall[1] + 6],
      [tall[0] + 5, tall[1] - 4],
      [tall[0] - 6, tall[1] + 13],
      [round[0] - 6, round[1] - 2],
      [round[0] + 4, round[1] + 3],
      [round[0] + 2, round[1] - 6],
    ]),
    poly(blob([tall[0], tall[1] - 24], 6, 4.5, 0.2, 4), art.pink),
    poly(ellipse([tall[0], tall[1] - 25], 2, 1.6, 10), art.mustardLight),
  ];
}

function flowerBucket(): Poly[] {
  const [x, y] = SPOT;
  const soil = y - 22;
  const heads: [number, number, string, string][] = [
    [-13, -44, art.pink, art.pinkShade],
    [12, -48, art.redLight, art.red],
    [-1, -58, art.pinkLight, art.pink],
  ];
  const flower = ([dx, dy, petal, heart]: [number, number, string, string]): Poly[] => {
    const c: Point = [x + dx, y + dy];
    return [
      ...Array.from({ length: 5 }, (_, i) => {
        const a = -Math.PI / 2 + (Math.PI * 2 * i) / 5;
        return poly(ellipse([c[0] + Math.cos(a) * 5, c[1] + Math.sin(a) * 4.4], 4.6, 4.2, 12), petal);
      }),
      poly(ellipse(c, 3.4, 3, 12), heart),
      poly(ellipse([c[0] - 0.8, c[1] - 0.8], 1.3, 1.1, 8), art.mustardLight),
    ];
  };
  return [
    poly(ribbon(ellipse([x, y - 24], 21, 22, 20, Math.PI * 1.02, Math.PI * 1.98), 2), art.stoneShade),
    ...pot(19, 22, { light: art.stoneLight, base: art.stone, shade: art.stoneShade }, 4),
    ...heads.map(([dx, dy]) => poly(ribbon([[x, soil], [x + dx * 0.6, soil + (dy + 22) * 0.5], [x + dx, y + dy]], 2.2), art.leafShade)),
    ...veined([x - 2, soil - 2], [x - 19, soil - 13], 10, art.leaf, art.leafShade),
    ...veined([x + 2, soil - 2], [x + 18, soil - 15], 10, art.leafShade, art.leafDeep),
    ...veined([x, soil - 4], [x - 6, soil - 20], 8, art.leafLight, art.leaf),
    ...heads.flatMap(flower),
  ];
}

function fishbowl(): Poly[] {
  const [x, y] = SPOT;
  const standTop = y - 9;
  const bowl: Point = [x, standTop - 23];
  return [
    poly([...ellipse([x, y - 3], 22, 9, 16, 0, Math.PI), [x - 22, standTop], [x + 22, standTop]], art.wood),
    poly([...ellipse([x, y - 3], 22, 9, 8, 0, 1.2), [x + 22 * Math.cos(1.2), standTop + 9 * Math.sin(1.2)], [x + 22, standTop]], art.woodShade),
    poly(ellipse([x, standTop], 22, 9, 24), art.woodLight),
    poly(ellipse(bowl, 25, 24, 32), art.glass, 0.9),
    poly(ellipse([x, standTop - 17], 22, 15, 24, 0.15, Math.PI - 0.15), art.teal, 0.55),
    poly(ellipse([x, standTop - 4], 15, 3.4, 18), art.mustardLight),
    poly(ellipse([x - 6, standTop - 4.4], 2.2, 1.2, 8), art.redLight),
    poly(ellipse([x + 7, standTop - 3.6], 2, 1.1, 8), art.stone),
    poly(ribbon([[x - 12, standTop - 5], [x - 14, standTop - 12], [x - 11, standTop - 19]], 3), art.leafShade),
    poly(ribbon([[x - 9, standTop - 5], [x - 7, standTop - 11], [x - 8, standTop - 15]], 2.4), art.leaf),
    poly(ellipse([x, standTop - 45], 13, 4.5), art.tealShade, 0.6),
    poly(ribbon(ellipse([x, standTop - 45], 13, 4.5, 28).concat([ellipse([x, standTop - 45], 13, 4.5, 28)[0]]), 1.4), art.glassLight),
    poly([[x - 3, standTop - 21], [x - 11, standTop - 27], [x - 11, standTop - 15]], art.mustardShade),
    poly(ellipse([x + 4, standTop - 21], 9, 6, 20), art.mustard),
    poly(ellipse([x + 3, standTop - 23.5], 6, 2.6, 14), art.mustardLight),
    poly([[x + 2, standTop - 17], [x + 6, standTop - 13], [x + 7, standTop - 17]], art.mustardShade),
    poly(ellipse([x + 8, standTop - 22], 1.4, 1.4), art.ink),
    poly(ellipse([x + 9, standTop - 31], 1.6, 1.6, 10), art.glassLight),
    poly(ellipse([x + 11, standTop - 37], 1.1, 1.1, 8), art.glassLight),
    poly(ellipse([x - 12, standTop - 33], 4, 8, 12), art.glassLight, 0.7),
  ];
}

function lemonTree(): Poly[] {
  const [x, y] = SPOT;
  const crown: Point = [x, y - 50];
  const lemons: [number, number][] = [[-11, -46], [10, -52], [2, -38], [-3, -60]];
  return [
    ...pot(19, 20, { light: art.redLight, base: art.red, shade: art.redShade }),
    poly(ribbon([[x, y - 20], [x - 1, y - 32], [x + 1, y - 38]], 5), art.woodShade),
    poly(ribbon([[x - 1.5, y - 21], [x - 2.5, y - 32]], 1.4), art.wood),
    poly(ribbon([[x, y - 34], [x + 9, y - 42]], 2.4), art.woodShade),
    poly(blob(crown, 26, 18, 0.1, 2), art.leafShade),
    poly(blob([crown[0] - 4, crown[1] - 3], 21, 14, 0.1, 5), art.leaf),
    poly(blob([crown[0] - 9, crown[1] - 8], 10, 6, 0.15, 3), art.leafLight),
    ...veined([crown[0] + 14, crown[1] + 6], [crown[0] + 26, crown[1] + 10], 7, art.leafShade, art.leafDeep),
    ...veined([crown[0] - 16, crown[1] + 8], [crown[0] - 27, crown[1] + 12], 7, art.leaf, art.leafShade),
    ...lemons.flatMap(([dx, dy]) => [
      poly(ellipse([x + dx, y + dy], 5.5, 4.6, 16), art.mustard),
      poly(ellipse([x + dx, y + dy], 5.5, 4.6, 10, -0.5, 2.1), art.mustardShade),
      poly(ellipse([x + dx - 1.6, y + dy - 1.4], 1.6, 1.1, 8), art.mustardLight),
    ]),
  ];
}

export const DAY4_DECOR: Record<string, Poly[]> = {
  'day4.monstera': monstera(),
  'day4.cactus_duo': cactusDuo(),
  'day4.flower_bucket': flowerBucket(),
  'day4.fishbowl': fishbowl(),
  'day4.lemon_tree': lemonTree(),
};
