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
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function FounderNoteScreen({
  name,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: FounderNoteScreenProps) {
  const title = name ? `${name}, before you start` : 'Before you start';

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
          Azora started less like a product and more like a note we kept leaving
          ourselves: pause, breathe, give your body a second to catch up.
        </Text>

        <Text style={styles.paragraph}>
          Breathing was the thing we came back to when our heads were loud and
          our bodies would not settle. Not because it fixed everything, but
          because it gave us something real to do in the moment.
        </Text>

        <Text style={styles.paragraph}>
          So we built Azora around that feeling: short sessions, clear guidance,
          and a way to notice your body responding. We still make it closely,
          word by word and session by session, trying to keep it human.
        </Text>

        <Text style={styles.paragraph}>
          If Azora ever feels useful, that means a lot to us. If something feels
          off, that matters too. We read what comes in because this only gets
          better when real people tell us where it missed.
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
