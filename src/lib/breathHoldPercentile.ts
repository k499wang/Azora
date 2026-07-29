/**
 * Where an untrained static breath hold sits against same-age peers.
 *
 * Untrained apnea times are right-skewed, so peers are modelled as a lognormal
 * distribution with an age-dependent median. Medians track the decline in vital
 * capacity and CO2 tolerance with age (Schagatay & Andersson 1998; Ferretti
 * 2001), anchored around ~45s for healthy adults in their twenties.
 *
 * This is a heuristic benchmark, not a clinical norm.
 */

interface AgeNorm {
  maxAge: number;
  medianSeconds: number;
}

const AGE_NORMS: AgeNorm[] = [
  { maxAge: 17, medianSeconds: 42 },
  { maxAge: 24, medianSeconds: 46 },
  { maxAge: 34, medianSeconds: 44 },
  { maxAge: 44, medianSeconds: 40 },
  { maxAge: 54, medianSeconds: 36 },
  { maxAge: 64, medianSeconds: 32 },
  { maxAge: Infinity, medianSeconds: 28 },
];

/** Spread of log(hold time) across untrained adults — a doubling is ~2 SD. */
const LOG_SD = 0.42;

function medianForAge(age: number): number {
  const norm = AGE_NORMS.find((entry) => age <= entry.maxAge);
  return norm ? norm.medianSeconds : AGE_NORMS[AGE_NORMS.length - 1].medianSeconds;
}

function normalCdf(z: number): number {
  // Zelen & Severo 26.2.17 approximation, accurate to ~7.5e-8.
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}

export interface BreathHoldBenchmark {
  /** Share of same-age peers this hold beats, 1–99. */
  percentile: number;
  /** Share of same-age peers this hold falls short of, 1–99. */
  topPercent: number;
  /** Peer median hold in seconds, for context copy. */
  peerMedianSeconds: number;
  label: string;
}

export function benchmarkBreathHold(
  holdSeconds: number,
  age: number,
): BreathHoldBenchmark {
  const peerMedianSeconds = medianForAge(age);
  const safeHold = Math.max(1, holdSeconds);
  const z = Math.log(safeHold / peerMedianSeconds) / LOG_SD;
  const percentile = Math.min(99, Math.max(1, Math.round(normalCdf(z) * 100)));
  const topPercent = Math.min(99, Math.max(1, 100 - percentile));

  const label =
    percentile >= 50
      ? `Top ${topPercent}% of people your age`
      : `Ahead of ${percentile}% of people your age`;

  return { percentile, topPercent, peerMedianSeconds, label };
}
