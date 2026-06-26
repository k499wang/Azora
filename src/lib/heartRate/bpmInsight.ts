export interface BpmInsightPoint {
  bpm: number;
}

export interface BpmInsightSummary {
  avgBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
  hrDrop: number | null;
}

export type BpmInsightContext = 'resting' | 'breath-hold' | 'breathing-exercise';

type TrendDirection = -1 | 0 | 1;

const MIN_OSCILLATION_POINTS = 5;
const MIN_OSCILLATION_REVERSALS = 3;
const MEANINGFUL_SWING_BPM = 4;

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

function getTrendDirection(delta: number): TrendDirection {
  if (delta > 0) return 1;
  if (delta < 0) return -1;
  return 0;
}

function countMeaningfulReversals(series: BpmInsightPoint[]): number {
  if (series.length < MIN_OSCILLATION_POINTS) return 0;

  const values = series.map((point) => point.bpm);
  let direction: TrendDirection = 0;
  let extreme = values[0];
  let reversals = 0;

  for (let i = 1; i < values.length; i += 1) {
    const value = values[i];

    if (direction === 0) {
      const delta = value - extreme;
      if (Math.abs(delta) >= MEANINGFUL_SWING_BPM) {
        direction = getTrendDirection(delta);
        extreme = value;
      }
      continue;
    }

    if (direction > 0) {
      if (value > extreme) {
        extreme = value;
      } else if (extreme - value >= MEANINGFUL_SWING_BPM) {
        reversals += 1;
        direction = -1;
        extreme = value;
      }
      continue;
    }

    if (value < extreme) {
      extreme = value;
    } else if (value - extreme >= MEANINGFUL_SWING_BPM) {
      reversals += 1;
      direction = 1;
      extreme = value;
    }
  }

  return reversals;
}

function buildOscillationInsight(
  series: BpmInsightPoint[],
  context: BpmInsightContext,
): string | null {
  const reversals = countMeaningfulReversals(series);
  if (reversals < MIN_OSCILLATION_REVERSALS) return null;

  if (context === 'breath-hold') {
    return 'The graph also had repeated up-and-down swings instead of one smooth line. That can happen when the diving-reflex response comes in waves, or when movement and signal quality add noise, so compare this pattern across a few holds.';
  }

  if (context === 'breathing-exercise') {
    return 'The graph also moved up and down several times. That usually means your heart rate was responding in waves to the breathing rhythm, movement, stress shifts, or signal quality rather than following one smooth trend.';
  }

  return 'The graph also moved up and down several times. Repeated swings can reflect breathing pattern changes, movement, stress shifts, or signal quality, so it is most useful when the same pattern shows up across multiple sessions.';
}

export function buildBpmInsight(
  series: BpmInsightPoint[],
  savedSummary?: BpmInsightSummary,
  context: BpmInsightContext = 'resting',
): string | null {
  const summary = summarizePlottedSeries(series) ?? savedSummary;
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
  const oscillationInsight = buildOscillationInsight(series, context);
  const withOscillationInsight = (insight: string) =>
    oscillationInsight == null ? insight : `${insight} ${oscillationInsight}`;

  if (context === 'breath-hold') {
    const rangeDesc = `Your heart rate ranged from ${min} to ${max} bpm, averaging ${avg} bpm during the hold`;

    if (drop == null) {
      return withOscillationInsight(
        `${rangeDesc}. A consistent downward pattern across future holds can help show how reliably your diving reflex engages.`,
      );
    }
    if (drop >= 15) {
      return withOscillationInsight(
        `Your heart rate slowed by ${drop} bpm during the hold, a pronounced diving-reflex response. This suggests strong parasympathetic engagement as your body worked to conserve oxygen. ${rangeDesc}.`,
      );
    }
    if (drop >= 8) {
      return withOscillationInsight(
        `Your heart rate slowed by ${drop} bpm during the hold, showing a clear diving-reflex response and parasympathetic activation. ${rangeDesc}. Compare holds under similar conditions to track how consistently this response appears.`,
      );
    }
    if (drop >= 3) {
      return withOscillationInsight(
        `Your heart rate slowed by ${drop} bpm during the hold, a mild diving-reflex response. ${rangeDesc}. A calm start and relaxed posture may help the slowing become more pronounced over time.`,
      );
    }
    return withOscillationInsight(
      `Your heart rate changed very little during this hold. ${rangeDesc}. The diving reflex varies with hold length, comfort, movement, and measurement quality, so look for a pattern across several sessions rather than judging one result.`,
    );
  }

  if (context === 'breathing-exercise') {
    const rangeDesc = `The graph ranged from ${min} to ${max} bpm and averaged ${avg} bpm`;

    if (drop == null) {
      return withOscillationInsight(
        `${rangeDesc}. Add a few more heart-rate-enabled sessions to see whether this exercise usually settles, raises, or stabilizes your pulse.`,
      );
    }
    if (drop >= 10) {
      return withOscillationInsight(
        `Your heart rate eased by ${drop} bpm across the breathing graph, a strong downshift during the session. ${rangeDesc}. That pattern usually points to good parasympathetic engagement and a calmer finish than start.`,
      );
    }
    if (drop >= 4) {
      return withOscillationInsight(
        `Your heart rate eased by ${drop} bpm across the breathing graph. ${rangeDesc}. That suggests the exercise helped nudge your nervous system toward a calmer state.`,
      );
    }
    if (drop <= -10) {
      return withOscillationInsight(
        `Your heart rate rose ${Math.abs(drop)} bpm across the breathing graph. ${rangeDesc}. That can happen when the rhythm is challenging, you are moving, or your body is carrying stress into the session.`,
      );
    }
    if (drop <= -4) {
      return withOscillationInsight(
        `Your heart rate ticked up ${Math.abs(drop)} bpm across the breathing graph. ${rangeDesc}. If this repeats, try a slower pace or a longer exhale pattern and compare the next graph.`,
      );
    }
    return withOscillationInsight(
      `Your heart rate stayed steady across the breathing graph. ${rangeDesc}. A stable line during guided breathing can be a useful sign that your body tolerated the rhythm smoothly.`,
    );
  }

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
    return withOscillationInsight(`${zoneDesc}. ${rangeDesc}.`);
  }
  if (drop >= 6) {
    return withOscillationInsight(
      `A ${drop} bpm drop over your session is a good sign - your parasympathetic nervous system engaged and guided your body toward a calmer state. ${zoneDesc}. ${rangeDesc}.`,
    );
  }
  if (drop <= -6) {
    return withOscillationInsight(
      `Your heart rate climbed ${Math.abs(drop)} bpm over the session, which can happen when you're fatigued, under-recovered, or slightly dehydrated. ${zoneDesc}. If this pattern repeats, take a closer look at sleep and stress.`,
    );
  }
  return withOscillationInsight(
    `Your heart rate stayed consistent throughout - a sign of a stable, well-regulated session. ${zoneDesc}. ${rangeDesc}.`,
  );
}
