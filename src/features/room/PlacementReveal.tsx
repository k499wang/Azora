import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  DECOR,
  HexRoom,
  ROOM_ASPECT,
  type DayKey,
  type FrameHue,
  type Picks,
  type Poly,
} from './RoomScene';
import DecorationLayer, {
  decorationPolys,
  frameAccent,
  polyBounds,
  roomPointToFraction,
} from './roomStage';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { duration, easing, spring } from '../../theme/motion';

// Beats of the reveal, in ms from mount. The object falls under gravity easing
// and lands on an exact frame, so everything that reacts to the landing — the
// squash, the burst, the room's recoil, the haptic — can be scheduled against
// one number instead of chasing a spring's settle.
const FALL_START_MS = 140;
const FALL_MS = 260;
const LAND_MS = FALL_START_MS + FALL_MS;
const BURST_MS = duration.slower;
const DONE_MS = LAND_MS + BURST_MS + 380;

const SPARKLE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const SPARKLE_SIZE = 8;
const SPARKLE_TRAVEL = 0.34;

interface PlacementRevealProps {
  width: number;
  day: DayKey;
  option: string;
  /** the room as it stands, *without* the piece being placed */
  picks: Picks;
  frameHue: FrameHue;
  shell: Poly[];
  onDone: () => void;
}

/**
 * The moment the piece arrives.
 *
 * The new object is drawn in its own `Svg` layered over the room rather than
 * inside it. Both share `VIEW_BOX` and a width, so the overlay registers on the
 * room exactly — which means the object can be transformed freely without
 * touching the generated scene or re-rendering the room every frame.
 */
