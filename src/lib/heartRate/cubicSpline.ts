/**
 * Natural cubic spline interpolation for PPG signal upsampling.
 *
 * Smartphone cameras deliver PPG at ~30 Hz, which creates ±16.7 ms quantization
 * error on beat timestamps. Upsampling to 180–250 Hz before peak detection
 * reduces this to ±2.8–5.6 ms, directly improving HRV (RMSSD) accuracy.
 *
 * This implements the classic tridiagonal-matrix (Thomas) algorithm for
 * natural cubic splines (second derivative = 0 at endpoints).
 *
 * References:
 *   - HRV4Training / CameraHRV: cubic spline to 180 Hz
 *   - Sun et al.: cubic-spline interpolation reduces sampling error in PPG HRV
 *   - Beres & Hejjel: 20 Hz + interpolation ≈ 50 Hz without for time-domain HRV
 */

export interface CubicSpline {
  /** Original x coordinates (timestamps) */
  x: number[];
  /** Coefficients: a[i] + b[i]*t + c[i]*t² + d[i]*t³ for segment i */
  a: number[];
  b: number[];
  c: number[];
  d: number[];
}

/**
 * Build a natural cubic spline through the given points.
 *
 * Requires x to be strictly increasing. Runs in O(n) time using the
 * Thomas algorithm for tridiagonal systems.
 */
export function buildNaturalCubicSpline(x: number[], y: number[]): CubicSpline {
  const n = x.length;
  if (n < 2) {
    throw new Error('Cubic spline requires at least 2 points');
  }
  if (n !== y.length) {
    throw new Error('x and y must have the same length');
  }
  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(x[i]) || !Number.isFinite(y[i])) {
      throw new Error('x and y values must be finite');
    }
  }
  for (let i = 1; i < n; i++) {
    if (x[i] <= x[i - 1]) {
      throw new Error('x must be strictly increasing');
    }
  }

  // h[i] = x[i+1] - x[i]
  const h = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    h[i] = x[i + 1] - x[i];
  }

  // Set up tridiagonal system for c (second derivatives)
  // Natural boundary: c[0] = c[n-1] = 0
  const alpha = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    alpha[i] =
      (3 / h[i]) * (y[i + 1] - y[i]) - (3 / h[i - 1]) * (y[i] - y[i - 1]);
  }

  const l = new Array(n).fill(0);
  const mu = new Array(n).fill(0);
  const z = new Array(n).fill(0);

  l[0] = 1;
  for (let i = 1; i < n - 1; i++) {
    l[i] = 2 * (x[i + 1] - x[i - 1]) - h[i - 1] * mu[i - 1];
    mu[i] = h[i] / l[i];
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
  }
  l[n - 1] = 1;

  const c = new Array(n).fill(0);
  const b = new Array(n - 1);
  const d = new Array(n - 1);
  const a = new Array(n - 1);

  for (let j = n - 2; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1];
    b[j] = (y[j + 1] - y[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3;
    d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
    a[j] = y[j];
  }

  return { x: x.slice(), a, b, c: c.slice(0, n - 1), d };
}

/**
 * Evaluate a cubic spline at a single point.
 *
 * Uses binary search to find the correct segment. If t is outside the
 * spline's domain, returns the nearest endpoint value.
 */
export function evaluateSpline(spline: CubicSpline, t: number): number {
  const { x, a, b, c, d } = spline;
  const n = x.length;

  if (n === 0) return NaN;
  if (n === 1) return a[0] ?? 0;

  if (t <= x[0]) {
    return a[0];
  }
  if (t >= x[n - 1]) {
    const last = n - 2;
    const dx = x[n - 1] - x[last];
    return a[last] + b[last] * dx + c[last] * dx * dx + d[last] * dx * dx * dx;
  }

  // Binary search for the segment containing t
  let lo = 0;
  let hi = n - 2;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (t < x[mid]) {
      hi = mid - 1;
    } else if (t >= x[mid + 1]) {
      lo = mid + 1;
    } else {
      const dx = t - x[mid];
      return a[mid] + b[mid] * dx + c[mid] * dx * dx + d[mid] * dx * dx * dx;
    }
  }

  // Fallback (should not reach here for valid input)
  const last = n - 2;
  const dx = t - x[last];
  return a[last] + b[last] * dx + c[last] * dx * dx + d[last] * dx * dx * dx;
}

