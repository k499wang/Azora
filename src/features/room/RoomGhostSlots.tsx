import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { G, Polygon } from 'react-native-svg';
import { ROOM_ASPECT, VIEW_BOX } from './roomGeometry';
import { DAYS, DECOR, type DayKey } from './RoomScene';
import { colors } from '../../theme/colors';
import type { RoomSlot } from '../../lib/room/roomProgress';

/**
 * The gap the next piece fills, standing in the room.
 *
 * Only the next one. Slots are filled in order and never skipped, so drawing
 * every empty slot both clutters the room and offers six affordances that do
 * not exist — it reads as a checklist rather than a place with a hole in it.
 *
 * The slot's first option stands in for it, flattened to one silhouette: the
 * shape says *something goes here* without promising the particular piece the
 * user will end up choosing.
 */
const GHOST_FILL = colors.neutral[400];
const GHOST_OPACITY = 0.14;

/** the stand-in shape for an empty slot, without the shadow it would cast */
function ghostPolys(slot: DayKey) {
  const option = DAYS.find((day) => day.key === slot)?.options[0]?.id;
  if (option == null) {
    return [];
  }

  return (DECOR[`${slot}.${option}`] ?? []).filter((poly) => poly.sh !== 1);
}

interface Props {
  /** must match every other layer of the same room */
  width: number;
  /** the slot a new object goes into, or null once the room is full */
  slot: RoomSlot | null;
}

function RoomGhostSlots({ width, slot }: Props) {
  const polys = useMemo(
    () => (slot == null ? [] : ghostPolys(slot)),
    [slot],
  );

  if (polys.length === 0) {
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
      {/* Grouped so overlapping polys composite once — per-poly opacity would
          darken every seam inside the shape. */}
      <G opacity={GHOST_OPACITY}>
        {polys.map((poly, index) => (
          <Polygon
            key={index}
            points={poly.p}
            fill={GHOST_FILL}
            stroke="none"
            strokeLinejoin="round"
          />
        ))}
      </G>
    </Svg>
  );
}

export default memo(RoomGhostSlots);
