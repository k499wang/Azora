import { FLOOR_HALF_D, FLOOR_HALF_W } from './roomGeometry';
import type { FrameHue, Poly } from './RoomScene';

/**
 * The room shells — walls, floor, floor pattern, trim.
 *
 * `RoomScene.tsx` is generated artwork and ships one shell. These are built
 * here instead so a new look is a palette plus a floor pattern rather than a
 * hand-authored polygon soup, and so regenerating the scene never clobbers
 * them.
 *
 * Geometry matches `RoomScene`'s viewBox exactly. The hexagon and its
 * decoration coordinates are fixed — every object is authored against this one
 * room space — so a shell varies surface, not shape.
 */

/** wall height, in viewBox units; the floor's half-width and half-depth are shared */
const HALF_W = FLOOR_HALF_W;
const HALF_D = FLOOR_HALF_D;
const WALL_H = 180;

/** the floor plane: `a` runs toward the right wall, `b` toward the left, 0..1 */
function floorPoint(a: number, b: number): string {
  return `${trim(HALF_W * (a - b))},${trim(HALF_D * (a + b))}`;
}

function floorQuad(a0: number, a1: number, b0: number, b1: number): string {
  return [
    floorPoint(a0, b0),
    floorPoint(a1, b0),
    floorPoint(a1, b1),
    floorPoint(a0, b1),
  ].join(' ');
}

/** a wall plane: `h` runs out from the centre seam, `v` runs down, 0..1 */
function wallQuad(
  side: -1 | 1,
  h0: number,
  h1: number,
  v0: number,
  v1: number,
): string {
  const point = (h: number, v: number) =>
    `${trim(side * HALF_W * h)},${trim(-WALL_H + HALF_D * h + WALL_H * v)}`;

  return [point(h0, v0), point(h1, v0), point(h1, v1), point(h0, v1)].join(' ');
}

function trim(value: number): number {
  return Math.round(value * 10) / 10;
}

type FloorPattern = 'planks' | 'planksCross' | 'checker' | 'tile' | 'medallion';

interface ShellSpec {
  name: string;
  /** the frame hue this shell was designed against */
  frameHue: FrameHue;
  wallLeft: string;
  wallRight: string;
  /** lower-wall panelling; omit for a plain wall */
  wainscotLeft?: string;
  wainscotRight?: string;
  /** skirting board along the foot of each wall */
  baseLeft: string;
  baseRight: string;
  floor: string;
  /** plank seams, grout, and the darker half of a checker */
  floorLine: string;
  pattern: FloorPattern;
}

/** plank seam thickness, as a fraction of the floor axis */
const SEAM = 0.011;
/** grout thickness */
const GROUT = 0.009;
/** where the skirting board starts */
const BASE_TOP = 0.967;
/** where wall panelling starts */
const WAINSCOT_TOP = 0.6;

function floorPatternPolys(pattern: FloorPattern, line: string, floor: string): Poly[] {
  switch (pattern) {
    case 'planks':
      return [0.2, 0.4, 0.6, 0.8].map((b) => ({
        p: floorQuad(0, 1, b, b + SEAM),
        f: line,
      }));

    case 'planksCross':
      return [0.2, 0.4, 0.6, 0.8].map((a) => ({
        p: floorQuad(a, a + SEAM, 0, 1),
        f: line,
      }));

    case 'checker': {
      const n = 6;
      const cells: Poly[] = [];

      for (let i = 0; i < n; i += 1) {
        for (let j = 0; j < n; j += 1) {
          if ((i + j) % 2 === 0) continue;
          cells.push({
            p: floorQuad(i / n, (i + 1) / n, j / n, (j + 1) / n),
            f: line,
          });
        }
      }

      return cells;
    }

    case 'tile': {
      const seams = [0.25, 0.5, 0.75];

      return [
        ...seams.map((b) => ({ p: floorQuad(0, 1, b, b + GROUT), f: line })),
        ...seams.map((a) => ({ p: floorQuad(a, a + GROUT, 0, 1), f: line })),
      ];
    }

    case 'medallion':
      return [
        { p: floorQuad(0.22, 0.78, 0.22, 0.78), f: line },
        { p: floorQuad(0.3, 0.7, 0.3, 0.7), f: floor },
        { p: floorQuad(0, 1, 0.5, 0.5 + GROUT), f: line },
        { p: floorQuad(0.5, 0.5 + GROUT, 0, 1), f: line },
      ];
  }
}

/**
 * Ambient darkening at the corner seam and where each wall meets the floor.
 * Neutral and constant — it reads as contact shadow, so it must not take the
 * shell's hue or every room ends up looking like the same room in a filter.
 */
const SEAM_SHADE: Poly[] = [
  { p: '0,-172 -6.9,-168 -6.9,4 0,0', f: 'rgba(58,67,79,.05)' },
  { p: '0,-172 6.9,-168 6.9,4 0,0', f: 'rgba(58,67,79,.07)' },
];

