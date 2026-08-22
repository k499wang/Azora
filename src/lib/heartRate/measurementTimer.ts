import type { FingerPlacementState, SignalStatus } from './types';

type MeasurementTimerHandle = ReturnType<typeof globalThis.setInterval>;

// Long enough for the "Pulse found" confirmation to register as a beat of its
// own before the session slides in over it.
export const BREATH_EXERCISE_PLACEMENT_LOCKED_DELAY_MS = 900;
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

export const CAPTURE_PULSE_LOCKED_DELAY_MS = 250;
export const CAPTURE_PLACEMENT_FALLBACK_DELAY_MS = 15_000;
export const CAPTURE_CAMERA_CHECK_FRAME_FRESHNESS_MS = 500;

interface CaptureStartEligibility {
  fingerPlacement: FingerPlacementState;
  signalStatus: SignalStatus;
}

interface CaptureStartDeadlineState {
  /** When the current run of usable placement began. */
  placementSinceMs: number | null;
  /** When the detector last began holding a pulse, or null if it is not. */
  pulseLockedSinceMs: number | null;
}

interface CaptureStartFrameFreshnessState {
  lastFrameReceivedAtMs: number | null;
  nowMs: number;
}

/** Whether the finger is placed well enough for the capture clock to run down. */
export function isCaptureStartEligible({
  fingerPlacement,
  signalStatus,
}: CaptureStartEligibility): boolean {
  return (
    fingerPlacement === 'good' &&
    signalStatus !== 'excessive_motion' &&
    signalStatus !== 'no_finger' &&
    signalStatus !== 'signal_lost'
  );
}

/** Whether the placement state came from a camera frame received recently enough to trust. */
export function isCaptureStartFrameFresh({
  lastFrameReceivedAtMs,
  nowMs,
}: CaptureStartFrameFreshnessState): boolean {
  if (lastFrameReceivedAtMs == null || nowMs < lastFrameReceivedAtMs) return false;

  return nowMs - lastFrameReceivedAtMs <= CAPTURE_CAMERA_CHECK_FRAME_FRESHNESS_MS;
}

/**
 * Placement can read good while producing no pulse, so waiting briefly for a
 * detector lock gives the measurement window a stronger starting signal.
 *
 * The fallback is anchored to when placement became usable rather than to the
 * current lock state, so a pulse that flickers in and out cannot keep pushing it
 * back and strand a hard-to-read finger on the setup screen.
 */
export function getCaptureStartDeadlineMs({
  placementSinceMs,
  pulseLockedSinceMs,
}: CaptureStartDeadlineState): number | null {
  if (placementSinceMs == null) return null;

  const fallbackDeadlineMs = placementSinceMs + CAPTURE_PLACEMENT_FALLBACK_DELAY_MS;
  if (pulseLockedSinceMs == null) return fallbackDeadlineMs;

  return Math.min(
    pulseLockedSinceMs + CAPTURE_PULSE_LOCKED_DELAY_MS,
    fallbackDeadlineMs,
  );
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
