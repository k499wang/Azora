import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import RoomAzo from './RoomAzo';
import { firstRoom, nextRoom } from './hotelWander';
import { HEX_W, slotAt } from './pyramidLayout';
import { ROOM_ASPECT } from './roomGeometry';
import { duration, easing } from '../../theme/motion';
import { useWhileVisible } from '../../hooks/useWhileVisible';

/**
 * The hotel's resident, moved from room to room over the pyramid.
 *
 * There is one Azo and he is somewhere in the hotel — standing in whichever
 * room he is in, and every so often hopping the wall into the room next door.
 * That is the whole of the illusion: a hotel with somebody living in it rather
 * than a hotel with a mascot pinned to it.
 *
 * He rides over the canvas on the same shared values the canvas is transformed
 * by, the way the next-room caption does, so panning and pinching carry him with
 * the room he is standing in without a re-render. Which room he is in is a ref
 * and a pair of shared values, never state: Azo moving house should cost the
 * pyramid nothing.
 *
 * Being an overlay, he is painted over the room rather than into it — the
 * layering `HomeRoom` does cannot work above a flattened canvas. He stands dead
 * centre, the part of the floor no decoration can reach, so he stays out from
 * behind the furniture rather than in front of it.
 */

/** how long it takes to cross a wall, and how far it rises doing it */
const TRAVEL_MS = duration.fill;
const HOP_UNITS = 46;

/** how long it stays in a room before moving on */
const STAY_MIN_MS = 6000;
const STAY_VARY_MS = 9000;

/**
 * How wide a room has to be on screen, in points, before its resident is worth
 * drawing. Stood further back than this Azo is a few pixels of wobble, and
 * reads as a dirty screen rather than as somebody home.
 */
const MIN_SLOT = 110;
const FADE_MS = duration.base;

interface Props {
  /** how many rooms the hotel has; Azo keeps to those */
  rooms: number;
  /** one room's width in points at `drawnAt`, walls included */
  width: number;
  /** the scale Azo is laid out for — the canvas's own maximum */
  drawnAt: number;
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
}

export default function HotelAzo({
  rooms,
  width,
  drawnAt,
  scale,
  translateX,
  translateY,
}: Props) {
  const reducedMotion = useReducedMotion();

  const at = useRef(firstRoom(rooms));
  const from = useRef<number | null>(null);
  const homed = useRef(false);

  const start = slotAt(at.current);
  const roomX = useSharedValue(start.x);
  const roomY = useSharedValue(start.y);
  const hop = useSharedValue(0);

  const travel = useCallback(
    (room: number) => {
      const slot = slotAt(room);
      const timing = { duration: TRAVEL_MS, easing: easing.settle };

      roomX.value = withTiming(slot.x, timing);
      roomY.value = withTiming(slot.y, timing);
      // Up over the wall and down the other side, rather than through it.
      hop.value = withSequence(
        withTiming(-HOP_UNITS, {
          duration: TRAVEL_MS / 2,
          easing: easing.burst,
        }),
        withTiming(0, { duration: TRAVEL_MS / 2, easing: easing.gravity }),
      );
    },
    [hop, roomX, roomY],
  );

  // The hotel he woke up in is not always the hotel he ends up in: the rooms
  // arrive from a query, and the dev override swaps them wholesale. Either way
  // Azo is put back in the room being filled, with no hop between — there was
  // no wall to cross between two different hotels.
  useEffect(() => {
    if (rooms === 0) return;
    if (homed.current && at.current < rooms) return;

    homed.current = true;
    at.current = firstRoom(rooms);
    from.current = null;

    const slot = slotAt(at.current);
    roomX.value = slot.x;
    roomY.value = slot.y;
  }, [rooms, roomX, roomY]);

  // Gated on the hotel actually being looked at: the wander is a timer driving
  // an animation, and both would otherwise carry on over whatever screen
  // replaced it — the same reason the canvas throws its texture away on blur.
  useWhileVisible(() => {
    if (reducedMotion || rooms < 2) return () => {};

    let timer: ReturnType<typeof setTimeout>;

    const rest = () => {
      timer = setTimeout(move, STAY_MIN_MS + Math.random() * STAY_VARY_MS);
    };

    const move = () => {
      const next = nextRoom(at.current, from.current, rooms, Math.random());

      if (next != null) {
        from.current = at.current;
        at.current = next;
        travel(next);
      }

      rest();
    };

    rest();

    return () => clearTimeout(timer);
  }, [rooms, reducedMotion, travel]);

  const style = useAnimatedStyle(() => ({
    opacity: withTiming(HEX_W * scale.value >= MIN_SLOT ? 1 : 0, {
      duration: FADE_MS,
    }),
    transform: [
      { translateX: translateX.value + roomX.value * scale.value },
      { translateY: translateY.value + (roomY.value + hop.value) * scale.value },
      { scale: scale.value / drawnAt },
    ],
  }));

  // Anchored at the canvas origin and centred on its slot by the margins, so
  // the transform is all that places him. Laid out at the canvas's largest
  // scale and only ever scaled down from there: a sprite scaled up past its
  // layout is resampled, and its edges soften the way the flattened texture's
  // do.
  const box = useMemo(
    () => ({
      width,
      height: width * ROOM_ASPECT,
      marginLeft: -width / 2,
      marginTop: (-width * ROOM_ASPECT) / 2,
    }),
    [width],
  );

  return (
    <Animated.View style={[styles.azo, box, style]} pointerEvents="none">
      <RoomAzo width={width} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  azo: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
