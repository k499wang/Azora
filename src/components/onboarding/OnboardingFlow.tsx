import { useMemo, useState } from 'react';
import AgeScreen from './screens/AgeScreen';
import CustomIntentScreen from './screens/CustomIntentScreen';
import DailyTimeScreen from './screens/DailyTimeScreen';
import GenderScreen from './screens/GenderScreen';
import IntentQuestionScreen from './screens/IntentQuestionScreen';
import IntentReflectionScreen from './screens/IntentReflectionScreen';
import PactScreen from './screens/PactScreen';
import { PERSONALIZED_INTENT_OPTIONS } from './data/intentOptions';
import type { GenderOption } from './data/genderOptions';
import type { OnboardingStep } from './types';

interface OnboardingFlowProps {
  onComplete: (onboardingGoal: string) => Promise<void>;
}

const STEP_COUNT = 6;
const STEP_INDEX: Record<OnboardingStep, number> = {
  intent: 1,
  intentReflection: 2,
  customIntent: 2,
  age: 3,
  gender: 4,
  dailyTime: 5,
  pact: 6,
};

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('intent');
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [customIntent, setCustomIntent] = useState('');
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<GenderOption['id'] | null>(null);
  const [dailyMinutes, setDailyMinutes] = useState(5);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOption = useMemo(
    () => PERSONALIZED_INTENT_OPTIONS.find((option) => option.id === selectedIntent) ?? null,
    [selectedIntent],
  );

  const selectIntent = (intentId: string) => {
    if (isSubmitting) return;
    setSelectedIntent(intentId);
    setErrorMessage(null);
  };

  const goFromIntent = () => {
    if (selectedIntent == null || isSubmitting) return;
    setStep(selectedIntent === 'other' ? 'customIntent' : 'intentReflection');
  };

  const finish = async () => {
    const goal = selectedIntent === 'other' ? customIntent.trim() : (selectedIntent ?? '');
    if (isSubmitting || goal.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onComplete(goal);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  const stepIndex = STEP_INDEX[step];

  if (step === 'intentReflection' && selectedOption) {
    return (
      <IntentReflectionScreen
        option={selectedOption}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        isSubmitting={isSubmitting}
        onContinue={() => setStep('age')}
        onBack={() => setStep('intent')}
      />
    );
  }

  if (step === 'customIntent') {
    return (
      <CustomIntentScreen
        value={customIntent}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onChange={setCustomIntent}
        onContinue={() => {
          if (customIntent.trim().length === 0) {
            setErrorMessage('Please share a few words.');
            return;
          }
          setStep('age');
        }}
        onBack={() => setStep('intent')}
      />
    );
  }

  if (step === 'age') {
    return (
      <AgeScreen
        value={age}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onChange={setAge}
        onContinue={() => setStep('gender')}
        onBack={() =>
          setStep(selectedIntent === 'other' ? 'customIntent' : 'intentReflection')
        }
      />
    );
  }

  if (step === 'gender') {
    return (
      <GenderScreen
        value={gender}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onSelect={setGender}
        onContinue={() => setStep('dailyTime')}
        onBack={() => setStep('age')}
      />
    );
  }

  if (step === 'dailyTime') {
    return (
      <DailyTimeScreen
        value={dailyMinutes}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        onChange={setDailyMinutes}
        onContinue={() => setStep('pact')}
        onBack={() => setStep('gender')}
      />
    );
  }

  if (step === 'pact') {
    const intentTitle =
      selectedIntent === 'other'
        ? customIntent.trim() || 'reach your goal'
        : selectedOption?.title ?? 'reach your goal';

    return (
      <PactScreen
        intentTitle={intentTitle}
        dailyMinutes={dailyMinutes}
        stepIndex={stepIndex}
        stepCount={STEP_COUNT}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onConfirm={finish}
        onBack={() => setStep('dailyTime')}
      />
    );
  }

  return (
    <IntentQuestionScreen
      selectedIntent={selectedIntent}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      stepIndex={stepIndex}
      stepCount={STEP_COUNT}
      onSelect={selectIntent}
      onContinue={goFromIntent}
    />
  );
}
