import { buildFloor, type FloorGrid, type FloorPiece } from './blobWalk';
import {
  DECOR,
  PAINT_ORDER,
  type DayKey,
  type FrameHue,
  type Picks,
  type Poly,
} from './RoomScene';
import { ROOM_FRAME } from './RoomScene';
import { roomFrameFor } from './roomFrameRegistry';

/**
 * The room, cut into the layers a resident can be drawn between.
 *
 * `HexRoom` paints the whole scene in one pass, which is right everywhere the
 * room is a picture. Home has a blob walking on the floor, so the pieces it is
 * behind have to be painted after it — otherwise it walks over the plant
 * instead of past it. The cut is a single index into `pieces`, because paint
 * order and depth order are the same order.
 */

/**
 * A decoration without the shadow authored with it.
 *
 * The room is drawn flat on purpose — one weight of line, one plane of colour
 * per surface. A soft grey patch under every standing piece is the one thing in
 * it pretending to be lit, and on the isometric walls it lands across a corner
 * as often as it lands on a surface.
 */
export function withoutShadow(polys: Poly[]): Poly[] {
  return polys.filter((poly) => poly.sh !== 1);
}

/** the days whose decoration stands on the floor; the rest hang or lie flat */
const FLOOR_DAYS: DayKey[] = ['day3', 'day2', 'day4'];

export interface RoomPiece {
  polys: Poly[];
  /** the front edge of its base, in viewBox `y` */
  front: number;
}

export interface RoomLayers {
  /** walls, floor, the rug and everything hung — always behind the resident */
  base: Poly[];
  /** the floor-standing pieces, back to front */
  pieces: RoomPiece[];
  /** the hexagon outline, always painted last */
  frame: Poly[];
}

export function roomLayers(
  picks: Picks,
  shell: Poly[],
  _frameHue: FrameHue,
): RoomLayers {
  const base = [...shell];

  for (const day of PAINT_ORDER) {
    if (FLOOR_DAYS.includes(day)) continue;
    base.push(...polysFor(picks, day));
  }

  const pieces = FLOOR_DAYS.flatMap((day) => {
    const polys = polysFor(picks, day);
    if (polys.length === 0) return [];

    return [{ polys, front: footprint(key(day, picks[day] as string)).maxY * DECOR_SCALE }];
  });

  return { base, pieces, frame: roomFrameFor(shell, ROOM_FRAME) };
}

/** the floor plan the blob walks, for a host that paints it at its true depth */
export function roomFloor(picks: Picks): FloorGrid {
  const pieces = FLOOR_DAYS.flatMap((day) => {
    const option = picks[day];
    return option ? [footprint(key(day, option))] : [];
  });

  return buildFloor(pieces, 'sorted');
}

/**
 * How far the blob strays where the room is a beat of something else rather
 * than the page itself — matching the wander the onboarding story screens were
 * tuned against, so a walk never drags a speech bubble across the copy.
 */
const ASIDE_ROAM = 34;

/**
 * The floor plan for a host that always paints the blob last: it has to stay in
 * front of every piece *any* room could hold, since it is handed finished
 * artwork rather than the picks. Built once, on first use — walking the whole
 * decor table at import time would cost every screen that pulls this file in.
 */
export function flatFloor(): FloorGrid {
  flatFloorGrid ??= buildFloor(
    Object.keys(DECOR)
      .filter((decorKey) => FLOOR_DAYS.includes(decorKey.split('.')[0] as DayKey))
      .map(footprint),
    'flat',
    ASIDE_ROAM,
  );

  return flatFloorGrid;
}

let flatFloorGrid: FloorGrid | null = null;

/**
 * Home's room is drawn out to the screen edges, so the decorations are scaled
 * up together from the back corner where the walls and floor meet. Every
 * surface passes through that point, so each piece stays on its own wall or
 * floor and keeps its place relative to the others. The rug grows a little
 * more, in place.
 */
const DECOR_SCALE = 1.3;
const RUG_SCALE = 1.35;

/**
 * Where an authored point lands in Home's room. `center` is the piece's own
 * middle, which the rug grows around.
 */
export function toHomeRoomPoint(
  day: DayKey,
  x: number,
  y: number,
  center: readonly [number, number],
): [number, number] {
  const rug = day === 'day1' ? RUG_SCALE : 1;
  const [cx, cy] = center;
  return [
    (cx + (x - cx) * rug) * DECOR_SCALE,
    (cy + (y - cy) * rug) * DECOR_SCALE,
  ];
}

function polysFor(picks: Picks, day: DayKey): Poly[] {
  const option = picks[day];
  return option ? homeDecorationPolys(day, option) : [];
}

/** one piece as Home draws it: no shadow, at Home's scale */
export function homeDecorationPolys(day: DayKey, option: string): Poly[] {
  const decorKey = key(day, option);
  const { minX, maxX, minY, maxY } = footprint(decorKey);
  const center = [(minX + maxX) / 2, (minY + maxY) / 2] as const;

  return withoutShadow(DECOR[decorKey] ?? []).map((poly) => ({
    ...poly,
    p: poly.p
      .trim()
      .split(/\s+/)
      .map((pair) => {
        const [x, y] = pair.split(',').map(Number);
        return toHomeRoomPoint(day, x, y, center).join(',');
      })
      .join(' '),
  }));
}

function key(day: DayKey, option: string): string {
  return `${day}.${option}`;
}

type Footprint = FloorPiece & { minY: number };

const footprints = new Map<string, Footprint>();

/**
 * A piece's extent, ignoring the shadow it casts — that belongs to the floor,
 * not to the object, and counting it would push every front edge forward.
 */
function footprint(decorKey: string): Footprint {
  const cached = footprints.get(decorKey);
  if (cached) return cached;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const poly of DECOR[decorKey] ?? []) {
    if (poly.sh === 1) continue;

    for (const pair of poly.p.trim().split(/\s+/)) {
      const [x, y] = pair.split(',').map(Number);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  const piece = { minX, maxX, minY, maxY };
  footprints.set(decorKey, piece);

  return piece;
}
