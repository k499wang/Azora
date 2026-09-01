/**
 * viewBox of the room space: x -174..174, y -201..201.
 *
 * Wider than the artwork needs, because the frame is no longer a line on the
 * hexagon — it is the walls' own thickness, standing outside it. The ratio is
 * held to the box it replaced (336x388) to a hundredth, so every caller that
 * sizes a room by width gets the same height it always did.
 */
export const VIEW_BOX = '-174 -201 348 402';
export const VIEW_BOX_WIDTH = 348;
export const VIEW_BOX_HEIGHT = 402;

/**
 * The scene is taller than it is wide. Callers give a width and the height
 * follows, so the svg box matches the artwork and nothing is letterboxed —
 * rendering into a square leaves ~13% dead width and reads as off-centre.
 */
export const ROOM_ASPECT = VIEW_BOX_HEIGHT / VIEW_BOX_WIDTH;

/**
 * The floor plane, in viewBox units. A point on it is `(a, b)` — both 0..1,
 * `a` running toward the right wall and `b` toward the left — drawn at
 * `x = FLOOR_HALF_W * (a - b)`, `y = FLOOR_HALF_D * (a + b)`. Everything that
 * stands on the floor measures in this basis: the shells that draw it and the
 * blob that walks on it.
 */
export const FLOOR_HALF_W = 155.9;
export const FLOOR_HALF_D = 90;
