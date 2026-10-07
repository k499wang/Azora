import { useCallback, useRef, useState } from 'react';
import {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useWhileVisible } from './useWhileVisible';

interface CountUpOptions {
  /** held before counting, so the number moves when what it counts arrives */
  delayMs: number;
  /** per unit, so +20 takes twice as long as +10 */
  msPerStep: number;
  /** the shortest a shown number stays up; units are skipped to keep to it */
  minStepMs?: number;
  maxDurationMs: number;
  /**
   * Each counted step, never a jump; `landed` on the step that reaches the
   * target.
   */
  onStep?: (value: number, landed: boolean) => void;
  /** false lands every change at once, for a counter nothing visibly arrives at */
  counts?: boolean;
  /**
   * The last number any counter sharing this record showed. A rise one of
   * them already counted lands at once on the rest instead of counting again.
   */
  seen?: { current: number | undefined };
}

interface Span {
  from: number;
  to: number;
  generation: number;
  /** how many numbers are shown on the way; fewer than the gain once it is large */
  steps: number;
}

/**
 * Shows `target`, counting up to it one step at a time when it rises. Falling
 * and the first known value land at once; only a gain is worth watching.
 *
 * The wait and the count run on the UI thread's frame clock, and only each new
 * whole number crosses back to render. React Native's JS timers could leave a
 * count parked until the next touch, and a busy JS thread stretched it; the
 * frame clock does neither.
 *
 * A gain too big to show one unit per `minStepMs` counts in larger strides
 * rather than faster: every number shown is a render, and a run of quick ticks
 * once rendered the pill on every frame for the whole count, on the JS thread
 * the next tick was waiting for.
 */
export function useCountUp(
  target: number | undefined,
  {
    delayMs,
    msPerStep,
    minStepMs = msPerStep,
    maxDurationMs,
    onStep,
    counts = true,
    seen,
  }: CountUpOptions,
): number {
  const [shown, setShown] = useState(target ?? 0);
  const stepped = useRef(onStep);
  stepped.current = onStep;
  const seenRef = useRef(seen);
  seenRef.current = seen;
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const latestTarget = useRef(target);
  latestTarget.current = target;
  const generation = useRef(0);
  const known = useRef(target != null);
  // When the rise being shown may start counting. A second rise that arrives
  // while the first is still waiting or counting keeps this schedule and only
  // extends the count, rather than starting the wait over: a run of ticks moves
  // the number as the first coins land, not after the last tap.
  const countFrom = useRef<number | null>(null);
  const progress = useSharedValue(1);
  const span = useSharedValue<Span>({ from: 0, to: 0, steps: 1, generation: 0 });

  const step = useCallback((value: number, to: number, countGeneration: number) => {
    // Cancelling UI work cannot recall callbacks already queued for JS. The
    // target check also covers a new render before its effect cleans up.
    if (countGeneration !== generation.current || to !== latestTarget.current) return;
    if (value <= shownRef.current || value > to) return;
    shownRef.current = value;
    setShown(value);
    if (seenRef.current) seenRef.current.current = value;
    if (value === to) countFrom.current = null;
    stepped.current?.(value, value === to);
  }, []);

  useAnimatedReaction(
    () => {
      const { from, to, steps } = span.value;
      const taken = Math.round(progress.value * steps);
      return taken >= steps ? to : from + Math.floor(((to - from) * taken) / steps);
    },
    (value, previous) => {
      if (previous == null || value === previous) return;
      runOnJS(step)(value, span.value.to, span.value.generation);
    },
    [step],
  );

  useWhileVisible((cameIntoView) => {
    const countGeneration = ++generation.current;
    const stop = () => {
      generation.current += 1;
      cancelAnimation(progress);
    };
    if (target == null) return stop;
    const from = Math.max(shownRef.current, seenRef.current?.current ?? -Infinity);
    // A rise that happened while this was out of view was not seen arriving,
    // so it lands on return rather than replaying a count the user missed.
    if (!known.current || target <= from || !counts || cameIntoView) {
      known.current = true;
      countFrom.current = null;
      shownRef.current = target;
      setShown(target);
      if (seenRef.current) seenRef.current.current = target;
      return stop;
    }
    if (from > shownRef.current) {
      shownRef.current = from;
      setShown(from);
    }

    const startAt = countFrom.current ?? Date.now() + delayMs;
    countFrom.current = startAt;
    const duration = Math.min(maxDurationMs, (target - from) * msPerStep);
    const steps = Math.max(1, Math.min(target - from, Math.round(duration / minStepMs)));
    progress.value = 0;
    span.value = { from, to: target, steps, generation: countGeneration };
    progress.value = withDelay(
      Math.max(0, startAt - Date.now()),
      withTiming(1, { duration, easing: Easing.linear }),
    );

    return stop;
  }, [target, delayMs, msPerStep, minStepMs, maxDurationMs, counts, progress, span]);

  return shown;
}
