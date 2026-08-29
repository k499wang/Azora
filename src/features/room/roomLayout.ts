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

interface RoomWidthLimits {
  /** the widest the room may be drawn, whatever the screen allows */
  maxWidth?: number;
  /** the margin left either side of it */
  gutter?: number;
}

/**
 * The one width formula: the room fits its gutters, its cap, and the vertical
 * space the caller has decided it may take.
 *
 * Callers differ only in `heightBudget`, and they differ for a real reason. A
 * screen whose room must fit between fixed chrome subtracts that chrome; a
 * scrolling screen that only wants a consistent inset omits it entirely.
 * Keeping that decision at the call site is the whole point — this function
 * must never learn which screen it serves.
 *
 * Omit `heightBudget` when nothing below the room has to share the fold with
 * it, and the gutters and the cap decide the size on their own.
 */
export function roomWidthWithin(
  windowWidth: number,
  heightBudget: number = Infinity,
  { maxWidth = ROOM_MAX_WIDTH, gutter = padding.screen.horizontal }: RoomWidthLimits = {},
): number {
  return Math.min(
    windowWidth - gutter * 2,
    maxWidth,
    heightBudget / ROOM_ASPECT,
  );
}

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
  return roomWidthWithin(windowWidth, windowHeight - ROOM_SCREEN_CHROME);
}

/**
 * How wide Home draws its room: the screen, less one screen margin either side.
 *
 * Home is the one place the room answers to width alone. It scrolls, so nothing
 * below it has to survive the fold, and it is the screen you open on — so the
 * room reads as the page's own width rather than as an object floating in it.
 * The inset is `padding.screen.horizontal`, the same margin the progress card
 * and the dailies below it use, so all three share one edge.
 *
 * A height rule here only ever took size away. Sharing `getRoomWidth` made Home
 * pay the room-complete screen's worst-case chrome — 107pt of room lost on a
 * 568pt phone for chrome Home does not have — and even a height share of its
 * own shrank the short phones that could least afford it. Home's chrome is a
 * 58pt bar and a 16pt margin; past that the phone's width is the only real
 * constraint, and the cap keeps a tablet from drawing a 708pt room.
 */
export function getHomeRoomWidth(windowWidth: number): number {
  return roomWidthWithin(windowWidth);
}
