import { useEffect, type ReactNode } from 'react';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';
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
import { duration, easing, spring, stagger, travel } from '../../../theme/motion';
import { triggerSoftHaptic } from '../../../native/tapHaptics';
import { startUiTimer } from '../../../lib/ui/uiThreadTimer';
import { LoopingTwinkle } from '../../common/RewardSparkles';
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
const VIEW_W = 180;
const VIEW_H = 200;
const ART_W = scaleVisual(VIEW_W);
const UNIT = ART_W / VIEW_W;
const ART_H = VIEW_H * UNIT;

/** where the stem leaves the soil, and where the leaves leave the stem */
const STEM_BASE = { x: 90, y: 110 };
const STEM_TIP = { x: 90, y: 60 };

const SPARKLES = [
  { x: 48, y: 42, size: 20 },
  { x: 134, y: 22, size: 16 },
  { x: 142, y: 76, size: 13 },
];

const POT_IN_MS = 180;
const STEM_AT_MS = POT_IN_MS + duration.base;
const LEAVES_AT_MS = STEM_AT_MS + duration.slow;
const SPARKLES_AT_MS = LEAVES_AT_MS + duration.fast;
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
    <View style={styles.illustration}>
      <Reanimated.View style={[StyleSheet.absoluteFill, potStyle]}>
        <Reanimated.View
          style={[StyleSheet.absoluteFill, origin(STEM_BASE), swayStyle]}
        >
          <Reanimated.View
            style={[StyleSheet.absoluteFill, origin(STEM_BASE), stemStyle]}
          >
            <Layer>
              <Path
                d="M90 110 C90 94 92 78 90 60"
                fill="none"
                stroke={colors.playful.teal.base}
                strokeWidth={6}
                strokeLinecap="round"
              />
            </Layer>
          </Reanimated.View>
          <Reanimated.View
            style={[StyleSheet.absoluteFill, origin(STEM_TIP), leavesStyle]}
          >
            <Layer>
              <Path
                d="M90 64 C74 64 62 54 60 38 C76 38 88 48 90 64 Z"
                fill={colors.playful.teal.mid}
              />
              <Path
                d="M90 60 C106 60 120 48 122 30 C104 30 92 42 90 60 Z"
                fill={colors.playful.teal.base}
              />
            </Layer>
          </Reanimated.View>
        </Reanimated.View>

        <Layer>
          <Ellipse
            cx={90}
            cy={110}
            rx={44}
            ry={7}
            fill={colors.playful.amber.ink}
          />
          <Path
            d="M48 128 L132 128 L122 186 Q121 192 115 192 L65 192 Q59 192 58 186 Z"
            fill={colors.playful.coral.mid}
          />
          <Rect
            x={38}
            y={110}
            width={104}
            height={24}
            rx={9}
            fill={colors.playful.coral.base}
          />
          <Rect
            x={38}
            y={110}
            width={104}
            height={18}
            rx={9}
            fill={colors.playful.coral.mid}
          />
        </Layer>
      </Reanimated.View>

      {SPARKLES.map((sparkle, index) => (
        <LoopingTwinkle
          key={index}
          x={sparkle.x * UNIT}
          y={sparkle.y * UNIT}
          size={sparkle.size * UNIT}
          color={colors.playful.amber.base}
          delay={SPARKLES_AT_MS + index * stagger.loose}
          period={duration.fill * 2}
          active
        />
      ))}
    </View>
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
