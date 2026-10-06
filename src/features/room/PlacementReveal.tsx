import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
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
import DecorationLayer, { FLOOR_CENTER_Y, decorationFootprint, frameAccent } from './roomStage';
import { BurstStar, FlashTwinkle } from '../../components/common/RewardSparkles';
import { useCompletionSound } from '../../hooks/useCompletionSound';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { colors } from '../../theme/colors';
import { duration, easing, spring, stagger } from '../../theme/motion';

// Beats of the reveal, in ms from mount. The piece materialises above its
// slot, hovers for a breath, then falls under gravity easing and lands on an
// exact frame, so everything that reacts to the landing — the squash, the
// burst, the room's recoil, the haptic, the chime — can be scheduled against
// one number instead of chasing a spring's settle.
const APPEAR_MS = 80;
const HOVER_MS = 520;
const FALL_START_MS = APPEAR_MS + HOVER_MS;
const FALL_MS = 280;
const LAND_MS = FALL_START_MS + FALL_MS;
const SQUASH_MS = 90;
const HOP_MS = 150;
const BURST_MS = duration.slower;
const DONE_MS = LAND_MS + BURST_MS + 520;

const HOVER_LIFT = 0.2;

const BURST_STARS = [
  { angle: -160, size: 14, travel: 0.3 },
  { angle: -130, size: 10, travel: 0.36 },
  { angle: -105, size: 16, travel: 0.32 },
  { angle: -75, size: 11, travel: 0.38 },
  { angle: -50, size: 15, travel: 0.3 },
  { angle: -20, size: 10, travel: 0.34 },
  { angle: 160, size: 8, travel: 0.22 },
  { angle: 20, size: 8, travel: 0.22 },
];
const PUFFS = [
  { direction: -1, size: 0.11, travel: 0.13 },
  { direction: 1, size: 0.11, travel: 0.13 },
  { direction: -1, size: 0.07, travel: 0.2 },
  { direction: 1, size: 0.07, travel: 0.2 },
];

interface PlacementRevealProps {
  width: number;
  day: DayKey;
  option: string;
  /** the room as it stands, *without* the piece being placed */
  picks: Picks;
  frameHue: FrameHue;
  shell: Poly[];
  /** onboarding shows the moment without its sound */
  muted?: boolean;
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
  muted = false,
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
  const { contact, top, left, right } = decorationFootprint(day, option, width) ?? {
    contact: { x: width / 2, y: height * FLOOR_CENTER_Y },
    top: height * FLOOR_CENTER_Y - width * 0.2,
    left: width * 0.4,
    right: width * 0.6,
  };
  const objectWidth = Math.max(right - left, width * 0.12);
  const hoverCenterY = (top + contact.y) / 2 - height * HOVER_LIFT;

  /**
   * The arriving piece is drawn without the contact shadow authored alongside
   * it. The shadow is fixed to the surface it belongs to, so it can only ever
   * be wrong while the object is in the air: travelling with the piece it reads
   * as sliding across the picture, and standing still it is a mark on the floor
   * with nothing above it. It comes back with the room once the piece is down.
   */

  const appear = useSharedValue(0);
  const bob = useSharedValue(0);
  const fall = useSharedValue(0);
  const squash = useSharedValue(0);
  const hop = useSharedValue(0);
  const kick = useSharedValue(0);
  const burst = useSharedValue(0);

