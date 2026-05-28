import { colors } from '../../theme/colors';

export type RestingHeartRateZone = 'low' | 'healthy' | 'elevated' | 'high';

export interface RestingHeartRateZoneInfo {
  zone: RestingHeartRateZone;
  label: string;
  color: string;
}

interface RestingHeartRateBand {
  /** Inclusive upper bound of the age group this band applies to. */
  maxAge: number;
  /** Below this is bradycardia territory (red). */
  lowMax: number;
  /** Upper bound of the healthy/athletic range (green). */
  greenMax: number;
  /** Upper bound of the slightly-elevated range (amber). Above is high (red). */
  yellowMax: number;
}

// Age-based resting heart-rate reference (gender-averaged, bpm). Edit here to
// retune the bands — every consumer reads these values.
const REFERENCE_BANDS: RestingHeartRateBand[] = [
  { maxAge: 25, lowMax: 49, greenMax: 65, yellowMax: 73 },
  { maxAge: 35, lowMax: 49, greenMax: 65, yellowMax: 74 },
  { maxAge: 45, lowMax: 50, greenMax: 66, yellowMax: 75 },
  { maxAge: 55, lowMax: 50, greenMax: 67, yellowMax: 76 },
  { maxAge: 65, lowMax: 51, greenMax: 67, yellowMax: 75 },
  { maxAge: Infinity, lowMax: 50, greenMax: 65, yellowMax: 73 },
];

const DEFAULT_BAND: RestingHeartRateBand = {
  maxAge: Infinity,
  lowMax: 50,
  greenMax: 68,
  yellowMax: 80,
};

export const RESTING_HR_AXIS_MIN = 35;
export const RESTING_HR_AXIS_MAX = 110;

function getBand(age: number | null): RestingHeartRateBand {
  if (age == null || !Number.isFinite(age)) return DEFAULT_BAND;
  return REFERENCE_BANDS.find((band) => age <= band.maxAge) ?? DEFAULT_BAND;
}

export function getRestingHeartRateZone(
  bpm: number,
  age: number | null,
): RestingHeartRateZoneInfo {
  const band = getBand(age);
  if (bpm < band.lowMax) {
    return { zone: 'low', label: 'Low', color: colors.error[500] };
  }
  if (bpm <= band.greenMax) {
    return { zone: 'healthy', label: 'Healthy', color: colors.success[500] };
  }
  if (bpm <= band.yellowMax) {
    return { zone: 'elevated', label: 'Slightly elevated', color: colors.warning[500] };
  }
  return { zone: 'high', label: 'High', color: colors.error[500] };
}

/** Marker position along the bar as a 0..1 fraction, clamped to the axis. */
export function getRestingHeartRateMarkerFraction(bpm: number): number {
  const fraction =
    (bpm - RESTING_HR_AXIS_MIN) / (RESTING_HR_AXIS_MAX - RESTING_HR_AXIS_MIN);
  return Math.max(0, Math.min(1, fraction));
}

export interface RestingHeartRateSegment {
  zone: RestingHeartRateZone;
  color: string;
  /** Share of the bar width, 0..1. */
  flex: number;
}

/** Crisp, contiguous color bands for the bar, sized by this age's thresholds. */
export function getRestingHeartRateSegments(age: number | null): RestingHeartRateSegment[] {
  const band = getBand(age);
  const fracLow = getRestingHeartRateMarkerFraction(band.lowMax);
  const fracGreen = getRestingHeartRateMarkerFraction(band.greenMax);
  const fracYellow = getRestingHeartRateMarkerFraction(band.yellowMax);

  return [
    { zone: 'low', color: colors.error[300], flex: fracLow },
    { zone: 'healthy', color: colors.success[300], flex: fracGreen - fracLow },
    { zone: 'elevated', color: colors.warning[300], flex: fracYellow - fracGreen },
    { zone: 'high', color: colors.error[300], flex: 1 - fracYellow },
  ];
}