export default function PlacementReveal({
  width,
  day,
  option,
  picks,
  frameHue,
  shell,
  onDone,
}: PlacementRevealProps) {
  const height = width * ROOM_ASPECT;
  const accent = frameAccent(frameHue);
  const polys = DECOR[`${day}.${option}`];

  /**
   * Where this piece meets its surface, in pixels of the rendered room.
   *
   * The bottom edge of the object's own artwork, centred — the point a
   * standing piece rests on and a hung piece hangs above. Everything about the
   * landing is measured from here: the squash flattens onto it, and the burst
   * comes out of it. Taken from the floor's centre instead, five of the seven
   * slots squashed toward a point they are nowhere near and burst from a place
   * nothing had happened.
   */
  const objectBox = polyBounds(decorationPolys(day, option, 'object'));
  const contact = (() => {
    if (objectBox == null) return { x: width / 2, y: height * 0.732 };

    const point = roomPointToFraction(
      (objectBox.minX + objectBox.maxX) / 2,
      objectBox.maxY,
    );
    return { x: point.x * width, y: point.y * height };
  })();

  /**
   * The arriving piece is drawn without the contact shadow authored alongside
   * it. The shadow is fixed to the surface it belongs to, so it can only ever
   * be wrong while the object is in the air: travelling with the piece it reads
   * as sliding across the picture, and standing still it is a mark on the floor
   * with nothing above it. It comes back with the room once the piece is down.
   */

  const fall = useSharedValue(0);
  const squash = useSharedValue(0);
  const kick = useSharedValue(0);
  const burst = useSharedValue(0);

  useEffect(() => {
    if (polys == null) {
      onDone();
      return;
    }

    fall.value = withDelay(
      FALL_START_MS,
      withTiming(1, { duration: FALL_MS, easing: easing.gravity }),
    );

    // Squash on contact, then spring back out — the bounce belongs after the
    // landing, not during the fall, or the object reads as floating down.
    squash.value = withDelay(
      LAND_MS,
      withSequence(
        withTiming(1, { duration: 90 }),
        withSpring(0, spring.bounce),
      ),
    );

    kick.value = withDelay(
      LAND_MS,
      withSequence(
        withTiming(1, { duration: 90 }),
        withSpring(0, spring.pop),
      ),
    );

    burst.value = withDelay(
      LAND_MS,
      withTiming(1, { duration: BURST_MS, easing: easing.burst }),
    );

    const timers = [
      setTimeout(() => {
        if (isHapticsEnabled()) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
            () => {},
          );
        }
      }, LAND_MS),
      setTimeout(onDone, DONE_MS),
    ];

    return () => {
      cancelAnimation(fall);
      cancelAnimation(squash);
      cancelAnimation(kick);
      cancelAnimation(burst);
      timers.forEach(clearTimeout);
    };
    // Runs once for the piece it was mounted with; the screen remounts this
    // component per placement rather than reusing it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - kick.value * 0.018 }],
  }));

  const objectStyle = useAnimatedStyle(() => {
    const drop = interpolate(fall.value, [0, 1], [-height * 0.16, 0]);
    const grow = interpolate(fall.value, [0, 1], [0.86, 1]);

    return {
      opacity: interpolate(fall.value, [0, 0.3], [0, 1], 'clamp'),
      transform: [
        { translateY: drop },
        { rotate: `${interpolate(fall.value, [0, 1], [-12, 0])}deg` },
        { scaleX: grow * (1 + squash.value * 0.14) },
        { scaleY: grow * (1 - squash.value * 0.16) },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(burst.value, [0, 0.2, 1], [0, 0.45, 0]),
    transform: [{ scale: interpolate(burst.value, [0, 1], [0.5, 1.35]) }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(burst.value, [0, 0.15, 1], [0, 0.6, 0]),
    transform: [{ scale: interpolate(burst.value, [0, 1], [0.3, 1.5]) }],
  }));

  const centerX = contact.x;
  const centerY = contact.y;
  const glowSize = width * 0.62;
  const ringSize = width * 0.44;

  return (
    <View style={{ width, height }}>
      <Animated.View
        shouldRasterizeIOS
        renderToHardwareTextureAndroid
        style={[StyleSheet.absoluteFill, roomStyle]}
      >
        <HexRoom
          width={width}
          picks={picks}
          frameHue={frameHue}
          shell={shell}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.centered,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: accent.soft,
            left: centerX - glowSize / 2,
            top: centerY - glowSize / 2,
          },
          glowStyle,
        ]}
      />

      <Animated.View
        pointerEvents="none"
        shouldRasterizeIOS
        renderToHardwareTextureAndroid
        style={[
          StyleSheet.absoluteFill,
          { transformOrigin: [contact.x, contact.y, 0] },
          objectStyle,
        ]}
      >
        <DecorationLayer width={width} day={day} option={option} part="object" />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.centered,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderWidth: 3,
            borderColor: accent.base,
            left: centerX - ringSize / 2,
            top: centerY - ringSize / 2,
          },
          ringStyle,
        ]}
      />

      {SPARKLE_ANGLES.map((angle) => (
        <Sparkle
          key={angle}
          angle={angle}
          burst={burst}
          color={accent.base}
          distance={width * SPARKLE_TRAVEL}
          left={centerX - SPARKLE_SIZE / 2}
          top={centerY - SPARKLE_SIZE / 2}
        />
      ))}
    </View>
  );
}

function Sparkle({
  angle,
  burst,
  color,
  distance,
  left,
  top,
}: {
  angle: number;
  burst: SharedValue<number>;
  color: string;
  distance: number;
  left: number;
  top: number;
}) {
  const radians = (angle * Math.PI) / 180;
  const dx = Math.cos(radians);
  const dy = Math.sin(radians);

  const style = useAnimatedStyle(() => {
    const travel = interpolate(burst.value, [0, 1], [0, distance]);

    return {
      opacity: interpolate(burst.value, [0, 0.15, 1], [0, 1, 0]),
      transform: [
        { translateX: dx * travel },
        { translateY: dy * travel },
        { scale: interpolate(burst.value, [0, 1], [1, 0.3]) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.centered,
        {
          width: SPARKLE_SIZE,
          height: SPARKLE_SIZE,
          borderRadius: SPARKLE_SIZE / 2,
          backgroundColor: color,
          left,
          top,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    position: 'absolute',
  },
});
