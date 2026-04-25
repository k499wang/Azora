export interface OnboardingStepProps {
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}
