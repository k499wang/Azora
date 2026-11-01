import { useEffect, useRef } from 'react';
import {
  cancelAnimation,
  ReduceMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { duration, easing, spring } from '../theme/motion';
import { useAnimationReduceMotion, useReducedMotionSetting } from './useReducedMotionSetting';

export function popAnimation(peak: number, reduceMotion = ReduceMotion.System) {
  'worklet';
  return withSequence(
    reduceMotion,
    withTiming(peak, { reduceMotion, duration: duration.fast / 2, easing: easing.enter }),
    withSpring(1, { ...spring.bounce, reduceMotion }),
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
  const reducedMotion = useReducedMotionSetting();
  const reduceMotion = useAnimationReduceMotion();
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
    scale.value = popAnimation(peak, reduceMotion);
  }, [enabled, peak, reduceMotion, reducedMotion, scale, trigger]);

  useEffect(() => () => cancelAnimation(scale), [scale]);

  return scale;
}
