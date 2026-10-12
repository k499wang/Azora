import { useState } from 'react';
import {
  cancelAnimation,
  Easing,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useWhileVisible } from '../../../hooks/useWhileVisible';
import { CLEANING_PREVIEW_TIMELINE } from './cleaningPreviewMotion';

export { CLEANING_PREVIEW_TIMELINE } from './cleaningPreviewMotion';

export default function useCleaningPreviewAnimation(ready: boolean) {
  const elapsed = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const [replayKey, setReplayKey] = useState(0);

  useWhileVisible(() => {
    const remaining = CLEANING_PREVIEW_TIMELINE.total - elapsed.value;
    if (ready && !reducedMotion && remaining > 0) {
      elapsed.value = withTiming(CLEANING_PREVIEW_TIMELINE.total, {
        duration: remaining,
        easing: Easing.linear,
      });
    }
    return () => cancelAnimation(elapsed);
  }, [ready, reducedMotion, replayKey, elapsed]);

  return {
    elapsed,
    reducedMotion,
    replay: () => {
      cancelAnimation(elapsed);
      elapsed.value = 0;
      setReplayKey((key) => key + 1);
    },
  };
}
