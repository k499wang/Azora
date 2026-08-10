import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

const FADE_OUT_MS = 260;
const FADE_IN_MS = 380;

/**
 * Softens a phase change: the instruction block fades out, swaps to the new
 * phase, then fades in, so a stage transition reads as a re-anchor rather than
 * a hard label swap.
 *
 * The returned phase lags the real one for the length of the fade — render the
 * instruction from `displayPhase`, never from the live phase, or the text
 * changes while the old one is still visible.
 *
 * Anything that updates *within* a phase (a running timer, a cycle counter) is
 * unaffected, because the fade is keyed on the phase itself.
 */
export function usePhaseCrossfade<Phase>(phase: Phase): {
  displayPhase: Phase;
  opacity: Animated.Value;
} {
  const [displayPhase, setDisplayPhase] = useState<Phase>(phase);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase === displayPhase) return;

    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_OUT_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;

      setDisplayPhase(phase);
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_IN_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  }, [displayPhase, opacity, phase]);

  return { displayPhase, opacity };
}
