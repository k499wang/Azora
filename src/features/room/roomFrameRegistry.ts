import type { Poly } from './RoomScene';

/**
 * Which frame belongs to which shell.
 *
 * The pair is kept here rather than in either file that owns half of it: the
 * shells import the frame builder from `RoomScene`, so `RoomScene` cannot ask
 * the shells which frame to draw without the two importing each other. A
 * registry holding only types depends on neither, and the shells fill it in as
 * they are built.
 *
 * Keyed on the artwork itself because that is what callers pass around — a room
 * is handed to a screen as polygons, not as a shell name.
 */
const frames = new WeakMap<Poly[], Poly[]>();

export function registerRoomFrame(shell: Poly[], frame: Poly[]): void {
  frames.set(shell, frame);
}

/** the shell's own frame, or `fallback` for artwork that never registered one */
export function roomFrameFor(shell: Poly[], fallback: Poly[]): Poly[] {
  return frames.get(shell) ?? fallback;
}
