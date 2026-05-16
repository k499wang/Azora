interface BandPercentiles {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

interface AgeBand {
  label: string;
  minAge: number;
  maxAge: number;
  percentiles: BandPercentiles;
}

const AGE_BANDS: AgeBand[] = [
  { label: 'under 18',  minAge: 0,   maxAge: 17,  percentiles: { p25: 25, p50: 38, p75: 55, p90: 80 } },
  { label: '18–24',     minAge: 18,  maxAge: 24,  percentiles: { p25: 30, p50: 45, p75: 65, p90: 95 } },
  { label: '25–34',     minAge: 25,  maxAge: 34,  percentiles: { p25: 28, p50: 42, p75: 60, p90: 90 } },
  { label: '35–44',     minAge: 35,  maxAge: 44,  percentiles: { p25: 25, p50: 38, p75: 55, p90: 80 } },
  { label: '45–54',     minAge: 45,  maxAge: 54,  percentiles: { p25: 22, p50: 34, p75: 48, p90: 70 } },
  { label: '55–64',     minAge: 55,  maxAge: 64,  percentiles: { p25: 20, p50: 30, p75: 42, p90: 60 } },
  { label: '65+',       minAge: 65,  maxAge: 200, percentiles: { p25: 18, p50: 26, p75: 36, p90: 50 } },
];

const ADULT_DEFAULT: AgeBand = AGE_BANDS[2];

function pickBand(age: number | null): AgeBand {
  if (age == null || !Number.isFinite(age)) return ADULT_DEFAULT;
  return AGE_BANDS.find((band) => age >= band.minAge && age <= band.maxAge) ?? ADULT_DEFAULT;
}

export interface HoldBenchmark {
  sentence: string;
  bandLabel: string;
  percentileBucket: 'top10' | 'top25' | 'aboveAverage' | 'average' | 'belowAverage';
}

export function getHoldBenchmark(holdSeconds: number, age: number | null): HoldBenchmark {
  const band = pickBand(age);
  const { p25, p50, p75, p90 } = band.percentiles;
  const ageRefLabel = age != null && Number.isFinite(age) ? `ages ${band.label}` : 'most adults';

  if (holdSeconds >= p90) {
    return {
      sentence: `Top 10% of ${ageRefLabel} — elite-level breath control.`,
      bandLabel: band.label,
      percentileBucket: 'top10',
    };
  }
  if (holdSeconds >= p75) {
    return {
      sentence: `Top 25% of ${ageRefLabel} — well above average.`,
      bandLabel: band.label,
      percentileBucket: 'top25',
    };
  }
  if (holdSeconds >= p50) {
    return {
      sentence: `Above the median for ${ageRefLabel} — strong result.`,
      bandLabel: band.label,
      percentileBucket: 'aboveAverage',
    };
  }
  if (holdSeconds >= p25) {
    return {
      sentence: `Around the average for ${ageRefLabel} — solid baseline to build on.`,
      bandLabel: band.label,
      percentileBucket: 'average',
    };
  }
  return {
    sentence: `Below average for ${ageRefLabel} — consistent practice will lift this fast.`,
    bandLabel: band.label,
    percentileBucket: 'belowAverage',
  };
}
