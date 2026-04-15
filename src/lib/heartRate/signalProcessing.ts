import type { BrightnessSample } from './types';

const MIN_SAMPLES = 18;
const MIN_DURATION_MS = 8000;
const STABILIZATION_MS = 3000;
const POST_STAB_MIN_SAMPLES = 12;
const FREQ_STEP = 0.02;
const BPM_FREQ_MIN = 0.67; // 40 bpm
const BPM_FREQ_MAX = 3.0;  // 180 bpm
const MIN_CONFIDENCE = 0.25;

/**
 * Compute power at a specific frequency using the Goertzel algorithm.
 */
function goertzel(signal: number[], targetFreq: number, sampleRate: number): number {
  const N = signal.length;
  const k = (targetFreq / sampleRate) * N;
  const omega = (2 * Math.PI * k) / N;
  const cosine = Math.cos(omega);
  const coeff = 2 * cosine;

  let prev1 = 0;
  let prev2 = 0;

  for (let i = 0; i < N; i++) {
    const curr = coeff * prev1 - prev2 + signal[i];
    prev2 = prev1;
    prev1 = curr;
  }

  return prev1 * prev1 + prev2 * prev2 - prev1 * prev2 * coeff;
}

/**
 * Detrend by subtracting a moving average sized to ~1 second of samples.
 * This removes slow drift while preserving heart rate oscillations.
 */
function detrend(values: number[], sampleRate: number): number[] {
  // Window = ~1 second worth of samples, must be odd
  let windowSize = Math.round(sampleRate);
  if (windowSize % 2 === 0) windowSize += 1;
  if (windowSize < 3) windowSize = 3;

  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const half = Math.floor(windowSize / 2);
    const start = Math.max(0, i - half);
    const end = Math.min(values.length, i + half + 1);
    let sum = 0;
    for (let j = start; j < end; j++) sum += values[j];
    result.push(values[i] - sum / (end - start));
  }
  return result;
}

/**
 * Normalize signal to zero mean, unit variance.
 */
function normalize(values: number[]): number[] {
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);
  if (std === 0) return values.map(() => 0);
  return values.map((v) => (v - mean) / std);
}

/**
 * Compute BPM from brightness samples using Goertzel-based frequency analysis.
 */
export function computeBPM(
  samples: BrightnessSample[],
): { bpm: number; confidence: number } | null {
  if (samples.length < MIN_SAMPLES) return null;

  const startTs = samples[0].timestamp;
  const endTs = samples[samples.length - 1].timestamp;
  const totalDurationMs = endTs - startTs;

  if (totalDurationMs < MIN_DURATION_MS) return null;

  // Discard first 3s (stabilization)
  const stabCutoff = startTs + STABILIZATION_MS;
  const stabSamples = samples.filter((s) => s.timestamp >= stabCutoff);

  if (stabSamples.length < POST_STAB_MIN_SAMPLES) return null;

  const values = stabSamples.map((s) => s.value);

  // Compute effective sample rate
  const firstTs = stabSamples[0].timestamp;
  const lastTs = stabSamples[stabSamples.length - 1].timestamp;
  const durationSec = (lastTs - firstTs) / 1000;
  if (durationSec <= 0) return null;
  const sampleRate = stabSamples.length / durationSec;

  // Detrend with ~1s moving average, then normalize
  const detrended = detrend(values, sampleRate);
  const signal = normalize(detrended);

  // Goertzel across heart rate frequency range
  const frequencies: number[] = [];
  const powers: number[] = [];

  for (let freq = BPM_FREQ_MIN; freq <= BPM_FREQ_MAX; freq += FREQ_STEP) {
    frequencies.push(freq);
    powers.push(goertzel(signal, freq, sampleRate));
  }

  // Find the strongest peak
  let peak1Idx = -1;
  let peak1Power = -Infinity;

  for (let i = 0; i < frequencies.length; i++) {
    if (powers[i] > peak1Power) {
      peak1Power = powers[i];
      peak1Idx = i;
    }
  }

  if (peak1Idx === -1) return null;

  // Harmonic rejection: check if peak is ~2x a strong sub-harmonic
  const peakFreq1 = frequencies[peak1Idx];
  const subHarmonicFreq = peakFreq1 / 2;

  let peakIdx = peak1Idx;

  if (subHarmonicFreq >= BPM_FREQ_MIN) {
    // Find the strongest bin near the sub-harmonic
    let subIdx = -1;
    let subPower = -Infinity;
    for (let i = 0; i < frequencies.length; i++) {
      if (Math.abs(frequencies[i] - subHarmonicFreq) < 0.1 && powers[i] > subPower) {
        subPower = powers[i];
        subIdx = i;
      }
    }

    // If sub-harmonic has at least 30% of the peak's power, it's likely the fundamental
    if (subIdx !== -1 && subPower > peak1Power * 0.3) {
      peakIdx = subIdx;
    }
  }

  const peakFreq = frequencies[peakIdx];
  const peakPower = powers[peakIdx];

  // Confidence: peak power vs mean of non-neighboring frequencies
  const neighborRange = 0.15; // Hz
  const otherPowers = powers.filter(
    (_, i) => Math.abs(frequencies[i] - peakFreq) > neighborRange,
  );
  const meanOtherPower =
    otherPowers.length > 0
      ? otherPowers.reduce((s, p) => s + p, 0) / otherPowers.length
      : 1;

  const rawConfidence =
    meanOtherPower > 0 ? peakPower / (peakPower + meanOtherPower) : 0;
  const confidence = Math.min(0.99, Math.max(0, rawConfidence));

  if (confidence < MIN_CONFIDENCE) return null;

  return {
    bpm: Math.round(peakFreq * 60),
    confidence,
  };
}
