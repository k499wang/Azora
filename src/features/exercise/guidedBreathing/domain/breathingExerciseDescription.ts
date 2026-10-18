import type { OnboardingIntent } from '../../../../components/onboarding/types';
import type { BreathingTechnique } from '../techniques';

const INTENT_DESCRIPTIONS: Record<OnboardingIntent, string | null> = {
  stress_relief: 'Take a pause from today’s demands and give yourself space to unwind.',
  calm_fast: 'Pause where you are and bring your attention to one breath at a time.',
  sleep: 'Make a little space to leave the day behind as you prepare for rest.',
  focus: 'Use this practice as a transition into your next focused task.',
  energy: 'Take a moment to reconnect with yourself before your next activity.',
  self_acceptance: 'Make a little space to notice how you feel, without needing to change it.',
  emotional_balance: 'Give yourself room to notice your feelings and choose your next step.',
  self_care: 'Let this be a few minutes you set aside just for yourself.',
  spiritual: 'Create a quiet moment to connect with what matters to you.',
  yoga: 'Bring your attention to your breath as part of your movement practice.',
  heart_health: 'Take time to notice your breathing as part of caring for yourself.',
  cleaning: 'Take a breathing pause before choosing one small step for your space.',
  daily_habit: 'Build your daily practice by making time for a few mindful breaths.',
  other: null,
};

export function resolveBreathingExerciseDescription(
  technique: Pick<BreathingTechnique, 'description'>,
  intent: OnboardingIntent | null | undefined,
): string {
  const introduction = intent == null ? null : INTENT_DESCRIPTIONS[intent];
  return introduction ? `${introduction}\n\n${technique.description}` : technique.description;
}
