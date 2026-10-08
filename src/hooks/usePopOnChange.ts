import { useEffect, useRef } from 'react';
import {
  cancelAnimation,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { duration, easing, spring } from '../theme/motion';

export function popAnimation(peak: number, durationMs?: number) {
  'worklet';
  const riseDuration = durationMs === undefined
    ? duration.fast / 2
    : Math.min(duration.fast / 2, durationMs / 2);
  return withSequence(
    withTiming(peak, { duration: riseDuration, easing: easing.enter }),
    durationMs === undefined
      ? withSpring(1, spring.bounce)
      : withTiming(1, { duration: durationMs - riseDuration, easing: easing.settle }),
  );
}

interface Options {
  enabled?: boolean;
  /** Set when the pop must settle before a flow advances. */
  durationMs?: number;
}

/** A scale that pops to `peak` and springs back each time `trigger` changes after mount. */
export function usePopOnChange(
  trigger: unknown,
  peak: number,
  { enabled = true, durationMs }: Options = {},
) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const previous = useRef(trigger);

  useEffect(() => {
    const changed = !Object.is(previous.current, trigger);
    previous.current = trigger;
    if (!enabled || reducedMotion) {
      cancelAnimation(scale);
      scale.value = 1;
      return;
    }
    if (!changed) return;
    cancelAnimation(scale);
    scale.value = popAnimation(peak, durationMs);
  }, [durationMs, enabled, peak, reducedMotion, scale, trigger]);

  useEffect(() => () => cancelAnimation(scale), [scale]);

  return scale;
}
