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

export type BreathingTechniqueBpmResponse =
  | 'downshift'
  | 'energize'
  | 'stabilize'
  | 'resonance';

export interface BreathingTechniqueBpmProfile {
  name: string;
  response: BreathingTechniqueBpmResponse;
}

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

function buildTechniqueBreathingExerciseInsight({
  avg,
  min,
  max,
  drop,
  profile,
  withOscillationInsight,
}: {
  avg: number;
  min: number;
  max: number;
  drop: number | null;
  profile: BreathingTechniqueBpmProfile;
  withOscillationInsight: (insight: string) => string;
}): string | null {
  const rangeDesc = `The graph ranged from ${min} to ${max} bpm and averaged ${avg} bpm`;

  if (drop == null) {
    return withOscillationInsight(
      `${rangeDesc}. Add a few more heart-rate-enabled ${profile.name} sessions to learn your typical response to this technique.`,
    );
  }

  const increase = Math.abs(drop);

  if (profile.response === 'energize') {
    if (drop <= -10) {
      return withOscillationInsight(
        `Your heart rate rose ${increase} bpm during ${profile.name}, which fits this technique's energizing intent. ${rangeDesc}. For rapid cyclic breathing, a higher finish can reflect sympathetic activation and increased alertness rather than a failed calming response.`,
      );
    }
    if (drop <= -4) {
      return withOscillationInsight(
        `Your heart rate ticked up ${increase} bpm during ${profile.name}, a mild energizing response for this faster breathing pattern. ${rangeDesc}. Compare a few sessions to learn how strongly your body responds to this technique.`,
      );
    }
    if (drop >= 4) {
      return withOscillationInsight(
        `Your heart rate eased by ${drop} bpm during ${profile.name}. ${rangeDesc}. Even with an energizing technique, some sessions settle if you start activated, keep the rhythm controlled, or finish more relaxed than you began.`,
      );
    }
    return withOscillationInsight(
      `Your heart rate stayed steady during ${profile.name}. ${rangeDesc}. A stable line can mean your body handled the faster rhythm without a large cardiovascular swing.`,
    );
  }

  if (profile.response === 'downshift') {
    if (drop >= 10) {
      return withOscillationInsight(
        `Your heart rate eased by ${drop} bpm during ${profile.name}, which matches this technique's down-regulating intent. ${rangeDesc}. The longer exhale pattern likely helped shift your body toward a calmer finish.`,
      );
    }
    if (drop >= 4) {
      return withOscillationInsight(
        `Your heart rate eased by ${drop} bpm during ${profile.name}. ${rangeDesc}. That is the direction this slower, exhale-led pattern is meant to encourage.`,
      );
    }
    if (drop <= -4) {
      return withOscillationInsight(
        `Your heart rate rose ${increase} bpm during ${profile.name}. ${rangeDesc}. This can happen if the holds or pacing felt effortful, so compare it with another session using a softer inhale and relaxed shoulders.`,
      );
    }
    return withOscillationInsight(
      `Your heart rate stayed steady during ${profile.name}. ${rangeDesc}. For a calming technique, steady can still be useful if you started settled or the session prevented your heart rate from climbing.`,
    );
  }

  if (profile.response === 'resonance') {
    if (drop >= 4) {
      return withOscillationInsight(
        `Your heart rate eased by ${drop} bpm during ${profile.name}. ${rangeDesc}. Resonance breathing often creates gentle breath-linked rises and falls while nudging the overall session toward balance.`,
      );
    }
    if (drop <= -4) {
      return withOscillationInsight(
        `Your heart rate rose ${increase} bpm during ${profile.name}. ${rangeDesc}. That can happen while your body adapts to the slow rhythm; over time, the more useful signal is whether the graph becomes smoother and more breath-linked.`,
      );
    }
    return withOscillationInsight(
      `Your heart rate stayed steady during ${profile.name}. ${rangeDesc}. A steady average with small breath-linked waves is a normal response for coherent breathing.`,
    );
  }

  if (drop >= 6) {
    return withOscillationInsight(
      `Your heart rate eased by ${drop} bpm during ${profile.name}. ${rangeDesc}. For this balanced pattern, that suggests you finished more settled than you began.`,
    );
  }
  if (drop <= -6) {
    return withOscillationInsight(
      `Your heart rate rose ${increase} bpm during ${profile.name}. ${rangeDesc}. Box-style holds can feel effortful at first, so use repeated sessions to see whether the pattern becomes steadier.`,
    );
  }
  return withOscillationInsight(
    `Your heart rate stayed steady during ${profile.name}. ${rangeDesc}. That is a useful response for an equal-phase technique designed to stabilize attention and breathing rhythm.`,
  );
}

export function buildBpmLockedInsightPlaceholder(
  context: BpmInsightContext = 'resting',
  breathingTechniqueProfile?: BreathingTechniqueBpmProfile | null,
): string {
  if (context === 'breath-hold') {
    return 'Your heart rate slowed during the hold as your diving reflex engaged. Tracking this response over repeated holds can show how consistently your nervous system shifts toward oxygen conservation.';
  }

  if (context === 'breathing-exercise') {
    const profile = breathingTechniqueProfile;
    if (profile?.response === 'energize') {
      return `${profile.name} is designed as an energizing breath pattern, so a heart-rate rise can be part of the intended response. Compare several sessions to see how strongly your body activates and how quickly it settles afterward.`;
    }
    if (profile?.response === 'downshift') {
      return `${profile.name} is designed to help your body downshift. A heart-rate drop or steadier finish can show the longer exhale pattern nudging your nervous system toward calm.`;
    }
    if (profile?.response === 'resonance') {
      return `${profile.name} often creates breath-linked rises and falls in heart rate. The useful pattern is whether the graph becomes smoother and more rhythmic across repeated sessions.`;
    }
    if (profile?.response === 'stabilize') {
      return `${profile.name} is designed to stabilize your breathing rhythm and attention. A steady graph or mild settling response can be a useful sign that your body tolerated the pattern smoothly.`;
    }
    return 'Your breathing-session graph can show whether this exercise tends to settle, raise, stabilize, or rhythmically vary your heart rate across repeated sessions.';
  }

  return "Your resting heart rate is tracking slightly below your weekly average, which typically signals good cardiovascular recovery. Today's peak of 112 bpm occurred during your afternoon session — well within your normal exertion range. Over the past 7 days, your recovery windows have been shortening, suggesting your body is adapting positively to recent activity.";
}

export function buildBpmInsight(
  series: BpmInsightPoint[],
  savedSummary?: BpmInsightSummary,
  context: BpmInsightContext = 'resting',
  breathingTechniqueProfile?: BreathingTechniqueBpmProfile | null,
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
    if (breathingTechniqueProfile != null) {
      const techniqueInsight = buildTechniqueBreathingExerciseInsight({
        avg,
        min,
        max,
        drop,
        profile: breathingTechniqueProfile,
        withOscillationInsight,
      });
      if (techniqueInsight != null) {
        return techniqueInsight;
      }
    }

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
