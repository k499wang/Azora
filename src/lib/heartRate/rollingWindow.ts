import type { HeartRateEstimate, PpgFrameSample } from './types';
import {
  computeBPMComparison,
  type ComputeBpmComparison,
  type ComputeBpmOptions,
} from './signalProcessing';

const DEFAULT_WINDOW_MS = 15000;

/**
 * Takes the most recent windowMs of samples from the buffer and computes BPM.
 * Returns null if not enough data for a valid reading.
 */
export function computeRollingBPM(
  buffer: PpgFrameSample[],
  windowMs: number = DEFAULT_WINDOW_MS,
  options?: ComputeBpmOptions,
): HeartRateEstimate | null {
  return computeRollingBPMComparison(buffer, windowMs, options).consensus;
}

export function computeRollingBPMComparison(
  buffer: PpgFrameSample[],
  windowMs: number = DEFAULT_WINDOW_MS,
  options?: ComputeBpmOptions,
): ComputeBpmComparison {
  if (buffer.length === 0) {
    return {
      original: null,
      pulseHue: null,
      consensus: null,
    };
  }

  const now = buffer[buffer.length - 1].timestamp;
  const cutoff = now - windowMs;
  const windowSamples = buffer.filter((s) => s.timestamp >= cutoff);

  if (windowSamples.length === 0) {
    return {
      original: null,
      pulseHue: null,
      consensus: null,
    };
  }

  return computeBPMComparison(windowSamples, options);
}
