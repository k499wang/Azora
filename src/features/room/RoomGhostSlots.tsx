import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { ROOM_ASPECT, VIEW_BOX } from './roomGeometry';
import { slotBounds } from './roomStage';
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
 * The shape is authored (`roomGhostShapes.ts`) rather than borrowed from the
 * decorations, which is what makes one clean stroke possible — see that file.
 * It is sized to the patch of room the slot owns, so it lands where the piece
 * will and moves with the art.
 */
const GHOST_FILL = colors.neutral[400];
const GHOST_OPACITY = 0.14;
const DOT_COLOR = colors.neutral[500];
const DOT_OPACITY = 0.45;
// viewBox units — the room is 348 x 402, so these read as fine dots on device.
const DOT_WIDTH = 2.5;
const DOT_DASH = '0.1 6';
// Shapes are drawn a little inside the patch, so the dots do not sit flush
// against the pieces already in the room.
const INSET = 0.06;

interface Props {
  /** must match every other layer of the same room */
  width: number;
  /** the slot a new object goes into, or null once the room is full */
  slot: RoomSlot | null;
}

function RoomGhostSlots({ width, slot }: Props) {
  const points = useMemo(() => {
    if (slot == null) {
      return null;
    }

    const box = slotBounds(slot);
    const shape = ROOM_GHOST_SHAPES[slot];
    if (box == null || shape == null) {
      return null;
    }

    const boxWidth = box.maxX - box.minX;
    const boxHeight = box.maxY - box.minY;

    return shape
      .map(([x, y]) => {
        const inset = (value: number) => INSET + value * (1 - INSET * 2);
        return `${box.minX + inset(x) * boxWidth},${
          box.minY + inset(y) * boxHeight
        }`;
      })
      .join(' ');
  }, [slot]);

  if (points == null) {
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
      <Polygon
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
    </Svg>
  );
}

export default memo(RoomGhostSlots);
