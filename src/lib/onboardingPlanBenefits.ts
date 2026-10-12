import type { OnboardingIntent } from '../components/onboarding/types';
import { exerciseTitleForTechniqueId } from '../features/exercise/guidedBreathing/exerciseTitles';
import {
  latestProgramPreset,
  PROGRAM_ACTIVITIES,
  type ProgramPlanId,
} from '../features/program/domain/programCatalogue';
import type { OnboardingPreset } from './onboardingPreset';

const PLAN_BENEFITS: Record<ProgramPlanId, { outcome: string; approach: string }> = {
  night: {
    outcome: 'more at ease with your evenings',
    approach: 'A gentler evening rhythm, with small practices that help you leave the day behind.',
  },
  morning: {
    outcome: 'ready to make space for your own day',
    approach: 'Small morning resets that help you begin, before the day gets away from you.',
  },
  pressure: {
    outcome: 'steadier when life gets loud',
    approach: 'Short pauses and practical lessons for the moments that feel like too much.',
  },
  focus: {
    outcome: 'more focused and in control of your day',
    approach: 'A small reset before the next task, so starting feels less like a mountain.',
  },
  quiet: {
    outcome: 'more connected to yourself',
    approach: 'Quiet moments that fit into real days, without needing to get everything else done first.',
  },
  home: {
    outcome: 'calmer in your space and more confident keeping it together',
    approach: 'Small resets and practical lessons for making everyday tasks feel more manageable.',
  },
  phone: {
    outcome: 'more in charge of where your attention goes',
    approach: 'Small pauses that give you a choice when the pull to scroll shows up.',
  },
  recovery: {
    outcome: 'more confident finding your way into the day',
    approach: 'Gentle practices and lighter days, so even a low-energy day has a small place to begin.',
  },
  selfTrust: {
    outcome: 'proud of following through on the promises you make to yourself',
    approach: 'Small promises you can keep, with room to miss a day and pick up where you left off.',
  },
};

export interface FirstGuidedReset {
  day: number;
  minutes: number;
  title: string;
}

/** Day one may contain only a lesson and check-in; find the first real reset. */
function firstGuidedReset(planId: ProgramPlanId): FirstGuidedReset | null {
  const plan = latestProgramPreset(planId);
  if (plan == null) return null;

  for (const day of plan.days) {
    for (const activityId of day.activityIds) {
      const activity = PROGRAM_ACTIVITIES.get(activityId);
      if (activity == null) continue;
      const delivery = activity.delivery;
      if (delivery.modality !== 'breathing' && delivery.modality !== 'attention') continue;
      return {
        day: day.day,
        minutes: delivery.minutes,
        title: delivery.modality === 'breathing'
          ? exerciseTitleForTechniqueId(delivery.techniqueId)
          : activity.title,
      };
    }
  }
  return null;
}

/** Selling the resolved plan must describe the same schedule the user starts. */
export function onboardingPlanBenefits(
  preset: OnboardingPreset,
  intent: OnboardingIntent,
  goalPhrase: string,
  triedEcho?: string | null,
) {
  const benefit = PLAN_BENEFITS[preset.id];
  return {
    days: preset.weeks * 7,
    // A heart-health goal promises a practice, not a physiological result.
    outcome: intent === 'heart_health'
      ? 'more confident making time to pause'
      : benefit.outcome,
    goal: goalPhrase.trim() || 'make room for yourself',
    approach: benefit.approach,
    triedNote: triedEcho?.trim()
      ? `You’ve tried ${triedEcho.trim()}. This time, we start small.`
      : null,
    firstReset: firstGuidedReset(preset.id),
  };
}