  const playLandSound = useCompletionSound('place', { active: !muted });
  const playLandSoundRef = useRef(playLandSound);
  playLandSoundRef.current = playLandSound;
  const onLand = useCallback(() => {
    playLandSoundRef.current();
    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (polys == null) {
      onDone();
      return;
    }

    appear.value = withDelay(APPEAR_MS, withSpring(1, spring.pop));

    bob.value = withDelay(APPEAR_MS + duration.fast, withSequence(
      withTiming(-1, { duration: HOVER_MS * 0.35, easing: easing.breathe }),
      withTiming(0.6, { duration: HOVER_MS * 0.3, easing: easing.breathe }),
      withTiming(0, { duration: HOVER_MS * 0.15, easing: easing.breathe }),
    ));

    fall.value = withDelay(
      FALL_START_MS,
      withTiming(1, { duration: FALL_MS, easing: easing.gravity }),
    );

    // Squash on contact, then spring back out — the bounce belongs after the
    // landing, not during the fall, or the object reads as floating down.
    squash.value = withDelay(
      LAND_MS,
      withSequence(
        withTiming(1, { duration: SQUASH_MS }),
        withSpring(0, spring.bounce),
      ),
    );

    hop.value = withDelay(
      LAND_MS + SQUASH_MS,
      withSequence(
        withTiming(1, { duration: HOP_MS, easing: easing.enter }),
        withTiming(0, { duration: HOP_MS, easing: easing.gravity }),
      ),
    );

    kick.value = withDelay(
      LAND_MS,
      withSequence(
        withTiming(1, { duration: SQUASH_MS }),
        withSpring(0, spring.pop),
      ),
    );

    burst.value = withDelay(
      LAND_MS,
      withTiming(1, { duration: BURST_MS, easing: easing.burst }),
    );

    const cancelTimers = [
      startUiTimer(LAND_MS, onLand),
      startUiTimer(DONE_MS, onDone),
    ];

    return () => {
      cancelAnimation(appear);
      cancelAnimation(bob);
      cancelAnimation(fall);
      cancelAnimation(squash);
      cancelAnimation(hop);
      cancelAnimation(kick);
      cancelAnimation(burst);
      cancelTimers.forEach((cancel) => cancel());
    };
    // Runs once for the piece it was mounted with; the screen remounts this
    // component per placement rather than reusing it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - kick.value * 0.018 }],
  }));

  const objectStyle = useAnimatedStyle(() => {
    const drop = interpolate(fall.value, [0, 1], [-height * HOVER_LIFT, 0]);
    const grow = interpolate(appear.value, [0, 1], [0.3, 1]);
    // Stretches along the fall and is back to round by contact, so the squash
    // owns the landing alone.
    const stretch = interpolate(fall.value, [0, 0.6, 1], [0, 1, 0]);

    return {
      opacity: interpolate(appear.value, [0, 0.4], [0, 1], 'clamp'),
      transform: [
        { translateY: drop + bob.value * height * 0.018 - hop.value * height * 0.03 },
        { rotate: `${interpolate(fall.value, [0, 1], [-8, 0]) + bob.value * 5}deg` },
        { scaleX: grow * (1 - stretch * 0.06 + squash.value * 0.14) },
        { scaleY: grow * (1 + stretch * 0.1 - squash.value * 0.16) },
      ],
    };
  });

  const orbStyle = useAnimatedStyle(() => ({
    opacity: interpolate(appear.value, [0, 0.5], [0, 1], 'clamp')
      * interpolate(fall.value, [0, 0.5], [1, 0], 'clamp'),
    transform: [
      { translateY: bob.value * height * 0.018 },
      { scale: interpolate(appear.value, [0, 1], [0.4, 1]) * (1 - 0.06 * bob.value) },
    ],
  }));

  const beamStyle = useAnimatedStyle(() => ({
    opacity: interpolate(appear.value, [0, 1], [0, 1], 'clamp')
      * interpolate(burst.value, [0, 0.6], [1, 0], 'clamp'),
    transform: [{ scaleX: interpolate(burst.value, [0, 0.6], [1, 0.4], 'clamp') }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(burst.value, [0, 0.2, 1], [0, 0.5, 0]),
    transform: [{ scale: interpolate(burst.value, [0, 1], [0.5, 1.35]) }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(burst.value, [0, 0.15, 1], [0, 0.6, 0]),
    transform: [{ scaleX: interpolate(burst.value, [0, 1], [0.3, 1.6]) }, { scaleY: interpolate(burst.value, [0, 1], [0.15, 0.7]) }],
  }));

  const orbSize = Math.max(objectWidth * 1.9, width * 0.34);
  const beamWidth = objectWidth * 1.3;
  const glowSize = width * 0.62;
  const ringSize = width * 0.44;
  const burstColors = [colors.reward.gold, accent.base, colors.playful.amber.soft];
  const lingerSpots = [
    { x: left - width * 0.02, y: top + (contact.y - top) * 0.2, size: 14, color: colors.reward.gold },
    { x: right + width * 0.02, y: top + (contact.y - top) * 0.45, size: 11, color: colors.playful.amber.soft },
    { x: (left + right) / 2 + objectWidth * 0.2, y: top - width * 0.03, size: 9, color: accent.base },
  ];

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
          styles.absolute,
          { width: beamWidth, height: contact.y, left: contact.x - beamWidth / 2, top: 0 },
          beamStyle,
        ]}
      >
        <Svg width={beamWidth} height={contact.y}>
          <Defs>
            <LinearGradient id="placeBeam" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.playful.amber.soft} stopOpacity={0} />
              <Stop offset="1" stopColor={colors.playful.amber.soft} stopOpacity={0.55} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={beamWidth} height={contact.y} rx={beamWidth / 2} fill="url(#placeBeam)" />
        </Svg>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.absolute,
          { width: orbSize, height: orbSize, left: contact.x - orbSize / 2, top: hoverCenterY - orbSize / 2 },
          orbStyle,
        ]}
      >
        <Svg width={orbSize} height={orbSize}>
          <Defs>
            <RadialGradient id="placeOrb" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.playful.amber.soft} stopOpacity={0.95} />
              <Stop offset="0.55" stopColor={colors.playful.amber.tint} stopOpacity={0.35} />
              <Stop offset="1" stopColor={colors.playful.amber.tint} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={orbSize / 2} cy={orbSize / 2} rx={orbSize / 2} ry={orbSize / 2} fill="url(#placeOrb)" />
        </Svg>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.absolute,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: accent.soft,
            left: contact.x - glowSize / 2,
            top: contact.y - glowSize / 2,
          },
          glowStyle,
        ]}
      />

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
            left: contact.x - ringSize / 2,
            top: contact.y - ringSize / 2,
          },
          ringStyle,
        ]}
      />

      {PUFFS.map((puff, i) => (
        <Puff
          key={i}
          burst={burst}
          direction={puff.direction}
          size={width * puff.size}
          distance={width * puff.travel}
          x={contact.x}
          y={contact.y}
        />
      ))}

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

      {BURST_STARS.map((star, i) => (
        <BurstStar
          key={star.angle}
          angle={star.angle}
          burst={burst}
          color={burstColors[i % burstColors.length]}
          distance={width * star.travel}
          size={star.size}
          x={contact.x}
          y={contact.y - (contact.y - top) * 0.3}
        />
      ))}

      {lingerSpots.map((spot, i) => (
        <FlashTwinkle
          key={i}
          {...spot}
          delay={LAND_MS + duration.base + i * stagger.base}
        />
      ))}
    </View>
  );
}

function Puff({
  burst,
  direction,
  size,
  distance,
  x,
  y,
}: {
  burst: SharedValue<number>;
  direction: number;
  size: number;
  distance: number;
  x: number;
  y: number;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(burst.value, [0, 0.1, 0.8], [0, 0.85, 0], 'clamp'),
    transform: [
      { translateX: direction * interpolate(burst.value, [0, 1], [0, distance]) },
      { translateY: -interpolate(burst.value, [0, 1], [0, size * 0.5]) },
      { scale: interpolate(burst.value, [0, 1], [0.4, 1.2]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.absolute,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.text.inverse,
          left: x - size / 2,
          top: y - size / 2,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
  },
});
