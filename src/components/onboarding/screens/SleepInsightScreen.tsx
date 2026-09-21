import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingVisualIntro from '../OnboardingVisualIntro';

interface SleepInsightScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function SleepInsightScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: SleepInsightScreenProps) {
  return (
    <OnboardingScreenLayout
      title=""
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <OnboardingVisualIntro
        image="azoSleeping"
        title="When your day feels scattered, bedtime is often where it catches up with you."
        subtitle="We’ll help you make winding down feel a little less like another thing to manage."
      />
    </OnboardingScreenLayout>
  );
}
