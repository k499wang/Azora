import { Text } from '../../common/Text';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { scaleVisual } from '../onboardingVisualScale';
import CelebratingKoala from '../../../../assets/Poses/koala_pose_celebrating.svg';

interface PlanIntroScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const VISUAL_SIZE = scaleVisual(290);
const SEAL_BOX = 52;
const SEAL_CENTER = SEAL_BOX / 2;
const SEAL_SIZE = scaleVisual(SEAL_BOX);
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

/**
 * Confetti as a still frame, not an animation: the headline is already doing
 * the celebrating, and a loop behind it would compete with the card the user is
 * meant to read. Three shapes, the way the artwork draws them — a curled
 * streamer, a four-point sparkle, and a dot — scattered as fractions of the
 * visual box so the arrangement scales with the koala on every device.
 */
const CONFETTI_BOX = 100;
/** the confetti field overhangs the koala's box a little, so nothing lands on him */
const CONFETTI_SIZE = VISUAL_SIZE * 1.12;
const CONFETTI_INSET = (CONFETTI_SIZE - VISUAL_SIZE) / 2;

/** a streamer seen mid-curl: two arcs of the same bend, capped square */
const STREAMER_PATH = 'M0 3 Q 5 -3 11 1 L 9.4 5.2 Q 4.6 2 1.6 6.6 Z';
/** a four-point star with concave sides */
const SPARKLE_PATH = 'M5 0 Q 5.9 4.1 10 5 Q 5.9 5.9 5 10 Q 4.1 5.9 0 5 Q 4.1 4.1 5 0 Z';

type ConfettiShape = 'streamer' | 'sparkle' | 'dot';

interface ConfettiPiece {
  x: number;
  y: number;
  shape: ConfettiShape;
  scale: number;
  rotate: number;
  color: string;
}

const CONFETTI_PINK = colors.playful.blush.mid;
const CONFETTI_YELLOW = colors.yellow[300];
const CONFETTI_GREEN = colors.playful.teal.mid;
const CONFETTI_BLUE = colors.primary.blue400;

const CONFETTI: ConfettiPiece[] = [
  { x: 40, y: 2, shape: 'streamer', scale: 1.1, rotate: 74, color: CONFETTI_PINK },
  { x: 55, y: 12, shape: 'sparkle', scale: 0.9, rotate: 0, color: CONFETTI_YELLOW },
  { x: 88, y: 17, shape: 'streamer', scale: 1, rotate: 128, color: CONFETTI_GREEN },
  { x: 12, y: 12, shape: 'dot', scale: 0.5, rotate: 0, color: CONFETTI_PINK },
  { x: 3, y: 26, shape: 'streamer', scale: 1, rotate: 42, color: CONFETTI_YELLOW },
  { x: 10, y: 43, shape: 'sparkle', scale: 0.8, rotate: 0, color: CONFETTI_YELLOW },
  { x: 93, y: 38, shape: 'dot', scale: 0.4, rotate: 0, color: CONFETTI_YELLOW },
  { x: 86, y: 45, shape: 'streamer', scale: 1.05, rotate: 110, color: CONFETTI_PINK },
  { x: 15, y: 55, shape: 'dot', scale: 0.35, rotate: 0, color: CONFETTI_BLUE },
  { x: 8, y: 62, shape: 'streamer', scale: 1, rotate: 16, color: CONFETTI_GREEN },
  { x: 80, y: 59, shape: 'sparkle', scale: 0.85, rotate: 0, color: CONFETTI_YELLOW },
  { x: 20, y: 70, shape: 'streamer', scale: 1, rotate: 150, color: CONFETTI_PINK },
  { x: 88, y: 69, shape: 'dot', scale: 0.4, rotate: 0, color: CONFETTI_BLUE },
  { x: 74, y: 73, shape: 'streamer', scale: 1.05, rotate: 24, color: CONFETTI_YELLOW },
  { x: 26, y: 78, shape: 'dot', scale: 0.35, rotate: 0, color: CONFETTI_YELLOW },
];

function ConfettiPieceShape({ piece }: { piece: ConfettiPiece }) {
  if (piece.shape === 'dot') {
    return <Circle cx={piece.x} cy={piece.y} r={piece.scale * 3} fill={piece.color} />;
  }

  const path = piece.shape === 'streamer' ? STREAMER_PATH : SPARKLE_PATH;
  const span = piece.shape === 'streamer' ? 11 : 10;
  const half = (span * piece.scale) / 2;

  return (
    <G
      transform={`translate(${piece.x - half} ${piece.y - half}) rotate(${piece.rotate} ${half} ${half}) scale(${piece.scale})`}
    >
      <Path d={path} fill={piece.color} />
    </G>
  );
}

function PlanCelebrationVisual() {
  return (
    <View style={styles.visual}>
      <Svg
        width={CONFETTI_SIZE}
        height={CONFETTI_SIZE}
        viewBox={`0 0 ${CONFETTI_BOX} ${CONFETTI_BOX}`}
        style={styles.confettiField}
      >
        {CONFETTI.map((piece, index) => (
          <ConfettiPieceShape key={index} piece={piece} />
        ))}
      </Svg>

      <CelebratingKoala width={VISUAL_SIZE} height={VISUAL_SIZE} />
    </View>
  );
}

function PersonalizationSeal() {
  return (
    <View style={styles.personalizationSeal}>
      <Svg width={SEAL_SIZE} height={SEAL_SIZE} viewBox={`0 0 ${SEAL_BOX} ${SEAL_BOX}`}>
        <Path
          d={PERSONALIZATION_SEAL_PATH}
          fill={colors.neutral[50]}
        />
      </Svg>
      <View style={styles.personalizationSealIcon}>
        <MaterialCommunityIcons
          name="account-circle"
          size={scaleVisual(28)}
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
    paddingBottom: spacing['2xl'],
  },
  visual: {
    width: VISUAL_SIZE,
    height: VISUAL_SIZE,
  },
  confettiField: {
    position: 'absolute',
    left: -CONFETTI_INSET,
    top: -CONFETTI_INSET,
  },
  copy: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headline: {
    fontFamily: fonts.semibold,
    fontSize: 30,
    lineHeight: 36,
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
    maxWidth: scaleVisual(310),
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
    backgroundColor: colors.background.card,
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
    marginLeft: -SEAL_SIZE / 2,
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
