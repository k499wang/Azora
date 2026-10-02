import { useCallback, useEffect, useRef, useState } from 'react';

const FULL_PAUSE_MS = 600;

interface Input {
  /** Changes on every step, so each step starts with nothing counted. */
  stepKey: number;
  /** Null for a step with nothing to count. */
  count: number | null;
  /** Called once, a moment after the last thing is counted. */
  onFull: () => void;
}

interface TapCount {
  counted: number;
  full: boolean;
  countOne: () => void;
}

/** Things the user taps off one by one, moving on by itself once all are counted. */
export function useAttentionTapCount({ stepKey, count, onFull }: Input): TapCount {
  const [tally, setTally] = useState({ stepKey, counted: 0 });
  const counted = tally.stepKey === stepKey ? tally.counted : 0;
  const full = count != null && counted >= count;
  const onFullRef = useRef(onFull);

  useEffect(() => {
    onFullRef.current = onFull;
  }, [onFull]);

  useEffect(() => {
    if (!full) return;
    const timer = setTimeout(() => onFullRef.current(), FULL_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [full, stepKey]);

  const countOne = useCallback(() => {
    if (count == null) return;
    setTally((current) => {
      const before = current.stepKey === stepKey ? current.counted : 0;
      return { stepKey, counted: Math.min(before + 1, count) };
    });
  }, [count, stepKey]);

  return { counted, full, countOne };
}
