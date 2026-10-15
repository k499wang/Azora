import { colors } from '../../../theme/colors';
import type { Poly } from '../RoomScene';
import { B, add, blob, ellipse, leaf, onWall, poly, ribbon, rounded, scale, wallRect, type Point } from './artKit';

const art = colors.roomArt;

/** day 6 sits flat on the right wall; wall-space shapes start from this corner */
const ANCHOR: Point = [50, -128];

/** how far a piece's face stands off the wall, toward the room */
const OUT = scale(B, 0.018);
/** how far a ledge reaches out from the wall */
const LEDGE = scale(B, 0.05);

const onRight = (shape: readonly Point[]): Point[] => onWall('right', ANCHOR, shape);

function wall(shape: readonly Point[], f: string, o?: number): Poly {
  return poly(onRight(shape), f, o);
}

function face(shape: readonly Point[], f: string, o?: number): Poly {
  return poly(onRight(shape).map((p) => add(p, OUT)), f, o);
}

function raised(shape: readonly Point[], base: string, shade: string): Poly[] {
  return [wall(shape, shade), face(shape, base)];
}

/** a ledge on the wall: its top at wall height `y` from `x0` to `x1`, `h` thick */
function ledge(x0: number, x1: number, y: number, h: number): Poly[] {
  const [back0, back1] = onRight([[x0, y], [x1, y]]);
  const [f0, f1] = [add(back0, LEDGE), add(back1, LEDGE)];
  const down: Point = [0, h];
  return [
    poly([back1, add(back1, down), add(f1, down), f1], art.woodShade),
    poly(rounded([f0, f1, add(f1, down), add(f0, down)], [0, 0, 2, 2]), art.wood),
    poly([back0, back1, f1, f0], art.woodLight),
  ];
}

/**
 * A recessed opening with a bevel: lit along its top and screen-left edge
 * (smaller `u` on this wall), shaded along the bottom and screen-right.
 */
function opening(x: number, y: number, w: number, h: number, content: string, light: string, shade: string, r = 3, bevel = 1.8): Poly[] {
  return [
    face(wallRect(x, y, w, h, r), light),
    face(wallRect(x + bevel, y + bevel, w - bevel, h - bevel, r), shade),
    face(wallRect(x + bevel, y + bevel, w - bevel * 2, h - bevel * 2, r), content),
  ];
}

function roundOpening(c: Point, rx: number, content: string, light: string, shade: string, bevel = 2): Poly[] {
  return [
    face(ellipse(c, rx, rx, 36), light),
    face(ellipse([c[0] + bevel * 0.5, c[1] + bevel * 0.5], rx - bevel * 0.5, rx - bevel * 0.5, 36), shade),
    face(ellipse(c, rx - bevel, rx - bevel, 36), content),
  ];
}

/** a pot sitting on wall-space line `y`, drawn on the given plane */
function wallPot(on: (shape: readonly Point[]) => Point[], x: number, y: number, w: number, h: number, light: string, base: string, shade: string): Poly[] {
  const body = rounded([[x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2 - 2, y], [x - w / 2 + 2, y]], [0, 0, 2, 2]);
  return [
    poly(on(body), base),
    poly(on(rounded([[x + w / 6, y - h], [x + w / 2, y - h], [x + w / 2 - 2, y], [x + w / 6 - 0.6, y]], [0, 0, 2, 0])), shade),
    poly(on(rounded([[x - w / 2 - 1, y - h - 1], [x + w / 2 + 1, y - h - 1], [x + w / 2 + 1, y - h + 3], [x - w / 2 - 1, y - h + 3]], 1.2)), light),
  ];
}

function veined(on: (shape: readonly Point[]) => Point[], base: Point, tip: Point, width: number, f: string, vein: string): Poly[] {
  const mid = (t: number): Point => [base[0] + (tip[0] - base[0]) * t, base[1] + (tip[1] - base[1]) * t];
  return [poly(on(leaf(base, tip, width, 12)), f), poly(on(ribbon([mid(0.12), mid(0.8)], 1)), vein)];
}

function star(x: number, y: number, r: number): Poly {
  const pts: Point[] = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (Math.PI / 5) * i;
    const rr = i % 2 ? r * 0.5 : r;
    return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
  });
  return face(rounded(pts, r * 0.18, 2), art.glow);
}

