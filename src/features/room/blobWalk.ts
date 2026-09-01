import { FLOOR_HALF_D, FLOOR_HALF_W } from './roomGeometry';

/**
 * Where the room's resident may stand, and the route it takes to get there.
 *
 * The floor is drawn as a rhombus but it is a unit square in its own basis —
 * see `FLOOR_HALF_W` — so the walkable floor is a plain grid, a piece of
 * furniture is a handful of blocked cells, and a route around one is a
 * breadth-first search over them. No polygon clipping, no rhombus edge cases,
 * and an empty room and a full one go through the same code.
 */

export interface FloorPoint {
  a: number;
  b: number;
}

/** a decoration standing on the floor, as its artwork is drawn, in viewBox units */
export interface FloorPiece {
  minX: number;
  maxX: number;
  /** the front edge of its base: past this y, the blob is in front of it */
  maxY: number;
}

export interface FloorGrid {
  /** one flag per cell, row-major over `a` then `b` */
  free: boolean[];
  /** the walkable cells, so picking somewhere to go is one random index */
  open: number[];
  /** how far from `START` this floor lets it stray, in viewBox units */
  roam: number;
}

/**
 * How the host draws the blob against the furniture.
 *
 * `sorted` hosts paint the pieces the blob is behind on top of it, so it may
 * walk anywhere it is not standing inside something. `flat` hosts always paint
 * it last, so it has to stay genuinely in front of every piece or it reads as
 * a sticker.
 */
export type Occlusion = 'sorted' | 'flat';

/** half the blob's body, in viewBox units — what a piece has to cover to hide it */
export const BLOB_HALF_W = 28;

/** where it stands before it has walked anywhere: the open front-left floor */
export const START: FloorPoint = { a: 0.44, b: 0.76 };

const CELLS = 16;

/**
 * How far its contact point stays from the room's edges. The front is the
 * strict one: its ground shadow reaches ~17 units past its feet, and past the
 * front edges there is no floor to catch it. At the back it only has to stop
 * short of standing in a wall.
 */
const FRONT_INSET = 0.12;
const BACK_INSET = 0.06;

/** it keeps this much daylight between its feet and a piece's base */
const CLEARANCE_X = 6;
const CLEARANCE_Y = 4;

/**
 * A floor-aligned quad's height on screen is a fixed fraction of its width —
 * the projection stretches both floor axes the same way — so a piece's base is
 * this deep in `y` whatever it is drawn standing above it.
 */
const BASE_RATIO = FLOOR_HALF_D / FLOOR_HALF_W;

/** the shortest trip worth taking, in viewBox units */
const MIN_TRIP = 55;

const UNREACHED = -1;

export function floorX({ a, b }: FloorPoint): number {
  return FLOOR_HALF_W * (a - b);
}

export function floorY({ a, b }: FloorPoint): number {
  return FLOOR_HALF_D * (a + b);
}

/**
 * `roam` caps how far from `START` the blob will go. A host showing the room as
 * the page — Home — leaves it off and gets the whole floor; a host where the
 * room is one beat of something else keeps it close, so a walk never pulls the
 * eye away from the copy it is standing next to.
 */
export function buildFloor(
  pieces: FloorPiece[],
  occlusion: Occlusion,
  roam: number = Infinity,
): FloorGrid {
  const free: boolean[] = [];
  const open: number[] = [];

  for (let index = 0; index < CELLS * CELLS; index += 1) {
    const point = cellPoint(index);
    const walkable =
      insideRoom(point) &&
      screenDistance(START, point) <= roam &&
      pieces.every((piece) => clears(piece, point, occlusion));

    free.push(walkable);
    if (walkable) open.push(index);
  }

  return { free, open, roam };
}

/**
 * A route from `from` to somewhere else worth standing, as waypoints it can
 * walk in straight lines between.
 *
 * Returns an empty route when the floor has nowhere to go — a room whose
 * pieces have sealed the blob in, which the insets make unlikely but not
 * impossible to author.
 */
export function planWalk(
  grid: FloorGrid,
  from: FloorPoint,
  random: () => number = Math.random,
): FloorPoint[] {
  const start = nearestOpen(grid, from);
  if (start === UNREACHED) return [];

  const came = flood(grid, start);
  const reached = grid.open.filter((cell) => came[cell] !== UNREACHED);
  const minTrip = Math.min(MIN_TRIP, grid.roam * 0.8);
  const worthIt = reached.filter(
    (cell) => screenDistance(from, cellPoint(cell)) > minTrip,
  );
  const pool = worthIt.length > 0 ? worthIt : reached;
  if (pool.length === 0) return [];

  const target = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];

  return straighten(grid, from, trace(came, start, target));
}

/** how many of `edges` — ascending front-edge `y` values — the blob has walked past */
export function passedCount(edges: number[], y: number): number {
  return edges.filter((edge) => y > edge).length;
}

