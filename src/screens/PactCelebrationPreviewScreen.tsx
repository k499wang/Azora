import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { PactCelebrationPreviewScreenProps } from '../app/navigation';
import CelebrationOverlay from '../components/onboarding/CelebrationOverlay';

/** matches how long onboarding holds the celebration before the paywall */
const CELEBRATION_HOLD_MS = 5000;

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
