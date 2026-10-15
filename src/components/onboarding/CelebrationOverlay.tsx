import { Text } from '../common/Text';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
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
import Icon from '../common/icons/Icon';
import { CHUNKY_TONE } from '../common/ChunkyButton';
import { scaleVisual } from './onboardingVisualScale';

interface CelebrationOverlayProps {
  title?: string;
  onFinished?: () => void;
}

const CIRCLE_SIZE = scaleVisual(120);
const LIP_DEPTH = scaleVisual(8);
const CHECK_SIZE = CIRCLE_SIZE * 0.55;
const BADGE_HEIGHT = CIRCLE_SIZE + LIP_DEPTH;
const RAYS_SIZE = CIRCLE_SIZE * 2.8;
const RAY_COUNT = 12;
const RAY_TURN_MS = 24_000;

const POP_AT_MS = 60;
const LANDED_MS = 420;
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

/** The beat after the contract is signed: a checkmark pops in on its lip. */
export default function CelebrationOverlay({
  title = 'This is a really good start. Well done.',
  onFinished,
}: CelebrationOverlayProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const backdrop = useSharedValue(reducedMotion ? 1 : 0);
  const light = useSharedValue(reducedMotion ? 1 : 0);
  const spin = useSharedValue(0);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  useEffect(() => startUiTimer(FINISHED_MS, () => onFinishedRef.current?.()), []);

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    if (reducedMotion) return;

    backdrop.value = withTiming(1, { duration: duration.base, easing: easing.enter });
    light.value = withDelay(
      LANDED_MS,
      withTiming(1, { duration: duration.slower, easing: easing.enter }),
    );
    const cancelLanding = startUiTimer(LANDED_MS, triggerHeavyHaptic);

    return () => {
      cancelLanding();
      cancelAnimation(backdrop);
      cancelAnimation(light);
    };
  }, [backdrop, light, reducedMotion]);

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

          <RiseUnlessReducedMotion reducedMotion={reducedMotion} delay={POP_AT_MS}>
            <View style={styles.lip}>
              <View style={styles.face}>
                <Icon name="check-bold" size={CHECK_SIZE} color={colors.background.card} />
              </View>
            </View>
          </RiseUnlessReducedMotion>
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
  title: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