function windowFrame(pane: string, sky: Poly[], extra: Poly[] = []): Poly[] {
  return [
    ...raised(wallRect(2, 2, 64, 76, 8), art.wood, art.woodShade),
    ...opening(8, 8, 52, 66, pane, art.woodLight, art.woodDeep, 4),
    ...sky,
    face(ribbon([[34, 9.8], [34, 72.2]], 4.5), art.wood),
    face(ribbon([[9.8, 41], [58.2, 41]], 4.5), art.wood),
    face(ribbon([[32.8, 10.4], [32.8, 39]], 1.2), art.woodLight),
    face(ribbon([[10.4, 39.8], [32, 39.8]], 1.2), art.woodLight),
    face(ellipse([34, 41], 2.6, 2.6, 14), art.woodShade),
    ...ledge(-3, 71, 75, 6),
    ...extra,
  ];
}

function dayWindow(): Poly[] {
  const curtain = (x0: number, x1: number, tie: number): Poly[] => [
    face(rounded([[x0, 9], [x1, 9], [tie + (x1 - x0) * 0.25, 52], [tie, 70], [x0, 70]], [0, 0, 6, 3, 0]), art.pink),
    face(ribbon([[x0 + (x1 - x0) * 0.45, 12], [tie + 1, 50]], 1.2), art.pinkShade),
    face(rounded([[tie - 3, 49], [tie + (x1 - x0) * 0.4, 49], [tie + (x1 - x0) * 0.4, 53], [tie - 3, 53]], 1.5), art.mustard),
  ];
  return windowFrame(
    art.skyLight,
    [
      face(ellipse([47, 21], 6.5, 6.5, 24), art.glow),
      face(ellipse([45.6, 19.6], 2.2, 2.2, 12), art.creamLight),
      face(blob([24, 26], 9, 4.5, 0.08, 2, 36), art.creamLight),
      face(blob([46, 58], 8, 4, 0.08, 4, 36), art.creamLight),
    ],
    [...curtain(9.8, 20, 12), ...curtain(58.2, 48, 56)],
  );
}

function nightWindow(): Poly[] {
  const sill = (shape: readonly Point[]): Point[] => onRight(shape).map((p) => add(p, scale(LEDGE, 0.5)));
  return windowFrame(
    art.lilacShade,
    [
      face(ellipse([46, 22], 7.5, 7.5, 28), art.glow),
      face(ellipse([50, 19], 6.5, 6.5, 28), art.lilacShade),
      star(18, 18, 4),
      star(22, 56, 3),
      face(ellipse([50, 58], 1.2, 1.2, 8), art.glow),
      face(ellipse([14, 32], 1, 1, 8), art.glow),
    ],
    [
      ...veined(sill, [52, 66], [44, 54], 8, art.leaf, art.leafShade),
      ...veined(sill, [52, 66], [60, 55], 8, art.leafShade, art.leafDeep),
      ...veined(sill, [52, 66], [52, 51], 7, art.leafLight, art.leaf),
      ...wallPot(sill, 52, 75, 12, 10, art.creamLight, art.cream, art.creamShade),
    ],
  );
}

function porthole(): Poly[] {
  const c: Point = [32, 36];
  return [
    ...raised(ellipse(c, 29, 29, 48), art.mustard, art.mustardShade),
    face(ribbon(ellipse(c, 27, 27, 30, Math.PI * 0.6, Math.PI * 1.4), 1.6), art.mustardLight),
    ...[0, 1, 2, 3, 4, 5].flatMap((i) => {
      const a = Math.PI / 6 + (Math.PI / 3) * i;
      const b: Point = [c[0] + Math.cos(a) * 24.5, c[1] + Math.sin(a) * 24.5];
      return [face(ellipse(b, 2.2, 2.2, 14), art.mustardShade), face(ellipse([b[0] - 0.6, b[1] - 0.6], 0.9, 0.9, 8), art.mustardLight)];
    }),
    ...roundOpening(c, 20, art.glass, art.mustardLight, art.mustardShade),
    face(ellipse(c, 18, 18, 40, 0.35, Math.PI - 0.35), art.teal),
    face(ribbon([[c[0] - 15, c[1] + 6], [c[0] - 8, c[1] + 4.6], [c[0], c[1] + 6.4], [c[0] + 9, c[1] + 4.6], [c[0] + 15, c[1] + 6]], 1.2), art.tealLight),
    face(ellipse([c[0] + 1, c[1] - 1], 7.5, 4.8, 24), art.mustard),
    face(rounded([[c[0] + 7, c[1] - 1], [c[0] + 13, c[1] - 6], [c[0] + 13, c[1] + 4]], 2), art.mustardShade),
    face(ellipse([c[0] - 0.4, c[1] - 2.4], 4.5, 1.8, 14), art.mustardLight),
    face(ellipse([c[0] - 3.5, c[1] - 1.5], 1.2, 1.2, 10), art.ink),
    face(ellipse([c[0] - 6, c[1] - 9], 1.4, 1.4, 10), art.glassLight),
    face(ellipse([c[0] - 4, c[1] - 13], 1, 1, 8), art.glassLight),
    face(ribbon([[c[0] - 14, c[1] - 3], [c[0] - 11, c[1] - 10], [c[0] - 5, c[1] - 14]], 3.4), art.glassLight, 0.85),
  ];
}

