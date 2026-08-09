import { padding } from '../../theme/spacing';

/**
 * How wide the room is drawn, everywhere it is drawn full size.
 *
 * Home, the picker, the completion replay and the lab all showed it at
 * different widths, so the same room appeared to change size as you moved
 * between screens. One number, one formula, no drift.
 */
export const ROOM_MAX_WIDTH = 360;

export function getRoomWidth(windowWidth: number): number {
  return Math.min(windowWidth - padding.screen.horizontal * 2, ROOM_MAX_WIDTH);
}
