import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { PactCelebrationPreviewScreenProps } from '../app/navigation';
import CelebrationOverlay, {
  CELEBRATION_HOLD_MS,
} from '../components/onboarding/CelebrationOverlay';

export default function PactCelebrationPreviewScreen(
  _: PactCelebrationPreviewScreenProps,
) {
  const [run, setRun] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => setRun((current) => current + 1),
      CELEBRATION_HOLD_MS,
    );
    return () => clearTimeout(timer);
  }, [run]);

  return (
    <Pressable
      style={StyleSheet.absoluteFill}
      accessibilityLabel="Replay celebration"
      onPress={() => setRun((current) => current + 1)}
    >
      <CelebrationOverlay key={run} />
    </Pressable>
  );
}
