import { colors } from '../../../theme/colors';
import type { IntentOption, PersonalizedIntentOption } from '../types';

export const PERSONALIZED_INTENT_OPTIONS: PersonalizedIntentOption[] = [
  {
    id: 'stress_relief',
    icon: 'waves',
    accent: colors.success[500],
    title: 'Reduce stress',
    body: 'Use breathing to settle your nervous system.',
    reflectionHeadline: 'Lower stress in one session.',
    reflectionBody:
      'Slow, paced breathing is one of the fastest ways to shift out of fight-or-flight.',
    valuePoints: [
      {
        icon: 'waves',
        accent: colors.success[500],
        label: 'Slows your heart rate within ~60 seconds',
      },
      {
        icon: 'breath-timer',
        accent: colors.primary.blue600,
        label: '5 minutes a day can lower cortisol up to 25%',
      },
      {
        icon: 'meditation',
        accent: colors.orange[500],
        label: 'Cuts perceived stress nearly in half over 8 weeks',
      },
    ],
  },
  {
    id: 'breath_work',
    icon: 'breath-timer',
    accent: colors.primary.blue600,
    title: 'Breath work',
    body: 'Build a steady breathing practice you can return to daily.',
    reflectionHeadline: 'Make breathwork part of your routine.',
    reflectionBody:
      'A few focused minutes each day is enough to train calmer breathing and better recovery.',
    valuePoints: [
      {
        icon: 'breath-timer',
        accent: colors.primary.blue600,
        label: 'Short daily sessions are easier to keep than long, occasional ones',
      },
      {
        icon: 'waves',
        accent: colors.success[500],
        label: 'Steady breathing can lower stress within a single practice',
      },
      {
        icon: 'streak',
        accent: colors.orange[500],
        label: 'Consistency builds the strongest results over time',
      },
    ],
  },
  {
    id: 'sleep',
    icon: 'moon',
    accent: colors.primary.blue600,
    title: 'Sleep better',
    body: 'Build a slower rhythm before rest.',
    reflectionHeadline: 'Fall asleep faster, sleep deeper.',
    reflectionBody:
      'A nightly wind-down trains your body to shift into rest mode on cue.',
    valuePoints: [
      {
        icon: 'moon',
        accent: colors.primary.blue600,
        label: 'Wind-down rituals help you fall asleep ~37% faster',
      },
      {
        icon: 'breath-timer',
        accent: colors.success[500],
        label: '10 minutes of slow breathing lifts HRV before bed',
      },
      {
        icon: 'streak',
        accent: colors.orange[500],
        label: 'Consistent rhythms add up to 20 minutes of deep sleep',
      },
    ],
  },
  {
    id: 'heart_health',
    icon: 'heart-bpm',
    accent: colors.error[500],
    title: 'Track heart health',
    body: 'Measure HRV and recovery trends over time.',
    reflectionHeadline: 'See your heart, every day.',
    reflectionBody:
      'HRV is the clearest window into recovery, stress load, and long-term cardiovascular health.',
    valuePoints: [
      {
        icon: 'heart-bpm',
        accent: colors.error[500],
        label: 'HRV predicts recovery better than resting heart rate',
      },
      {
        icon: 'heart-glow',
        accent: colors.primary.blue600,
        label: 'Higher HRV is linked to ~25% lower cardiovascular risk',
      },
      {
        icon: 'timer',
        accent: colors.orange[500],
        label: 'Daily check-ins surface trends weeks before symptoms',
      },
    ],
  },
  {
    id: 'daily_habit',
    icon: 'streak',
    accent: colors.orange[500],
    title: 'Build a habit',
    body: 'Make breathwork part of your daily routine.',
    reflectionHeadline: 'Small daily reps, real change.',
    reflectionBody:
      'Consistency beats intensity. A few focused minutes a day compounds faster than long, infrequent sessions.',
    valuePoints: [
      {
        icon: 'streak',
        accent: colors.orange[500],
        label: 'New habits form in ~66 days — Azora keeps the streak',
      },
      {
        icon: 'breath-timer',
        accent: colors.success[500],
        label: '5 minutes daily outperforms one long session per week',
      },
      {
        icon: 'sparkle',
        accent: colors.primary.blue600,
        label: 'Daily cues triple long-term retention vs willpower alone',
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
