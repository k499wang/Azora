import { padding } from '../../theme/spacing';
import { ROOM_ASPECT } from './roomGeometry';

/**
 * How wide the room is drawn, everywhere it is drawn full size.
 *
 * Home, the picker, the completion replay and the lab all showed it at
 * different widths, so the same room appeared to change size as you moved
 * between screens. One number, one formula, no drift.
 */
export const ROOM_MAX_WIDTH = 360;

/**
 * The chrome a room screen puts above and below the room, at its tallest.
 *
 * That tallest arrangement is the room-complete screen: a title and a note that
 * both wrap to two lines on a small phone, a footer button, and the scrolling
 * body's tail. Sizing the room from width alone let it stand 391pt tall on a
 * 667pt phone, which ran it straight under that chrome.
 *
 * This is only the first-paint estimate. `useRoomWidth` replaces it with the
 * measured space as soon as the layout has one, so this number just has to be
 * conservative enough that the first frame is never too big — never exact.
 */
const ROOM_SCREEN_CHROME = 364;

export function getRoomWidth(
  windowWidth: number,
  windowHeight: number,
): number {
  return Math.min(
    windowWidth - padding.screen.horizontal * 2,
    ROOM_MAX_WIDTH,
    (windowHeight - ROOM_SCREEN_CHROME) / ROOM_ASPECT,
  );
}
