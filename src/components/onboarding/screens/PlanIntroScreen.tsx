import { Text } from '../../common/Text';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface PlanIntroScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const VISUAL_SIZE = 240;
const RING_CENTER = VISUAL_SIZE / 2;
const RING_RADIUS = 84;
const SEGMENT_SWEEP = 100;
const SEGMENT_START_ANGLES = [-90, 30, 150];
const SEGMENT_COLORS = [
  colors.primary.blue600,
  colors.primary.blue400,
  colors.primary.blue300,
];
const SEAL_SIZE = 52;
const SEAL_CENTER = SEAL_SIZE / 2;
const SEAL_LOBE_COUNT = 12;

interface SealPoint {
  x: number;
  y: number;
}

function midpoint(from: SealPoint, to: SealPoint): SealPoint {
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  };
}

function createPersonalizationSealPath(): string {
  const points = Array.from({ length: SEAL_LOBE_COUNT * 2 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / SEAL_LOBE_COUNT;
    const radius = index % 2 === 0 ? 25 : 22;
    return {
      x: SEAL_CENTER + Math.cos(angle) * radius,
      y: SEAL_CENTER + Math.sin(angle) * radius,
    };
  });
  const start = midpoint(points[points.length - 1], points[0]);
  const curves = points
    .map((point, index) => {
      const end = midpoint(point, points[(index + 1) % points.length]);
      return `Q ${point.x} ${point.y} ${end.x} ${end.y}`;
    })
    .join(' ');

  return `M ${start.x} ${start.y} ${curves} Z`;
}

const PERSONALIZATION_SEAL_PATH = createPersonalizationSealPath();

function polarPoint(angleDegrees: number) {
  const radians = (angleDegrees * Math.PI) / 180;
  return {
    x: RING_CENTER + Math.cos(radians) * RING_RADIUS,
    y: RING_CENTER + Math.sin(radians) * RING_RADIUS,
  };
}

function arcPath(startAngle: number) {
  const start = polarPoint(startAngle);
  const end = polarPoint(startAngle + SEGMENT_SWEEP);
  return `M ${start.x} ${start.y} A ${RING_RADIUS} ${RING_RADIUS} 0 0 1 ${end.x} ${end.y}`;
}

function PlanCelebrationVisual() {
  return (
    <View style={styles.visual}>
      <Svg
        width={VISUAL_SIZE}
        height={VISUAL_SIZE}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <RadialGradient
            id="planHalo"
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={RING_CENTER}
            gradientUnits="userSpaceOnUse"
          >
            <Stop
              offset="0"
              stopColor={colors.primary.blue100}
              stopOpacity={0.95}
            />
            <Stop
              offset="0.68"
              stopColor={colors.primary.blue200}
              stopOpacity={0.32}
            />
            <Stop offset="1" stopColor={colors.primary.blue200} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Circle
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_CENTER}
          fill="url(#planHalo)"
        />
        <Circle
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke={colors.primary.blue200}
          strokeOpacity={0.55}
          strokeWidth={12}
        />

        {SEGMENT_START_ANGLES.map((startAngle, index) => (
          <Path
            key={startAngle}
            d={arcPath(startAngle)}
            fill="none"
            stroke={SEGMENT_COLORS[index]}
            strokeWidth={12}
            strokeLinecap="round"
          />
        ))}
      </Svg>

      <View style={styles.centerDisc} />
      <View style={styles.centerIcon}>
        <Icon name="sparkle" size={64} color={colors.primary.blue600} />
      </View>
    </View>
  );
}

function PersonalizationSeal() {
  return (
    <View style={styles.personalizationSeal}>
      <Svg width={SEAL_SIZE} height={SEAL_SIZE} viewBox="0 0 52 52">
        <Path
          d={PERSONALIZATION_SEAL_PATH}
          fill={colors.neutral[50]}
        />
      </Svg>
      <View style={styles.personalizationSealIcon}>
        <MaterialCommunityIcons
          name="account-circle"
          size={28}
          color={colors.primary.blue600}
        />
      </View>
    </View>
  );
}

function PersonalizedPlanCard() {
  return (
    <View style={styles.planCardOuter}>
      <View style={styles.planCardWrap}>
        <View style={styles.planCard}>
          <Text style={styles.planCardTitle}>Personalized to your goals</Text>
          <Text style={styles.planCardBody}>
            {'We’ll use your answers to tailor your plan, targets, and recommendations.'}
          </Text>
        </View>
        <PersonalizationSeal />
      </View>
    </View>
  );
}

export default function PlanIntroScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: PlanIntroScreenProps) {
  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Build my plan" onPress={onContinue} />}
    >
      <View style={styles.stage}>
        <PlanCelebrationVisual />
        <View style={styles.copy}>
          <Text style={styles.headline}>Time to generate your custom plan!</Text>
          <PersonalizedPlanCard />
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
    gap: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  visual: {
    width: VISUAL_SIZE,
    height: VISUAL_SIZE,
  },
  centerDisc: {
    position: 'absolute',
    left: RING_CENTER - 60,
    top: RING_CENTER - 60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background.elevated,
    borderWidth: 1.5,
    borderColor: colors.primary.blue200,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  centerIcon: {
    position: 'absolute',
    left: RING_CENTER - 60,
    top: RING_CENTER - 60,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.md,
  },
  headline: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  planCardOuter: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  planCardWrap: {
    width: '100%',
    maxWidth: 310,
    position: 'relative',
    overflow: 'visible',
  },
  planCard: {
    marginTop: spacing.xl,
    borderRadius: 16,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm + spacing.xs,
    gap: spacing.xs,
    backgroundColor: colors.background.elevated,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  personalizationSeal: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -SEAL_CENTER,
    width: SEAL_SIZE,
    height: SEAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    elevation: 3,
  },
  personalizationSealIcon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCardTitle: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 26,
    color: colors.text.primary,
    textAlign: 'center',
  },
  planCardBody: {
    ...typography.body.medium,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
