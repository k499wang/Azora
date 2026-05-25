export type HeartRateCaptureMode = 'quick' | 'full';

export interface HeartRateCaptureModeConfig {
  id: HeartRateCaptureMode;
  label: string;
  durationMs: number;
  computeHrv: boolean;
  /** Sensor capture rate. HRV needs fine IBI timing (30); BPM-only tolerates 20. */
  captureFps: number;
  /** Whether this mode is reserved for Pro users (e.g. the longer HRV analysis). */
  requiresPro: boolean;
  shortDescription: string;
}

export const HEART_RATE_CAPTURE_MODES: Record<HeartRateCaptureMode, HeartRateCaptureModeConfig> = {
  quick: {
    id: 'quick',
    label: 'Quick',
    durationMs: 25_000,
    computeHrv: false,
    captureFps: 20,
    requiresPro: false,
    shortDescription: 'Heart rate only · 25s',
  },
  full: {
    id: 'full',
    label: 'Full',
    durationMs: 90_000,
    computeHrv: true,
    captureFps: 30,
    requiresPro: true,
    shortDescription: 'Heart rate + HRV · 90s',
  },
};

export const DEFAULT_CAPTURE_MODE: HeartRateCaptureMode = 'quick';

export const HEART_RATE_CAPTURE_MODE_ORDER: HeartRateCaptureMode[] = ['quick', 'full'];

export function getCaptureModeConfig(mode: HeartRateCaptureMode): HeartRateCaptureModeConfig {
  return HEART_RATE_CAPTURE_MODES[mode];
}

/** Infer which capture mode a saved session used from its stored duration. */
export function inferCaptureModeFromDurationSeconds(
  durationSeconds: number,
): HeartRateCaptureMode {
  const durationMs = durationSeconds * 1000;
  let closest = HEART_RATE_CAPTURE_MODE_ORDER[0];
  let closestDistance = Infinity;
  for (const mode of HEART_RATE_CAPTURE_MODE_ORDER) {
    const distance = Math.abs(HEART_RATE_CAPTURE_MODES[mode].durationMs - durationMs);
    if (distance < closestDistance) {
      closest = mode;
      closestDistance = distance;
    }
  }
  return closest;
}

/** A mode is locked when it requires Pro and the user is not entitled. */
export function isCaptureModeLocked(mode: HeartRateCaptureMode, isPro: boolean): boolean {
  return getCaptureModeConfig(mode).requiresPro && !isPro;
}
