import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

const FADE_OUT_MS = 260;
const FADE_IN_MS = 380;
// The displayed value swaps at the bottom of the fade, so the whole crossfade
// has to fit inside the time a stage actually holds. At a quarter of it a
// four-second inhale keeps the full fade, while Bellows Breath's one-second
// phases shorten it instead of spending most of the phase mid-transition and
// showing the previous instruction well into the new one.
const MAX_FADE_SHARE = 0.25;
// Below this a fade reads as a blink rather than a transition, so swap outright.
const MIN_FADE_MS = 120;

interface UsePhaseCrossfadeOptions {
  /**
   * What actually re-anchors the screen. Defaults to the phase itself; pass the
   * rendered label when two phases draw the same instruction, so `holdIn` ->
   * `holdOut` does not fade "Hold" out and back in to become "Hold".
   */
  fadeKey?: unknown;
  /** Shortest time a stage holds still. Scales the fade to fit inside it. */
  holdMs?: number;
}

function scaleFade(holdMs: number | undefined) {
  const total = FADE_OUT_MS + FADE_IN_MS;
  if (holdMs == null || !Number.isFinite(holdMs) || holdMs <= 0) {
    return { fadeOutMs: FADE_OUT_MS, fadeInMs: FADE_IN_MS };
  }

  const scale = Math.min(1, (holdMs * MAX_FADE_SHARE) / total);
  return {
    fadeOutMs: Math.round(FADE_OUT_MS * scale),
    fadeInMs: Math.round(FADE_IN_MS * scale),
  };
}

/**
 * Softens a phase change: the instruction block fades out, swaps to the new
 * phase, then fades in, so a stage transition reads as a re-anchor rather than
 * a hard label swap.
 *
 * While a fade is in flight the returned phase lags the real one — render the
 * instruction from `displayPhase`, never from the live phase, or the text
 * changes while the old one is still visible. Anything that must stay in step
 * with the instruction (a phase countdown) has to come off `displayPhase` too,
 * and should check `displayPhase === phase` before drawing a value that belongs
 * to the incoming phase.
 *
 * Anything that updates *within* a phase (a running timer, a cycle counter) is
 * unaffected, because the fade is keyed on `fadeKey`, not on the render.
 */
export function usePhaseCrossfade<Phase>(
  phase: Phase,
  options: UsePhaseCrossfadeOptions = {},
): {
  displayPhase: Phase;
  opacity: Animated.Value;
} {
  const { fadeKey = phase, holdMs } = options;

  const [laggedPhase, setLaggedPhase] = useState<Phase>(phase);
  const phaseRef = useRef(phase);
  const displayedKey = useRef<unknown>(fadeKey);
  const opacity = useRef(new Animated.Value(1)).current;
  const running = useRef<Animated.CompositeAnimation | null>(null);
  const generation = useRef(0);

  phaseRef.current = phase;

  const { fadeOutMs, fadeInMs } = useMemo(() => scaleFade(holdMs), [holdMs]);

  useEffect(() => {
    const currentGeneration = ++generation.current;
    const previousAnimation = running.current;
    running.current = null;
    previousAnimation?.stop();

    if (Object.is(fadeKey, displayedKey.current)) {
      opacity.setValue(1);
      return;
    }

    if (fadeOutMs + fadeInMs < MIN_FADE_MS) {
      displayedKey.current = fadeKey;
      setLaggedPhase(phaseRef.current);
      opacity.setValue(1);
      return;
    }

    const fadeOut = Animated.timing(opacity, {
      toValue: 0,
      duration: fadeOutMs,
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

      displayedKey.current = fadeKey;
      setLaggedPhase(phaseRef.current);
      const fadeIn = Animated.timing(opacity, {
        toValue: 1,
        duration: fadeInMs,
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
  }, [fadeInMs, fadeKey, fadeOutMs, opacity]);

  // A phase that draws the same instruction passes straight through, in the
  // same render: no fade owns that swap, so lagging it would leave anything
  // rendered alongside the instruction a frame behind the phase it belongs to.
  // Every write to `displayedKey` is paired with a state update, so this stays
  // in step with what is on screen.
  const displayPhase = Object.is(fadeKey, displayedKey.current)
    ? phase
    : laggedPhase;

  return { displayPhase, opacity };
}
