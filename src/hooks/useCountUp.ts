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
  maxDurationMs: number;
  /** each counted step, never a jump; `landed` on the step that reaches the target */
  onStep?: (value: number, landed: boolean) => void;
}

interface Span {
  from: number;
  to: number;
}

/**
 * Shows `target`, counting up to it one step at a time when it rises. Falling
 * and the first known value land at once; only a gain is worth watching.
 *
 * The wait and the count run on the UI thread's frame clock, and only each new
 * whole number crosses back to render. React Native's JS timers could leave a
 * count parked until the next touch, and a busy JS thread stretched it; the
 * frame clock does neither.
 */
export function useCountUp(
  target: number | undefined,
  { delayMs, msPerStep, maxDurationMs, onStep }: CountUpOptions,
): number {
  const [shown, setShown] = useState(target ?? 0);
  const stepped = useRef(onStep);
  stepped.current = onStep;
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const known = useRef(target != null);
  // When the rise being shown may start counting. A second rise that arrives
  // while the first is still waiting or counting keeps this schedule and only
  // extends the count, rather than starting the wait over: a run of ticks moves
  // the number as the first coins land, not after the last tap.
  const countFrom = useRef<number | null>(null);
  const progress = useSharedValue(1);
  const span = useSharedValue<Span>({ from: 0, to: 0 });

  const step = useCallback((value: number, to: number) => {
    if (value <= shownRef.current || value > to) return;
    shownRef.current = value;
    setShown(value);
    if (value === to) countFrom.current = null;
    stepped.current?.(value, value === to);
  }, []);

  useAnimatedReaction(
    () => Math.round(span.value.from + (span.value.to - span.value.from) * progress.value),
    (value, previous) => {
      if (previous == null || value === previous) return;
      runOnJS(step)(value, span.value.to);
    },
    [step],
  );

  useWhileVisible(() => {
    if (target == null) return () => {};
    const from = shownRef.current;
    if (!known.current || target <= from) {
      known.current = true;
      countFrom.current = null;
      setShown(target);
      return () => {};
    }

    const startAt = countFrom.current ?? Date.now() + delayMs;
    countFrom.current = startAt;
    const duration = Math.min(maxDurationMs, (target - from) * msPerStep);
    progress.value = 0;
    span.value = { from, to: target };
    progress.value = withDelay(
      Math.max(0, startAt - Date.now()),
      withTiming(1, { duration, easing: Easing.linear }),
    );

    return () => cancelAnimation(progress);
  }, [target, delayMs, msPerStep, maxDurationMs, progress, span]);

  return shown;
}
