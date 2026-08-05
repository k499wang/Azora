import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

const ENTER_DURATION_MS = 700;

/**
 * Shared fade + scale pop-in for species renderers, so new species get the
 * entrance animation for free without copying the Animated plumbing.
 */
export function useSpeciesEntrance(): {
  opacity: Animated.Value;
  scale: Animated.AnimatedInterpolation<string | number>;
} {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: ENTER_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });

  return { opacity: enter, scale };
}
