import { useEffect, useMemo, useRef, useState } from 'react';
import type { MindMapScore } from '../lib/onboardingScores';

interface ScoreMorphOptions {
  from: MindMapScore[];
  to: MindMapScore[];
  durationMs?: number;
  delayMs?: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Interpolates a radar's axis values on the JS thread. Driving it here rather
 * than on the native thread keeps the SVG polygon and the numeric labels beside
 * it on the same frame — a native-driven polygon would leave the text behind.
 */
export function useScoreMorph({
  from,
  to,
  durationMs = 900,
  delayMs = 0,
}: ScoreMorphOptions): { scores: MindMapScore[]; progress: number } {
  const [progress, setProgress] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const startAt = Date.now() + delayMs;
    const tick = () => {
      const elapsed = Date.now() - startAt;
      if (elapsed < 0) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, elapsed / durationMs);
      setProgress(easeOutCubic(t));
      frameRef.current = t < 1 ? requestAnimationFrame(tick) : null;
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [durationMs, delayMs]);

  const scores = useMemo(
    () =>
      from.map((score, index) => {
        const target = to[index]?.value ?? score.value;
        return {
          ...score,
          value: Math.round(score.value + (target - score.value) * progress),
        };
      }),
    [from, to, progress],
  );

  return { scores, progress };
}
