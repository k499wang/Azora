import { colors } from '../../../theme/colors';
import type { Poly } from '../RoomScene';
import { ellipse, leaf, poly, ribbon, rounded, sag, type Point } from './artKit';

const art = colors.roomArt;

/** day 7 hangs along the top of both walls, meeting at the back corner */
const LEFT: Point = [-140, -84];
const CORNER: Point = [-8, -160];
const RIGHT: Point = [140, -84];

function strands(depth: number): Point[][] {
  return [sag(LEFT, CORNER, depth), sag(CORNER, RIGHT, depth)];
}

interface Hang {
  at: Point;
  /** unit vector along the string here */
  along: Point;
  /** unit vector perpendicular to the string, pointing down */
  down: Point;
}

/** exact points on both `sag` curves, with the string's direction there, skipping the pinned ends */
function hangs(depth: number, perSide: number): Hang[] {
  return [
    [LEFT, CORNER],
    [CORNER, RIGHT],
  ].flatMap(([from, to]) =>
    Array.from({ length: perSide }, (_, i) => {
      const t = (i + 0.5) / perSide;
      const dx = to[0] - from[0];
      const dy = to[1] - from[1] + Math.PI * Math.cos(Math.PI * t) * depth;
      const len = Math.hypot(dx, dy);
      const along: Point = [dx / len, dy / len];
      return {
        at: [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t + Math.sin(Math.PI * t) * depth] as Point,
        along,
        down: [-along[1], along[0]] as Point,
      };
    }),
  );
}

/** a shape authored in the hang's frame — `u` along the string, `v` hanging down — placed on the string */
function hung({ at, along, down }: Hang, shape: readonly Point[]): Point[] {
  return shape.map(([u, v]) => [at[0] + along[0] * u + down[0] * v, at[1] + along[1] * u + down[1] * v] as Point);
}

/** the same point, hanging plumb rather than along the string */
function plumb(h: Hang): Hang {
  return { at: h.at, along: [1, 0], down: [0, 1] };
}

function knot(at: Point, f: string): Poly {
  return poly(ellipse(at, 2.2, 2.2, 14), f);
}

function string(depth: number, tone: string, width = 2.4): Poly[] {
  return strands(depth).map((path) => poly(ribbon(path, width), tone));
}

function pins(tone: string): Poly[] {
  return [LEFT, CORNER, RIGHT].flatMap((p) => [
    poly(ellipse(p, 3.6, 3.6, 16), tone),
    poly(ellipse([p[0] - 1, p[1] - 1], 1.3, 1.3, 10), art.stoneLight),
  ]);
}

function flagBunting(): Poly[] {
  const tones = [
    [art.red, art.redShade],
    [art.mustard, art.mustardShade],
    [art.cream, art.creamShade],
    [art.teal, art.tealShade],
  ];
  return [
    ...string(14, art.woodShade),
    ...hangs(14, 4).flatMap((h, i) => {
      const [base, shade] = tones[i % tones.length];
      return [
        poly(hung(h, rounded([[-11, 0], [11, 0], [0, 24]], [1, 1, 3])), base),
        poly(hung(h, rounded([[0, 0], [11, 0], [0, 24]], [0, 1, 3])), shade),
        poly(hung(h, ellipse([-3.5, 6], 1.8, 1.8, 12)), art.creamLight, 0.9),
        knot(h.at, art.woodDeep),
      ];
    }),
    ...pins(art.woodDeep),
  ];
}

function fairyLights(): Poly[] {
  const bulbs = [art.glow, art.pinkLight, art.mustardLight, art.tealLight];
  return [
    ...string(16, art.leafDeep),
    ...hangs(16, 5).map(plumb).flatMap((h, i) => [
      poly(hung(h, ellipse([0, 9], 7.5, 8.5, 24)), art.glow, 0.35),
      poly(hung(h, rounded([[-2.2, 0], [2.2, 0], [2.2, 3.4], [-2.2, 3.4]], 0.8)), art.leafDeep),
      poly(hung(h, ellipse([0, 8.4], 4.2, 5.6, 20)), bulbs[i % bulbs.length]),
      poly(hung(h, ellipse([-1.4, 6.6], 1.2, 1.8, 10)), art.creamLight),
    ]),
    ...pins(art.leafDeep),
  ];
}

