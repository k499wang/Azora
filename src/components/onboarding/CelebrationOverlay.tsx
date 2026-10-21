import { Text } from '../common/Text';
import { useEffect, useRef } from 'react';
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
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { isHapticsEnabled } from '../../services/preferences/hapticsPreference';
import { triggerHeavyHaptic } from '../../native/tapHaptics';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { useWhileVisible } from '../../hooks/useWhileVisible';
import { RiseUnlessReducedMotion } from '../common/Reveal';
import { CHUNKY_TONE } from '../common/ChunkyButton';
import { scaleVisual } from './onboardingVisualScale';

interface CelebrationOverlayProps {
  title?: string;
  onFinished?: () => void;
  statusMessage?: string;
}

const CIRCLE_SIZE = scaleVisual(120);
const LIP_DEPTH = scaleVisual(8);
const CHECK_SIZE = CIRCLE_SIZE * 0.6;
const CHECK_PATH = 'M6 12.5 L10.5 17 L18.5 8';
const CHECK_LENGTH = 19;
const BADGE_HEIGHT = CIRCLE_SIZE + LIP_DEPTH;
const RAYS_SIZE = CIRCLE_SIZE * 2.8;
const RAY_COUNT = 12;
const RAY_TURN_MS = 24_000;

const POP_AT_MS = 60;
const DRAW_AT_MS = 300;
const DRAW_MS = 300;
const LANDED_MS = DRAW_AT_MS + DRAW_MS;
const TITLE_AT_MS = LANDED_MS + 80;
/** long enough to read the title; the save waits on this, so it caps the beat */
const FINISHED_MS = 2_400;

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

const RAYS = raysPath(RAYS_SIZE);

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The beat after the contract is signed: the badge scales in on its lip and
 * the check draws itself.
 */
export default function CelebrationOverlay({
  title = 'This is a really good start. Well done.',
  onFinished,
  statusMessage,
}: CelebrationOverlayProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const backdrop = useSharedValue(reducedMotion ? 1 : 0);
  const light = useSharedValue(reducedMotion ? 1 : 0);
  const spin = useSharedValue(0);
  const pop = useSharedValue(reducedMotion ? 1 : 0);
  const draw = useSharedValue(reducedMotion ? 1 : 0);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  useEffect(() => startUiTimer(FINISHED_MS, () => onFinishedRef.current?.()), []);

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    if (reducedMotion) return;

    backdrop.value = withTiming(1, { duration: duration.base, easing: easing.enter });
    pop.value = withDelay(
      POP_AT_MS,
      withTiming(1, { duration: duration.base, easing: easing.enter }),
    );
    draw.value = withDelay(
      DRAW_AT_MS,
      withTiming(1, { duration: DRAW_MS, easing: Easing.out(Easing.cubic) }),
    );
    light.value = withDelay(
      LANDED_MS,
      withTiming(1, { duration: duration.slower, easing: easing.enter }),
    );
    const cancelLanding = startUiTimer(LANDED_MS, triggerHeavyHaptic);

    return () => {
      cancelLanding();
      cancelAnimation(backdrop);
      cancelAnimation(light);
      cancelAnimation(pop);
      cancelAnimation(draw);
    };
  }, [backdrop, draw, light, pop, reducedMotion]);

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
  const raysStyle = useAnimatedStyle(() => ({
    opacity: light.value,
    transform: [{ scale: 0.6 + 0.4 * light.value }, { rotate: `${spin.value * 360}deg` }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: 0.6 + 0.4 * pop.value }],
  }));
  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - draw.value),
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
      <View style={styles.center}>
        <View style={styles.badgeWrap}>
          <Animated.View style={[styles.rays, raysStyle]}>
            <Svg width={RAYS_SIZE} height={RAYS_SIZE}>
              <Defs>
                <RadialGradient id="celebrationRays" cx="50%" cy="50%" r="50%">
                  <Stop offset="0.25" stopColor={colors.celebrationGlow.core} stopOpacity={1} />
                  <Stop offset="1" stopColor={colors.celebrationGlow.core} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Path d={RAYS} fill="url(#celebrationRays)" />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.lip, badgeStyle]}>
            <View style={styles.face}>
              <Svg width={CHECK_SIZE} height={CHECK_SIZE} viewBox="0 0 24 24">
                <AnimatedPath
                  d={CHECK_PATH}
                  fill="none"
                  stroke={colors.background.card}
                  strokeWidth={3.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={CHECK_LENGTH}
                  animatedProps={checkProps}
                />
              </Svg>
            </View>
          </Animated.View>
        </View>

        <RiseUnlessReducedMotion
          delay={TITLE_AT_MS}
          reducedMotion={reducedMotion}
          style={styles.copy}
        >
          <Text style={styles.title}>{title}</Text>
          {statusMessage ? (
            <Text accessibilityRole="progressbar" accessibilityLiveRegion="polite" style={styles.status}>
              {statusMessage}
            </Text>
          ) : null}
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
  badgeWrap: {
    width: CIRCLE_SIZE,
    height: BADGE_HEIGHT,
  },
  rays: {
    position: 'absolute',
    width: RAYS_SIZE,
    height: RAYS_SIZE,
    left: (CIRCLE_SIZE - RAYS_SIZE) / 2,
    top: (BADGE_HEIGHT - RAYS_SIZE) / 2,
  },
  lip: {
    width: CIRCLE_SIZE,
    height: BADGE_HEIGHT,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: CHUNKY_TONE.lip,
  },
  face: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: CHUNKY_TONE.face,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
  },
  status: {
    ...typography.body.medium,
    position: 'absolute',
    top: '100%',
    width: '100%',
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center',
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
