import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import { STREAK_UNLIT_ILLUSTRATION } from '../../components/common/icons/habitIllustrations';
import { stickerIllustrationSvg } from '../../components/common/icons/stickerIllustrationSvg';
import { BurstStar, LoopingTwinkle } from '../../components/common/RewardSparkles';
import { colors } from '../../theme/colors';
import { duration, easing, spring } from '../../theme/motion';

interface Props {
  /** ms after mount at which the grey flame lights */
  igniteAt: number;
  /** the lit flame flickers and its glow breathes while true */
  idle: boolean;
  reducedMotion: boolean;
}

const HERO_SIZE = 128;
const FLAME_SIZE = 96;
const CENTER = HERO_SIZE / 2;
const SQUASH_MS = 90;
const STRETCH_MS = 140;
const FLICKER_MS = 720;
const SWAY_MS = 1150;
const GLOW_MS = 1600;
const UNLIT_XML = stickerIllustrationSvg(STREAK_UNLIT_ILLUSTRATION);

const SPARK_COLORS = [colors.reward.gold, colors.orange[400], colors.reward.flame];
const SPARKS = Array.from({ length: 10 }, (_, index) => ({
  angle: index * 36 - 90,
  distance: index % 2 === 0 ? 76 : 62,
  size: index % 2 === 0 ? 11 : 8,
  color: SPARK_COLORS[index % SPARK_COLORS.length],
}));

const TWINKLES = [
  { x: 14, y: 34, size: 13, delay: 400, period: 1400 },
  { x: 116, y: 24, size: 10, delay: 650, period: 1700 },
  { x: 112, y: 104, size: 12, delay: 900, period: 1250 },
];

/**
 * The streak flame lighting up, Duolingo-style: it waits grey, then squashes,
 * stretches and swirls into colour with a glow flash and a ring of sparks,
 * and keeps flickering from its base for as long as it is on screen.
 */
export default function StreakFlameHero({ igniteAt, idle, reducedMotion }: Props) {
  const lit = useSharedValue(reducedMotion ? 1 : 0);
  const pop = useSharedValue(reducedMotion ? 1 : 0.88);
  const stretch = useSharedValue(0);
  const swirl = useSharedValue(0);
  const flash = useSharedValue(0);
  const burst = useSharedValue(0);
  const flicker = useSharedValue(0);
  const sway = useSharedValue(0.5);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    lit.value = withDelay(igniteAt, withTiming(1, { duration: duration.fast }));
    pop.value = withDelay(
      igniteAt,
      withSequence(withTiming(1.22, { duration: duration.fast, easing: easing.enter }), withSpring(1, spring.bounce)),
    );
    stretch.value = withDelay(
      igniteAt,
      withSequence(
        withTiming(-1, { duration: SQUASH_MS, easing: easing.enter }),
        withTiming(1, { duration: STRETCH_MS, easing: easing.enter }),
        withSpring(0, spring.bounce),
      ),
    );
    swirl.value = withDelay(igniteAt, withTiming(1, { duration: duration.slower, easing: easing.settle }));
    flash.value = withDelay(
      igniteAt,
      withSequence(
        withTiming(1, { duration: duration.fast, easing: easing.enter }),
        withTiming(0, { duration: duration.slower, easing: easing.burst }),
      ),
    );
    burst.value = withDelay(igniteAt, withTiming(1, { duration: duration.slower, easing: easing.burst }));
    return () => {
      [lit, pop, stretch, swirl, flash, burst].forEach((value) => cancelAnimation(value));
    };
  }, [burst, flash, igniteAt, lit, pop, reducedMotion, stretch, swirl]);

  useEffect(() => {
    if (!idle || reducedMotion) {
      flicker.value = withTiming(0, { duration: duration.base });
      sway.value = withTiming(0.5, { duration: duration.base });
      glow.value = withTiming(0, { duration: duration.base });
      return;
    }
    const settledAt = igniteAt + duration.slower;
    const breathe = (period: number) =>
      withRepeat(withTiming(1, { duration: period, easing: easing.breathe }), -1, true);
    flicker.value = withDelay(settledAt, breathe(FLICKER_MS));
    sway.value = withDelay(
      settledAt,
      withSequence(withTiming(0, { duration: SWAY_MS / 2, easing: easing.breathe }), breathe(SWAY_MS)),
    );
    glow.value = withDelay(igniteAt, breathe(GLOW_MS));
    return () => {
      cancelAnimation(flicker);
      cancelAnimation(sway);
      cancelAnimation(glow);
    };
  }, [flicker, glow, idle, igniteAt, reducedMotion, sway]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, lit.value * (0.6 + 0.3 * glow.value) + 0.4 * flash.value),
    transform: [{ scale: 0.8 + 0.1 * glow.value + 0.35 * flash.value }],
  }));

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(swirl.value, [0, 0.3, 0.65, 1], [0, -20, 8, 0]) + (sway.value - 0.5) * 6}deg` },
      { scale: pop.value },
      { scaleX: 1 - 0.16 * stretch.value - 0.035 * flicker.value },
      { scaleY: 1 + 0.16 * stretch.value + 0.07 * flicker.value },
    ],
  }));

  const unlitStyle = useAnimatedStyle(() => ({ opacity: 1 - lit.value }));
  const litStyle = useAnimatedStyle(() => ({ opacity: lit.value }));

  return (
    <View style={styles.hero} pointerEvents="none">
      <Animated.View style={[styles.glowOuter, glowStyle]}>
        <View style={styles.glowInner} />
      </Animated.View>
      <Animated.View style={[styles.flame, flameStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, unlitStyle]}>
          <SvgXml xml={UNLIT_XML} width={FLAME_SIZE} height={FLAME_SIZE} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, litStyle]}>
          <TaskIllustration name="streakFilled" size={FLAME_SIZE} />
        </Animated.View>
      </Animated.View>
      {SPARKS.map((spark) => (
        <BurstStar key={spark.angle} {...spark} shape="square" burst={burst} x={CENTER} y={CENTER} />
      ))}
      {TWINKLES.map((twinkle) => (
        <LoopingTwinkle
          key={`${twinkle.x}-${twinkle.y}`}
          {...twinkle}
          delay={igniteAt + twinkle.delay}
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
    transformOrigin: [FLAME_SIZE / 2, FLAME_SIZE * 0.92, 0],
  },
});
