export interface BpmInsightPoint {
  bpm: number;
}

export interface BpmInsightSummary {
  avgBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
  hrDrop: number | null;
}

function isFiniteNumber(value: number | null): value is number {
  return value != null && Number.isFinite(value);
}

function summarizePlottedSeries(series: BpmInsightPoint[]): BpmInsightSummary | null {
  if (series.length < 2) return null;

  const values = series.map((point) => point.bpm);
  const windowSize = Math.max(1, Math.floor(series.length * 0.15));
  const startAvg = values.slice(0, windowSize).reduce((sum, value) => sum + value, 0) / windowSize;
  const endAvg = values.slice(-windowSize).reduce((sum, value) => sum + value, 0) / windowSize;

  return {
    avgBpm: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
    minBpm: Math.round(Math.min(...values)),
    maxBpm: Math.round(Math.max(...values)),
    hrDrop: Math.round(startAvg - endAvg),
  };
}

export function buildBpmInsight(
  series: BpmInsightPoint[],
  savedSummary?: BpmInsightSummary,
): string | null {
  const summary = savedSummary ?? summarizePlottedSeries(series);
  if (
    summary == null ||
    !isFiniteNumber(summary.avgBpm) ||
    !isFiniteNumber(summary.minBpm) ||
    !isFiniteNumber(summary.maxBpm)
  ) {
    return null;
  }

  const avg = Math.round(summary.avgBpm);
  const min = Math.round(summary.minBpm);
  const max = Math.round(summary.maxBpm);
  const range = max - min;
  const drop = isFiniteNumber(summary.hrDrop) ? Math.round(summary.hrDrop) : null;

  const zoneDesc =
    avg <= 55
      ? `${avg} bpm is an excellent resting rate - typically seen in well-trained or highly recovered individuals`
      : avg <= 70
        ? `${avg} bpm sits in a strong resting range, reflecting good cardiovascular health`
        : avg <= 85
          ? `${avg} bpm is within a normal resting range for most adults`
          : `${avg} bpm is on the higher side for a resting measurement - hydration, stress, and caffeine can all push this up`;

  const rangeDesc =
    range <= 8
      ? `The narrow ${min}-${max} bpm window points to a well-regulated, stable session`
      : range <= 18
        ? `A ${min}-${max} bpm spread is normal - your heart was adapting naturally throughout`
        : `The wider ${min}-${max} bpm range suggests your heart was actively responding to something, whether that's breathing pattern, movement, or nervous system shifts`;

  if (drop == null) {
    return `${zoneDesc}. ${rangeDesc}.`;
  }
  if (drop >= 6) {
    return `A ${drop} bpm drop over your session is a good sign - your parasympathetic nervous system engaged and guided your body toward a calmer state. ${zoneDesc}. ${rangeDesc}.`;
  }
  if (drop <= -6) {
    return `Your heart rate climbed ${Math.abs(drop)} bpm over the session, which can happen when you're fatigued, under-recovered, or slightly dehydrated. ${zoneDesc}. If this pattern repeats, take a closer look at sleep and stress.`;
  }
  return `Your heart rate stayed consistent throughout - a sign of a stable, well-regulated session. ${zoneDesc}. ${rangeDesc}.`;
}
