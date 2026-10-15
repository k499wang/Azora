import { colors } from '../../../theme/colors';
import type { Poly } from '../RoomScene';
import { A, ellipse, onWall, poly, ribbon, rounded, sag, scale, wallRect, type Point } from './artKit';

const art = colors.roomArt;

/** day 5 hangs flat on the left wall; wall-space shapes start from this nail */
const ANCHOR: Point = [-52, -118];

/** how far a hung piece stands off the wall, toward the room */
const OUT = scale(A, 0.018);

function wall(shape: readonly Point[], f: string, o?: number): Poly {
  return poly(onWall('left', ANCHOR, shape), f, o);
}

/** drawn on the piece's face, which stands `OUT` off the wall */
function face(shape: readonly Point[], f: string, o?: number): Poly {
  return poly(onWall('left', ANCHOR, shape).map(([x, y]) => [x + OUT[0], y + OUT[1]] as Point), f, o);
}

/** the piece's edge against the wall, then its face */
function raised(shape: readonly Point[], base: string, shade: string): Poly[] {
  return [wall(shape, shade), face(shape, base)];
}

/**
 * A recessed opening with a bevel: lit along its top and screen-left edge
 * (larger `u` on this wall), shaded along the bottom and screen-right.
 */
function opening(x: number, y: number, w: number, h: number, content: string, light: string, shade: string, r = 1.5, bevel = 1.6): Poly[] {
  return [
    face(wallRect(x, y, w, h, r), light),
    face(wallRect(x, y + bevel, w - bevel, h - bevel, r), shade),
    face(wallRect(x + bevel, y + bevel, w - bevel * 2, h - bevel * 2, r), content),
  ];
}

function roundOpening(c: Point, rx: number, ry: number, content: string, light: string, shade: string, bevel = 1.8): Poly[] {
  return [
    face(ellipse(c, rx, ry, 36), light),
    face(ellipse([c[0] - bevel * 0.5, c[1] + bevel * 0.5], rx - bevel * 0.5, ry - bevel * 0.5, 36), shade),
    face(ellipse(c, rx - bevel, ry - bevel, 36), content),
  ];
}

/** a nail in the wall with a cord running down to two points on the piece */
function hanger(nail: Point, left: Point, right: Point): Poly[] {
  return [
    wall(ribbon([left, nail, right], 1.2), art.ink),
    wall(ellipse(nail, 2, 2, 10), art.stoneShade),
    wall(ellipse([nail[0] + 0.5, nail[1] - 0.5], 0.9, 0.9, 8), art.stoneLight),
  ];
}

function pin(c: Point, f: string, light: string): Poly[] {
  return [face(ellipse(c, 2.6, 2.6, 12), f), face(ellipse([c[0] + 0.7, c[1] - 0.7], 1, 1, 8), light)];
}

function pinBoard(): Poly[] {
  const notes: [number, number, number, number, string, string][] = [
    [10, 11, 19, 17, art.mustardLight, art.red],
    [33, 13, 18, 16, art.creamLight, art.sky],
    [15, 32, 22, 15, art.pinkLight, art.teal],
  ];
  return [
    ...raised(wallRect(2, 2, 58, 52, 5), art.wood, art.woodShade),
    ...opening(7, 7, 48, 42, art.woodLight, art.woodLight, art.woodShade),
    ...[
      [14, 44],
      [44, 40],
      [48, 10],
      [40, 33],
    ].map(([x, y]) => face(ellipse([x, y], 1.1, 1.1, 8), art.wood)),
    ...notes.flatMap(([x, y, w, h, tone, pinTone]) => [
      face(wallRect(x, y, w, h, 1), tone),
      face(ribbon([[x + 4, y + 8], [x + w - 4, y + 8]], 1.2), art.creamShade),
      face(ribbon([[x + 4, y + 11.5], [x + w - 8, y + 11.5]], 1.2), art.creamShade),
      ...pin([x + w / 2, y + 2.5], pinTone, art.creamLight),
    ]),
    face(wallRect(40, 31, 12, 14, 1), art.creamLight),
    face(wallRect(41.6, 32.6, 8.8, 8, 0.6), art.skyLight),
    face([[42, 40.6], [46, 36], [50.4, 40.6]], art.leaf),
    ...pin([46, 32], art.mustard, art.creamLight),
  ];
}

