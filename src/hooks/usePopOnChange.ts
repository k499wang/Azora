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

export function popAnimation(peak: number) {
  'worklet';
  return withSequence(
    withTiming(peak, { duration: duration.fast / 2, easing: easing.enter }),
    withSpring(1, spring.bounce),
  );
}

interface Options {
  enabled?: boolean;
}

/** A scale that pops to `peak` and springs back each time `trigger` changes after mount. */
export function usePopOnChange(
  trigger: unknown,
  peak: number,
  { enabled = true }: Options = {},
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
    scale.value = popAnimation(peak);
  }, [enabled, peak, reducedMotion, scale, trigger]);

  useEffect(() => () => cancelAnimation(scale), [scale]);

  return scale;
}
