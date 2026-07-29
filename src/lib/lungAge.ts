/**
 * Lung age — the chronological age whose typical untrained breath hold matches
 * yours. Distinct from the Azora Score: the score is a 0–100 performance rating,
 * this is a number of years.
 *
 * Peer medians decay roughly exponentially with age past the early twenties
 * (vital capacity and CO2 tolerance both decline), so a hold maps back to an age
 * by inverting that curve. A hold exactly at your own age's median returns your
 * own age.
 *
 * This is a heuristic, not a spirometry-derived clinical lung age.
 */

const PEAK_AGE = 22;
const PEAK_MEDIAN_SECONDS = 46;
const DECAY_PER_YEAR = 0.0125;

export const MIN_LUNG_AGE = 18;
export const MAX_LUNG_AGE = 90;

/** Typical untrained hold, in seconds, for a healthy person of this age. */
export function medianHoldForAge(age: number): number {
  if (age <= PEAK_AGE) return PEAK_MEDIAN_SECONDS;
  return PEAK_MEDIAN_SECONDS * Math.exp(-DECAY_PER_YEAR * (age - PEAK_AGE));
}

/** Where a lung age sits on the 18–90 gauge, as a 0–100 fill. */
export function lungAgeGaugeFill(years: number): number {
  const span = MAX_LUNG_AGE - MIN_LUNG_AGE;
  const clamped = Math.min(MAX_LUNG_AGE, Math.max(MIN_LUNG_AGE, years));
  return ((clamped - MIN_LUNG_AGE) / span) * 100;
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
    PEAK_AGE - Math.log(safeHold / PEAK_MEDIAN_SECONDS) / DECAY_PER_YEAR;
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
