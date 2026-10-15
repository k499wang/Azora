import { memo, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';
import { VIEW_BOX_HEIGHT, VIEW_BOX_WIDTH } from './roomGeometry';
import { ROOM_GHOST_SHAPES } from './roomGhostShapes';
import { HOME_ROOM_BLEED } from './RoomLayer';
import { toHomeRoomPoint } from './roomLayers';
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
/** how long one breath of the pulse takes, when the slot is being offered */
const PULSE_MS = 1400;

interface Props {
  /** must match every other layer of the same room */
  width: number;
  /** the slot a new object goes into, or null once the room is full */
  slot: RoomSlot | null;
  /** breathe, for the beat where the room is asking to be filled */
  pulsing?: boolean;
}

function RoomGhostSlots({ width, slot, pulsing = false }: Props) {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!pulsing || reducedMotion) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: PULSE_MS / 2 }),
        withTiming(0, { duration: PULSE_MS / 2 }),
      ),
      -1,
      false,
    );

    return () => cancelAnimation(pulse);
  }, [pulse, pulsing, reducedMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + pulse.value * 0.4,
  }));
  const loops = useMemo(() => {
    if (slot == null) return [];
    const shapes = ROOM_GHOST_SHAPES[slot] ?? [];
    const xs = shapes.flat().map(([x]) => x);
    const ys = shapes.flat().map(([, y]) => y);
    const center = [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
    ] as const;

    return shapes.map((loop) =>
      loop
        .map(([x, y]) => toHomeRoomPoint(slot, x, y, center).join(','))
        .join(' '),
    );
  }, [slot]);

  const u = width / VIEW_BOX_WIDTH;

  if (loops.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, pulsing ? pulseStyle : null]}
      pointerEvents="none"
    >
    <Svg
      width={(VIEW_BOX_WIDTH + HOME_ROOM_BLEED * 2) * u}
      height={(VIEW_BOX_HEIGHT + HOME_ROOM_BLEED * 2) * u}
      viewBox={`${-VIEW_BOX_WIDTH / 2 - HOME_ROOM_BLEED} ${-VIEW_BOX_HEIGHT / 2 - HOME_ROOM_BLEED} ${VIEW_BOX_WIDTH + HOME_ROOM_BLEED * 2} ${VIEW_BOX_HEIGHT + HOME_ROOM_BLEED * 2}`}
      style={[styles.layer, { left: -HOME_ROOM_BLEED * u, top: -HOME_ROOM_BLEED * u }]}
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
    </Animated.View>
  );
}

export default memo(RoomGhostSlots);

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
  },
});
