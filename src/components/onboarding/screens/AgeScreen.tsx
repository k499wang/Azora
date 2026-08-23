import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingHapticSlider from '../OnboardingHapticSlider';
import MochiAside from '../MochiAside';

interface AgeScreenProps {
  value: number;
  stepIndex: number;
  stepCount: number;
  onChange: (value: number) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export default function AgeScreen({
  value,
  stepIndex,
  stepCount,
  onChange,
  onContinue,
  onBack,
  onSkip,
}: AgeScreenProps) {
  return (
    <OnboardingScreenLayout
      title=""
      titleSlot={
        <MochiAside
          text="How old are you?"
          variant="question"
          expression="happy"
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