function insideRoom({ a, b }: FloorPoint): boolean {
  return (
    a > BACK_INSET &&
    b > BACK_INSET &&
    a < 1 - FRONT_INSET &&
    b < 1 - FRONT_INSET
  );
}

function clears(
  piece: FloorPiece,
  point: FloorPoint,
  occlusion: Occlusion,
): boolean {
  const y = floorY(point);
  if (y > piece.maxY + CLEARANCE_Y) return true;

  const spread = occlusion === 'flat' ? BLOB_HALF_W : 0;
  const x = floorX(point);
  if (x < piece.minX - spread - CLEARANCE_X) return true;
  if (x > piece.maxX + spread + CLEARANCE_X) return true;

  // Behind the piece and overlapping it. A flat host has to keep out entirely;
  // a sorted one only has to keep the blob out of the piece's own base, and out
  // of any spot wide enough to swallow it whole — vanishing for a few seconds
  // reads as a bug, half-hidden behind a plant reads as a room.
  if (occlusion === 'flat') return false;
  if (piece.minX <= x - BLOB_HALF_W && x + BLOB_HALF_W <= piece.maxX) return false;

  return y < piece.maxY - baseDepth(piece) - CLEARANCE_Y;
}

function baseDepth(piece: FloorPiece): number {
  return (piece.maxX - piece.minX) * BASE_RATIO;
}

function cellPoint(index: number): FloorPoint {
  return {
    a: (Math.floor(index / CELLS) + 0.5) / CELLS,
    b: ((index % CELLS) + 0.5) / CELLS,
  };
}

function cellIndex({ a, b }: FloorPoint): number {
  const i = clampCell(Math.floor(a * CELLS));
  const j = clampCell(Math.floor(b * CELLS));

  return i * CELLS + j;
}

function clampCell(value: number): number {
  return Math.max(0, Math.min(CELLS - 1, value));
}

function nearestOpen(grid: FloorGrid, from: FloorPoint): number {
  const here = cellIndex(from);
  if (grid.free[here]) return here;

  let best = UNREACHED;
  let bestDistance = Infinity;

  for (const cell of grid.open) {
    const distance = screenDistance(from, cellPoint(cell));
    if (distance < bestDistance) {
      best = cell;
      bestDistance = distance;
    }
  }

  return best;
}

function flood(grid: FloorGrid, start: number): number[] {
  const came = new Array<number>(CELLS * CELLS).fill(UNREACHED);
  came[start] = start;

  const queue = [start];
  for (let head = 0; head < queue.length; head += 1) {
    const cell = queue[head];
    const i = Math.floor(cell / CELLS);
    const j = cell % CELLS;

    for (const [di, dj] of NEIGHBOURS) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= CELLS || nj >= CELLS) continue;

      const next = ni * CELLS + nj;
      if (!grid.free[next] || came[next] !== UNREACHED) continue;

      came[next] = cell;
      queue.push(next);
    }
  }

  return came;
}

const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function trace(came: number[], start: number, target: number): FloorPoint[] {
  const cells: number[] = [];

  let cell = target;
  while (cell !== start) {
    cells.push(cell);
    cell = came[cell];
  }

  // `start` leads the route rather than being assumed: a room decorated under
  // the blob's feet leaves it standing somewhere it may not stand, and stepping
  // onto open floor is the first thing it should do. `straighten` drops it again
  // whenever it was already standing on open floor.
  cells.push(start);

  return cells.reverse().map(cellPoint);
}

/**
 * Pulls the grid path taut: keep only the waypoints it actually has to turn at,
 * so the blob walks the diagonal it can see rather than a staircase of cells.
 */
function straighten(
  grid: FloorGrid,
  from: FloorPoint,
  path: FloorPoint[],
): FloorPoint[] {
  const kept: FloorPoint[] = [];
  let at = from;
  let index = 0;

  while (index < path.length) {
    let next = index;
    for (let ahead = path.length - 1; ahead > index; ahead -= 1) {
      if (clearLine(grid, at, path[ahead])) {
        next = ahead;
        break;
      }
    }

    at = path[next];
    kept.push(at);
    index = next + 1;
  }

  return kept;
}

function clearLine(grid: FloorGrid, from: FloorPoint, to: FloorPoint): boolean {
  const steps =
    Math.ceil(
      Math.max(Math.abs(to.a - from.a), Math.abs(to.b - from.b)) * CELLS * 3,
    ) + 1;

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const point = {
      a: from.a + (to.a - from.a) * t,
      b: from.b + (to.b - from.b) * t,
    };
    if (!grid.free[cellIndex(point)]) return false;
  }

  return true;
}

function screenDistance(from: FloorPoint, to: FloorPoint): number {
  return Math.hypot(floorX(to) - floorX(from), floorY(to) - floorY(from));
}
