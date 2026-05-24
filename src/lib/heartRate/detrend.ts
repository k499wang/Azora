/**
 * Smoothness-priors detrending (Tarvainen, Ranta-aho & Karjalainen 2002).
 *
 * Removes very-low-frequency baseline drift (DC sway, respiration-induced
 * baseline wander) from a uniformly sampled signal without distorting the
 * cardiac band. It replaces a rectangular moving-average detrend, whose leaky
 * frequency response attenuates RSA energy and whose fixed time-constant
 * behaves inconsistently across capture lengths.
 *
 * The trend is the Whittaker smoother  trend = (I + λ²·D₂ᵀD₂)⁻¹·z,  where D₂ is
 * the discrete second-difference operator. The detrended signal is z minus that
 * trend — a zero-phase high-pass. λ is derived from the sample rate so the
 * cutoff frequency is fixed in Hz regardless of frame rate (the half-gain point
 * is where 16·λ²·sin⁴(ω_c/2) = 1).
 *
 * A = I + λ²·D₂ᵀD₂ is symmetric, positive-definite and pentadiagonal, so it is
 * solved with a banded Cholesky factorization in O(n).
 */

// Cutoff sits below the slowest plausible heart rate (~40 bpm = 0.67 Hz) and
// above respiration, so slow baseline sway is removed while the cardiac
// fundamental is preserved.
const DETREND_CUTOFF_HZ = 0.4;

export function smoothnessPriorsLambdaSquared(
  sampleRate: number,
  cutoffHz: number = DETREND_CUTOFF_HZ,
): number {
  const omegaC = (2 * Math.PI * cutoffHz) / sampleRate;
  const halfGainSin = Math.sin(omegaC / 2);
  return 1 / (16 * halfGainSin ** 4);
}

/**
 * Whittaker (second-order smoothness) trend estimate: (I + λ²·D₂ᵀD₂)⁻¹·z.
 * `lambdaSquared` is the smoothness weight (Tarvainen's λ²).
 */
export function smoothnessPriorsTrend(values: number[], lambdaSquared: number): number[] {
  const n = values.length;
  if (n < 3) return values.slice();

  // A = I + λ²·(D₂ᵀD₂), symmetric pentadiagonal. The second-difference penalty
  // D₂ᵀD₂ has the fixed banded structure:
  //   main diagonal: [1, 5, 6, ..., 6, 5, 1]
  //   ±1 diagonal:   [-2, -4, ..., -4, -2]
  //   ±2 diagonal:   [1, 1, ..., 1]
  const ad = new Array<number>(n); // A[i][i]
  const ae = new Array<number>(n); // A[i][i-1]
  const af = new Array<number>(n); // A[i][i-2]

  for (let i = 0; i < n; i++) {
    const main = i === 0 || i === n - 1 ? 1 : i === 1 || i === n - 2 ? 5 : 6;
    ad[i] = 1 + lambdaSquared * main;
    ae[i] = i >= 1 ? lambdaSquared * (i === 1 || i === n - 1 ? -2 : -4) : 0;
    af[i] = i >= 2 ? lambdaSquared : 0;
  }

  // Banded Cholesky A = L·Lᵀ (half-bandwidth 2). A is SPD (eigenvalues ≥ 1),
  // so no pivoting is needed.
  const ld = new Array<number>(n); // L[i][i]
  const le = new Array<number>(n); // L[i][i-1]
  const lf = new Array<number>(n); // L[i][i-2]
  for (let i = 0; i < n; i++) {
    lf[i] = i >= 2 ? af[i] / ld[i - 2] : 0;
    le[i] = i >= 1 ? (ae[i] - (i >= 2 ? lf[i] * le[i - 1] : 0)) / ld[i - 1] : 0;
    ld[i] = Math.sqrt(ad[i] - lf[i] * lf[i] - le[i] * le[i]);
  }

  // Forward solve L·y = z.
  const y = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const rhs =
      values[i] - (i >= 1 ? le[i] * y[i - 1] : 0) - (i >= 2 ? lf[i] * y[i - 2] : 0);
    y[i] = rhs / ld[i];
  }

  // Backward solve Lᵀ·x = y.
  const trend = new Array<number>(n);
  for (let i = n - 1; i >= 0; i--) {
    const rhs =
      y[i] -
      (i + 1 < n ? le[i + 1] * trend[i + 1] : 0) -
      (i + 2 < n ? lf[i + 2] * trend[i + 2] : 0);
    trend[i] = rhs / ld[i];
  }

  return trend;
}

export function smoothnessPriorsDetrend(values: number[], sampleRate: number): number[] {
  const n = values.length;
  if (n < 4 || sampleRate <= 0) {
    const avg = n > 0 ? values.reduce((sum, value) => sum + value, 0) / n : 0;
    return values.map((value) => value - avg);
  }

  const trend = smoothnessPriorsTrend(values, smoothnessPriorsLambdaSquared(sampleRate));
  return values.map((value, index) => value - trend[index]);
}