function galleryWall(): Poly[] {
  const frame = (x: number, y: number, w: number, h: number, mat: string, art_: (ix: number, iy: number, iw: number, ih: number) => Poly[]): Poly[] => [
    ...raised(wallRect(x, y, w, h, 2.5), art.wood, art.woodShade),
    ...opening(x + 3.4, y + 3.4, w - 6.8, h - 6.8, mat, art.woodLight, art.woodShade, 1),
    ...art_(x + 5, y + 5, w - 10, h - 10),
  ];
  return [
    ...hanger([16, -4], [9, 4], [23, 4]),
    ...frame(2, 2, 28, 32, art.skyLight, (x, y, w, h) => [
      face(ellipse([x + w * 0.3, y + h * 0.3], 3.2, 3.2, 14), art.glow),
      face([[x, y + h], [x, y + h * 0.62], [x + w * 0.45, y + h * 0.4], [x + w, y + h * 0.72], [x + w, y + h]], art.leaf),
      face([[x + w * 0.5, y + h], [x + w, y + h * 0.55], [x + w, y + h]], art.leafShade),
    ]),
    ...frame(32, 8, 24, 22, art.tealLight, (x, y, w, h) => [
      face(ellipse([x + w / 2, y + h * 0.42], 4, 4.2, 14), art.cream),
      face(ellipse([x + w / 2, y + h + 2], 7.5, 6, 18, Math.PI, Math.PI * 2), art.teal),
    ]),
    ...frame(8, 38, 22, 20, art.creamLight, (x, y, w, h) => [
      face(ellipse([x + w * 0.5, y + h * 0.55], 4.5, 4.5, 14), art.red),
      face(ellipse([x + w * 0.5 + 2, y + h * 0.55 - 2], 1.6, 1.6, 8), art.redLight),
      face(ribbon([[x + w * 0.5, y + h * 0.55 - 4], [x + w * 0.5 - 1, y + h * 0.15]], 1), art.leafShade),
    ]),
    ...frame(34, 34, 20, 24, art.mustardLight, (x, y, w, h) => [
      face([[x + w * 0.5, y + 2], [x + w - 1, y + h - 2], [x + 1, y + h - 2]], art.mustard),
      face([[x + w * 0.5, y + 2], [x + w - 1, y + h - 2], [x + w * 0.5, y + h - 2]], art.mustardShade),
    ]),
  ];
}

function mirror(): Poly[] {
  const c: Point = [28, 32];
  return [
    ...hanger([28, -2], [18, 8], [38, 8]),
    ...raised(ellipse(c, 23, 30, 36), art.mustard, art.mustardShade),
    face(ribbon(ellipse(c, 21, 28, 30, Math.PI * 0.55, Math.PI * 1.35), 1.4), art.mustardLight),
    ...roundOpening(c, 17, 24, art.glass, art.mustardLight, art.mustardShade),
    face(ribbon([[38, 32], [37, 20], [31, 13]], 4), art.glassLight, 0.85),
    face(ribbon([[39.5, 38], [39.4, 36]], 2.6), art.glassLight, 0.85),
    face(ellipse([28, 3], 3.6, 2.2, 12), art.mustard),
  ];
}

function wallClock(): Poly[] {
  const c: Point = [28, 32];
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (Math.PI / 6) * i;
    const major = i % 3 === 0;
    const r0 = major ? 10.5 : 12;
    const p0: Point = [c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0];
    const p1: Point = [c[0] + Math.cos(a) * 14, c[1] + Math.sin(a) * 14];
    return face(ribbon([p0, p1], major ? 2 : 1.1), major ? art.tealShade : art.stoneShade);
  });
  return [
    ...hanger([28, 4], [28, 4], [28, 9]),
    ...raised(ellipse(c, 23, 23, 36), art.teal, art.tealShade),
    face(ribbon(ellipse(c, 21, 21, 30, Math.PI * 0.6, Math.PI * 1.4), 1.6), art.tealLight),
    ...roundOpening(c, 17.5, 17.5, art.creamLight, art.tealLight, art.tealShade),
    ...ticks,
    face(ribbon([c, [c[0] + 4, c[1] - 9]], 3), art.ink),
    face(ribbon([c, [c[0] - 10, c[1] - 3]], 2.2), art.ink),
    face(ribbon([[c[0] - 3, c[1] + 4], [c[0] + 7, c[1] - 9]], 0.9), art.red),
    face(ellipse(c, 2.6, 2.6, 12), art.ink),
    face(ellipse(c, 1.1, 1.1, 8), art.red),
  ];
}

function macrame(): Poly[] {
  const cords = [14, 23, 33, 42];
  const knot = (x: number, y: number): Poly[] => [
    wall(ellipse([x, y], 3.6, 2.8, 16), art.woodLight),
    wall(ribbon([[x - 2, y - 0.6], [x + 2, y + 0.6]], 1), art.woodShade),
  ];
  return [
    ...hanger([28, -16], [8, 4], [48, 4]),
    ...cords.map((x) => wall(ribbon([[x, 6], [x, 46]], 3), art.woodLight)),
    wall(ribbon(sag([10, 14], [46, 14], 11, 16), 4.2), art.wood),
    wall(ribbon(sag([16, 28], [40, 28], 8, 16), 4.2), art.wood),
    ...cords.flatMap((x) => knot(x, 9)),
    ...knot(18.5, 37),
    ...knot(37.5, 37),
    wall(ellipse([28, 25], 4.5, 4.5, 16), art.mustard),
    wall(ellipse([29, 24], 1.8, 1.8, 10), art.mustardLight),
    wall(ellipse([28, 44], 3, 3, 12), art.mustard),
    ...cords.map((x) => wall(rounded([[x - 3.5, 46], [x + 3.5, 46], [x + 2.2, 58], [x - 2.2, 58]], [0, 0, 1.5, 1.5]), art.woodLight)),
    ...cords.map((x) => wall(ribbon([[x - 1.6, 46], [x - 1, 56]], 1), art.woodShade)),
    face(ribbon([[4, 4], [52, 4]], 5), art.wood),
    face(ribbon([[6, 2.9], [50, 2.9]], 1.4), art.woodLight),
    face(ellipse([3.5, 4], 3.4, 3.4, 12), art.woodShade),
    face(ellipse([52.5, 4], 3.4, 3.4, 12), art.woodShade),
  ];
}

export const DAY5_DECOR: Record<string, Poly[]> = {
  'day5.pin_board': pinBoard(),
  'day5.gallery_wall': galleryWall(),
  'day5.mirror': mirror(),
  'day5.wall_clock': wallClock(),
  'day5.macrame': macrame(),
};
