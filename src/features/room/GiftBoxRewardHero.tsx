import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useCompletionSound } from '../../hooks/useCompletionSound';
import { colors } from '../../theme/colors';
import { duration, easing, spring, stagger } from '../../theme/motion';
import { decorationRewardPalette } from './decorationRewardPalette';
import { LoopingTwinkle } from '../../components/common/RewardSparkles';
import { GIFT_BOX_VIEWBOX, GIFT_BOX_VIOLET, GiftBoxBody, GiftBoxLid } from '../../components/common/GiftBoxArt';
import { triggerSoftHaptic } from '../../native/tapHaptics';

interface Props {
  size: number;
  active: boolean;
  reducedMotion: boolean;
  delay: number;
}

const VIEWBOX = GIFT_BOX_VIEWBOX;
const OPENING = { x: 150, y: 161 };
const BOX_BASE_Y = 262;
const WIGGLE_STEPS = [-1, 1, -0.7, 0.45, 0];
const WIGGLE_STEP_MS = 80;
const DRIFT_MS = 2400;
const TWINKLE_MS = [900, 1300, 1100, 1500, 1000, 1200, 1400];

const RAYS = [-62, -38, -14, 14, 38, 62].map((angle, i) => {
  const spread = i % 2 === 0 ? 11 : 8;
  const length = 158;
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${OPENING.x + length * Math.sin(rad)} ${OPENING.y - length * Math.cos(rad)}`;
  };
  return `M${OPENING.x} ${OPENING.y}L${point(angle - spread / 2)}L${point(angle + spread / 2)}Z`;
});

const SPARKLES = [
  { x: 30, y: 140, r: 14, color: colors.reward.gold },
  { x: 264, y: 92, r: 12, color: colors.playful.amber.soft },
  { x: 272, y: 196, r: 9, color: colors.reward.gold },
  { x: 44, y: 226, r: 8, color: colors.playful.violet.soft },
  { x: 212, y: 30, r: 9, color: colors.reward.gold },
  { x: 86, y: 36, r: 7, color: colors.playful.coral.tint },
  { x: 150, y: 14, r: 6, color: colors.playful.amber.soft },
];

/** The gift represents an earned choice; the picker reveals the actual pieces. */
export default function GiftBoxRewardHero({ size, active, reducedMotion, delay }: Props) {
  const unit = size / VIEWBOX;
  const enter = useSharedValue(0);
  const wiggle = useSharedValue(0);
  const open = useSharedValue(0);
  const light = useSharedValue(0);
  const drift = useSharedValue(0);
  const playOpenSound = useCompletionSound('gift', { active });
  const playOpenSoundRef = useRef(playOpenSound);
  playOpenSoundRef.current = playOpenSound;

  const onLidOpen = useCallback(() => {
    triggerSoftHaptic();
    playOpenSoundRef.current();
  }, []);

  const shakeAt = delay + duration.slow;
  const openAt = shakeAt + WIGGLE_STEP_MS * WIGGLE_STEPS.length;

  useEffect(() => {
    const values = [enter, wiggle, open, light, drift];
    values.forEach((value) => cancelAnimation(value));
    const settled = active && reducedMotion ? 1 : 0;
    enter.value = settled;
    open.value = settled;
    light.value = settled;
    wiggle.value = 0;
    drift.value = 0;
    if (active && reducedMotion) onLidOpen();
    if (active && !reducedMotion) {
      enter.value = withDelay(delay, withSpring(1, spring.pop));
      wiggle.value = withDelay(shakeAt, withSequence(
        ...WIGGLE_STEPS.map((step) => withTiming(step, { duration: WIGGLE_STEP_MS, easing: easing.breathe })),
      ));
      open.value = withDelay(openAt, withSequence(
        // Trigger on the animation's clock as the lid starts moving.
        withTiming(0, { duration: 0 }, (finished) => {
          if (finished) runOnJS(onLidOpen)();
        }),
        withSpring(1, spring.bounce),
      ));
      light.value = withDelay(openAt, withTiming(1, { duration: duration.slower, easing: easing.burst }));
      drift.value = withDelay(
        openAt + duration.slower,
        withRepeat(withTiming(1, { duration: DRIFT_MS, easing: easing.breathe }), -1, true),
      );
    }
    return () => values.forEach((value) => cancelAnimation(value));
  }, [active, delay, drift, enter, light, onLidOpen, open, openAt, reducedMotion, shakeAt, wiggle]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0, 0.5], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(enter.value, [0, 1], [0.7, 1]) }],
  }));
  const boxStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${wiggle.value * 6}deg` },
      { scaleY: 1 - 0.05 * Math.abs(wiggle.value) },
    ],
  }));
  const lidStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -size * 0.03 * open.value },
      { translateY: -size * (0.19 * open.value + 0.012 * drift.value) },
      { rotate: `${-12 * open.value + 2 * drift.value}deg` },
    ],
  }));
  const raysStyle = useAnimatedStyle(() => ({
    opacity: light.value,
    transform: [
      { scale: interpolate(light.value, [0, 1], [0.3, 1]) },
      { rotate: `${(drift.value - 0.5) * 8}deg` },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: light.value }));

  const box = { width: size, height: size };
  const viewBox = `0 0 ${VIEWBOX} ${VIEWBOX}`;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[box, heroStyle]}
    >
      <Svg width={size} height={size} viewBox={viewBox}>
        <Defs>
          <RadialGradient id="giftSpotlight" cx="50%" cy="45%" r="50%">
            <Stop offset="0" stopColor={decorationRewardPalette.surface} stopOpacity={0.85} />
            <Stop offset="1" stopColor={decorationRewardPalette.surface} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="150" cy="145" r="145" fill="url(#giftSpotlight)" />
        <Ellipse cx="155" cy="258" rx="94" ry="11" fill={colors.playful.night.ink} opacity={0.35} />
      </Svg>

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transformOrigin: [OPENING.x * unit, OPENING.y * unit, 0] },
          raysStyle,
        ]}
      >
        <Svg width={size} height={size} viewBox={viewBox}>
          <Defs>
            <RadialGradient
              id="giftRays"
              cx={OPENING.x}
              cy={OPENING.y}
              r="158"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={colors.playful.amber.soft} stopOpacity={0.95} />
              <Stop offset="0.45" stopColor={colors.playful.amber.tint} stopOpacity={0.4} />
              <Stop offset="1" stopColor={colors.playful.amber.tint} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="giftHalo" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.playful.amber.soft} stopOpacity={0.9} />
              <Stop offset="0.6" stopColor={colors.playful.amber.tint} stopOpacity={0.3} />
              <Stop offset="1" stopColor={colors.playful.amber.tint} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          {RAYS.map((d) => <Path key={d} d={d} fill="url(#giftRays)" />)}
          <Ellipse cx={OPENING.x} cy={OPENING.y - 18} rx="96" ry="64" fill="url(#giftHalo)" />
          <Circle cx="70" cy="80" r="3" fill={colors.playful.coral.tint} />
          <Circle cx="236" cy="140" r="3" fill={colors.playful.violet.tint} />
          <Circle cx="118" cy="24" r="2.5" fill={colors.text.inverse} />
          <Circle cx="250" cy="40" r="2.5" fill={colors.playful.amber.soft} />
          <Circle cx="56" cy="180" r="2.5" fill={colors.reward.gold} />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transformOrigin: [size / 2, BOX_BASE_Y * unit, 0] },
          boxStyle,
        ]}
      >
        <Svg width={size} height={size} viewBox={viewBox} style={StyleSheet.absoluteFill}>
          <GiftBoxBody palette={GIFT_BOX_VIOLET} />
        </Svg>

        <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
          <Svg width={size} height={size} viewBox={viewBox}>
            <Defs>
              <LinearGradient id="giftInside" x1="0" y1="1" x2="0" y2="0">
                <Stop offset="0" stopColor={colors.playful.amber.mid} stopOpacity={0.9} />
                <Stop offset="1" stopColor={colors.playful.amber.soft} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Path d="M72 170 108 152H228L192 170Z" fill="url(#giftInside)" />
          </Svg>
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, lidStyle]}>
          <Svg width={size} height={size} viewBox={viewBox}>
            <GiftBoxLid palette={GIFT_BOX_VIOLET} />
          </Svg>
        </Animated.View>
      </Animated.View>

      {SPARKLES.map((sparkle, i) => (
        <LoopingTwinkle
          key={`${sparkle.x}-${sparkle.y}`}
          x={sparkle.x * unit}
          y={sparkle.y * unit}
          size={2 * sparkle.r * unit}
          color={sparkle.color}
          delay={openAt + i * stagger.tight}
          period={TWINKLE_MS[i]}
          active={active}
          reducedMotion={reducedMotion}
        />
      ))}
    </Animated.View>
  );
}

