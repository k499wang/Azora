/**
 * HRV statistics derived from inter-beat (RR / IBI) intervals captured by the
 * PPG signal pipeline (HeartRateManager). All inputs are arrays of intervals
 * in milliseconds, in chronological order.
 */

export interface HRVStats {
  rmssd: number;       // ms — short-term variability (parasympathetic)
  sdnn: number;        // ms — overall variability
  stress: number;      // 0..100 stress index
  pnn50: number;       // %  — pairs of beats differing by >50ms
  meanHr: number;      // bpm
  minHr: number;       // bpm (over the hold)
  maxHr: number;       // bpm (over the hold)
  hrDrop: number;      // bpm (start HR − end HR, positive = HR dropped)
  durationSec: number; // s
  beatCount: number;
  score: number;       // 0..100 composite (RMSSD vs 60ms target)
}

const HRV_TARGET_RMSSD = 60;

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance =
    values.reduce((sum, v) => sum + (v - m) * (v - m), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function linearDetrend(values: number[]): number[] {
  const n = values.length;
  if (n < 3) return values;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) * (i - xMean);
  }
  if (den === 0) return values;
  const slope = num / den;
  return values.map((v, i) => v - slope * (i - xMean));
}

function ibiToBpm(ibiMs: number): number {
  if (ibiMs <= 0) return 0;
  return Math.round(60000 / ibiMs);
}

export function computeHRVStats(ibi: number[]): HRVStats {
  if (ibi.length < 2) {
    return {
      rmssd: 0,
      sdnn: 0,
      stress: 0,
      pnn50: 0,
      meanHr: 0,
      minHr: 0,
      maxHr: 0,
      hrDrop: 0,
      durationSec: 0,
      beatCount: ibi.length,
      score: 0,
    };
  }

  let sumSq = 0;
  let nn50 = 0;
  for (let i = 1; i < ibi.length; i++) {
    const diff = ibi[i] - ibi[i - 1];
    sumSq += diff * diff;
    if (Math.abs(diff) > 50) nn50 += 1;
  }
  const rmssd = Math.round(Math.sqrt(sumSq / (ibi.length - 1)));
  const sdnn = Math.round(stddev(linearDetrend(ibi)));
  const pnn50 = Math.round((nn50 / (ibi.length - 1)) * 100);

  const rmssdScore = Math.max(0, 100 - (rmssd / HRV_TARGET_RMSSD) * 100);
  const meanIbi = mean(ibi);
  const meanHr = ibiToBpm(meanIbi);
  const hrScore = Math.max(0, (meanHr - 50) / 30 * 100);
  const stress = Math.round(rmssdScore * 0.7 + hrScore * 0.3);
  const minHr = ibiToBpm(Math.max(...ibi));
  const maxHr = ibiToBpm(Math.min(...ibi));

  const window = Math.max(2, Math.floor(ibi.length * 0.15));
  const startHr = ibiToBpm(mean(ibi.slice(0, window)));
  const endHr = ibiToBpm(mean(ibi.slice(-window)));
  const hrDrop = startHr - endHr;

  const durationSec = Math.round(ibi.reduce((sum, ms) => sum + ms, 0) / 1000);
  const score = Math.max(0, Math.min(100, Math.round((rmssd / HRV_TARGET_RMSSD) * 100)));

  return {
    rmssd,
    sdnn,
    stress,
    pnn50,
    meanHr,
    minHr,
    maxHr,
    hrDrop,
    durationSec,
    beatCount: ibi.length,
    score,
  };
}