const FLOOR_SHADE: Poly[] = [
  { p: '0,0 6.9,4 -149,94 -155.9,90', f: 'rgba(58,67,79,.05)' },
  { p: '0,0 155.9,90 149,94 -6.9,4', f: 'rgba(58,67,79,.05)' },
];

function buildShell(spec: ShellSpec): Poly[] {
  const wainscot: Poly[] = [];

  if (spec.wainscotLeft != null) {
    wainscot.push({
      p: wallQuad(-1, 0, 1, WAINSCOT_TOP, 1),
      f: spec.wainscotLeft,
    });
  }
  if (spec.wainscotRight != null) {
    wainscot.push({
      p: wallQuad(1, 0, 1, WAINSCOT_TOP, 1),
      f: spec.wainscotRight,
    });
  }

  return [
    { p: wallQuad(-1, 0, 1, 0, 1), f: spec.wallLeft },
    { p: wallQuad(1, 0, 1, 0, 1), f: spec.wallRight },
    ...wainscot,
    ...SEAM_SHADE,
    { p: floorQuad(0, 1, 0, 1), f: spec.floor },
    ...floorPatternPolys(spec.pattern, spec.floorLine, spec.floor),
    ...FLOOR_SHADE,
    { p: wallQuad(-1, 0, 1, BASE_TOP, 1), f: spec.baseLeft },
    { p: wallQuad(1, 0, 1, BASE_TOP, 1), f: spec.baseRight },
  ];
}

const SPECS = {
  cream: {
    name: 'Cream',
    frameHue: 'sky',
    wallLeft: '#FCF4DE',
    wallRight: '#F4E9C8',
    baseLeft: '#F0E2BC',
    baseRight: '#EDDDB2',
    floor: '#EBCA92',
    floorLine: '#DEB979',
    pattern: 'planks',
  },
  sage: {
    name: 'Sage',
    frameHue: 'teal',
    wallLeft: '#F1F6EB',
    wallRight: '#E5EEDC',
    baseLeft: '#E4EEDA',
    baseRight: '#D9E6CC',
    floor: '#C9DBBE',
    floorLine: '#AFC7A1',
    pattern: 'planksCross',
  },
  clay: {
    name: 'Clay',
    frameHue: 'blush',
    wallLeft: '#FCEFE6',
    wallRight: '#F6E2D4',
    baseLeft: '#F2E0D2',
    baseRight: '#EBD5C3',
    floor: '#DCAB8A',
    floorLine: '#C68F6C',
    pattern: 'tile',
  },
  dusk: {
    name: 'Dusk',
    frameHue: 'sky',
    wallLeft: '#E7E8F4',
    wallRight: '#D8DAEC',
    wainscotLeft: '#CFD2E8',
    wainscotRight: '#C1C5DE',
    baseLeft: '#BDC1DB',
    baseRight: '#AFB4D0',
    floor: '#ADAFCE',
    floorLine: '#9092B7',
    pattern: 'checker',
  },
  mint: {
    name: 'Mint',
    frameHue: 'teal',
    wallLeft: '#E9F7F3',
    wallRight: '#D9EEE8',
    baseLeft: '#D6EDE7',
    baseRight: '#C6E4DC',
    floor: '#A6D6CA',
    floorLine: '#88C2B4',
    pattern: 'medallion',
  },
  slate: {
    name: 'Slate',
    frameHue: 'blush',
    wallLeft: '#EEF1F5',
    wallRight: '#E0E6EC',
    wainscotLeft: '#D7DEE6',
    wainscotRight: '#C8D2DC',
    baseLeft: '#C4CED8',
    baseRight: '#B6C1CD',
    floor: '#B4C0CB',
    floorLine: '#98A6B4',
    pattern: 'planks',
  },
} as const satisfies Record<string, ShellSpec>;

export type RoomShellKey = keyof typeof SPECS;

export const ROOM_SHELL_KEYS = Object.keys(SPECS) as RoomShellKey[];

export const ROOM_SHELLS: Record<RoomShellKey, Poly[]> = Object.fromEntries(
  ROOM_SHELL_KEYS.map((key) => [key, buildShell(SPECS[key])]),
) as Record<RoomShellKey, Poly[]>;

/** what the "pick your next room" swatches offer */
export interface RoomStyle {
  shell: RoomShellKey;
  name: string;
  frameHue: FrameHue;
}

export const ROOM_STYLES: RoomStyle[] = ROOM_SHELL_KEYS.map((shell) => ({
  shell,
  name: SPECS[shell].name,
  frameHue: SPECS[shell].frameHue,
}));

/**
 * A room's shell is free text in the database so a look can be retired without
 * a migration; anything unrecognised falls back to the original room.
 */
export function toRoomShell(value: string | undefined): RoomShellKey {
  return value != null && value in SPECS ? (value as RoomShellKey) : 'cream';
}

export function roomShellPolys(value: string | undefined): Poly[] {
  return ROOM_SHELLS[toRoomShell(value)];
}
