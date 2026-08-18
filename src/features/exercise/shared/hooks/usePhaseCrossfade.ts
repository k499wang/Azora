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
  const displayedPhase = useRef(phase);
  const opacity = useRef(new Animated.Value(1)).current;
  const running = useRef<Animated.CompositeAnimation | null>(null);
  const generation = useRef(0);

  useEffect(() => {
    const currentGeneration = ++generation.current;
    const previousAnimation = running.current;
    running.current = null;
    previousAnimation?.stop();

    if (Object.is(phase, displayedPhase.current)) {
      opacity.setValue(1);
      return;
    }

    const fadeOut = Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_OUT_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });

    running.current = fadeOut;
    fadeOut.start(({ finished }) => {
      if (
        !finished ||
        generation.current !== currentGeneration ||
        running.current !== fadeOut
      ) {
        return;
      }

      displayedPhase.current = phase;
      setDisplayPhase(phase);
      const fadeIn = Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_IN_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });

      running.current = fadeIn;
      fadeIn.start(() => {
        if (
          generation.current === currentGeneration &&
          running.current === fadeIn
        ) {
          running.current = null;
        }
      });
    });

    return () => {
      if (generation.current !== currentGeneration) return;
      generation.current += 1;
      const currentAnimation = running.current;
      running.current = null;
      currentAnimation?.stop();
    };
  }, [opacity, phase]);

  return { displayPhase, opacity };
}
