import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { PactCelebrationPreviewScreenProps } from '../app/navigation';
import CelebrationOverlay from '../components/onboarding/CelebrationOverlay';

export default function PactCelebrationPreviewScreen(
  _: PactCelebrationPreviewScreenProps,
) {
  const [run, setRun] = useState(0);
  const replay = useCallback(() => setRun((current) => current + 1), []);

  return (
    <Pressable
      style={StyleSheet.absoluteFill}
      accessibilityLabel="Replay celebration"
      onPress={replay}
    >
      <CelebrationOverlay key={run} onFinished={replay} />
    </Pressable>
  );
}
