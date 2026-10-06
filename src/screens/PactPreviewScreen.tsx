import { useState } from 'react';
import type { PactPreviewScreenProps } from '../app/navigation';
import PactScreen from '../components/onboarding/screens/PactScreen';

const SAMPLE_NAME = 'Alex';
const SAMPLE_DAILY_MINUTES = 5;

/**
 * The contract screen as onboarding shows it, with nothing saved: sign, confirm,
 * watch the seal and the celebration, and it resets for another go.
 */
export default function PactPreviewScreen({ navigation }: PactPreviewScreenProps) {
  const [run, setRun] = useState(0);

  return (
    <PactScreen
      key={run}
      dailyMinutes={SAMPLE_DAILY_MINUTES}
      name={SAMPLE_NAME}
      stepIndex={1}
      stepCount={1}
      isSubmitting={false}
      errorMessage={null}
      onConfirm={() => {}}
      onCelebrated={() => setRun((current) => current + 1)}
      onBack={() => navigation.goBack()}
    />
  );
}