function paperLanterns(): Poly[] {
  const pairs = [
    [art.red, art.redShade, art.redLight],
    [art.mustard, art.mustardShade, art.mustardLight],
  ];
  return [
    ...string(12, art.woodShade),
    ...hangs(12, 2).map(plumb).flatMap((h, i) => {
      const [base, shade, light] = pairs[i % 2];
      const c: Point = [0, 15];
      return [
        poly(hung(h, ribbon([[0, 0], [0, 3]], 1.2)), art.ink),
        poly(hung(h, rounded([[-5, 2], [5, 2], [5, 4.6], [-5, 4.6]], 1)), art.ink),
        poly(hung(h, ellipse(c, 15, 11.5, 36)), base),
        poly(hung(h, ellipse(c, 15, 11.5, 24, -Math.PI / 2.4, Math.PI / 2.4)), shade),
        poly(hung(h, ribbon(ellipse(c, 6, 11.2, 14, -Math.PI / 2, Math.PI / 2), 1)), shade),
        poly(hung(h, ribbon(ellipse(c, 6, 11.2, 14, Math.PI / 2, Math.PI * 1.5), 1)), shade),
        poly(hung(h, ribbon([[0, 3.6], [0, 26.4]], 1)), shade),
        poly(hung(h, ellipse([-7, 10], 2, 3.2, 14)), light),
        poly(hung(h, rounded([[-5, 25.4], [5, 25.4], [5, 28], [-5, 28]], 1)), art.ink),
        poly(hung(h, ribbon([[0, 28], [0, 33]], 1.4)), art.mustardShade),
        knot(h.at, art.woodDeep),
      ];
    }),
    ...pins(art.woodDeep),
  ];
}

function ivyVine(): Poly[] {
  const depth = 10;
  return [
    ...string(depth, art.leafDeep, 3),
    ...hangs(depth, 5).flatMap((h, i) => {
      const side = i % 2 ? 1 : -1;
      const drop = i % 3 === 1 ? 22 : 15;
      const tip = hung(h, [[side * 6, drop]])[0];
      const vein = hung(h, [[side * 1, 2], [side * 4.6, drop * 0.75]]);
      return [
        poly(leaf(h.at, tip, 12, 12), i % 2 ? art.leafShade : art.leaf),
        poly(ribbon(vein, 0.9), i % 2 ? art.leafDeep : art.leafShade),
        poly(leaf(h.at, hung(h, [[-side * 9, -7]])[0], 7, 10), art.leafLight),
      ];
    }),
    ...hangs(depth, 2).flatMap((h) => [
      ...[0, 1, 2, 3, 4].map((k) => poly(hung(h, ellipse([Math.cos((k * 2 * Math.PI) / 5) * 3, 3 + Math.sin((k * 2 * Math.PI) / 5) * 3], 2.4, 2.4, 12)), art.pinkLight)),
      poly(hung(h, ellipse([0, 3], 1.4, 1.4, 10)), art.mustard),
    ]),
  ];
}

function star([cx, cy]: Point, r: number): Point[] {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (Math.PI * i) / 5;
    const rr = i % 2 ? r * 0.55 : r;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as Point;
  });
}

function starString(): Poly[] {
  return [
    ...string(13, art.ink, 2),
    ...hangs(13, 2).flatMap((h, i) => {
      const drop = i % 2 ? 18 : 11;
      const c: Point = [h.at[0], h.at[1] + drop];
      return [
        poly(ribbon([h.at, [c[0], c[1] - 9]], 1.2), art.ink),
        knot(h.at, art.ink),
        poly(rounded(star(c, 11), 3, 4), art.mustardShade),
        poly(rounded(star([c[0] - 0.8, c[1] - 0.8], 9.6), 2.6, 4), art.mustard),
        poly(ellipse([c[0] - 3, c[1] - 2.6], 1.6, 1.2, 10), art.mustardLight),
      ];
    }),
    ...pins(art.ink),
  ];
}

export const DAY7_DECOR: Record<string, Poly[]> = {
  'day7.flag_bunting': flagBunting(),
  'day7.fairy_lights': fairyLights(),
  'day7.paper_lanterns': paperLanterns(),
  'day7.ivy_vine': ivyVine(),
  'day7.star_string': starString(),
};
