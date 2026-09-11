import type { RoomSlot } from '../../lib/room/roomProgress';

/**
 * The shape drawn where a slot's piece will go.
 *
 * Authored rather than borrowed from the decorations. A decoration is dozens of
 * overlapping polygons, so its outline is not a thing that exists — flattening
 * one gives a lumpy blob, and tracing one dots every internal seam. These are
 * single closed loops, which is what makes a dotted contour possible at all:
 * one path, one stroke, nothing to mask.
 *
 * They say *what kind of thing* goes here, not which piece: a slab on the floor
 * for the rug, a block for furniture, a pane on the wall. The room's own
 * isometric language does the rest.
 *
 * Points are in unit space — `0,0` top-left of the slot's patch, `1,1` bottom
 * right — so a shape is positioned by the art it stands in for and cannot drift
 * when a piece is redrawn.
 */
export type GhostPoint = readonly [x: number, y: number];

/** a circle as a closed loop, for the shapes that want one */
function ring(steps: number, squash = 1): GhostPoint[] {
  return Array.from({ length: steps }, (_, index) => {
    const angle = (index / steps) * Math.PI * 2 - Math.PI / 2;
    return [
      0.5 + Math.cos(angle) * 0.5,
      0.5 + (Math.sin(angle) * 0.5) / squash,
    ] as GhostPoint;
  });
}

export const ROOM_GHOST_SHAPES: Record<RoomSlot, readonly GhostPoint[]> = {
  // a slab lying on the floor, along the room's isometric grid
  day1: [
    [0.5, 0],
    [1, 0.5],
    [0.5, 1],
    [0, 0.5],
  ],
  // an upright block: top face, two sides, seen in the same isometric
  day2: [
    [0.5, 0],
    [1, 0.22],
    [1, 0.78],
    [0.5, 1],
    [0, 0.78],
    [0, 0.22],
  ],
  // the same block, narrower
  day3: [
    [0.5, 0],
    [0.84, 0.2],
    [0.84, 0.8],
    [0.5, 1],
    [0.16, 0.8],
    [0.16, 0.2],
  ],
  // something standing in a pot — neck, shoulder, base
  day4: [
    [0.5, 0],
    [0.73, 0.26],
    [0.65, 0.6],
    [0.8, 1],
    [0.2, 1],
    [0.35, 0.6],
    [0.27, 0.26],
  ],
  // a pane hung flat against the angled back wall
  day5: [
    [0.12, 0.17],
    [0.88, 0],
    [0.88, 0.83],
    [0.12, 1],
  ],
  // an opening in the wall
  day6: ring(14),
  // a line strung between two points, sagging in the middle
  day7: [
    [0, 0],
    [0.5, 0.55],
    [1, 0],
    [1, 0.35],
    [0.5, 1],
    [0, 0.35],
  ],
};
