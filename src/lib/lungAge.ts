/**
 * Lung age — the chronological age whose typical untrained breath hold matches
 * yours. Distinct from the Azora Score: the score is a 0–100 performance rating,
 * this is a number of years.
 *
 * Peer medians decay roughly exponentially with age (vital capacity and CO2
 * tolerance both decline), so a hold maps back to an age by inverting that
 * curve. A hold exactly at your own age's median returns your own age.
 *
 * This is a heuristic, not a spirometry-derived clinical lung age.
 */

export const MIN_LUNG_AGE = 18;
export const MAX_LUNG_AGE = 90;

// The two endpoints calibrate the whole gauge: a one-minute hold reads as the
// youngest result, a ten-second hold as the oldest. Everything in between falls
// out of the decay rate they imply, so widening the gauge means moving these.
const YOUNGEST_MEDIAN_SECONDS = 60;
const OLDEST_MEDIAN_SECONDS = 10;

const DECAY_PER_YEAR =
  Math.log(YOUNGEST_MEDIAN_SECONDS / OLDEST_MEDIAN_SECONDS) /
  (MAX_LUNG_AGE - MIN_LUNG_AGE);

/** Typical untrained hold, in seconds, for a healthy person of this age. */
export function medianHoldForAge(age: number): number {
  if (age <= MIN_LUNG_AGE) return YOUNGEST_MEDIAN_SECONDS;
  return (
    YOUNGEST_MEDIAN_SECONDS * Math.exp(-DECAY_PER_YEAR * (age - MIN_LUNG_AGE))
  );
}

// The youngest result still has to read as a result: at a bare 0 fill the arc
// disappears and the calibration sweep has nothing to travel. Starting the
// scale above empty gives an 18-year-old lung age a visible arc and a real
// sweep, at the cost of a slightly compressed scale everywhere else.
export const GAUGE_MIN_FILL = 10;

/** Where a lung age sits on the 18–90 gauge, as a GAUGE_MIN_FILL–100 fill. */
export function lungAgeGaugeFill(years: number): number {
  const span = MAX_LUNG_AGE - MIN_LUNG_AGE;
  const clamped = Math.min(MAX_LUNG_AGE, Math.max(MIN_LUNG_AGE, years));
  return (
    GAUGE_MIN_FILL + ((clamped - MIN_LUNG_AGE) / span) * (100 - GAUGE_MIN_FILL)
  );
}

/** Inverse of `lungAgeGaugeFill`, in whole years. Runs on the UI thread. */
export function lungAgeFromGaugeFill(fill: number): number {
  'worklet';
  const span = MAX_LUNG_AGE - MIN_LUNG_AGE;
  const ratio = (fill - GAUGE_MIN_FILL) / (100 - GAUGE_MIN_FILL);
  return Math.round(
    MIN_LUNG_AGE + Math.min(1, Math.max(0, ratio)) * span,
  );
}

export interface LungAgeEstimate {
  /** Estimated lung age in whole years. */
  years: number;
  /** Negative when lungs read younger than the person's actual age. */
  deltaYears: number;
  label: string;
}

export function estimateLungAge(
  holdSeconds: number,
  age: number,
): LungAgeEstimate {
  const safeHold = Math.max(1, holdSeconds);
  const raw =
    MIN_LUNG_AGE -
    Math.log(safeHold / YOUNGEST_MEDIAN_SECONDS) / DECAY_PER_YEAR;
  const years = Math.round(
    Math.min(MAX_LUNG_AGE, Math.max(MIN_LUNG_AGE, raw)),
  );
  const deltaYears = years - Math.round(age);

  let label: string;
  if (deltaYears <= -1) {
    label = `${Math.abs(deltaYears)} years younger than you`;
  } else if (deltaYears >= 1) {
    label = `${deltaYears} years older than you`;
  } else {
    label = 'right on your age';
  }

  return { years, deltaYears, label };
}
