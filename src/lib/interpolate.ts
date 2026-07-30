/** An anchor table, ascending by x. */
export type Curve = ReadonlyArray<readonly [x: number, y: number]>;

/**
 * Piecewise-linear lookup across an anchor table. Values outside the table
 * clamp to the nearest endpoint, so a curve stays flat past its edges rather
 * than extrapolating past the range it was calibrated for.
 */
export function interpolateCurve(curve: Curve, x: number): number {
  const first = curve[0];
  const last = curve[curve.length - 1];
  if (x <= first[0]) return first[1];
  if (x >= last[0]) return last[1];

  for (let i = 1; i < curve.length; i += 1) {
    const [x1, y1] = curve[i];
    if (x <= x1) {
      const [x0, y0] = curve[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }

  return last[1];
}
