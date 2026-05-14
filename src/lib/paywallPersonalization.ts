import {
  INTENT_TO_TECHNIQUE,
  TECHNIQUE_RECOMMENDATIONS,
} from '../components/onboarding/data/techniqueRecommendations';

export interface PaywallPersonalizationInput {
  displayName: string | null;
  intentId: string | null;
  stressLevel: number | null;
  sleepQuality: number | null;
  dailyMinutes: number | null;
}

export type PaywallChartDirection = 'up' | 'down';

export interface PaywallPersonalization {
  headline: string;
  subhead: string;
  metricLabel: string;
  baselineValue: string;
  baselineCaption: string;
  targetValue: string;
  targetCaption: string;
  chartDirection: PaywallChartDirection;
  techniqueName: string;
  techniqueTagline: string;
  techniqueWhy: string;
  dailyMinutes: number;
  challenge: string;
}

const TARGET_DAYS = 30;

export function buildPaywallPersonalization(
  input: PaywallPersonalizationInput,
): PaywallPersonalization {
  const intentId = input.intentId ?? 'other';
  const techniqueId = INTENT_TO_TECHNIQUE[intentId] ?? 'box';
  const technique = TECHNIQUE_RECOMMENDATIONS[techniqueId] ?? TECHNIQUE_RECOMMENDATIONS.box;
  const dailyMinutes = clampMinutes(input.dailyMinutes);
  const targetCaption = formatTargetDate(TARGET_DAYS);
  const namePrefix = input.displayName ? `${input.displayName}, ` : '';

  const metric = buildMetric(intentId, input);

  return {
    headline: `${namePrefix}${metric.headlineAction} by ${targetCaption}`,
    subhead: metric.subhead,
    metricLabel: metric.label,
    baselineValue: metric.baselineValue,
    baselineCaption: metric.baselineCaption,
    targetValue: metric.targetValue,
    targetCaption,
    chartDirection: metric.chartDirection,
    techniqueName: technique.name,
    techniqueTagline: technique.tagline,
    techniqueWhy: technique.why,
    dailyMinutes,
    challenge: buildChallenge(intentId, dailyMinutes),
  };
}

interface MetricFrame {
  label: string;
  baselineValue: string;
  baselineCaption: string;
  targetValue: string;
  headlineAction: string;
  subhead: string;
  chartDirection: PaywallChartDirection;
}

function buildMetric(
  intentId: string,
  input: PaywallPersonalizationInput,
): MetricFrame {
  if (intentId === 'stress_relief') {
    const baseline = clamp10(input.stressLevel ?? 6);
    const drop = baseline >= 8 ? 4 : baseline >= 5 ? 3 : 2;
    const target = Math.max(1, baseline - drop);
    const dropPct = Math.round((drop / baseline) * 20) * 5;
    return {
      label: 'STRESS LEVEL',
      baselineValue: `${baseline}/10`,
      baselineCaption: 'today',
      targetValue: `${target}/10`,
      headlineAction: `cut your stress by ${dropPct}%`,
      subhead: `Daily paced breathing settles your nervous system ${dropPct}% lower in 30 days.`,
      chartDirection: 'down',
    };
  }

  if (intentId === 'sleep') {
    const quality = clamp10(input.sleepQuality ?? 5);
    const baselineMin = quality <= 3 ? 45 : quality <= 6 ? 28 : 18;
    const targetMin = quality <= 3 ? 18 : quality <= 6 ? 12 : 9;
    const saved = baselineMin - targetMin;
    return {
      label: 'TIME TO FALL ASLEEP',
      baselineValue: `${baselineMin} min`,
      baselineCaption: 'today',
      targetValue: `${targetMin} min`,
      headlineAction: `fall asleep ${saved} minutes faster`,
      subhead: `A nightly wind-down protocol trains your body to drift off ${saved} minutes sooner.`,
      chartDirection: 'down',
    };
  }

  if (intentId === 'heart_health') {
    return {
      label: 'HRV TREND',
      baselineValue: 'Today',
      baselineCaption: 'baseline',
      targetValue: '+15 ms',
      headlineAction: `lift your HRV by 15 ms`,
      subhead: `Daily resonance breathing is the most-studied way to push HRV up.`,
      chartDirection: 'up',
    };
  }

  if (intentId === 'daily_habit') {
    return {
      label: 'DAILY STREAK',
      baselineValue: 'Day 0',
      baselineCaption: 'today',
      targetValue: 'Day 30',
      headlineAction: `lock in a 30-day streak`,
      subhead: `Habits stick at day 21 — Azora protects the streak past the hard part.`,
      chartDirection: 'up',
    };
  }

  if (intentId === 'breath_work') {
    return {
      label: 'SESSIONS',
      baselineValue: '0',
      baselineCaption: 'today',
      targetValue: '30',
      headlineAction: `complete 30 daily sessions`,
      subhead: `Short daily reps compound faster than long, occasional sessions.`,
      chartDirection: 'up',
    };
  }

  return {
    label: 'YOUR PROGRESS',
    baselineValue: 'Day 0',
    baselineCaption: 'today',
    targetValue: 'Day 30',
    headlineAction: `feel measurably calmer`,
    subhead: `30 days of daily breathing rewires your default response to stress.`,
    chartDirection: 'up',
  };
}

function buildChallenge(intentId: string, dailyMinutes: number): string {
  if (intentId === 'stress_relief') {
    return `Log how you feel before and after each ${dailyMinutes}-min session.`;
  }
  if (intentId === 'sleep') {
    return `One ${dailyMinutes}-min session in the 30 minutes before bed.`;
  }
  if (intentId === 'heart_health') {
    return `Morning HRV check + one ${dailyMinutes}-min breathing session.`;
  }
  if (intentId === 'daily_habit') {
    return `Same time every day — protect the streak.`;
  }
  return `Daily ${dailyMinutes}-min session — never miss two days in a row.`;
}

function clamp10(value: number): number {
  if (Number.isNaN(value)) return 5;
  return Math.max(1, Math.min(10, Math.round(value)));
}

function clampMinutes(value: number | null): number {
  if (value == null || Number.isNaN(value)) return 5;
  return Math.max(1, Math.min(60, Math.round(value)));
}

function formatTargetDate(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}
