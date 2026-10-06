import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import { BurstStar, LoopingTwinkle } from '../../components/common/RewardSparkles';
import { colors } from '../../theme/colors';
import { duration, easing, spring, travel } from '../../theme/motion';

interface Props {
  /** the flame flickers and its glow breathes while true */
  idle: boolean;
  /** flips true when the streak count lands: the flame flares and throws sparks */
  flared: boolean;
}

const HERO_SIZE = 148;
const FLAME_SIZE = 112;
const CENTER = HERO_SIZE / 2;
const FLICKER_MS = 720;
const SWAY_MS = 1150;
const GLOW_MS = 1600;

const BURST = Array.from({ length: 8 }, (_, index) => ({
  angle: index * 45 - 112.5,
  distance: index % 2 === 0 ? 74 : 60,
  size: index % 2 === 0 ? 18 : 13,
  color: index % 2 === 0 ? colors.reward.gold : colors.orange[400],
}));

const TWINKLES = [
  { x: 18, y: 40, size: 14, delay: 500, period: 1400 },
  { x: 132, y: 30, size: 11, delay: 800, period: 1700 },
  { x: 128, y: 118, size: 13, delay: 1100, period: 1250 },
];

/**
 * The streak popup's flame, alive rather than stamped on: it bounces in,
 * flickers from its base while the popup is up, and flares with a spray of
 * sparks the moment the count ticks over.
 */
export default function StreakFlameHero({ idle, flared }: Props) {
  const reducedMotion = useReducedMotion();
  const enter = useSharedValue(reducedMotion ? 1 : 0);
  const flicker = useSharedValue(0);
  const sway = useSharedValue(0.5);
  const glow = useSharedValue(0);
  const flare = useSharedValue(1);
  const burst = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    enter.value = withSpring(1, spring.bounce);
    return () => cancelAnimation(enter);
  }, [enter, reducedMotion]);

  useEffect(() => {
    if (!idle || reducedMotion) {
      flicker.value = withTiming(0, { duration: duration.base });
      sway.value = withTiming(0.5, { duration: duration.base });
      glow.value = withTiming(0, { duration: duration.base });
      return;
    }
    const breathe = (period: number) =>
      withRepeat(withTiming(1, { duration: period, easing: easing.breathe }), -1, true);
    flicker.value = withDelay(duration.slower, breathe(FLICKER_MS));
    sway.value = withDelay(duration.slower, withSequence(withTiming(0, { duration: SWAY_MS / 2, easing: easing.breathe }), breathe(SWAY_MS)));
    glow.value = breathe(GLOW_MS);
    return () => {
      cancelAnimation(flicker);
      cancelAnimation(sway);
      cancelAnimation(glow);
    };
  }, [flicker, glow, idle, reducedMotion, sway]);

  useEffect(() => {
    if (!flared || reducedMotion) return;
    flare.value = withSequence(
      withTiming(1.2, { duration: duration.fast, easing: easing.enter }),
      withSpring(1, spring.bounce),
    );
    burst.value = 0;
    burst.value = withTiming(1, { duration: duration.slower, easing: easing.burst });
  }, [burst, flare, flared, reducedMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: enter.value * (0.6 + 0.4 * glow.value),
    transform: [{ scale: enter.value * flare.value * (0.9 + 0.12 * glow.value) }],
  }));

  const flameStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, enter.value * 3),
    transform: [
      { translateY: (1 - enter.value) * travel.drop },
      { rotate: `${(1 - enter.value) * -14 + (sway.value - 0.5) * 6}deg` },
      { scale: enter.value * flare.value },
      { scaleX: 1 - 0.035 * flicker.value },
      { scaleY: 1 + 0.07 * flicker.value },
    ],
  }));

  return (
    <View style={styles.hero} pointerEvents="none">
      <Animated.View style={[styles.glowOuter, glowStyle]}>
        <View style={styles.glowInner} />
      </Animated.View>
      <Animated.View style={[styles.flame, flameStyle]}>
        <TaskIllustration name="streakFilled" size={FLAME_SIZE} />
      </Animated.View>
      {BURST.map((star) => (
        <BurstStar key={star.angle} {...star} burst={burst} x={CENTER} y={CENTER} />
      ))}
      {TWINKLES.map((twinkle) => (
        <LoopingTwinkle
          key={`${twinkle.x}-${twinkle.y}`}
          {...twinkle}
          color={colors.reward.gold}
          active={idle}
          reducedMotion={reducedMotion}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: HERO_SIZE, height: HERO_SIZE, alignItems: 'center', justifyContent: 'center' },
  glowOuter: {
    position: 'absolute',
    width: HERO_SIZE,
    height: HERO_SIZE,
    borderRadius: HERO_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange[100],
  },
  glowInner: {
    width: HERO_SIZE * 0.68,
    height: HERO_SIZE * 0.68,
    borderRadius: HERO_SIZE * 0.34,
    backgroundColor: colors.orange[200],
  },
  flame: {
    width: FLAME_SIZE,
    height: FLAME_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    transformOrigin: [FLAME_SIZE / 2, FLAME_SIZE * 0.92, 0],
  },
});
