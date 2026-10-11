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
  type SharedValue,
  useAnimatedProps,
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

/** where each moving part pivots: the stem in the soil, each leaf on the stem */
const STEM_BASE = { x: 100, y: 118 };
const LEFT_LEAF_BASE = { x: 100, y: 72 };
const RIGHT_LEAF_BASE = { x: 100, y: 66 };
const SOIL_BASE = { x: 100, y: 124 };
const POT_FOOT = { x: 100, y: 207 };

/** a touch longer than the stem's ~53 units, so one dash covers it whole */
const STEM_DASH = 56;
const LAND_SQUASH = 0.04;
const SOIL_HEAVE = 0.18;
const LEAF_FOLD_DEGREES = 35;
const LEAF_BUD_SCALE = 0.25;
const SWAY_DEGREES = 3;
const LEAF_TRAIL_DEGREES = 1.75;

const POT_IN_MS = 120;
const LAND_AT_MS = POT_IN_MS + duration.fast;
const STEM_AT_MS = LAND_AT_MS + duration.base;
/** the stem's easing front-loads its growth, so this is ~85% of the way up */
const LEAVES_AT_MS = STEM_AT_MS + duration.fast;
const RIGHT_LEAF_AT_MS = LEAVES_AT_MS + stagger.base;
const SWAY_AT_MS = RIGHT_LEAF_AT_MS + duration.fill;
const SWAY_SWING_MS = duration.fill * 2;
/** a quarter period behind the stem, so the leaves trail it like foliage */
const LEAF_TRAIL_MS = SWAY_SWING_MS / 2;

const AnimatedPath = Reanimated.createAnimatedComponent(Path);

function origin(point: { x: number; y: number }) {
  return { transformOrigin: [point.x * UNIT, point.y * UNIT, 0] };
}

function swayFromRest(delayMs: number) {
  const swing = (to: number) =>
    withTiming(to, { duration: SWAY_SWING_MS, easing: easing.breathe });
  return withDelay(
    delayMs,
    withSequence(swing(1), withRepeat(withSequence(swing(-1), swing(1)), -1)),
  );
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

function LeafGradient() {
  return (
    <Defs>
      <LinearGradient id="seedlingLeaf" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={colors.playful.teal.mid} />
        <Stop offset="1" stopColor={colors.playful.teal.base} />
      </LinearGradient>
    </Defs>
  );
}

interface UnfurlingLeafProps {
  unfurl: SharedValue<number>;
  trail: SharedValue<number>;
  base: { x: number; y: number };
  /** the bud's starting angle, folded in against the stem */
  foldDegrees: number;
  blade: string;
  vein: string;
}

function UnfurlingLeaf({
  unfurl,
  trail,
  base,
  foldDegrees,
  blade,
  vein,
}: UnfurlingLeafProps) {
  const leafStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, unfurl.value * 2),
    transform: [
      {
        rotate: `${(1 - unfurl.value) * foldDegrees + trail.value * LEAF_TRAIL_DEGREES}deg`,
      },
      { scale: LEAF_BUD_SCALE + (1 - LEAF_BUD_SCALE) * unfurl.value },
    ],
  }));

  return (
    <Reanimated.View style={[StyleSheet.absoluteFill, origin(base), leafStyle]}>
      <Layer>
        <LeafGradient />
        <Path d={blade} fill="url(#seedlingLeaf)" />
        <Path
          d={vein}
          fill="none"
          stroke={colors.playful.teal.ink}
          strokeOpacity={0.25}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Layer>
    </Reanimated.View>
  );
}

/**
 * A seed sprouting in a pot: the plan as something the answers grow, rather
 * than a form being filled in.
 */
function SeedlingIllustration() {
  const potShown = useSharedValue(0);
  const pot = useSharedValue(0);
  const land = useSharedValue(0);
  const heave = useSharedValue(0);
  const stem = useSharedValue(0);
  const leftLeaf = useSharedValue(0);
  const rightLeaf = useSharedValue(0);
  const sway = useSharedValue(0);
  const trail = useSharedValue(0);

  useEffect(() => {
    potShown.value = withDelay(
      POT_IN_MS,
      withTiming(1, { duration: duration.fast }),
    );
    pot.value = withDelay(POT_IN_MS, withSpring(1, spring.settle));
    land.value = withDelay(
      LAND_AT_MS,
      withSequence(
        withTiming(1, { duration: duration.fast, easing: easing.enter }),
        withSpring(0, spring.settle),
      ),
    );
    heave.value = withDelay(
      STEM_AT_MS,
      withSequence(
        withTiming(1, { duration: duration.base, easing: easing.enter }),
        withSpring(0, spring.settle),
      ),
    );
    stem.value = withDelay(
      STEM_AT_MS,
      withTiming(1, { duration: duration.slower, easing: easing.settle }),
    );
    leftLeaf.value = withDelay(LEAVES_AT_MS, withSpring(1, spring.unfurl));
    rightLeaf.value = withDelay(RIGHT_LEAF_AT_MS, withSpring(1, spring.unfurl));
    sway.value = swayFromRest(SWAY_AT_MS);
    trail.value = swayFromRest(SWAY_AT_MS + LEAF_TRAIL_MS);
    return startUiTimer(LEAVES_AT_MS, triggerSoftHaptic);
  }, [potShown, pot, land, heave, stem, leftLeaf, rightLeaf, sway, trail]);

  const potStyle = useAnimatedStyle(() => ({
    opacity: potShown.value,
    transform: [
      { translateY: (1 - pot.value) * travel.drop },
      { scaleX: 1 + land.value * LAND_SQUASH },
      { scaleY: 1 - land.value * LAND_SQUASH },
    ],
  }));
  const swayStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sway.value * SWAY_DEGREES}deg` }],
  }));
  const soilStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: 1 + heave.value * SOIL_HEAVE }],
  }));
  const stemProps = useAnimatedProps(() => ({
    strokeDashoffset: STEM_DASH * (1 - stem.value),
    // a zero-length dash still draws its round cap as a dot at the base
    strokeOpacity: stem.value > 0 ? 1 : 0,
  }));

  return (
    <Reanimated.View style={[styles.illustration, origin(POT_FOOT), potStyle]}>
      <Reanimated.View
        style={[StyleSheet.absoluteFill, origin(STEM_BASE), swayStyle]}
      >
        <Layer>
          <AnimatedPath
            animatedProps={stemProps}
            d="M100 118 C100 100 102 86 100 66"
            fill="none"
            stroke={colors.playful.teal.base}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={STEM_DASH}
          />
        </Layer>
        <UnfurlingLeaf
          unfurl={leftLeaf}
          trail={trail}
          base={LEFT_LEAF_BASE}
          foldDegrees={LEAF_FOLD_DEGREES}
          blade="M100 72 C86 74 68 66 60 44 C80 40 97 52 100 72 Z"
          vein="M100 72 Q86 60 66 47"
        />
        <UnfurlingLeaf
          unfurl={rightLeaf}
          trail={trail}
          base={RIGHT_LEAF_BASE}
          foldDegrees={-LEAF_FOLD_DEGREES}
          blade="M100 66 C114 66 134 56 142 32 C120 28 103 42 100 66 Z"
          vein="M100 66 Q116 52 137 36"
        />
      </Reanimated.View>

      <Reanimated.View
        style={[StyleSheet.absoluteFill, origin(SOIL_BASE), soilStyle]}
      >
        <Layer>
          <Path
            d="M56 124 Q100 106 144 124 Z"
            fill={colors.playful.amber.ink}
          />
        </Layer>
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
            Let’s build your personalized plan.
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
