import { useEffect, type ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { CHUNKY_LIP_DEPTH } from './ChunkyButton';
import { duration, easing, spring, travel } from '../../theme/motion';

/**
 * The three ways things arrive in this app.
 *
 * They were re-implemented at every call site with slightly different numbers,
 * so entrances that should have matched did not. Use these; tune them in
 * `theme/motion.ts`.
 */

interface RevealProps {
  /** ms from mount */
  delay?: number;
  /** Override the reveal timing without changing the shared default. */
  durationMs?: number;
  /** re-plays when this flips from false to true; omit to play on mount */
  when?: boolean;
  style?: ViewStyle;
  children: ReactNode;
}

/** Fades up into place. For text, cards, blocks. */
export function Rise({
  delay = 0,
  durationMs = duration.slow,
  when = true,
  style,
  children,
}: RevealProps) {
  const enter = useSharedValue(0);

  useEffect(() => {
    if (!when) {
      cancelAnimation(enter);
      enter.value = 0;
      return;
    }

    // One frame of headroom. `when` almost always flips inside a React commit,
    // and starting here would put the entrance's first frames behind that
    // commit's mount work on the UI thread — which is exactly the stutter you
    // see at the front of a staggered reveal.
    const frame = requestAnimationFrame(() => {
      enter.value = withDelay(
        delay,
        withTiming(1, { duration: durationMs, easing: easing.enter }),
      );
    });

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimation(enter);
    };
  }, [delay, durationMs, enter, when]);

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
      cancelAnimation(enter);
      enter.value = 0;
      return;
    }

    const frame = requestAnimationFrame(() => {
      enter.value = withDelay(delay, withSpring(1, spring.pop));
    });

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimation(enter);
    };
  }, [delay, enter, when]);

  const animated = useAnimatedStyle(() => ({
    opacity: interpolate(enter.value, [0, 0.4], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(enter.value, [0, 1], [0.7, 1]) }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/**
 * Rises past its resting place, then drops the last few points under gravity.
 *
 * The travel is exactly a lip button's depth, so a `ChunkyButton` arriving this
 * way lands by dropping its face onto its lip — the same movement the button
 * makes when it is pressed. It is the one entrance that ends in an impact, so
 * it belongs to whatever the screen wants tapped, and to nothing else.
 */
export function Land({
  delay = 0,
  durationMs = duration.slow,
  when = true,
  style,
  children,
}: RevealProps) {
  const enter = useSharedValue(0);
  const offset = useSharedValue<number>(travel.rise);

  useEffect(() => {
    if (!when) {
      cancelAnimation(enter);
      cancelAnimation(offset);
      enter.value = 0;
      offset.value = travel.rise;
      return;
    }

    const frame = requestAnimationFrame(() => {
      enter.value = withDelay(
        delay,
        withTiming(1, { duration: durationMs, easing: easing.enter }),
      );
      offset.value = withDelay(
        delay,
        withSequence(
          withTiming(-CHUNKY_LIP_DEPTH, {
            duration: durationMs,
            easing: easing.settle,
          }),
          withTiming(0, { duration: duration.fast, easing: easing.gravity }),
        ),
      );
    });

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimation(enter);
      cancelAnimation(offset);
    };
  }, [delay, durationMs, enter, offset, when]);

  const animated = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: offset.value }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
