/**
 * Lung age — the chronological age whose typical untrained breath hold matches
 * yours, in years.
 *
 * Peer medians decay roughly exponentially with age (vital capacity and CO2
 * tolerance both decline), so a hold maps back to an age by inverting that
 * curve. A hold exactly at your own age's median returns your own age.
 *
 * This is a heuristic, not a spirometry-derived clinical lung age.
 */

import { colors } from '../theme/colors';

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
  /** Negative when lungs read younger than the person's actual age. Null when their age is unknown. */
  deltaYears: number | null;
  label: string | null;
  /** Same comparison as `label`, trimmed to fit inside a ring. */
  shortLabel: string | null;
}

export function estimateLungAge(
  holdSeconds: number,
  age: number | null,
): LungAgeEstimate {
  const safeHold = Math.max(1, holdSeconds);
  const raw =
    MIN_LUNG_AGE -
    Math.log(safeHold / YOUNGEST_MEDIAN_SECONDS) / DECAY_PER_YEAR;
  const years = Math.round(
    Math.min(MAX_LUNG_AGE, Math.max(MIN_LUNG_AGE, raw)),
  );
  if (age == null) {
    return { years, deltaYears: null, label: null, shortLabel: null };
  }

  const deltaYears = years - Math.round(age);

  let label: string;
  let shortLabel: string;
  if (deltaYears <= -1) {
    label = `${Math.abs(deltaYears)} years younger than you`;
    shortLabel = `${Math.abs(deltaYears)} years younger`;
  } else if (deltaYears >= 1) {
    label = `${deltaYears} years older than you`;
    shortLabel = `${deltaYears} years older`;
  } else {
    label = 'right on your age';
    shortLabel = 'right on your age';
  }

  return { years, deltaYears, label, shortLabel };
}

// ─── Visual display helpers ───────────────────────────────────────────────────

// The onboarding dial reads like a speedometer, so it grows with age. A progress
// ring reads the opposite way — full means good — so the ring fill is inverted:
// the youngest lung age fills it, the oldest nearly empties it.
const RING_MIN_FILL = 0.08;

/** Where a lung age sits on a 0–1 progress ring. Younger reads fuller. */
export function lungAgeRingFill(years: number): number {
  const span = MAX_LUNG_AGE - MIN_LUNG_AGE;
  const clamped = Math.min(MAX_LUNG_AGE, Math.max(MIN_LUNG_AGE, years));
  const youth = 1 - (clamped - MIN_LUNG_AGE) / span;
  return RING_MIN_FILL + youth * (1 - RING_MIN_FILL);
}

export interface LungAgeToneMeta {
  ringColors: [string, string];
  textColor: string;
  direction: 'positive' | 'neutral';
  /** Tinted pill behind the comparison line. `pillTextColor` is the darker step
   *  of the same family so the label stays legible on the tint. */
  pillBackground: string;
  pillTextColor: string;
}

const YOUNGER_TONE: LungAgeToneMeta = {
  ringColors: [colors.success[500], colors.primary.blue500],
  textColor: colors.success[500],
  direction: 'positive',
  pillBackground: colors.success[100],
  pillTextColor: colors.success[700],
};
const ON_PACE_TONE: LungAgeToneMeta = {
  ringColors: [colors.primary.blue500, colors.primary.blue400],
  textColor: colors.primary.blue500,
  direction: 'neutral',
  pillBackground: colors.primary.blue100,
  pillTextColor: colors.primary.blue700,
};
const OLDER_TONE: LungAgeToneMeta = {
  ringColors: [colors.orange[500], colors.error[500]],
  textColor: colors.orange[500],
  direction: 'neutral',
  pillBackground: colors.orange[100],
  pillTextColor: colors.orange[700],
};

/** Coloring for a lung-age readout. A null delta means the age is unknown. */
export function lungAgeToneMeta(deltaYears: number | null): LungAgeToneMeta {
  if (deltaYears == null || deltaYears === 0) return ON_PACE_TONE;
  return deltaYears < 0 ? YOUNGER_TONE : OLDER_TONE;
}

const REFERENCE_AGES = [20, 30, 40, 50, 60, 70];

export interface LungAgeReference {
  age: number;
  medianSeconds: number;
}

/**
 * Median hold at a spread of ages, so the in-app explainer quotes the same curve
 * the estimate is inverted from rather than a hand-written copy of it.
 */
export function lungAgeReferenceHolds(): LungAgeReference[] {
  return REFERENCE_AGES.map((age) => ({
    age,
    medianSeconds: Math.round(medianHoldForAge(age)),
  }));
}
