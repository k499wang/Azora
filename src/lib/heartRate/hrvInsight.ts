export interface HrvInsightSummary {
  rmssd: number | null;
  sdnn: number | null;
  avgBpm: number | null;
}

function isFiniteNumber(value: number | null): value is number {
  return value != null && Number.isFinite(value);
}

export function buildHrvInsight(summary: HrvInsightSummary): string | null {
  if (
    !isFiniteNumber(summary.rmssd) ||
    !isFiniteNumber(summary.sdnn) ||
    !isFiniteNumber(summary.avgBpm)
  ) {
    return null;
  }

  const rmssd = Math.round(summary.rmssd);
  const sdnn = Math.round(summary.sdnn);
  const avgBpm = Math.round(summary.avgBpm);
  const variabilityDetail = `Your SDNN was ${sdnn} ms, reflecting your overall heart-rate variability during this measurement.`;

  if (rmssd >= 50) {
    return `An RMSSD of ${rmssd} ms is excellent. Your parasympathetic nervous system is clearly dominant, and your body appears well prepared for recovery. ${variabilityDetail} Your saved average heart rate was ${avgBpm} bpm.`;
  }
  if (rmssd >= 20) {
    return `An RMSSD of ${rmssd} ms is in a solid resting range. Your autonomic nervous system appears reasonably balanced. ${variabilityDetail} Your saved average heart rate was ${avgBpm} bpm.`;
  }
  return `An RMSSD of ${rmssd} ms is on the lower side and can occur with stress, fatigue, poor sleep, caffeine, or training load. ${variabilityDetail} Your saved average heart rate was ${avgBpm} bpm. Compare this with future measurements taken under similar conditions.`;
}