function greenhouseShelf(): Poly[] {
  const mid = scale(LEDGE, 0.5);
  const onShelf = (shape: readonly Point[]): Point[] => onRight(shape).map((p) => add(p, mid));
  const bracket = (x: number): Poly[] => {
    const [top, low] = onRight([[x, 60], [x, 72]]);
    const tip = add(top, scale(LEDGE, 0.85));
    return [poly([top, tip, low], art.woodShade), poly([top, add(top, scale(LEDGE, 0.5)), add(top, [0, 2])], art.wood)];
  };
  return [
    ...bracket(8),
    ...bracket(62),
    ...ledge(0, 72, 54, 6).slice(1),
    ...veined(onShelf, [15, 41], [6, 24], 11, art.leaf, art.leafShade),
    ...veined(onShelf, [15, 41], [24, 22], 11, art.leafShade, art.leafDeep),
    ...veined(onShelf, [15, 41], [15, 20], 9, art.leafLight, art.leaf),
    poly(onShelf(ellipse([36, 32], 8, 9.5, 32)), art.leafShade),
    poly(onShelf(ellipse([35, 31], 6, 7.5, 28)), art.leaf),
    poly(onShelf(ribbon([[35, 25], [35, 38]], 1)), art.leafDeep),
    poly(onShelf(ellipse([33, 27], 1.4, 2.6, 10)), art.leafLight),
    ...veined(onShelf, [57, 41], [51, 22], 9, art.leaf, art.leafShade),
    ...veined(onShelf, [57, 41], [64, 24], 9, art.leafShade, art.leafDeep),
    poly(onShelf(ellipse([51, 21], 3.2, 3.2, 14)), art.pinkLight),
    poly(onShelf(ellipse([51, 21], 1.3, 1.3, 8)), art.mustard),
    ...wallPot(onShelf, 15, 54, 16, 13, art.redLight, art.red, art.redShade),
    ...wallPot(onShelf, 36, 54, 16, 13, art.creamLight, art.cream, art.creamShade),
    ...wallPot(onShelf, 57, 54, 16, 13, art.tealLight, art.teal, art.tealShade),
  ];
}

function stainedGlass(): Poly[] {
  const arch = (inset: number, bottom = 88): Point[] => [
    ...ellipse([34, 30], 26 - inset, 26 - inset, 24, Math.PI, Math.PI * 2),
    [60 - inset, bottom - inset],
    [8 + inset, bottom - inset],
  ];
  return [
    ...raised(rounded(arch(-2), 4), art.stone, art.stoneShade),
    face(rounded(arch(2.5), 3), art.stoneLight),
    face(rounded(arch(4).map(([x, y]) => [x + 1.4, y + 1.4] as Point), 3), art.stoneShade),
    face(rounded(arch(4.2), 3), art.lilacLight),
    face(rounded([[12, 50], [34, 50], [34, 83.8], [12, 83.8]], [0, 0, 0, 3]), art.redLight),
    face(rounded([[34, 50], [55.8, 50], [55.8, 83.8], [34, 83.8]], [0, 0, 3, 0]), art.mustardLight),
    face([[12, 50], [34, 50], [12, 70]], art.pinkLight),
    face([[55.8, 50], [34, 50], [55.8, 70]], art.tealLight),
    face(ellipse([34, 30], 12, 12, 24, Math.PI, Math.PI * 2), art.glow),
    face(ellipse([34, 66], 6, 6, 24), art.lilac),
    face(ribbon([[34, 8], [34, 84]], 3), art.stone),
    face(ribbon([[11, 50], [57, 50]], 3), art.stone),
    face(ribbon([[12, 70], [34, 50], [55.8, 70]], 2), art.stone),
    face(ribbon(ellipse([34, 30], 12, 12, 16, Math.PI, Math.PI * 2), 2), art.stone),
    face(ellipse([20, 24], 4, 2.4, 16), art.glassLight, 0.7),
    ...ledge(4, 64, 86.5, 4),
  ];
}

export const DAY6_DECOR: Record<string, Poly[]> = {
  'day6.day_window': dayWindow(),
  'day6.night_window': nightWindow(),
  'day6.porthole': porthole(),
  'day6.greenhouse_shelf': greenhouseShelf(),
  'day6.stained_glass': stainedGlass(),
};
