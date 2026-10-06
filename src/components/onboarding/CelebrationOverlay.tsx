import { Text } from '../common/Text';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { duration, easing, spring, stagger } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { triggerHeavyHaptic } from '../../native/tapHaptics';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import ConfettiFall from '../common/ConfettiFall';
import { BurstStar, LoopingTwinkle } from '../common/RewardSparkles';
import { RiseUnlessReducedMotion } from '../common/Reveal';
import { scaleVisual } from './onboardingVisualScale';

interface CelebrationOverlayProps {
  title?: string;
}

const RING_SIZE = scaleVisual(128);
/** the darker disc the circle rests on, like a button on its lip */
const RING_LIP = scaleVisual(7);
const RAYS_SIZE = RING_SIZE * 2.7;
const RAY_COUNT = 12;
const RAY_TURN_MS = 24_000;

/** the check, short stroke then long, in a 24-unit box */
const CHECK_PATH = 'M6 12.6 L10.2 16.8 L18.2 8';
const CHECK_LENGTH = Math.hypot(4.2, 4.2) + Math.hypot(8, 8.8);
const CHECK_STROKE = 3.2;

const POP_AT_MS = 60;
/** the circle has landed and settled enough to draw on */
const CHECK_AT_MS = 320;
const CHECK_MS = 380;
const CHECK_DONE_MS = CHECK_AT_MS + CHECK_MS;
const TITLE_AT_MS = CHECK_DONE_MS + 80;
/** one buzz as the screen arrives, one as the check finishes */
const ARRIVE_HAPTIC = Haptics.NotificationFeedbackType.Success;

const BURST = Array.from({ length: 8 }, (_, i) => ({
  angle: -90 + i * 45 + (i % 2 === 0 ? 0 : 12),
  distance: RING_SIZE * (i % 2 === 0 ? 0.95 : 0.75),
  size: scaleVisual(i % 2 === 0 ? 18 : 13),
  color: i % 2 === 0 ? colors.reward.gold : colors.primary.blue300,
}));
/** around the circle once the burst has thrown off; fractions of the ring */
const TWINKLES = [
  { x: -0.2, y: 0.1, size: 0.15, period: 1_500 },
  { x: 1.22, y: 0.18, size: 0.12, period: 1_900 },
  { x: 1.12, y: 0.95, size: 0.14, period: 1_700 },
  { x: -0.12, y: 0.88, size: 0.11, period: 2_100 },
  { x: 0.5, y: -0.3, size: 0.12, period: 1_600 },
] as const;

const AnimatedPath = Animated.createAnimatedComponent(Path);

function raysPath(size: number): string {
  const c = size / 2;
  const half = Math.PI / RAY_COUNT / 2;
  let d = '';
  for (let ray = 0; ray < RAY_COUNT; ray += 1) {
    const angle = (ray * 2 * Math.PI) / RAY_COUNT;
    d +=
      `M${c},${c} ` +
      `L${c + Math.cos(angle - half) * c},${c + Math.sin(angle - half) * c} ` +
      `L${c + Math.cos(angle + half) * c},${c + Math.sin(angle + half) * c} Z `;
  }
  return d;
}

/**
 * The beat after the contract is signed: a chunky circle pops in, the check
 * draws itself on, and stars burst off it as it lands, with light turning
 * slowly behind.
 */