/**
 * Upsample a signal to a uniform grid at targetRate Hz using natural
 * cubic spline interpolation.
 *
 * @param values    Signal samples
 * @param timestamps Corresponding timestamps in milliseconds
 * @param targetRate Target sample rate in Hz (e.g. 180)
 * @returns Upsampled values and timestamps
 */
export function upsampleCubicSpline(
  values: number[],
  timestamps: number[],
  targetRate: number,
): { values: number[]; timestamps: number[]; sampleRate: number } {
  validateUpsampleInput(values, timestamps, targetRate);

  if (values.length < 4) {
    // Not enough points for a meaningful cubic spline — fall back to linear
    return upsampleLinear(values, timestamps, targetRate);
  }

  const spline = buildNaturalCubicSpline(timestamps, values);

  const start = timestamps[0];
  const end = timestamps[timestamps.length - 1];
  const stepMs = 1000 / targetRate;
  const sampleCount = Math.floor((end - start) / stepMs) + 1;

  const newValues = new Array<number>(sampleCount);
  const newTimestamps = new Array<number>(sampleCount);
  let segmentIndex = 0;
  const lastSegmentIndex = spline.x.length - 2;

  for (let i = 0; i < sampleCount; i++) {
    const t = start + i * stepMs;
    while (
      segmentIndex < lastSegmentIndex &&
      t >= spline.x[segmentIndex + 1]
    ) {
      segmentIndex += 1;
    }

    const dx = t - spline.x[segmentIndex];
    newTimestamps[i] = t;
    newValues[i] =
      spline.a[segmentIndex] +
      spline.b[segmentIndex] * dx +
      spline.c[segmentIndex] * dx * dx +
      spline.d[segmentIndex] * dx * dx * dx;
  }

  return { values: newValues, timestamps: newTimestamps, sampleRate: targetRate };
}

/**
 * Fallback linear upsampling when too few points for cubic spline.
 */
function upsampleLinear(
  values: number[],
  timestamps: number[],
  targetRate: number,
): { values: number[]; timestamps: number[]; sampleRate: number } {
  const start = timestamps[0];
  const end = timestamps[timestamps.length - 1];
  const stepMs = 1000 / targetRate;
  const sampleCount = Math.floor((end - start) / stepMs) + 1;

  const newValues: number[] = [];
  const newTimestamps: number[] = [];
  let sourceIndex = 0;

  for (let i = 0; i < sampleCount; i++) {
    const t = start + i * stepMs;
    while (sourceIndex < timestamps.length - 2 && timestamps[sourceIndex + 1] < t) {
      sourceIndex += 1;
    }

    const t0 = timestamps[sourceIndex];
    const t1 = timestamps[sourceIndex + 1];
    const v0 = values[sourceIndex];
    const v1 = values[sourceIndex + 1];

    if (t1 == null || v1 == null || t1 <= t0) {
      newValues.push(v0);
    } else {
      const ratio = (t - t0) / (t1 - t0);
      newValues.push(v0 + (v1 - v0) * ratio);
    }
    newTimestamps.push(t);
  }

  return { values: newValues, timestamps: newTimestamps, sampleRate: targetRate };
}

function validateUpsampleInput(values: number[], timestamps: number[], targetRate: number): void {
  if (values.length !== timestamps.length) {
    throw new Error('values and timestamps must have the same length');
  }
  if (values.length < 2) {
    throw new Error('Upsampling requires at least 2 samples');
  }
  if (!Number.isFinite(targetRate) || targetRate <= 0) {
    throw new Error('targetRate must be a positive finite number');
  }
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i]) || !Number.isFinite(timestamps[i])) {
      throw new Error('values and timestamps must be finite');
    }
    if (i > 0 && timestamps[i] <= timestamps[i - 1]) {
      throw new Error('timestamps must be strictly increasing');
    }
  }
}
