/**
 * Centered moving average for PPG signal smoothing and detrending.
 *
 * `preprocess` subtracts a moving average from the signal to remove the
 * baseline and slow trend, so the average must stay *centered* on each sample.
 * A trailing/causal average would phase-shift the result by ~half a window,
 * distorting the pulse upstroke that beat timing is derived from — and thus
 * corrupting HRV. The window also shrinks symmetrically at the signal edges.
 */

/**
 * Round `samples` to the nearest positive odd integer.
 *
 * A centered window must be odd so it has a single middle sample with an equal
 * number of neighbours on each side.
 */
export function makeOddWindow(samples: number): number {
  const rounded = Math.max(1, Math.round(samples));
  return rounded % 2 === 0 ? rounded + 1 : rounded;
}

/**
 * Centered moving average over an odd-length window, in O(n).
 *
 * Maintains a running sum across a window that advances with the output index,
 * instead of re-summing the window for every sample (O(n × window)). Both
 * window bounds only ever move forward, so the whole pass is linear.
 *
 * @param values     Input signal.
 * @param windowSize Desired window length; coerced to a positive odd integer.
 * @returns Smoothed signal, same length as `values`. Each element is the mean
 *          of the window centered on it, clipped to the signal bounds.
 */
export function movingAverage(values: number[], windowSize: number): number[] {
  const window = makeOddWindow(windowSize);
  const half = (window - 1) / 2;
  const n = values.length;
  const result = new Array<number>(n);

  let windowSum = 0;
  let windowStart = 0;
  let windowEnd = -1;

  for (let i = 0; i < n; i++) {
    const targetEnd = Math.min(n - 1, i + half);
    const targetStart = Math.max(0, i - half);

    while (windowEnd < targetEnd) windowSum += values[++windowEnd];
    while (windowStart < targetStart) windowSum -= values[windowStart++];

    result[i] = windowSum / (windowEnd - windowStart + 1);
  }

  return result;
}
