import { useState } from 'react';
import IntentQuestionScreen from './screens/IntentQuestionScreen';
import type { OnboardingStep } from './types';

interface OnboardingFlowProps {
  onComplete: (onboardingGoal: string) => Promise<void>;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step] = useState<OnboardingStep>('intent');
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectIntent = (intentId: string) => {
    if (isSubmitting) return;

    setSelectedIntent(intentId);
    setErrorMessage(null);
  };

  const completeIntentStep = async () => {
    if (isSubmitting || selectedIntent == null) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onComplete(selectedIntent);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  if (step === 'intent') {
    return (
      <IntentQuestionScreen
        selectedIntent={selectedIntent}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onSelect={selectIntent}
        onContinue={completeIntentStep}
      />
    );
  }

  return null;
}
