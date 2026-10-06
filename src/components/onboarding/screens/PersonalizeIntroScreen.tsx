import { useEffect, type ReactNode } from 'react';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { duration, easing, spring, travel } from '../../../theme/motion';
import { triggerSoftHaptic } from '../../../native/tapHaptics';
import { startUiTimer } from '../../../lib/ui/uiThreadTimer';
import { Text } from '../../common/Text';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { scaleVisual } from '../onboardingVisualScale';

interface PersonalizeIntroScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

/** the drawing's own coordinate space; every layer shares it */
const VIEW_W = 200;
const VIEW_H = 220;
const ART_W = scaleVisual(240);
const UNIT = ART_W / VIEW_W;
const ART_H = VIEW_H * UNIT;

/** where the stem leaves the soil, and where the leaves leave the stem */
const STEM_BASE = { x: 100, y: 118 };
const STEM_TIP = { x: 100, y: 66 };

const POT_IN_MS = 180;
const STEM_AT_MS = POT_IN_MS + duration.base;
const LEAVES_AT_MS = STEM_AT_MS + duration.slow;
const SWAY_AT_MS = LEAVES_AT_MS + duration.slower;
const SWAY_DEGREES = 3;

function origin(point: { x: number; y: number }) {
  return { transformOrigin: [point.x * UNIT, point.y * UNIT, 0] };
}

/** one full-size layer of the drawing, so every part shares the same viewBox */
function Layer({ children }: { children: ReactNode }) {
  return (
    <Svg
      width={ART_W}
      height={ART_H}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      style={StyleSheet.absoluteFill}
    >
      {children}
    </Svg>
  );
}

/**
 * A seed sprouting in a pot: the plan as something the answers grow, rather
 * than a form being filled in.
 */
function SeedlingIllustration() {
  const pot = useSharedValue(0);
  const stem = useSharedValue(0);
  const leaves = useSharedValue(0);
  const sway = useSharedValue(0);

  useEffect(() => {
    pot.value = withDelay(
      POT_IN_MS,
      withTiming(1, { duration: duration.slow, easing: easing.enter }),
    );
    stem.value = withDelay(
      STEM_AT_MS,
      withTiming(1, { duration: duration.slow, easing: easing.settle }),
    );
    leaves.value = withDelay(LEAVES_AT_MS, withSpring(1, spring.pop));
    sway.value = withDelay(
      SWAY_AT_MS,
      withRepeat(
        withSequence(
          withTiming(1, { duration: duration.fill * 2, easing: easing.breathe }),
          withTiming(-1, { duration: duration.fill * 2, easing: easing.breathe }),
        ),
        -1,
      ),
    );
    return startUiTimer(LEAVES_AT_MS, triggerSoftHaptic);
  }, [pot, stem, leaves, sway]);

  const potStyle = useAnimatedStyle(() => ({
    opacity: pot.value,
    transform: [{ translateY: (1 - pot.value) * travel.rise }],
  }));
  const swayStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sway.value * SWAY_DEGREES}deg` }],
  }));
  const stemStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: stem.value }],
  }));
  const leavesStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, leaves.value * 2),
    transform: [{ scale: leaves.value }],
  }));

  return (
    <Reanimated.View style={[styles.illustration, potStyle]}>
      <Reanimated.View
        style={[StyleSheet.absoluteFill, origin(STEM_BASE), swayStyle]}
      >
        <Reanimated.View
          style={[StyleSheet.absoluteFill, origin(STEM_BASE), stemStyle]}
        >
          <Layer>
            <Path
              d="M100 118 C100 100 102 86 100 66"
              fill="none"
              stroke={colors.playful.teal.base}
              strokeWidth={7}
              strokeLinecap="round"
            />
          </Layer>
        </Reanimated.View>
        <Reanimated.View
          style={[StyleSheet.absoluteFill, origin(STEM_TIP), leavesStyle]}
        >
          <Layer>
            <Defs>
              <LinearGradient id="seedlingLeaf" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.playful.teal.mid} />
                <Stop offset="1" stopColor={colors.playful.teal.base} />
              </LinearGradient>
            </Defs>
            <Path
              d="M100 72 C86 74 68 66 60 44 C80 40 97 52 100 72 Z"
              fill="url(#seedlingLeaf)"
            />
            <Path
              d="M100 72 Q86 60 66 47"
              fill="none"
              stroke={colors.playful.teal.ink}
              strokeOpacity={0.25}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Path
              d="M100 66 C114 66 134 56 142 32 C120 28 103 42 100 66 Z"
              fill="url(#seedlingLeaf)"
            />
            <Path
              d="M100 66 Q116 52 137 36"
              fill="none"
              stroke={colors.playful.teal.ink}
              strokeOpacity={0.25}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Layer>
        </Reanimated.View>
      </Reanimated.View>

      <Layer>
        <Defs>
          <LinearGradient id="seedlingPot" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.playful.coral.mid} />
            <Stop offset="0.55" stopColor={colors.playful.coral.mid} />
            <Stop offset="1" stopColor={colors.playful.coral.base} />
          </LinearGradient>
          <LinearGradient id="seedlingRim" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.playful.coral.tintDeep} />
            <Stop offset="1" stopColor={colors.playful.coral.mid} />
          </LinearGradient>
        </Defs>

        <Ellipse
          cx={100}
          cy={210}
          rx={50}
          ry={6}
          fill={colors.shadowInk}
          fillOpacity={0.1}
        />
        <Path
          d="M56 124 Q100 106 144 124 Z"
          fill={colors.playful.amber.ink}
        />
        <Path
          d="M56 144 L144 144 C141 170 138 190 135 201 Q133 207 126 207 L74 207 Q67 207 65 201 C62 190 59 170 56 144 Z"
          fill="url(#seedlingPot)"
        />
        <Rect
          x={56}
          y={144}
          width={88}
          height={7}
          fill={colors.playful.coral.base}
          fillOpacity={0.55}
        />
        <Rect
          x={44}
          y={120}
          width={112}
          height={26}
          rx={12}
          fill={colors.playful.coral.base}
        />
        <Rect
          x={44}
          y={120}
          width={112}
          height={21}
          rx={11}
          fill="url(#seedlingRim)"
        />
      </Layer>
    </Reanimated.View>
  );
}

export default function PersonalizeIntroScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: PersonalizeIntroScreenProps) {
  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.stage}>
        <SeedlingIllustration />

        <View style={styles.copy}>
          <Text style={styles.headline}>
            First, let’s build your personalized plan.
          </Text>
          <Text style={styles.subtitle}>
            A few quick questions, and your plan is built around your answers.
          </Text>
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing['2xl'],
  },
  illustration: {
    width: ART_W,
    height: ART_H,
    marginBottom: spacing.lg,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  headline: {
    fontFamily: fonts.semibold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
