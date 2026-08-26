import { createContext, useContext, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { ROOM_ASPECT } from './roomGeometry';
import { getRoomWidth } from './roomLayout';

/**
 * The height a room screen actually has left for its room, measured.
 *
 * `getRoomWidth` can only guess at the chrome above and below, and the guess
 * has to hold for a title that wraps to two lines on one phone and one on the
 * next. Measuring the header and the tray removes the guess: the layout knows
 * exactly what it has spent, so the room can take the rest and never run under
 * anything.
 *
 * `null` until the first layout pass. Until then callers fall back to
 * `getRoomWidth`, which is deliberately conservative so the first paint is
 * already small enough and the measured value only ever refines it.
 */
const RoomStageBox = createContext<number | null>(null);

export function RoomStageBoxProvider({
  height,
  children,
}: {
  height: number | null;
  children: ReactNode;
}) {
  return <RoomStageBox.Provider value={height}>{children}</RoomStageBox.Provider>;
}

/** How wide to draw the room on a room screen. */
export function useRoomWidth(): number {
  const { width, height } = useWindowDimensions();
  const measured = useContext(RoomStageBox);
  const byWidth = getRoomWidth(width, height);
  if (measured == null || measured <= 0) return byWidth;
  return Math.min(byWidth, measured / ROOM_ASPECT);
}
