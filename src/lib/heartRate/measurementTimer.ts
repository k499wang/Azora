type MeasurementTimerHandle = ReturnType<typeof globalThis.setInterval>;

export interface MeasurementTimerOptions {
  durationMs: number;
  intervalMs: number;
  now?: () => number;
  setInterval?: (callback: () => void, delayMs: number) => MeasurementTimerHandle;
  clearInterval?: (handle: MeasurementTimerHandle) => void;
  onTick: (elapsedMs: number) => void;
  onComplete: () => void;
}

export interface MeasurementTimer {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
}

export function createMeasurementTimer({
  durationMs,
  intervalMs,
  now = Date.now,
  setInterval: scheduleInterval = globalThis.setInterval,
  clearInterval: cancelInterval = globalThis.clearInterval,
  onTick,
  onComplete,
}: MeasurementTimerOptions): MeasurementTimer {
  let intervalHandle: MeasurementTimerHandle | null = null;
  let startMs: number | null = null;
  let completed = false;

  const stop = () => {
    if (intervalHandle != null) {
      cancelInterval(intervalHandle);
      intervalHandle = null;
    }
    startMs = null;
  };

  const tick = () => {
    if (startMs == null || completed) return;

    const elapsedMs = Math.max(0, now() - startMs);
    onTick(Math.min(durationMs, elapsedMs));

    if (elapsedMs >= durationMs) {
      completed = true;
      stop();
      onComplete();
    }
  };

  const start = () => {
    stop();
    completed = false;
    startMs = now();
    onTick(0);
    intervalHandle = scheduleInterval(tick, intervalMs);
  };

  return {
    start,
    stop,
    isRunning: () => intervalHandle != null,
  };
}
