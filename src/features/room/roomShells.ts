import { FLOOR_HALF_D, FLOOR_HALF_W } from './roomGeometry';
import { buildRoomFrame } from './RoomScene';
import { registerRoomFrame } from './roomFrameRegistry';
import type { FramePalette, FrameHue, Poly } from './RoomScene';

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
    name: 'Sunbeam',
    frameHue: 'sky',
    wallLeft: '#FFF8DC',
    wallRight: '#FFEFBD',
    baseLeft: '#FFE8A6',
    baseRight: '#FCDA8B',
    floor: '#F7BB68',
    floorLine: '#E3A24C',
    pattern: 'planks',
  },
  sage: {
    name: 'Meadow',
    frameHue: 'teal',
    wallLeft: '#EFFCE6',
    wallRight: '#E0F7D0',
    baseLeft: '#D9F5C6',
    baseRight: '#C8EDAE',
    floor: '#A4E187',
    floorLine: '#8BCF6A',
    pattern: 'planksCross',
  },
  clay: {
    name: 'Coral',
    frameHue: 'blush',
    wallLeft: '#FFF2EA',
    wallRight: '#FFE1D0',
    baseLeft: '#FFD9C1',
    baseRight: '#FFC8A9',
    floor: '#FBA47E',
    floorLine: '#E78A63',
    pattern: 'tile',
  },
  dusk: {
    name: 'Violet',
    frameHue: 'sky',
    wallLeft: '#F3F0FF',
    wallRight: '#E4DDFF',
    wainscotLeft: '#D6CDFF',
    wainscotRight: '#C4B9FE',
    baseLeft: '#BEB2FC',
    baseRight: '#AD9FF8',
    floor: '#B0A2F7',
    floorLine: '#9084EC',
    pattern: 'checker',
  },
  mint: {
    name: 'Lagoon',
    frameHue: 'teal',
    wallLeft: '#E6FCF7',
    wallRight: '#D1F6EF',
    baseLeft: '#C6F3EA',
    baseRight: '#B1EBDF',
    floor: '#82E0CD',
    floorLine: '#5FCBB6',
    pattern: 'medallion',
  },
  slate: {
    name: 'Sky',
    frameHue: 'blush',
    wallLeft: '#DDEEFF',
    wallRight: '#BFE0FF',
    wainscotLeft: '#A5D2FF',
    wainscotRight: '#85C1FF',
    baseLeft: '#79BAFF',
    baseRight: '#57A6FB',
    floor: '#3E97F7',
    floorLine: '#1F79DC',
    pattern: 'planks',
  },
} as const satisfies Record<string, ShellSpec>;

export type RoomShellKey = keyof typeof SPECS;

export const ROOM_SHELL_KEYS = Object.keys(SPECS) as RoomShellKey[];

export const ROOM_SHELLS: Record<RoomShellKey, Poly[]> = Object.fromEntries(
  ROOM_SHELL_KEYS.map((key) => [key, buildShell(SPECS[key])]),
) as Record<RoomShellKey, Poly[]>;


/**
 * The frame is the cut thickness of the room's own walls, so it is that room's
 * colour — a blue room ends in blue plaster, not in the cream the first shell
 * happened to be drawn in.
 *
 * All five are derived from `floor` rather than listed per shell: the tones are
 * light on one solid, and hand-picking them six times over is six chances for a
 * face to end up brighter than the one turned more squarely to the light.
 *
 * The floor is the source because it is the only surface carrying the shell's
 * hue at full strength — every `wallLeft` is a near-white pastel, so a frame
 * mixed from those came out the same off-white for all six rooms whatever the
 * room was. Each tone is the floor lifted most of the way to white so the cut
 * still reads as plaster, pulled slightly toward its own grey because a cut
 * edge is flatter than a painted surface, then darkened by how far that face
 * turns from the light. The factors are the tones the original cream frame was
 * authored with, kept as ratios so every shell is lit the same way.
 */
const FRAME_LIFT = 0.62;
const FRAME_FLATTEN = 0.15;
const FRAME_FACTORS: Record<keyof FramePalette, number> = {
  cap: 0.96,
  baseLeft: 0.93,
  sideLeft: 0.885,
  baseRight: 0.853,
  sideRight: 0.805,
};

function channels(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function frameTone(source: string, factor: number): string {
  const lifted = channels(source).map(
    (value) => value + (255 - value) * FRAME_LIFT,
  ) as [number, number, number];
  const grey =
    0.2126 * lifted[0] + 0.7152 * lifted[1] + 0.0722 * lifted[2];

  const tone = lifted.map((value) => {
    const flattened = value + (grey - value) * FRAME_FLATTEN;
    const lit = Math.round(Math.min(255, Math.max(0, flattened * factor)));
    return lit.toString(16).padStart(2, '0');
  });

  return `#${tone.join('')}`;
}

function framePalette(source: string): FramePalette {
  return {
    cap: frameTone(source, FRAME_FACTORS.cap),
    baseLeft: frameTone(source, FRAME_FACTORS.baseLeft),
    sideLeft: frameTone(source, FRAME_FACTORS.sideLeft),
    baseRight: frameTone(source, FRAME_FACTORS.baseRight),
    sideRight: frameTone(source, FRAME_FACTORS.sideRight),
  };
}

export const ROOM_FRAMES: Record<RoomShellKey, Poly[]> = Object.fromEntries(
  ROOM_SHELL_KEYS.map((key) => [
    key,
    buildRoomFrame(framePalette(SPECS[key].floor)),
  ]),
) as Record<RoomShellKey, Poly[]>;

/**
 * A shell's frame, looked up by the artwork itself.
 *
 * Callers hand a room's shell around as polygons, not as a key, so the frame is
 * registered against the artwork itself — that keeps the pair together with
 * nothing to thread through every screen that draws a room. Artwork from
 * outside this table (the generated `ROOM_SHELL`) keeps its authored frame.
 */
for (const key of ROOM_SHELL_KEYS) {
  registerRoomFrame(ROOM_SHELLS[key], ROOM_FRAMES[key]);
}

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
