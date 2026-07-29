// A fixed calibration duration makes short sweeps crawl: the arc barely moves
// and the counter ticks a handful of times spread over seconds. Holding the
// sweep speed constant instead keeps both the motion and the counting cadence
// identical whatever the measured value is.
const MS_PER_FILL_PERCENT = 26;
const MIN_CALIBRATION_MS = 850;
const MAX_CALIBRATION_MS = 2400;

export function calibrationDurationMs(fromFill: number, toFill: number) {
  const travel = Math.abs(toFill - fromFill);
  return Math.round(
    Math.min(
      MAX_CALIBRATION_MS,
      Math.max(MIN_CALIBRATION_MS, travel * MS_PER_FILL_PERCENT),
    ),
  );
}
