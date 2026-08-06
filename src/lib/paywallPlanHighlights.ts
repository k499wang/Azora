import type { PaywallFeature } from '../components/paywall/PaywallFeatureList';
import type { MindMapAxis, MindMapScore } from './onboardingScores';
import type { OnboardingIntent } from '../components/onboarding/types';
import type { OnboardingPlan } from './onboardingPlan';

const INTENT_HIGHLIGHT: Record<OnboardingIntent, string> = {
  stress_relief: 'Run slow-exhale resets that pull your heart rate back down',
  calm_fast: 'Reach for a 60-second rescue breath without anyone noticing',
  sleep: 'Start a wind down timed to the bedtime you gave us',
  focus: 'Clear the fog with breathing before you open your laptop',
  energy: 'Charge up in the morning without another coffee',
  spiritual: 'Settle into coherent breathing at a steady, held rhythm',
  yoga: 'Train belly breathing that carries into your practice',
  heart_health: 'Scan your heart rate and HRV in 90 seconds with your camera',
  daily_habit: 'Keep a session short enough to finish on your worst days',
  other: 'Follow a breathing routine built from the answers you just gave',
};

const INTENT_PROOF: Record<Exclude<OnboardingIntent, 'other'>, string> = {
  stress_relief: 'Feel your shoulders drop by the second round of exhales',
  calm_fast: 'Come back down in under a minute, wherever you are',
  sleep: 'Drift off on the exhale instead of rerunning the day',
  focus: 'Win one clear hour of work before the noise creeps back',
  energy: 'Skip the 3pm crash with a two-minute breath instead',
  spiritual: 'Sit longer without your mind drifting off the breath',
  yoga: 'Hold poses longer with breath left over at the end',
  heart_health: 'Watch your resting heart rate settle week over week',
  daily_habit: 'Build a streak that survives the days you almost skip',
};

/** Fills the proof slot when the goal is "other" and carries no promise of its own. */
const GROWTH_AREA_PROOF: Record<MindMapAxis, string> = {
  calm: 'Stay level even when the day gets loud',
  recovery: 'Wake up rested instead of already behind',
  focus: 'Hold your attention on one thing at a time',
  resilience: 'Bounce back faster when something knocks you sideways',
  breathEase: 'Breathe deeper without having to force it',
};

const GROWTH_AREA_HIGHLIGHT: Record<MindMapAxis, string> = {
  calm: 'calm',
  recovery: 'recovery',
  focus: 'focus',
  resilience: 'resilience',
  breathEase: 'breath control',
};

export interface PlanHighlightInputs {
  plan: OnboardingPlan;
  growthArea: MindMapScore;
  holdSeconds: number | null;
}

/**
 * The paywall's "what your trial unlocks" bullets, quoting the plan and scores
 * the user just built rather than generic feature claims. Each slot pulls from
 * a different answer so the list can't read as one interchangeable block.
 */
export function buildPlanHighlights({
  plan,
  growthArea,
  holdSeconds,
}: PlanHighlightInputs): PaywallFeature[] {
  return [
    {
      icon: 'waves',
      text: INTENT_HIGHLIGHT[plan.intent],
    },
    {
      icon: 'sparkle',
      text: `Rebuild ${GROWTH_AREA_HIGHLIGHT[growthArea.axis]} first, your weakest area at ${growthArea.value} out of 100`,
    },
    {
      icon: 'breath-timer',
      text:
        plan.intent === 'other'
          ? GROWTH_AREA_PROOF[growthArea.axis]
          : INTENT_PROOF[plan.intent],
    },
    holdSeconds != null
      ? {
          icon: 'heart',
          text: `Retest your ${holdSeconds}s breath hold each week and watch it climb`,
        }
      : {
          icon: 'heart',
          text: 'Check your heart rate and stress with just your camera',
        },
  ];
}
