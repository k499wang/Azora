/**
 * Where a measured resting heart rate sits for someone's age and sex.
 *
 * Typical ranges are the middle band of healthy adult resting rates rather than
 * the full 60–100 bpm clinical window, so the reading lands somewhere
 * meaningful instead of always reading "normal". Female rates run a few bpm
 * higher than male at the same age (smaller heart, smaller stroke volume), so
 * the band is shifted rather than re-tabulated.
 *
 * This is orientation copy, not a clinical assessment.
 */

export type RestingHeartRateBand = 'below' | 'typical' | 'above';

export type RestingHeartRateSex = 'female' | 'male' | 'unspecified';

interface AgeBand {
  maxAge: number;
  low: number;
  high: number;
}

const AGE_BANDS: AgeBand[] = [
  { maxAge: 17, low: 62, high: 78 },
  { maxAge: 29, low: 60, high: 74 },
  { maxAge: 39, low: 60, high: 75 },
  { maxAge: 49, low: 61, high: 76 },
  { maxAge: 59, low: 62, high: 77 },
  { maxAge: Infinity, low: 62, high: 78 },
];

/** Female resting rates average a few bpm above male at the same age. */
const FEMALE_OFFSET_BPM = 3;

export const MIN_GAUGE_BPM = 40;
export const MAX_GAUGE_BPM = 120;

/** Where a resting heart rate sits on the 40–120 gauge, as a 0–100 fill. */
export function restingHeartRateGaugeFill(bpm: number): number {
  const span = MAX_GAUGE_BPM - MIN_GAUGE_BPM;
  const clamped = Math.min(MAX_GAUGE_BPM, Math.max(MIN_GAUGE_BPM, bpm));
  return ((clamped - MIN_GAUGE_BPM) / span) * 100;
}

export interface RestingHeartRateContext {
  typicalLow: number;
  typicalHigh: number;
  band: RestingHeartRateBand;
  bandLabel: string;
  /** Who the typical range describes, e.g. "women around 34". */
  peerLabel: string;
  /** One-line read on the number itself. */
  headline: string;
  /** Why it looks that way and what changes it. */
  detail: string;
}

const BAND_LABEL: Record<RestingHeartRateBand, string> = {
  below: 'Below average',
  typical: 'Average',
  above: 'Above average',
};

const BAND_DETAIL: Record<RestingHeartRateBand, string> = {
  below:
    'A slower resting heart rate is linked to a longer life, deeper sleep and sharper focus. Yours is already there — a daily reset is how you keep it.',
  typical:
    'A slower resting heart rate is linked to a longer life, deeper sleep and sharper focus. A daily reset is one of the fastest ways to move yours down.',
  above:
    'A slower resting heart rate is linked to a longer life, deeper sleep and sharper focus. Yours has room to come down, and a daily reset is the fastest way there.',
};

function bandForAge(age: number): AgeBand {
  return AGE_BANDS.find((entry) => age <= entry.maxAge) ?? AGE_BANDS[AGE_BANDS.length - 1];
}

function peerLabel(age: number, sex: RestingHeartRateSex): string {
  const rounded = Math.round(age);
  if (sex === 'female') return `women around ${rounded}`;
  if (sex === 'male') return `men around ${rounded}`;
  return `people around ${rounded}`;
}

export function describeRestingHeartRate({
  bpm,
  age,
  sex,
}: {
  bpm: number;
  age: number;
  sex: RestingHeartRateSex;
}): RestingHeartRateContext {
  const ageBand = bandForAge(age);
  const offset = sex === 'female' ? FEMALE_OFFSET_BPM : 0;
  const typicalLow = ageBand.low + offset;
  const typicalHigh = ageBand.high + offset;

  const band: RestingHeartRateBand =
    bpm < typicalLow ? 'below' : bpm > typicalHigh ? 'above' : 'typical';

  const peers = peerLabel(age, sex);
  const headline =
    band === 'below'
      ? `${bpm} bpm sits under the typical range for ${peers}.`
      : band === 'above'
        ? `${bpm} bpm sits above the typical range for ${peers}.`
        : `${bpm} bpm sits inside the typical range for ${peers}.`;

  return {
    typicalLow,
    typicalHigh,
    band,
    bandLabel: BAND_LABEL[band],
    peerLabel: peers,
    headline,
    detail: BAND_DETAIL[band],
  };
}
