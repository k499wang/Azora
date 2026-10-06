import { useEffect, useRef } from 'react';
import {
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
    if (Object.is(previous.current, trigger)) return;
    previous.current = trigger;
    if (!enabled || reducedMotion) return;
    scale.value = popAnimation(peak);
  }, [enabled, peak, reducedMotion, scale, trigger]);

  return scale;
}
