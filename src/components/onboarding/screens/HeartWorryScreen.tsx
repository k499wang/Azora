import { StyleSheet, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingHapticSlider from '../OnboardingHapticSlider';
import MochiAside from '../MochiAside';

interface HeartWorryScreenProps {
  value: number;
  stepIndex: number;
  stepCount: number;
  onChange: (value: number) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
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
      title=""
      titleSlot={
        <MochiAside
          text="How much do you worry about your heart health?"
          variant="question"
          expression="thinking"
          holding="notes"
          delayMs={160}
        />
      }
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      centerBody
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.content}>
        <OnboardingHapticSlider
          min={1}
          max={9}
          value={value}
          accent={accent}
          onChange={onChange}
          minLabel="It barely crosses my mind."
          maxLabel="It’s on my mind a lot."
        />
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
});
