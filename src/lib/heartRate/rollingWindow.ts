import type { BrightnessSample } from './types';
import { computeBPM } from './signalProcessing';

const DEFAULT_WINDOW_MS = 15000;

/**
 * Takes the most recent windowMs of samples from the buffer and computes BPM.
 * Returns null if not enough data for a valid reading.
 */
export function computeRollingBPM(
  buffer: BrightnessSample[],
  windowMs: number = DEFAULT_WINDOW_MS,
): { bpm: number; confidence: number } | null {
  if (buffer.length === 0) return null;

  const now = buffer[buffer.length - 1].timestamp;
  const cutoff = now - windowMs;
  const windowSamples = buffer.filter((s) => s.timestamp >= cutoff);

  if (windowSamples.length === 0) return null;

  return computeBPM(windowSamples);
}
