import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingHapticSlider from '../OnboardingHapticSlider';
import { colors } from '../../../theme/colors';

interface DailyTimeScreenProps {
  value: number;
  stepIndex: number;
  stepCount: number;
  onChange: (value: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function DailyTimeScreen({
  value,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
}: DailyTimeScreenProps) {
  return (
    <OnboardingScreenLayout
      title="How much time can you give?"
      subtitle="A few minutes a day is enough to see real change."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <OnboardingHapticSlider
        min={1}
        max={30}
        value={value}
        unit={value === 1 ? 'min / day' : 'min / day'}
        accent={colors.success[500]}
        onChange={onChange}
      />
    </OnboardingScreenLayout>
  );
}
