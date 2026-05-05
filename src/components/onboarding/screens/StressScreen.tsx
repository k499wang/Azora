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
}

function descriptorFor(value: number): string {
  if (value <= 2) return 'Mostly calm';
  if (value <= 4) return 'A little tense';
  if (value <= 6) return 'Noticeably stressed';
  if (value <= 8) return 'Very stressed';
  return 'Overwhelmed';
}

export default function StressScreen({
  value,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
}: StressScreenProps) {
  return (
    <OnboardingScreenLayout
      title="How stressed have you felt this past week?"
      subtitle="Be honest — there's no wrong answer. Azora tunes your plan to it."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.content}>
        <Text style={styles.descriptor}>{descriptorFor(value)}</Text>

        <OnboardingHapticSlider
          min={1}
          max={10}
          value={value}
          accent={colors.warning[500]}
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
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 22,
    color: colors.text.primary,
    textAlign: 'center',
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginTop: -spacing.sm,
  },
  scaleLabel: {
    ...typography.body.small,
    fontSize: 12,
    color: colors.text.tertiary,
  },
});
