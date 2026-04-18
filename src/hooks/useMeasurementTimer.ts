import { useCallback, useEffect, useRef } from 'react';
import { createMeasurementTimer, type MeasurementTimer } from '../lib/heartRate/measurementTimer';

interface UseMeasurementTimerOptions {
  durationMs: number;
  intervalMs: number;
  onTick: (elapsedMs: number) => void;
  onComplete: () => void;
}

export function useMeasurementTimer({
  durationMs,
  intervalMs,
  onTick,
  onComplete,
}: UseMeasurementTimerOptions): { start: () => void; stop: () => void } {
  const callbacksRef = useRef({ onTick, onComplete });
  const timerRef = useRef<MeasurementTimer | null>(null);

  useEffect(() => {
    callbacksRef.current = { onTick, onComplete };
  }, [onTick, onComplete]);

  const stop = useCallback(() => {
    timerRef.current?.stop();
    timerRef.current = null;
  }, []);

  const start = useCallback(() => {
    stop();
    timerRef.current = createMeasurementTimer({
      durationMs,
      intervalMs,
      onTick: (elapsedMs) => callbacksRef.current.onTick(elapsedMs),
      onComplete: () => callbacksRef.current.onComplete(),
    });
    timerRef.current.start();
  }, [durationMs, intervalMs, stop]);

  useEffect(() => () => stop(), [stop]);

  return { start, stop };
}
