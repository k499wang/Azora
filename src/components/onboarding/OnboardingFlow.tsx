import { useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { WelcomeScreen } from './steps/WelcomeScreen';
import { ScienceScreen } from './steps/ScienceScreen';
import { IntentScreen, type Intent } from './steps/IntentScreen';

interface OnboardingFlowProps {
  onComplete: (data: { intents: Intent[] }) => void;
}

const TOTAL_STEPS = 3;

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [index, setIndex] = useState(0);
  const [intents, setIntents] = useState<Intent[]>([]);

  const handleNext = useCallback(() => {
    if (index < TOTAL_STEPS - 1) {
      setIndex((i) => i + 1);
    } else {
      onComplete({ intents });
    }
  }, [index, intents, onComplete]);

  const handleBack = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  const stepProps = {
    onNext: handleNext,
    onBack: handleBack,
    stepIndex: index,
    totalSteps: TOTAL_STEPS,
  };

  let step: React.ReactNode;
  if (index === 0) step = <WelcomeScreen {...stepProps} />;
  else if (index === 1) step = <ScienceScreen {...stepProps} />;
  else step = <IntentScreen {...stepProps} selected={intents} onChange={setIntents} />;

  return <View style={styles.root}>{step}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
