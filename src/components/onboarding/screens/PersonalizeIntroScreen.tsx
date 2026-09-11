import Svg, { Circle, Polyline } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';
import AzoPortrait from '../../../features/mascot/AzoPortrait';
import { AZO_MARGIN } from '../../../features/mascot/azoPaths';
import { card, radius } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts } from '../../../theme/typography';
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

const BLOB_SIZE = scaleVisual(144);
/** his box carries the room his ears wobble into; cancel it so his body stays put */
const BLOB_INSET = BLOB_SIZE * AZO_MARGIN;
const BLOB_BODY_W = BLOB_SIZE - BLOB_INSET * 2;
/** how far his shoulder crosses onto the sheet, so he is holding it rather than stood beside it */
const BLOB_OVERLAP = BLOB_BODY_W * 0.4;
const CARD_W = scaleVisual(140);
const CARD_H = scaleVisual(156);
const CHART_W = CARD_W - spacing.md * 2;

/** the rows of "writing" on the card, as a fraction of its width */
const ROWS = [0.78, 0.54, 0.66];

/**
 * Azo holding the sheet the answers go onto — the same character from the room,
 * doing the thing the next thirty screens are for, so the assessment arrives as
 * his idea rather than as a change of subject.
 */
function PersonalizeIllustration() {
  return (
    <View style={styles.illustration}>
      <View style={styles.card}>
        {ROWS.map((rowWidth, index) => (
          <View
            key={index}
            style={[styles.row, { width: `${rowWidth * 100}%` }]}
          />
        ))}

        <Svg width={CHART_W} height={scaleVisual(44)} viewBox="0 0 100 40">
          <Polyline
            points="4,32 28,20 52,26 76,8 96,14"
            fill="none"
            stroke={colors.primary.blue600}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[
            [28, 20],
            [76, 8],
          ].map(([cx, cy]) => (
            <Circle
              key={cx}
              cx={cx}
              cy={cy}
              r={4.5}
              fill={colors.primary.blue600}
            />
          ))}
        </Svg>
      </View>

      {/* overlapping the card's lower-left corner, so he reads as holding it */}
      <View style={[styles.blob, { left: -BLOB_INSET }]}>
        <AzoPortrait size={BLOB_SIZE} active={false} />
      </View>
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
        <PersonalizeIllustration />

        <View style={styles.copy}>
          <Text style={styles.headline}>
            First, let’s personalize Azora for you.
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
    width: CARD_W + BLOB_BODY_W - BLOB_OVERLAP,
    height: CARD_H + spacing.md,
    marginBottom: spacing.lg,
  },
  card: {
    ...card.base,
    ...card.shadow,
    position: 'absolute',
    right: 0,
    top: 0,
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    height: 8,
    borderRadius: radius.xs,
    backgroundColor: colors.border.subtle,
  },
  blob: {
    position: 'absolute',
    bottom: 0,
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
});
