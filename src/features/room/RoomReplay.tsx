import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  DAYS,
  HexRoom,
  PAINT_ORDER,
  ROOM_ASPECT,
  type DayKey,
  type FrameHue,
  type Picks,
  type Poly,
} from './RoomScene';
import DecorationLayer, { FLOOR_CENTER_Y, decorationFootprint, frameAccent } from './roomStage';
import { BurstStar, LoopingTwinkle } from '../../components/common/RewardSparkles';
import { useCompletionSound } from '../../hooks/useCompletionSound';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { colors } from '../../theme/colors';
import { duration, easing, spring, stagger } from '../../theme/motion';

const START_MS = duration.base;
const STAGGER_MS = stagger.loose;
/** a piece's fall, mount to contact */
const PIECE_MS = 280;
/** the squash ringing out and the piece's sparks landing */
const SETTLE_MS = 520;
const BLOOM_MS = 720;
const TAIL_MS = duration.slow;
const SPIN_MS = 24000;

const RAY_COUNT = 14;
const RAYS = Array.from({ length: RAY_COUNT }, (_, i) => {
  const step = 360 / RAY_COUNT;
  const spread = i % 2 === 0 ? 9 : 6;
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${50 + 50 * Math.sin(rad)} ${50 - 50 * Math.cos(rad)}`;
  };
  return `M50 50L${point(i * step - spread / 2)}L${point(i * step + spread / 2)}Z`;
});

const PIECE_SPARKS = [
  { angle: -145, size: 10, travel: 0.11 },
  { angle: -90, size: 12, travel: 0.13 },
  { angle: -35, size: 10, travel: 0.11 },
];
const FINALE_SPARKS = [-170, -145, -120, -100, -80, -60, -35, -10, 15, 165].map((angle, i) => ({
  angle,
  size: i % 3 === 0 ? 20 : i % 3 === 1 ? 14 : 11,
  travel: 0.36 + (i % 4) * 0.05,
}));
/** around the room's edge, as fractions of its box */
const AMBIENT_TWINKLES = [
  { x: 0.06, y: 0.2, size: 16, period: 1300 },
  { x: 0.93, y: 0.14, size: 13, period: 1100 },
  { x: 0.98, y: 0.56, size: 10, period: 1500 },
  { x: 0.03, y: 0.62, size: 11, period: 1200 },
  { x: 0.86, y: 0.94, size: 14, period: 1400 },
  { x: 0.16, y: 0.96, size: 9, period: 1000 },
  { x: 0.52, y: -0.02, size: 12, period: 1600 },
];

interface RoomReplayProps {
  width: number;
  /** the finished room */
  picks: Picks;
  frameHue: FrameHue;
  shell: Poly[];
  /** onboarding shows the moment without its sound */
  muted?: boolean;
  onDone?: () => void;
}

/**
 * The week, replayed.
 *
 * A finished room shown as a still photograph is the flattest possible ending
 * to seven days of work, so it rebuilds itself instead — each piece dropping
 * in the order it was painted with its own squash, sparks, note and haptic
 * tick, then light breaking out behind the room when the last one settles and
 * stars that stay twinkling around it.
 */
export default function RoomReplay({
  width,
  picks,
  frameHue,
  shell,
  muted = false,
  onDone,
}: RoomReplayProps) {
  const height = width * ROOM_ASPECT;
  const accent = frameAccent(frameHue);
  // Painted back to front, revealed first to last. The two orders are not the
  // same and both matter: a piece drawn out of turn sits in front of something
  // it should be behind, and a week replayed out of turn does not resolve on
  // the piece that finished it. Slots fill in order, so the day number is the
  // order they were earned in.
  const order = PAINT_ORDER.filter((day) => picks[day] != null);
  const earned = DAYS.map(({ key }) => key).filter((day) => picks[day] != null);
  const landsAt = START_MS + Math.max(0, order.length - 1) * STAGGER_MS + PIECE_MS;
  // The cue is one take scored to a full week's landings; a partial room
  // would land out of time with it.
  const fullWeek = order.length === DAYS.length;

  const bloom = useSharedValue(0);
  const pop = useSharedValue(0);
  const rays = useSharedValue(0);
  const spin = useSharedValue(0);

  const playReplaySound = useCompletionSound('roomComplete', { active: fullWeek && !muted });
  const playReplaySoundRef = useRef(playReplaySound);
  playReplaySoundRef.current = playReplaySound;

  useEffect(() => {
    bloom.value = withDelay(
      landsAt,
      withTiming(1, { duration: BLOOM_MS, easing: easing.burst }),
    );

    pop.value = withDelay(
      landsAt,
      withSequence(
        withTiming(1, { duration: 120 }),
        withSpring(0, spring.pop),
      ),
    );

    rays.value = withDelay(
      landsAt,
      withTiming(1, { duration: duration.slower, easing: easing.settle }),
    );
    spin.value = withDelay(
      landsAt,
      withRepeat(withTiming(1, { duration: SPIN_MS, easing: Easing.linear }), -1),
    );

    const cancelTimers = [
      startUiTimer(START_MS + PIECE_MS, () => {
        if (fullWeek) playReplaySoundRef.current();
      }),
      startUiTimer(landsAt, () => {
        if (isHapticsEnabled()) {
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
        }
      }),
    ];

    if (onDone != null) {
      cancelTimers.push(startUiTimer(landsAt + TAIL_MS, onDone));
    }

    return () => {
      cancelAnimation(bloom);
      cancelAnimation(pop);
      cancelTimers.forEach((cancel) => cancel());
      cancelAnimation(rays);
      cancelAnimation(spin);
    };
    // Plays once for the room it mounted with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pop.value * 0.025 }],
  }));

  const raysStyle = useAnimatedStyle(() => ({
    opacity: rays.value * 0.85,
    transform: [
      { scale: interpolate(rays.value, [0, 1], [0.4, 1]) },
      { rotate: `${spin.value * 360}deg` },
    ],
  }));

  const bloomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(bloom.value, [0, 0.2, 1], [0, 0.5, 0]),
    transform: [{ scale: interpolate(bloom.value, [0, 1], [0.4, 1.5]) }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(bloom.value, [0, 0.15, 1], [0, 0.55, 0]),
    transform: [{ scale: interpolate(bloom.value, [0, 1], [0.35, 1.7]) }],
  }));

  const raysSize = width * 1.55;
  const bloomSize = width * 0.78;
  const ringSize = width * 0.52;
  const sparkColors = [colors.reward.gold, accent.base, colors.playful.amber.soft];

  return (
    <Animated.View style={[{ width, height }, stageStyle]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.absolute,
          {
            width: raysSize,
            height: raysSize,
            left: width / 2 - raysSize / 2,
            top: height / 2 - raysSize / 2,
          },
          raysStyle,
        ]}
      >
        <Svg width={raysSize} height={raysSize} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="replayRays" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
              <Stop offset="0.3" stopColor={colors.playful.amber.soft} stopOpacity={0.7} />
              <Stop offset="0.65" stopColor={colors.playful.amber.tint} stopOpacity={0.25} />
              <Stop offset="1" stopColor={colors.playful.amber.tint} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          {RAYS.map((d) => <Path key={d} d={d} fill="url(#replayRays)" />)}
        </Svg>
      </Animated.View>

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

      {order.map((day) => (
        <Piece
          key={day}
          width={width}
          day={day}
          option={picks[day] as string}
          sparkColors={sparkColors}
          delayMs={START_MS + earned.indexOf(day) * STAGGER_MS}
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

      {FINALE_SPARKS.map((spark, i) => (
        <BurstStar
          key={spark.angle}
          angle={spark.angle}
          burst={bloom}
          color={sparkColors[i % sparkColors.length]}
          distance={width * spark.travel}
          size={spark.size}
          x={width / 2}
          y={height * 0.55}
        />
      ))}

      {AMBIENT_TWINKLES.map((twinkle, i) => (
        <LoopingTwinkle
          key={i}
          x={twinkle.x * width}
          y={twinkle.y * height}
          size={twinkle.size}
          color={sparkColors[i % sparkColors.length]}
          delay={landsAt + duration.base + i * stagger.base}
          period={twinkle.period}
          active
        />
      ))}
    </Animated.View>
  );
}

function Piece({
  width,
  day,
  option,
  sparkColors,
  delayMs,
}: {
  width: number;
  day: DayKey;
  option: string;
  sparkColors: string[];
  delayMs: number;
}) {
  const height = width * ROOM_ASPECT;
  const footprint = decorationFootprint(day, option, width);
  const contact = footprint?.contact ?? { x: width / 2, y: height * FLOOR_CENTER_Y };
  const sparkFrom = footprint == null ? contact.y : contact.y - (contact.y - footprint.top) * 0.4;
  const enter = useSharedValue(0);
  const [visible, setVisible] = useState(false);
  const landAt = PIECE_MS / (PIECE_MS + SETTLE_MS);
  const sparks = useDerivedValue(() => interpolate(enter.value, [landAt, 1], [0, 1], 'clamp'));

  useEffect(() => {
    // Each piece owns its reveal so mounting one SVG does not rerender the
    // room or any artwork that has already landed.
    const showTimer = setTimeout(() => setVisible(true), delayMs);
    const hapticTimer = setTimeout(() => {
      if (isHapticsEnabled()) {
        Haptics.selectionAsync().catch(() => {});
      }
    }, delayMs + PIECE_MS);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hapticTimer);
    };
  }, [delayMs]);

  useEffect(() => {
    if (!visible) return;

    // One linear clock for the whole piece; the fall, the squash and the
    // sparks are read off it, so one cancel stops all of them.
    enter.value = 0;
    enter.value = withTiming(1, {
      duration: PIECE_MS + SETTLE_MS,
      easing: Easing.linear,
    });

    return () => cancelAnimation(enter);
  }, [enter, visible]);

  const objectStyle = useAnimatedStyle(() => {
    const ms = enter.value * (PIECE_MS + SETTLE_MS);
    const fallT = Math.min(ms / PIECE_MS, 1);
    const fall = fallT * fallT * fallT;
    const since = ms - PIECE_MS;
    // Stretched along the fall, then a squash that rings out on contact.
    const stretch = since < 0 ? Math.sin(Math.PI * fallT) : 0;
    const squash = since < 0 ? 0 : Math.exp(-since / 110) * Math.cos((since / 1000) * 2 * Math.PI * 5);

    return {
      opacity: Math.min(fallT / 0.3, 1),
      transform: [
        { translateY: (1 - fall) * -height * 0.09 },
        { scaleX: 1 - stretch * 0.06 + squash * 0.12 },
        { scaleY: 1 + stretch * 0.08 - squash * 0.14 },
      ],
    };
  });

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sparks.value, [0, 0.3], [0, 1], 'clamp'),
  }));

  if (!visible) return null;

  // Rasterising turns the entrance into a texture move instead of a
  // re-composite of every polygon on every frame. The contact shadow stays on
  // the surface and arrives with the landing; carried through the air it reads
  // as a mark sliding across the picture.
  return (
    <View pointerEvents="none" style={styles.fill}>
      <Animated.View
        shouldRasterizeIOS
        renderToHardwareTextureAndroid
        style={[styles.fill, shadowStyle]}
      >
        <DecorationLayer width={width} day={day} option={option} part="shadow" />
      </Animated.View>
      <Animated.View
        shouldRasterizeIOS
        renderToHardwareTextureAndroid
        style={[styles.fill, { transformOrigin: [contact.x, contact.y, 0] }, objectStyle]}
      >
        <DecorationLayer width={width} day={day} option={option} part="object" />
      </Animated.View>
      {PIECE_SPARKS.map((spark, i) => (
        <BurstStar
          key={spark.angle}
          angle={spark.angle}
          burst={sparks}
          color={sparkColors[i % sparkColors.length]}
          distance={width * spark.travel}
          size={spark.size}
          x={contact.x}
          y={sparkFrom}
        />
      ))}
    </View>
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
