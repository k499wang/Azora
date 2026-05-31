import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingHapticSlider from '../OnboardingHapticSlider';

interface StressScreenProps {
  value: number;
  stepIndex: number;
  stepCount: number;
  onChange: (value: number) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

function descriptorFor(value: number): string {
  if (value <= 2) return 'Mostly calm';
  if (value <= 4) return 'A little tense';
  if (value <= 6) return 'Noticeably stressed';
  if (value <= 8) return 'Very stressed';
  return 'Overwhelmed';
}

function accentForStress(value: number): string {
  if (value <= 2) return colors.success[500];
  if (value <= 4) return colors.primary.blue500;
  if (value <= 6) return colors.warning[500];
  if (value <= 8) return colors.orange[500];
  return colors.error[500];
}

export default function StressScreen({
  value,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
  onSkip,
}: StressScreenProps) {
  const accent = accentForStress(value);

  return (
    <OnboardingScreenLayout
      title="How stressed have you felt this past week?"
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
          <Text style={styles.scaleLabel}>Calm</Text>
          <Text style={styles.scaleLabel}>Overwhelmed</Text>
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
