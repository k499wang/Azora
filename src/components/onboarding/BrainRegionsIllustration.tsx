import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

interface BrainRegionsIllustrationProps {
  /** The square illustration narrows to stay within this height. */
  maxHeight: number;
}

export default function BrainRegionsIllustration({ maxHeight }: BrainRegionsIllustrationProps) {
  const [available, setAvailable] = useState(0);
  const size = Math.min(available, maxHeight);

  return (
    <View
      style={styles.frame}
      onLayout={(event: LayoutChangeEvent) => setAvailable(event.nativeEvent.layout.width)}
    >
      {size > 0 ? (
        <Image
          source={require('../../../assets/onboarding/behavioural-science-brain.png')}
          style={{ width: size, height: size }}
          contentFit="contain"
          transition={0}
          accessible
          accessibilityRole="image"
          accessibilityLabel="Limbic brain: emotional brain. Neocortex: rational brain."
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    alignItems: 'center',
  },
});
