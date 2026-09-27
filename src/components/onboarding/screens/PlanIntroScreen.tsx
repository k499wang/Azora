import { Text } from '../../common/Text';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import ReviewCard from '../ReviewCard';
import { PLAN_REVIEW } from '../../../data/paywallTestimonials';
import { scaleVisual } from '../onboardingVisualScale';
import CelebratingKoala from '../../../../assets/Poses/koala_pose_celebrating.svg';

interface PlanIntroScreenProps {
  name: string | null;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const VISUAL_SIZE = scaleVisual(250);
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

export default function PlanIntroScreen({
  name,
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
          <Text style={styles.headline}>
            {name ? `Everything's in, ${name}.` : "Everything's in."}
            {'\n'}
            Let's build your plan.
          </Text>
          <View style={styles.review}>
            <ReviewCard review={PLAN_REVIEW} showTitle />
          </View>
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
  review: {
    alignSelf: 'stretch',
    marginTop: spacing.xl,
  },
});
