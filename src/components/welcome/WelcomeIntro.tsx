import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { BrandSplash } from './BrandSplash';

interface Props {
  onFinish: () => void;
}

const HOLD_MS = 2200;
const FADE_OUT_MS = 360;

export function WelcomeIntro({ onFinish }: Props) {
  // Starts fully opaque so the handoff from the native splash (same lockup)
  // is seamless and the screen underneath never flashes through.
  const opacity = useRef(new Animated.Value(1)).current;
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(HOLD_MS),
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished) onFinishRef.current();
    });
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.root, { opacity }]} pointerEvents="none">
      <BrandSplash />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 900,
    elevation: 900,
  },
});
