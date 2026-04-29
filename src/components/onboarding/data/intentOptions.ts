import type { IntentOption } from '../types';

export const INTENT_OPTIONS: IntentOption[] = [
  {
    id: 'stress_relief',
    icon: 'breath-hold',
    title: 'Calm stress',
    body: 'Use breathing to settle your nervous system.',
  },
  {
    id: 'sleep',
    icon: 'moon',
    title: 'Sleep better',
    body: 'Build a slower rhythm before rest.',
  },
  {
    id: 'heart_health',
    icon: 'heart',
    title: 'Track heart health',
    body: 'Measure HRV and recovery trends over time.',
  },
  {
    id: 'daily_habit',
    icon: 'streak',
    title: 'Build a habit',
    body: 'Make breathwork part of your daily routine.',
  },
];
