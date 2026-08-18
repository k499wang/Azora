import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

export const PLACEMENT_FADE_MS = 500;

/**
 * Eases the pulse-finding elements in together, so the measuring screen arrives
 * as one surface instead of snapping in behind the session that just started.
 */
export function usePlacementFade(active: boolean): Animated.Value {
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.stopAnimation();
    if (!active) {
      opacity.setValue(0);
      return;
    }

    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: reducedMotion ? 0 : PLACEMENT_FADE_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });
    animation.start();

    return () => animation.stop();
  }, [active, opacity, reducedMotion]);

  return opacity;
}
