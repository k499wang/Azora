import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import CleaningPreviewScene from './CleaningPreviewScene';

interface CleaningPreviewScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function CleaningPreviewScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: CleaningPreviewScreenProps) {
  return (
    <OnboardingScreenLayout
      title="See where to start cleaning with one photo."
      subtitle="Azo’s AI helper turns your photo into small cleaning steps."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <CleaningPreviewScene />
    </OnboardingScreenLayout>
  );
}

