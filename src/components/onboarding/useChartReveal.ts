import { useCallback, useEffect, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedReaction,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type WithSpringConfig,
} from 'react-native-reanimated';
import { spring } from '../../theme/motion';
import { chartReveal } from './chartTokens';

/** Measures the chart's width, ignoring sub-point layout jitter. */
export function useChartWidth() {
  const [width, setWidth] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setWidth((currentWidth) =>
      Math.abs(currentWidth - nextWidth) < 1 ? currentWidth : nextWidth,
    );
  }, []);

  return { width, onLayout };
}

/**
 * Measures the chart's width and, once it has one, runs the shared left-to-right
 * pen from 0 to 1.
 */
export function useChartReveal() {
  const { width, onLayout } = useChartWidth();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (width <= 0) return;
    progress.value = 0;
    progress.value = withDelay(
      chartReveal.delayMs,
      // Linear, because the x axis is time — an eased pen makes a trace look
      // like it speeds up mid-recording.
      withTiming(1, { duration: chartReveal.durationMs, easing: Easing.linear }),
    );
    return () => cancelAnimation(progress);
  }, [progress, width]);

  return { width, onLayout, progress };
}

/** Springs from 0 to 1 the moment the pen passes `revealAt`, and back to 0 if it rewinds. */
export function useChartPop(
  progress: SharedValue<number>,
  revealAt: number,
  config: WithSpringConfig = spring.pop,
): SharedValue<number> {
  const shown = useSharedValue(0);

  useAnimatedReaction(
    () => progress.value >= revealAt,
    (isShown, wasShown) => {
      if (isShown === wasShown) return;
      shown.value = isShown ? withSpring(1, config) : 0;
    },
    [revealAt, config],
  );

  return shown;
}

/** Scale-and-fade for a popped element; opacity is clamped against the spring's overshoot. */
export function popStyle(shown: number, hiddenScale = 0.6) {
  'worklet';
  return {
    opacity: Math.min(1, shown),
    transform: [{ scale: hiddenScale + (1 - hiddenScale) * shown }],
  };
}
