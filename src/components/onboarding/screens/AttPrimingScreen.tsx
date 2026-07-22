import { Text } from '../../common/Text';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { card } from '../../../theme/card';

const ARROW_WIDTH = 60;
const ARROW_HEIGHT = 116;
const ARROW_XML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 52" width="${ARROW_WIDTH}" height="${ARROW_HEIGHT}">
  <path d="M11 49 C 9 36 14 28 14 8" fill="none" stroke="${colors.primary.blue600}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M7.5 17 L14 8 L20.5 17" fill="none" stroke="${colors.primary.blue600}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface AttPrimingScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

function AttPromptPreview() {
  return (
    <View style={styles.prompt}>
      <View style={styles.promptHeader}>
        <Text style={styles.promptTitle}>
          Allow “Azora” to track your activity across other companies’ apps and
          websites?
        </Text>
        <Text style={styles.promptBody}>
          Allowing this keeps your experience tailored to you as Azora keeps
          getting better.
        </Text>
      </View>
      <View style={styles.promptDivider} />
      <View style={styles.promptButton}>
        <Text style={styles.promptDenyText}>Ask App Not to Track</Text>
      </View>
      <View style={styles.promptDivider} />
      <View style={styles.promptButton}>
        <Text style={styles.promptAllowText}>Allow</Text>
      </View>
    </View>
  );
}

export default function AttPrimingScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
  onSkip,
}: AttPrimingScreenProps) {
  return (
    <OnboardingScreenLayout
      title="Make Azora better for you"
      subtitle="You’ll see this in just a moment. Tap Allow so Azora keeps working around you."
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.body}>
        <View style={styles.promptWrap}>
          <AttPromptPreview />
          <View style={styles.arrow}>
            <SvgXml xml={ARROW_XML} width={ARROW_WIDTH} height={ARROW_HEIGHT} />
          </View>
        </View>

        <Text style={styles.reassurance}>
          Allowing this keeps what you see relevant to you — and you can change
          it anytime in Settings.
        </Text>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: spacing.xl,
  },
  prompt: {
    ...card.shadow,
    alignSelf: 'center',
    width: 272,
    borderRadius: 14,
    backgroundColor: colors.background.elevated,
    overflow: 'hidden',
  },
  promptHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  promptTitle: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 15,
    lineHeight: 19,
    textAlign: 'center',
    color: colors.text.primary,
  },
  promptBody: {
    ...typography.caption.caption1,
    fontSize: 12.5,
    lineHeight: 16,
    textAlign: 'center',
    color: colors.text.secondary,
  },
  promptDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.neutral[200],
  },
  promptButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptAllowText: {
    fontSize: 17,
    color: colors.primary.blue600,
  },
  promptDenyText: {
    fontSize: 17,
    color: colors.primary.blue600,
  },
  promptWrap: {
    alignItems: 'center',
  },
  arrow: {
    marginTop: spacing.xs,
    alignItems: 'center',
  },
  reassurance: {
    ...typography.body.small,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
});
