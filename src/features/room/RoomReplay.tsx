import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  HexRoom,
  PAINT_ORDER,
  ROOM_ASPECT,
  type DayKey,
  type FrameHue,
  type Picks,
  type Poly,
} from './RoomScene';
import DecorationLayer, { FLOOR_CENTER_Y, frameAccent } from './roomStage';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';

const START_MS = 260;
const STAGGER_MS = 115;
const PIECE_MS = 320;
const BLOOM_MS = 720;
const TAIL_MS = 420;

interface RoomReplayProps {
  width: number;
  /** the finished room */
  picks: Picks;
  frameHue: FrameHue;
  shell: Poly[];
  onDone?: () => void;
}

/**
 * The week, replayed.
 *
 * A finished room shown as a still photograph is the flattest possible ending
 * to seven days of work, so it rebuilds itself instead — each piece landing in
 * the order it was painted, one soft haptic tick apiece, and a single bloom when
 * the last one settles.
 */
export default function RoomReplay({
  width,
  picks,
  frameHue,
  shell,
  onDone,
}: RoomReplayProps) {
  const height = width * ROOM_ASPECT;
  const accent = frameAccent(frameHue);
  const order = PAINT_ORDER.filter((day) => picks[day] != null);
  const landsAt = START_MS + Math.max(0, order.length - 1) * STAGGER_MS + PIECE_MS;

  const bloom = useSharedValue(0);
  const pop = useSharedValue(0);

  useEffect(() => {
    bloom.value = withDelay(
      landsAt,
      withTiming(1, { duration: BLOOM_MS, easing: Easing.out(Easing.quad) }),
    );

    pop.value = withDelay(
      landsAt,
      withSequence(
        withTiming(1, { duration: 120 }),
        withSpring(0, { damping: 9, stiffness: 150 }),
      ),
    );

    const timers = order.map((_, index) =>
      setTimeout(() => {
        if (isHapticsEnabled()) {
          Haptics.selectionAsync().catch(() => {});
        }
      }, START_MS + index * STAGGER_MS + PIECE_MS * 0.7),
    );

    timers.push(
      setTimeout(() => {
        if (isHapticsEnabled()) {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
        }
      }, landsAt),
    );

    if (onDone != null) {
      timers.push(setTimeout(onDone, landsAt + TAIL_MS));
    }

    return () => timers.forEach(clearTimeout);
    // Plays once for the room it mounted with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pop.value * 0.025 }],
  }));

  const bloomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(bloom.value, [0, 0.2, 1], [0, 0.5, 0]),
    transform: [{ scale: interpolate(bloom.value, [0, 1], [0.4, 1.5]) }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(bloom.value, [0, 0.15, 1], [0, 0.55, 0]),
    transform: [{ scale: interpolate(bloom.value, [0, 1], [0.35, 1.7]) }],
  }));

  const bloomSize = width * 0.78;
  const ringSize = width * 0.52;

  return (
    <Animated.View style={[{ width, height }, stageStyle]}>
      <HexRoom width={width} picks={{}} frameHue={frameHue} shell={shell} />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.absolute,
          {
            width: bloomSize,
            height: bloomSize,
            borderRadius: bloomSize / 2,
            backgroundColor: accent.soft,
            left: width / 2 - bloomSize / 2,
            top: height * FLOOR_CENTER_Y - bloomSize / 2,
          },
          bloomStyle,
        ]}
      />

      {order.map((day, index) => (
        <Piece
          key={day}
          width={width}
          day={day}
          option={picks[day] as string}
          delay={START_MS + index * STAGGER_MS}
        />
      ))}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.absolute,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderWidth: 3,
            borderColor: accent.base,
            left: width / 2 - ringSize / 2,
            top: height * FLOOR_CENTER_Y - ringSize / 2,
          },
          ringStyle,
        ]}
      />
    </Animated.View>
  );
}

function Piece({
  width,
  day,
  option,
  delay,
}: {
  width: number;
  day: DayKey;
  option: string;
  delay: number;
}) {
  const enter = useSharedValue(0);

  useEffect(() => {
    enter.value = withDelay(
      delay,
      withTiming(1, { duration: PIECE_MS, easing: Easing.out(Easing.back(1.6)) }),
    );
  }, [delay, enter]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0, 0.35], [0, 1], 'clamp'),
    transform: [
      { translateY: interpolate(enter.value, [0, 1], [-22, 0]) },
      { scale: interpolate(enter.value, [0, 1], [0.82, 1]) },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.fill, style]}>
      <DecorationLayer width={width} day={day} option={option} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});
