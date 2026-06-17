import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { card } from '../../../theme/card';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

const SIGNATURE_IMAGE = require('../../../../assets/signature.png');

const LETTER_DATE = new Date().toLocaleDateString('en-US', {
  month: 'long',
  year: 'numeric',
});

interface FounderNoteScreenProps {
  name: string | null;
  intentTitle: string | null;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

function toGoalPhrase(intentTitle: string | null): string {
  const trimmed = intentTitle?.trim();
  if (!trimmed) return 'feel calmer and more in control';
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

export default function FounderNoteScreen({
  name,
  intentTitle,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: FounderNoteScreenProps) {
  const title = name ? `${name}, before you start` : 'Before you start';
  const goalPhrase = toGoalPhrase(intentTitle);

  return (
    <OnboardingScreenLayout
      title={title}
      subtitle="We wanted to say one thing first."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={[card.paper, styles.note]}>
        <View style={styles.noteHead}>
          <Text style={styles.fromLabel}>From Azora,</Text>
          <Text style={styles.dateLabel}>{LETTER_DATE}</Text>
        </View>

        <Text style={styles.paragraph}>
          We made Azora because breathing got us through things nothing else
          touched, and it always bugged us that nobody really teaches you how to
          do it.
        </Text>

        <Text style={styles.paragraph}>
          So we kept it small. A few real minutes a day, pointed at {goalPhrase}.
          We cut the guilt trips and the clutter, because that stuff never kept us
          coming back either.
        </Text>

        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>
            We're a tiny team and we read what comes in. If something annoys you,
            or you wish Azora did something it doesn't yet, hit{' '}
            <Text style={styles.bubbleEmphasis}>Send feedback</Text> in Settings.
            It lands straight with us.
          </Text>
        </View>

        <View style={styles.signature}>
          <Text style={styles.signOff}>Breathe easy,</Text>
          <Image
            source={SIGNATURE_IMAGE}
            style={styles.signatureImage}
            resizeMode="contain"
          />
          <Text style={styles.signName}>— The Azora team</Text>
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  note: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  noteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fromLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  dateLabel: {
    ...typography.body.small,
    color: colors.text.tertiary,
  },
  paragraph: {
    ...typography.body.medium,
    color: colors.text.primary,
    lineHeight: 23,
  },
  bubble: {
    alignSelf: 'stretch',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 22,
    borderBottomLeftRadius: 6,
    backgroundColor: colors.primary.blue100,
  },
  bubbleText: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  bubbleEmphasis: {
    fontFamily: fonts.semibold,
    color: colors.primary.blue700,
  },
  signature: {
    gap: spacing.xs,
  },
  signOff: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  signatureImage: {
    width: '100%',
    height: 160,
    marginTop: spacing.xs,
  },
  signName: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
});
