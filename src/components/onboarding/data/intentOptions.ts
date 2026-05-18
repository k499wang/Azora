import { colors } from '../../../theme/colors';
import type { IntentOption, PersonalizedIntentOption } from '../types';

export const PERSONALIZED_INTENT_OPTIONS: PersonalizedIntentOption[] = [
  {
    id: 'stress_relief',
    icon: 'waves',
    accent: colors.success[500],
    title: 'Reduce stress',
    body: 'Use breathing to settle your nervous system.',
    hook: "Stress doesn't stand a chance.",
    reflectionHeadline: 'Lower stress in one session.',
    reflectionBody:
      "Your body is built to calm down. You're just giving it permission.",
    valuePoints: [
      {
        icon: 'waves',
        accent: colors.success[500],
        label: 'Heart rate slows in under 60 seconds',
      },
      {
        icon: 'breath-timer',
        accent: colors.primary.blue600,
        label: '5 min/day cuts cortisol up to 25%',
      },
      {
        icon: 'meditation',
        accent: colors.orange[500],
        label: 'Stress nearly halved after 8 weeks',
      },
    ],
  },
  {
    id: 'breath_work',
    icon: 'breath-timer',
    accent: colors.primary.blue600,
    title: 'Breath work',
    body: 'Build a steady breathing practice you can return to daily.',
    hook: 'A practice built to actually last.',
    reflectionHeadline: 'Make breathwork part of your routine.',
    reflectionBody:
      'A few focused minutes a day trains calmer breathing — and real, measurable recovery.',
    valuePoints: [
      {
        icon: 'breath-timer',
        accent: colors.primary.blue600,
        label: 'Short daily sessions are easier to keep',
      },
      {
        icon: 'waves',
        accent: colors.success[500],
        label: 'Stress drops within a single 5-minute session',
      },
      {
        icon: 'streak',
        accent: colors.orange[500],
        label: 'Results compound week over week',
      },
    ],
  },
  {
    id: 'sleep',
    icon: 'moon',
    accent: colors.primary.blue600,
    title: 'Sleep better',
    body: 'Build a slower rhythm before rest.',
    hook: 'Tonight can already feel different.',
    reflectionHeadline: 'Fall asleep faster, sleep deeper.',
    reflectionBody:
      'A nightly wind-down teaches your body to slip into rest on cue — no willpower needed.',
    valuePoints: [
      {
        icon: 'moon',
        accent: colors.primary.blue600,
        label: 'Fall asleep up to 37% faster',
      },
      {
        icon: 'breath-timer',
        accent: colors.success[500],
        label: '10 min of slow breathing lifts HRV before bed',
      },
      {
        icon: 'streak',
        accent: colors.orange[500],
        label: 'Add up to 20 min of deep sleep per night',
      },
    ],
  },
  {
    id: 'heart_health',
    icon: 'heart-bpm',
    accent: colors.error[500],
    title: 'Track heart health',
    body: 'Measure HRV and recovery trends over time.',
    hook: 'Your heart has been waiting for this.',
    reflectionHeadline: 'See your heart, every day.',
    reflectionBody:
      'HRV is the clearest window into recovery, stress, and long-term cardiovascular health.',
    valuePoints: [
      {
        icon: 'heart-bpm',
        accent: colors.error[500],
        label: 'HRV predicts recovery better than heart rate alone',
      },
      {
        icon: 'heart-glow',
        accent: colors.primary.blue600,
        label: 'Higher HRV = ~25% lower cardiovascular risk',
      },
      {
        icon: 'timer',
        accent: colors.orange[500],
        label: 'Trends surface weeks before symptoms appear',
      },
    ],
  },
  {
    id: 'daily_habit',
    icon: 'streak',
    accent: colors.orange[500],
    title: 'Build a habit',
    body: 'Make breathwork part of your daily routine.',
    hook: 'Small reps. Real change.',
    reflectionHeadline: 'Small daily reps, real change.',
    reflectionBody:
      'Consistency always beats intensity. A few minutes a day compounds faster than you expect.',
    valuePoints: [
      {
        icon: 'streak',
        accent: colors.orange[500],
        label: 'Habits solidify in ~66 days — Azora tracks every one',
      },
      {
        icon: 'breath-timer',
        accent: colors.success[500],
        label: '5 min/day beats one long session per week',
      },
      {
        icon: 'sparkle',
        accent: colors.primary.blue600,
        label: 'Daily cues triple retention vs. willpower alone',
      },
    ],
  },
];

const OTHER_INTENT_OPTION: IntentOption = {
  id: 'other',
  icon: 'sparkle',
  accent: colors.warning[500],
  title: 'Something else',
  body: 'Tell Azora what brought you here in your own words.',
};

export const INTENT_OPTIONS: IntentOption[] = [
  ...PERSONALIZED_INTENT_OPTIONS,
  OTHER_INTENT_OPTION,
];
