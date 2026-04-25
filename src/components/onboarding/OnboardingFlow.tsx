import React, { useState, useCallback } from 'react';
import type { OnboardingStepProps } from './types';
import { PlaceholderScreen } from './steps/PlaceholderScreen';

// ─── Add, remove, or reorder steps here. Nothing else needs to change. ───────
const STEPS: React.ComponentType<OnboardingStepProps>[] = [
  PlaceholderScreen,
];
// ─────────────────────────────────────────────────────────────────────────────

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [index, setIndex] = useState(0);

  const handleNext = useCallback(() => {
    if (index < STEPS.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onComplete();
    }
  }, [index, onComplete]);

  const handleBack = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  const Step = STEPS[index];
  return (
    <Step
      onNext={handleNext}
      onBack={handleBack}
      stepIndex={index}
      totalSteps={STEPS.length}
    />
  );
}
