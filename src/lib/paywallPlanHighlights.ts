import type { PaywallFeature } from '../components/paywall/PaywallFeatureList';
import type { OnboardingIntent } from '../components/onboarding/types';
import type { MindMapScore } from './onboardingScores';
import type { OnboardingPlan } from './onboardingPlan';

const INTENT_PLAN_HIGHLIGHT: Record<OnboardingIntent, string> = {
  stress_relief: 'A daily plan built around your goal to reduce stress.',
  calm_fast: 'A daily plan built around your goal to calm down quickly.',
  sleep: 'A daily plan built around your goal to sleep better.',
  focus:
    'A daily plan built around your goal to stay focused while you work or study.',
  energy: 'A daily plan built around your goal to boost your energy.',
  spiritual:
    'A daily plan built around your goal to deepen your spiritual practice.',
  yoga: 'A daily plan built around your goal to support your yoga practice.',
  heart_health:
    'A daily plan built around your goal to support your heart health and recovery.',
  daily_habit: 'A daily plan built around your goal to build a daily habit.',
  other: 'A daily plan built from your onboarding answers.',
};

export interface PlanHighlightInputs {
  plan: OnboardingPlan;
  growthArea: MindMapScore;
  holdSeconds: number | null;
}

/**
 * The paywall's "what your trial unlocks" bullets: three concrete capabilities
 * and the plan benefit framed around the user's primary onboarding intent.
 */
export function buildPlanHighlights({
  plan,
}: PlanHighlightInputs): PaywallFeature[] {
  return [
    {
      icon: 'waves',
      text: 'Unlimited mental reset exercises.',
    },
    {
      icon: 'sparkle',
      text: 'Detailed stress and recovery insights.',
    },
    {
      icon: 'heart',
      text: 'Heart-rate tracking during breathing exercises.',
    },
    {
      icon: 'calendar',
      text: INTENT_PLAN_HIGHLIGHT[plan.intent],
    },
  ];
}
