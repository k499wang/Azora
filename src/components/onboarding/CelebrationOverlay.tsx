import { Text } from '../common/Text';
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  cancelAnimation,
  Easing,
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
  /** once Azo has finished his hug */
  onFinished?: () => void;
}

const HUGGING_AZO = require('../../../assets/animations/hug.webp');
const AZO_WIDTH = scaleVisual(220);
const AZO_HEIGHT = AZO_WIDTH * (578 / 600);
const RAYS_SIZE = AZO_WIDTH * 1.7;
const RAY_COUNT = 12;
const RAY_TURN_MS = 24_000;

const HUG_MS = 5_950;
const POP_AT_MS = 60;
/** Azo has landed from his pop */
const LANDED_MS = 420;
const TITLE_AT_MS = LANDED_MS + 80;
/** a beat on his last pose before the screen moves on */
const FINISHED_MS = POP_AT_MS + HUG_MS + 400;
/** one buzz as the screen arrives, one as Azo lands */
const ARRIVE_HAPTIC = Haptics.NotificationFeedbackType.Success;

const BURST = Array.from({ length: 8 }, (_, i) => ({
  angle: -90 + i * 45 + (i % 2 === 0 ? 0 : 12),
  distance: AZO_WIDTH * (i % 2 === 0 ? 0.6 : 0.48),
  size: scaleVisual(i % 2 === 0 ? 18 : 13),
  color: i % 2 === 0 ? colors.reward.gold : colors.primary.blue300,
}));
/** around Azo once the burst has thrown off; fractions of his box */
const TWINKLES = [
  { x: -0.2, y: 0.1, size: 0.15, period: 1_500 },
  { x: 1.22, y: 0.18, size: 0.12, period: 1_900 },
  { x: 1.12, y: 0.95, size: 0.14, period: 1_700 },
  { x: -0.12, y: 0.88, size: 0.11, period: 2_100 },
  { x: 0.5, y: -0.3, size: 0.12, period: 1_600 },
] as const;

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
 * The beat after the contract is signed: Azo pops in and hugs a heart, stars
 * burst off him as he lands, and light turns slowly behind.
 */
export default function CelebrationOverlay({
  title = 'This is a really good start. Well done.',
  onFinished,
}: CelebrationOverlayProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const rays = useMemo(() => raysPath(RAYS_SIZE), []);
  const backdrop = useSharedValue(reducedMotion ? 1 : 0);
  const pop = useSharedValue(reducedMotion ? 1 : 0);
  const burst = useSharedValue(0);
  const light = useSharedValue(reducedMotion ? 1 : 0);
  const spin = useSharedValue(0);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  useEffect(() => startUiTimer(FINISHED_MS, () => onFinishedRef.current?.()), []);

  useEffect(() => {
    if (isHapticsEnabled()) Haptics.notificationAsync(ARRIVE_HAPTIC).catch(() => {});
    if (reducedMotion) return;

    backdrop.value = withTiming(1, { duration: duration.base, easing: easing.enter });
    pop.value = withDelay(POP_AT_MS, withSpring(1, spring.bounce));
    burst.value = withDelay(
      LANDED_MS,
      withTiming(1, { duration: duration.slower, easing: easing.burst }),
    );
    light.value = withDelay(
      LANDED_MS,
      withTiming(1, { duration: duration.slower, easing: easing.enter }),
    );
    const cancelLanding = startUiTimer(LANDED_MS, triggerHeavyHaptic);

    return () => {
      cancelLanding();
      cancelAnimation(backdrop);
      cancelAnimation(pop);
      cancelAnimation(burst);
      cancelAnimation(light);
    };
  }, [backdrop, burst, light, pop, reducedMotion]);

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
  const azoStyle = useAnimatedStyle(() => {
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
        <View style={styles.azoWrap}>
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

          <Animated.View style={azoStyle}>
            <Image
              source={HUGGING_AZO}
              style={styles.azo}
              contentFit="contain"
              autoplay={!reducedMotion}
              useAppleWebpCodec={false}
            />
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
                  x={AZO_WIDTH / 2}
                  y={AZO_HEIGHT / 2}
                />
              ))}
          {TWINKLES.map((twinkle, index) => (
            <LoopingTwinkle
              key={index}
              x={twinkle.x * AZO_WIDTH}
              y={twinkle.y * AZO_HEIGHT}
              size={twinkle.size * AZO_WIDTH * 0.6}
              color={index % 2 === 0 ? colors.reward.gold : colors.primary.blue400}
              delay={LANDED_MS + duration.base + index * stagger.base}
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
  azoWrap: {
    width: AZO_WIDTH,
    height: AZO_HEIGHT,
  },
  rays: {
    position: 'absolute',
    width: RAYS_SIZE,
    height: RAYS_SIZE,
    left: (AZO_WIDTH - RAYS_SIZE) / 2,
    top: (AZO_HEIGHT - RAYS_SIZE) / 2,
  },
  azo: {
    width: AZO_WIDTH,
    height: AZO_HEIGHT,
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
