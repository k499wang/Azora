import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingVisualIntro from '../OnboardingVisualIntro';

interface BaselineIntroScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function BaselineIntroScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: BaselineIntroScreenProps) {
  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      enableNavigationHaptics={false}
      footer={
        <OnboardingPrimaryButton
          label="Read my heart"
          onPress={onContinue}
          enableHaptics={false}
        />
      }
    >
      <OnboardingVisualIntro
        image="heartHealthMascot"
        title="Let’s get to know your heart."
        subtitle="A quick camera reading estimates your current heart rate and gives you a personal baseline to follow over time."
      />
    </OnboardingScreenLayout>
  );
}
