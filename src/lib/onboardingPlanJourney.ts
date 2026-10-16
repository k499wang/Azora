import type { OnboardingIntent } from '../components/onboarding/types';
import { planJourney, planPhasesForPlan, type OnboardingPreset, type PresetId } from './onboardingPreset';
import { ARCHETYPE_FOR_PLAN } from './onboardingArchetype';

type MilestoneOutcomes = readonly [string, string, string];

/**
 * One sentence per milestone. The last is a clause without its full stop: it
 * runs on into the user's own goal.
 */
const PLAN_MILESTONE_OUTCOMES: Record<PresetId, MilestoneOutcomes> = {
  night: [
    'Your head hits the pillow without the whole day replaying on loop.',
    'Bedtime turns into the calmest part of your day instead of the loudest.',
    'Your nights feel restful again',
  ],
  morning: [
    'You get up without a ten-round fight with the snooze button.',
    'Your mornings run on an easy routine instead of a mad scramble.',
    'Your mornings feel like yours again',
  ],
  pressure: [
    'Small stuff stops landing like a giant emergency, because you have a pause ready.',
    'You stay cool in the moments that used to boil over.',
    'You keep a cool head when the pressure is on',
  ],
  focus: [
    'Big tasks shrink into steps you can actually start.',
    'You stay locked in longer while the noise fades into the background.',
    'You finish what you start, one focused block at a time',
  ],
  quiet: [
    'You carve out a few minutes a day that belong only to you.',
    'Time for yourself stops feeling like something you have to earn.',
    'Your mind feels calm and roomy even on busy days',
  ],
  home: [
    'The pile that felt impossible turns into one small spot you can clear in minutes.',
    'Tidying becomes a quick daily habit, not a weekend you dread.',
    'Your home finally feels like a place to rest',
  ],
  phone: [
    'You catch the mindless unlock before it eats your next hour.',
    'Your in-between minutes go to things you actually enjoy.',
    'Your time and attention belong to you again',
  ],
  recovery: [
    'Low-energy days still count, so you stop losing whole days to an empty tank.',
    'Rest becomes part of your plan, and your energy starts to stick around.',
    'You bounce back from hard weeks with energy to spare',
  ],
  selfTrust: [
    'Every small promise you keep becomes proof you can count on yourself.',
    'A slip stops being a reason to quit, because you know how to begin again.',
    'You trust yourself to follow through, even on imperfect days',
  ],
};

const GOAL_MILESTONE_OUTCOMES: Partial<Record<PresetId, Partial<Record<OnboardingIntent, MilestoneOutcomes>>>> = {
  pressure: {
    calm_fast: [
      'One worry stops hijacking your whole day, because you know the way out of the loop.',
      'You notice an anxious thought without believing every word of it.',
      'You meet the what-ifs calmly with your next step in mind',
    ],
    emotional_balance: [
      'A big feeling stops deciding what comes out of your mouth next.',
      'Tense moments pass in minutes instead of taking over your day.',
      'You handle hard conversations without losing yourself',
    ],
    heart_health: [
      'Looking after yourself finally moves up your to-do list.',
      'Recovery gets a protected spot in your week instead of the leftovers.',
      'Your wellbeing is a real priority in your week',
    ],
  },
  quiet: {
    spiritual: [
      'Your day gets a little pocket of meaning you can always come back to.',
      'Quiet time pulls you back to what matters when the day pulls you away.',
      'Every day stays connected to the values you care about most',
    ],
    yoga: [
      'Your time on the mat starts to feel like time that’s truly yours.',
      'You move with what your body needs instead of what you think it should do.',
      'The calm from your mat carries into the rest of your day',
    ],
  },
  selfTrust: {
    daily_habit: [
      'Showing up gets easy, even on days your motivation doesn’t.',
      'A missed day stops wiping out your momentum, because picking back up is part of the plan.',
      'You feel proud of every day you show up',
    ],
  },
  phone: {
    sleep: [
      'Your bedtime stops disappearing into one more scroll.',
      'Putting your phone down feels like choosing rest, not missing out.',
      'You’ve taken your evenings back from the screen',
    ],
    focus: [
      'The task you chose gets your attention before your phone takes over.',
      'Work and study flow with fewer interruptions, so you can stay with one thing.',
      'Your attention lands wherever you point it',
    ],
  },
};

/** What day one of each plan is, short enough to read at a glance. */
const PLAN_FIRST_DAY_HOOK: Record<PresetId, string> = {
  night: 'a tiny wind-down to close the day',
  morning: 'a two-minute start that beats snooze',
  pressure: 'your first pause before you react',
  focus: 'one task small enough to start now',
  quiet: 'your first few minutes of real quiet',
  home: 'one small spot, not the whole house',
  phone: 'your first pause before the unlock',
  recovery: 'a step gentle enough for your lowest day',
  selfTrust: 'one promise small enough to keep',
};

/** The same personal journey wherever the user's assigned plan is described. */
export function personalizedPlanJourney(
  preset: OnboardingPreset,
  intent: OnboardingIntent,
  name: string | null | undefined,
  goalPhrase: string | null | undefined,
) {
  const goal = goalPhrase?.trim() || 'make room for yourself';
  const personalName = name?.trim();
  const planName = ARCHETYPE_FOR_PLAN[preset.id].planName;
  const intro = personalName ? `${personalName}, day one` : 'Day one';
  const outcomes = GOAL_MILESTONE_OUTCOMES[preset.id]?.[intent]
    ?? PLAN_MILESTONE_OUTCOMES[preset.id];

  const firstDayLine = `${intro} of ${planName}: ${PLAN_FIRST_DAY_HOOK[preset.id]}.`;
  const milestones = planPhasesForPlan(preset.id, preset.revision).map((phase, index) => ({
    day: phase.endWeek * 7,
    title: phase.name,
    outcome: index === outcomes.length - 1
      ? `${outcomes[index]}, and you’re ready to ${goal}.`
      : outcomes[index],
  }));

  return {
    planName,
    goal,
    firstDayLine,
    milestones,
    /** Every stop on the journey, each with its one-sentence line. */
    stops: planJourney(preset.id, preset.revision).map((stop) => ({
      day: stop.day,
      line: stop.day === 1
        ? firstDayLine
        : milestones.find((milestone) => milestone.day === stop.day)?.outcome ?? stop.line,
    })),
  };
}