export default function CelebrationOverlay({
  title = 'This is a really good start. Well done.',
}: CelebrationOverlayProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const rays = useMemo(() => raysPath(RAYS_SIZE), []);
  const backdrop = useSharedValue(reducedMotion ? 1 : 0);
  const pop = useSharedValue(reducedMotion ? 1 : 0);
  const check = useSharedValue(reducedMotion ? 1 : 0);
  const burst = useSharedValue(0);
  const light = useSharedValue(reducedMotion ? 1 : 0);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (isHapticsEnabled()) Haptics.notificationAsync(ARRIVE_HAPTIC).catch(() => {});
    if (reducedMotion) return;

    backdrop.value = withTiming(1, { duration: duration.base, easing: easing.enter });
    pop.value = withDelay(POP_AT_MS, withSpring(1, spring.bounce));
    check.value = withDelay(
      CHECK_AT_MS,
      withTiming(1, { duration: CHECK_MS, easing: Easing.inOut(Easing.cubic) }),
    );
    burst.value = withDelay(
      CHECK_DONE_MS,
      withTiming(1, { duration: duration.slower, easing: easing.burst }),
    );
    light.value = withDelay(
      CHECK_DONE_MS,
      withTiming(1, { duration: duration.slower, easing: easing.enter }),
    );
    const cancelLanding = startUiTimer(CHECK_DONE_MS, triggerHeavyHaptic);

    return () => {
      cancelLanding();
      cancelAnimation(backdrop);
      cancelAnimation(pop);
      cancelAnimation(check);
      cancelAnimation(burst);
      cancelAnimation(light);
    };
  }, [backdrop, burst, check, light, pop, reducedMotion]);

  useWhileVisible(() => {
    if (reducedMotion) return () => {};
    spin.value = withRepeat(
      withTiming(1, { duration: RAY_TURN_MS, easing: Easing.linear }),
      -1,
    );
    return () => {
      cancelAnimation(spin);
      spin.value = 0;
    };
  }, [reducedMotion, spin]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  // Squashes as it overshoots, so it lands rather than just scaling up.
  const ringStyle = useAnimatedStyle(() => {
    const over = Math.max(0, pop.value - 1);
    const base = Math.min(pop.value, 1);
    return {
      transform: [{ scaleX: base + over }, { scaleY: base - over * 1.2 }],
    };
  });
  const raysStyle = useAnimatedStyle(() => ({
    opacity: light.value,
    transform: [{ scale: 0.6 + 0.4 * light.value }, { rotate: `${spin.value * 360}deg` }],
  }));
  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - check.value),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overlay,
        {
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
          paddingLeft: insets.left + spacing.xl,
          paddingRight: insets.right + spacing.xl,
        },
        overlayStyle,
      ]}
    >
      <ConfettiFall />

      <View style={styles.center}>
        <View style={styles.ringWrap}>
          <Animated.View style={[styles.rays, raysStyle]}>
            <Svg width={RAYS_SIZE} height={RAYS_SIZE}>
              <Defs>
                <RadialGradient id="celebrationRays" cx="50%" cy="50%" r="50%">
                  <Stop offset="0.25" stopColor={colors.celebrationGlow.core} stopOpacity={1} />
                  <Stop offset="1" stopColor={colors.celebrationGlow.core} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Path d={rays} fill="url(#celebrationRays)" />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.ring, ringStyle]}>
            <View style={styles.lip} />
            <View style={styles.face}>
              <Svg width={RING_SIZE * 0.62} height={RING_SIZE * 0.62} viewBox="0 0 24 24">
                <AnimatedPath
                  d={CHECK_PATH}
                  fill="none"
                  stroke={colors.text.inverse}
                  strokeWidth={CHECK_STROKE}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={[CHECK_LENGTH, CHECK_LENGTH]}
                  animatedProps={checkProps}
                />
              </Svg>
            </View>
          </Animated.View>

          {reducedMotion
            ? null
            : BURST.map((star, index) => (
                <BurstStar
                  key={index}
                  angle={star.angle}
                  burst={burst}
                  color={star.color}
                  distance={star.distance}
                  size={star.size}
                  x={RING_SIZE / 2}
                  y={RING_SIZE / 2}
                />
              ))}
          {TWINKLES.map((twinkle, index) => (
            <LoopingTwinkle
              key={index}
              x={twinkle.x * RING_SIZE}
              y={twinkle.y * RING_SIZE}
              size={twinkle.size * RING_SIZE}
              color={index % 2 === 0 ? colors.reward.gold : colors.primary.blue400}
              delay={CHECK_DONE_MS + duration.base + index * stagger.base}
              period={twinkle.period}
              active
              reducedMotion={reducedMotion}
            />
          ))}
        </View>

        <RiseUnlessReducedMotion
          delay={TITLE_AT_MS}
          reducedMotion={reducedMotion}
          style={styles.copy}
        >
          <Text style={styles.title}>{title}</Text>
        </RiseUnlessReducedMotion>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: spacing.xl,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE + RING_LIP,
  },
  rays: {
    position: 'absolute',
    width: RAYS_SIZE,
    height: RAYS_SIZE,
    left: (RING_SIZE - RAYS_SIZE) / 2,
    top: (RING_SIZE - RAYS_SIZE) / 2,
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE + RING_LIP,
  },
  lip: {
    position: 'absolute',
    top: RING_LIP,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: colors.primary.blue700,
  },
  face: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: colors.primary.blue500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
  },
  title: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
