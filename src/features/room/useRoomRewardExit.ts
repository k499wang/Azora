import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { easing } from '../../theme/motion';

/** Fade the whole reward surface before its owner closes it. */
export function useRoomRewardExit(onDone: () => void) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const started = useRef(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => () => cancelAnimation(progress), [progress]);

  const dismiss = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setLeaving(true);

    if (reducedMotion) {
      onDone();
      return;
    }

    progress.value = withTiming(
      1,
      { duration: 300, easing: easing.enter },
      (finished) => {
        if (finished) runOnJS(onDone)();
      },
    );
  }, [onDone, progress, reducedMotion]);

  const exitStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));

  return { leaving, dismiss, exitStyle };
}
