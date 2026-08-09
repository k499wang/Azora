import { useEffect, type ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { duration, easing, spring, travel } from '../../theme/motion';

/**
 * The two ways things arrive in this app.
 *
 * Both were re-implemented at every call site with slightly different numbers,
 * so entrances that should have matched did not. Use these; tune them in
 * `theme/motion.ts`.
 */

interface RevealProps {
  /** ms from mount */
  delay?: number;
  /** re-plays when this flips from false to true; omit to play on mount */
  when?: boolean;
  style?: ViewStyle;
  children: ReactNode;
}

/** Fades up into place. For text, cards, blocks. */
export function Rise({ delay = 0, when = true, style, children }: RevealProps) {
  const enter = useSharedValue(0);

  useEffect(() => {
    if (!when) {
      enter.value = 0;
      return;
    }

    enter.value = withDelay(
      delay,
      withTiming(1, { duration: duration.slow, easing: easing.enter }),
    );
  }, [delay, enter, when]);

  const animated = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: interpolate(enter.value, [0, 1], [travel.rise, 0]) },
    ],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/** Springs in with a small overshoot. For characters, tiles, anything playful. */
export function Pop({ delay = 0, when = true, style, children }: RevealProps) {
  const enter = useSharedValue(0);

  useEffect(() => {
    if (!when) {
      enter.value = 0;
      return;
    }

    enter.value = withDelay(delay, withSpring(1, spring.pop));
  }, [delay, enter, when]);

  const animated = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0, 0.4], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(enter.value, [0, 1], [0.7, 1]) }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
