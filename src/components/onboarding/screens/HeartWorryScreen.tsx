import { Text } from '../../common/Text';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingHapticSlider from '../OnboardingHapticSlider';

interface HeartWorryScreenProps {
  value: number;
  stepIndex: number;
  stepCount: number;
  onChange: (value: number) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

function descriptorFor(value: number): string {
  if (value <= 2) return 'Rarely crosses my mind';
  if (value <= 4) return 'Now and then';
  if (value <= 6) return 'More than I’d like';
  if (value <= 8) return 'Often on my mind';
  return 'It weighs on me';
}

function accentForWorry(value: number): string {
  if (value <= 2) return colors.success[500];
  if (value <= 4) return colors.primary.blue500;
  if (value <= 6) return colors.warning[500];
  if (value <= 8) return colors.orange[500];
  return colors.error[500];
}

export default function HeartWorryScreen({
  value,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
  onSkip,
}: HeartWorryScreenProps) {
  const accent = accentForWorry(value);

  return (
    <OnboardingScreenLayout
      title="How much do you worry about your heart health?"
      subtitle="There's no wrong answer. Azora tunes your plan to it."
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      centerBody
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.content}>
        <Text style={[styles.descriptor, { color: accent }]}>{descriptorFor(value)}</Text>

        <OnboardingHapticSlider
          min={1}
          max={10}
          value={value}
          accent={accent}
          onChange={onChange}
        />

        <View style={styles.scaleRow}>
          <Text style={styles.scaleLabel}>Rarely</Text>
          <Text style={styles.scaleLabel}>Constantly</Text>
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  descriptor: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 22,
    color: colors.text.primary,
    textAlign: 'center',
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.sm,
  },
  scaleLabel: {
    ...typography.body.small,
    fontSize: 12,
    color: colors.text.tertiary,
  },
});
