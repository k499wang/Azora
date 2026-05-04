import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingHapticSlider from '../OnboardingHapticSlider';

interface AgeScreenProps {
  value: number;
  stepIndex: number;
  stepCount: number;
  onChange: (value: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function AgeScreen({
  value,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
}: AgeScreenProps) {
  return (
    <OnboardingScreenLayout
      title="How old are you?"
      subtitle="Azora tunes guidance to your age."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <OnboardingHapticSlider
        min={13}
        max={100}
        value={value}
        unit="years"
        onChange={onChange}
      />
    </OnboardingScreenLayout>
  );
}
