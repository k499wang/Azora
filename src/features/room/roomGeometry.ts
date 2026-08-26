/** viewBox of the room space: x -168..168, y -194..194 */
export const VIEW_BOX = '-168 -194 336 388';
export const VIEW_BOX_WIDTH = 336;
export const VIEW_BOX_HEIGHT = 388;

/**
 * The scene is taller than it is wide. Callers give a width and the height
 * follows, so the svg box matches the artwork and nothing is letterboxed —
 * rendering into a square leaves ~13% dead width and reads as off-centre.
 */
export const ROOM_ASPECT = VIEW_BOX_HEIGHT / VIEW_BOX_WIDTH;
