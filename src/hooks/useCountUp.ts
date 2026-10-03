import { useRef, useState } from 'react';
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

/**
 * Shows `target`, counting up to it one step at a time when it rises. Falling
 * and the first known value land at once; only a gain is worth watching.
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
    let frame: number | undefined;
    const timer = setTimeout(() => {
      const start = Date.now();
      let last = from;
      const step = () => {
        const progress = Math.min(1, (Date.now() - start) / duration);
        const value = Math.round(from + (target - from) * progress);
        // Frames outnumber steps; render only when the number moves.
        if (value !== last) {
          last = value;
          setShown(value);
          stepped.current?.(value, value === target);
        }
        if (progress < 1) frame = requestAnimationFrame(step);
        else countFrom.current = null;
      };
      frame = requestAnimationFrame(step);
    }, Math.max(0, startAt - Date.now()));

    return () => {
      clearTimeout(timer);
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, [target, delayMs, msPerStep, maxDurationMs]);

  return shown;
}
