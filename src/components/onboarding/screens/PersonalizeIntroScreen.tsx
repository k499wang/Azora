import Svg, { Circle, Polyline } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';
import MochiPortrait, {
  getMochiSideroom,
} from '../../../features/room/MochiPortrait';
import { MASCOT_NAME } from '../../../features/room/mascot';
import { card, radius } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { Text } from '../../common/Text';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface PersonalizeIntroScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const BLOB_SIZE = 74;
const BLOB_HELD = 'pencil' as const;
const BLOB_FACE = 'pleased' as const;
/** the pencil and his lean widen his box; cancel both so his body stays put */
const BLOB_INSET = getMochiSideroom(BLOB_SIZE, BLOB_HELD, BLOB_FACE);
const CARD_W = 140;
const CARD_H = 156;
const CHART_W = CARD_W - spacing.md * 2;

/** the rows of "writing" on the card, as a fraction of its width */
const ROWS = [0.78, 0.54, 0.66];

/**
 * The blob holding the sheet the answers go onto — the same character from the
 * room, doing the thing the next thirty screens are for, so the assessment
 * arrives as his idea rather than as a change of subject.
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

        <Svg width={CHART_W} height={44} viewBox="0 0 100 40">
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
        <MochiPortrait
          size={BLOB_SIZE}
          expression={BLOB_FACE}
          holding={BLOB_HELD}
        />
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
          <Text style={styles.headline}>Let’s build your plan.</Text>
          <Text style={styles.sub}>
            {`A few questions shape your daily practice. Doing it is what fills ${MASCOT_NAME}’s room.`}
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
    width: CARD_W + BLOB_SIZE * 0.7,
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
    fontWeight: '500',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: colors.text.primary,
    textAlign: 'center',
  },
  sub: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
