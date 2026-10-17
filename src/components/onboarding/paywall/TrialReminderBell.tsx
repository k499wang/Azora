import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Text } from '../../common/Text';
import { useWhileVisible } from '../../../hooks/useWhileVisible';
import { colors } from '../../../theme/colors';
import { spring } from '../../../theme/motion';
import { fonts, typography } from '../../../theme/typography';
import { scaleVisual } from '../onboardingVisualScale';

const SIZE = scaleVisual(280);
const VIEWBOX = 200;
const u = SIZE / VIEWBOX;

const RING_MS = 2400;
const REST_MS = 600;
const SWING_DEG = 20;
const OSCILLATIONS = 5;
const CLAPPER_GAIN = -1.5;
const CLAPPER_LAG = 0.035;
const SWAY_PX = 0.35;
const OUTER_WAVE_LAG = 0.3;

const BELL_PIVOT = { x: 100, y: 30 };
const CLAPPER_PIVOT = { x: 100, y: 146 };
const BADGE = { x: 146, y: 54, d: 36 };

// One continuous damped swing: eased in so it never jerks off the mark, then
// decaying smoothly to rest — no segment boundaries for the motion to snag on.
function envelope(t: number) {
  'worklet';
  if (t <= 0 || t >= 1) {
    return 0;
  }
  const rise = Math.min(1, t / 0.12);
  const attack = rise * rise * (3 - 2 * rise);
  return attack * Math.pow(1 - t, 1.5);
}

function ringAngle(t: number) {
  'worklet';
  return SWING_DEG * envelope(t) * Math.sin(2 * Math.PI * OSCILLATIONS * t);
}

// A wave leaves the bell on every full swing, fading in and out on a sine so
// it never pops, and shrinking with the swing as the ring dies away.
function wavePulse(t: number, lag: number) {
  'worklet';
  const cycles = OSCILLATIONS * t - 0.25 - lag;
  if (cycles < 0) {
    return { opacity: 0, progress: 0 };
  }
  const progress = cycles - Math.floor(cycles);
  return { opacity: envelope(t) * Math.sin(Math.PI * progress), progress };
}

export function TrialReminderBell() {
  const ring = useSharedValue(0);
  const badgePop = useSharedValue(0);

  useWhileVisible(() => {
    ring.value = 0;
    badgePop.value = withDelay(260, withSpring(1, spring.bounce));
    ring.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: RING_MS, easing: Easing.linear }),
          withDelay(REST_MS, withTiming(0, { duration: 0 })),
        ),
        -1,
        false,
      ),
    );

    return () => {
      cancelAnimation(ring);
      cancelAnimation(badgePop);
    };
  }, [ring, badgePop]);

  const bellStyle = useAnimatedStyle(() => {
    const angle = ringAngle(ring.value);
    return {
      transform: [{ translateX: angle * SWAY_PX * u }, { rotate: `${angle}deg` }],
    };
  });
  const clapperStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${CLAPPER_GAIN * ringAngle(ring.value - CLAPPER_LAG)}deg` }],
  }));
  const innerWaveStyle = useAnimatedStyle(() => {
    const pulse = wavePulse(ring.value, 0);
    return {
      opacity: pulse.opacity,
      transform: [{ scale: 0.9 + pulse.progress * 0.18 }],
    };
  });
  const outerWaveStyle = useAnimatedStyle(() => {
    const pulse = wavePulse(ring.value, OUTER_WAVE_LAG);
    return {
      opacity: pulse.opacity * 0.8,
      transform: [{ scale: 0.9 + pulse.progress * 0.22 }],
    };
  });
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgePop.value }],
  }));

  return (
    <View style={styles.stage}>
      <Animated.View style={[StyleSheet.absoluteFill, innerWaveStyle]}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
          <Path
            d="M44 72Q32 94 44 116"
            stroke={colors.reward.gold}
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M156 72Q168 94 156 116"
            stroke={colors.reward.gold}
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, outerWaveStyle]}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
          <Path
            d="M28 60Q10 94 28 128"
            stroke={colors.reward.goldSheen}
            strokeWidth={7}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M172 60Q190 94 172 128"
            stroke={colors.reward.goldSheen}
            strokeWidth={7}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transformOrigin: [BELL_PIVOT.x * u, BELL_PIVOT.y * u, 0] },
          bellStyle,
        ]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { transformOrigin: [CLAPPER_PIVOT.x * u, CLAPPER_PIVOT.y * u, 0] },
            clapperStyle,
          ]}
        >
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
            <Rect
              x={96}
              y={146}
              width={8}
              height={20}
              rx={4}
              fill={colors.reward.goldLip}
            />
            <Circle cx={100} cy={172} r={14} fill={colors.reward.goldLip} />
          </Svg>
        </Animated.View>

        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
          <Circle cx={100} cy={32} r={12} fill={colors.reward.goldLip} />
          <Circle cx={100} cy={32} r={5} fill={colors.reward.gold} />
          <Path
            d="M100 40C70 40 56 64 56 94V124C56 134 48 140 44 148H156C152 140 144 134 144 124V94C144 64 130 40 100 40Z"
            fill={colors.reward.gold}
          />
          <Path
            d="M74 72Q66 92 70 120"
            stroke={colors.reward.goldSheen}
            strokeWidth={9}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={82} cy={60} r={4.5} fill={colors.reward.goldSheen} />
          <Rect
            x={34}
            y={150}
            width={132}
            height={18}
            rx={9}
            fill={colors.reward.goldLip}
          />
          <Rect
            x={34}
            y={142}
            width={132}
            height={18}
            rx={9}
            fill={colors.reward.gold}
          />
        </Svg>

        <Animated.View style={[styles.badge, badgeStyle]}>
          <Text style={styles.badgeText}>1</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: SIZE,
    height: SIZE,
  },
  badge: {
    position: 'absolute',
    left: (BADGE.x - BADGE.d / 2) * u,
    top: (BADGE.y - BADGE.d / 2) * u,
    minWidth: BADGE.d * u,
    height: BADGE.d * u,
    borderRadius: (BADGE.d / 2) * u,
    borderWidth: 3 * u,
    borderColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error[500],
  },
  badgeText: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    color: colors.neutral[0],
  },
});

export default TrialReminderBell;
