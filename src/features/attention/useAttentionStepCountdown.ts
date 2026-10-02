import { useEffect, useRef, useState } from 'react';

const TICK_MS = 250;

interface Input {
  /** Changes on every step, so two equal timed steps in a row each restart. */
  stepKey: number;
  /** Null for a step that waits for a tap. */
  seconds: number | null;
  /** False while the screen is covered; the step restarts when it returns. */
  active: boolean;
  onElapsed: () => void;
}

/**
 * Seconds left on a timed step, calling `onElapsed` once when they run out.
 *
 * Measured against the clock rather than counted in ticks, so a slow frame or
 * a moment in the background cannot stretch a five second squeeze.
 */
export function useAttentionStepCountdown({
  stepKey,
  seconds,
  active,
  onElapsed,
}: Input): number | null {
  const [remaining, setRemaining] = useState(seconds);
  const onElapsedRef = useRef(onElapsed);

  useEffect(() => {
    onElapsedRef.current = onElapsed;
  }, [onElapsed]);

  useEffect(() => {
    setRemaining(seconds);
    if (seconds == null || !active) return;

    const endsAt = Date.now() + seconds * 1000;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(timer);
        onElapsedRef.current();
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [stepKey, seconds, active]);

  return remaining;
}
