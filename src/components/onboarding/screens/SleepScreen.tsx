import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingHapticSlider from '../OnboardingHapticSlider';

interface SleepScreenProps {
  value: number;
  stepIndex: number;
  stepCount: number;
  onChange: (value: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

function descriptorFor(value: number): string {
  if (value <= 2) return 'Running on fumes';
  if (value <= 4) return 'Often tired';
  if (value <= 6) return 'Decent, could be better';
  if (value <= 8) return 'Mostly rested';
  return 'Fully recharged';
}

export default function SleepScreen({
  value,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
}: SleepScreenProps) {
  return (
    <OnboardingScreenLayout
      title="How rested do you feel most mornings?"
      subtitle="Sleep shapes everything — your stress, focus, and mood."
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
          accent={colors.primary.blue600}
          onChange={onChange}
        />

        <View style={styles.scaleRow}>
          <Text style={styles.scaleLabel}>Exhausted</Text>
          <Text style={styles.scaleLabel}>Recharged</Text>
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
