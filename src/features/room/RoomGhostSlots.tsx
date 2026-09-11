import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { ROOM_ASPECT, VIEW_BOX } from './roomGeometry';
import { ROOM_GHOST_SHAPES } from './roomGhostShapes';
import { colors } from '../../theme/colors';
import type { RoomSlot } from '../../lib/room/roomProgress';

/**
 * The gap the next piece fills, standing in the room.
 *
 * Only the next one. Slots are filled in order and never skipped, so drawing
 * every empty slot both clutters the room and offers six affordances that do
 * not exist — it reads as a checklist rather than a place with a hole in it.
 *
 * A pale wash inside a dotted contour: the fill alone reads as a badly drawn
 * piece of furniture rather than an absent one, and the dots are what say
 * *empty*, since nothing else in the room is drawn with them.
 *
 * The outline is a real piece traced offline into closed loops
 * (`roomGhostShapes.ts`), which is what keeps the dots clean — stroking the art
 * itself would dot every seam between its overlapping polygons. Most slots are
 * one loop; a garland is two, one per wall.
 */
const GHOST_FILL = colors.neutral[400];
const GHOST_OPACITY = 0.14;
const DOT_COLOR = colors.neutral[500];
const DOT_OPACITY = 0.45;
// viewBox units — the room is 348 x 402, so these read as fine dots on device.
const DOT_WIDTH = 2.5;
const DOT_DASH = '0.1 6';

interface Props {
  /** must match every other layer of the same room */
  width: number;
  /** the slot a new object goes into, or null once the room is full */
  slot: RoomSlot | null;
}

function RoomGhostSlots({ width, slot }: Props) {
  const loops = useMemo(
    () =>
      (slot == null ? [] : (ROOM_GHOST_SHAPES[slot] ?? [])).map((loop) =>
        loop.map(([x, y]) => `${x},${y}`).join(' '),
      ),
    [slot],
  );

  if (loops.length === 0) {
    return null;
  }

  return (
    <Svg
      width={width}
      height={width * ROOM_ASPECT}
      viewBox={VIEW_BOX}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {loops.map((points, index) => (
        <Polygon
          key={index}
          points={points}
          fill={GHOST_FILL}
          fillOpacity={GHOST_OPACITY}
          stroke={DOT_COLOR}
          strokeOpacity={DOT_OPACITY}
          strokeWidth={DOT_WIDTH}
          strokeDasharray={DOT_DASH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}

export default memo(RoomGhostSlots);
