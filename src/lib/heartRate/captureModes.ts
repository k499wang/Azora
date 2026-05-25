export type HeartRateCaptureMode = 'quick' | 'full';

export interface HeartRateCaptureModeConfig {
  id: HeartRateCaptureMode;
  label: string;
  durationMs: number;
  computeHrv: boolean;
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
    requiresPro: false,
    shortDescription: 'Heart rate only · 25s',
  },
  full: {
    id: 'full',
    label: 'Full',
    durationMs: 90_000,
    computeHrv: true,
    requiresPro: true,
    shortDescription: 'Heart rate + HRV · 90s',
  },
};

export const DEFAULT_CAPTURE_MODE: HeartRateCaptureMode = 'quick';

export const HEART_RATE_CAPTURE_MODE_ORDER: HeartRateCaptureMode[] = ['quick', 'full'];

export function getCaptureModeConfig(mode: HeartRateCaptureMode): HeartRateCaptureModeConfig {
  return HEART_RATE_CAPTURE_MODES[mode];
}

/** A mode is locked when it requires Pro and the user is not entitled. */
export function isCaptureModeLocked(mode: HeartRateCaptureMode, isPro: boolean): boolean {
  return getCaptureModeConfig(mode).requiresPro && !isPro;
}
