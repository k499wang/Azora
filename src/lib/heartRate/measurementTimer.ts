import type { FingerPlacementState, SignalStatus } from './types';

type MeasurementTimerHandle = ReturnType<typeof globalThis.setInterval>;

export const BREATH_EXERCISE_PLACEMENT_LOCKED_DELAY_MS = 250;
export const BREATH_EXERCISE_PLACEMENT_FALLBACK_DELAY_MS = 20_000;

interface BreathExercisePlacementStartState {
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
  bpmLocked: boolean;
}

export function getBreathExercisePlacementStartDelayMs({
  fingerPlacement,
  signalStatus,
  bpmLocked,
}: BreathExercisePlacementStartState): number | null {
  if (
    fingerPlacement !== 'good' ||
    signalStatus === 'excessive_motion' ||
    signalStatus === 'no_finger' ||
    signalStatus === 'signal_lost'
  ) {
    return null;
  }

  return bpmLocked
    ? BREATH_EXERCISE_PLACEMENT_LOCKED_DELAY_MS
    : BREATH_EXERCISE_PLACEMENT_FALLBACK_DELAY_MS;
}

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
