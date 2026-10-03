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

  useWhileVisible(() => {
    if (target == null) return () => {};
    const from = shownRef.current;
    if (!known.current || target <= from) {
      known.current = true;
      setShown(target);
      return () => {};
    }

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
      };
      frame = requestAnimationFrame(step);
    }, delayMs);

    return () => {
      clearTimeout(timer);
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, [target, delayMs, msPerStep, maxDurationMs]);

  return shown;
}
