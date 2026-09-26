import { useEffect, useState } from 'react';
import type { PactPreviewScreenProps } from '../app/navigation';
import PactScreen from '../components/onboarding/screens/PactScreen';

/** time from Confirm until the preview resets: the seal, then the celebration */
const REPLAY_AFTER_MS = 5000;
const SAMPLE_NAME = 'Alex';
const SAMPLE_DAILY_MINUTES = 5;

/**
 * The contract screen as onboarding shows it, with nothing saved: sign, confirm,
 * watch the seal and the celebration, and it resets for another go.
 */
export default function PactPreviewScreen({ navigation }: PactPreviewScreenProps) {
  const [run, setRun] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!confirmed) return undefined;
    const timer = setTimeout(() => {
      setConfirmed(false);
      setRun((current) => current + 1);
    }, REPLAY_AFTER_MS);
    return () => clearTimeout(timer);
  }, [confirmed]);

  return (
    <PactScreen
      key={run}
      dailyMinutes={SAMPLE_DAILY_MINUTES}
      name={SAMPLE_NAME}
      stepIndex={1}
      stepCount={1}
      isSubmitting={false}
      errorMessage={null}
      onConfirm={() => setConfirmed(true)}
      onBack={() => navigation.goBack()}
    />
  );
}
