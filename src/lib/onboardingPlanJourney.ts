import type { OnboardingIntent } from '../components/onboarding/types';
import { planPhasesForPlan, type OnboardingPreset, type PresetId } from './onboardingPreset';
import { ARCHETYPE_FOR_PLAN } from './onboardingArchetype';

type MilestoneOutcomes = readonly [string, string, string];

/**
 * A milestone line is one short sentence, so the last one plus the goal
 * sentence below still fits on a card: the journey is read as small steps, and
 * a crowded paragraph reads as a promise instead.
 */
const PLAN_MILESTONE_OUTCOMES: Record<PresetId, MilestoneOutcomes> = {
  night: [
    'Your evenings start to feel less like another battle.',
    'Bedtime feels more like time for you.',
    'Your evenings feel gentler, and more like yours.',
  ],
  morning: [
    'The morning starts to feel like yours again.',
    'You can begin without having the whole day figured out.',
    'A morning that makes space for your own life changes how the day starts.',
  ],
  pressure: [
    'Your day feels less like one giant emergency.',
    'You can choose what matters and let the rest wait.',
    'You feel steadier and more capable.',
  ],
  focus: [
    'The task in front of you feels less like a mountain.',
    'You move things forward instead of carrying an unfinished list.',
    'Your attention has somewhere to land.',
  ],
  quiet: [
    'You start to feel like a person with needs of your own.',
    'Time for yourself feels less like something you have to earn.',
    'You have a little space that belongs to you, even on busy days.',
  ],
  home: [
    'Your space starts to feel like something you can face.',
    'You can take on the dishes without taking on everything.',
    'Your home feels more like a place to land.',
  ],
  phone: [
    'You start to notice how much of your day belongs to the scroll.',
    'A quick check doesn’t have to decide your afternoon.',
    'Your attention goes back to your own life.',
  ],
  recovery: [
    'A low-energy day doesn’t have to be a lost day, and your gentle start still counts.',
    'You can make progress without running yourself into the ground.',
    'You can handle tired days without demanding your best.',
  ],
  selfTrust: [
    'You start seeing small wins instead of only what you haven’t done.',
    'You can begin again with kindness.',
    'You learn to trust yourself, even on imperfect days.',
  ],
};

const GOAL_MILESTONE_OUTCOMES: Partial<Record<PresetId, Partial<Record<OnboardingIntent, MilestoneOutcomes>>>> = {
  pressure: {
    calm_fast: [
      'The same worry doesn’t have to own the whole day, and you can find your way out of the loop.',
      'You can notice a thought without treating it like a fact.',
      'You can choose your next step instead of every what-if.',
    ],
    emotional_balance: [
      'A difficult feeling doesn’t have to decide what you say next.',
      'A tense moment can stay a moment, not your whole day.',
      'Handling hard conversations gets easier, and you come back to yourself afterward.',
    ],
    heart_health: [
      'Looking after yourself starts to feel like a priority, with room for rest after a demanding day.',
      'Recovery doesn’t have to come last in your week.',
      'Protecting time for your wellbeing starts to feel normal.',
    ],
  },
  quiet: {
    spiritual: [
      'There’s a little more room for meaning in your day.',
      'Quiet time returns you to what matters when the day pulls you elsewhere.',
      'Your day stays connected to the values that matter most.',
    ],
    yoga: [
      'Your time on the mat feels more like time for you.',
      'You move with what your body needs that day.',
      'Your yoga time carries a little calm into your day.',
    ],
  },
  selfTrust: {
    daily_habit: [
      'Showing up starts to feel possible, even when your motivation doesn’t.',
      'A missed day doesn’t have to erase your momentum.',
      'You can keep going, and feel proud of the days you show up.',
    ],
  },
  phone: {
    sleep: [
      'Bedtime doesn’t have to disappear into another scroll.',
      'Putting the phone down feels more like choosing rest than missing out.',
      'Your evenings belong to you again, not the screen.',
    ],
    focus: [
      'The task you chose gets a chance before your phone takes over.',
      'Work or study stays interrupted less, so you can stay with one thing.',
      'Your attention lands where you point it.',
    ],
  },
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
  const intro = personalName ? `${personalName}, this is` : 'This is';
  const outcomes = GOAL_MILESTONE_OUTCOMES[preset.id]?.[intent]
    ?? PLAN_MILESTONE_OUTCOMES[preset.id];

  return {
    planName,
    goal,
    // Two sentences: the first step, then the promise that it fits their life.
    firstDayLine: `${intro} your first step toward your goal to ${goal}. ${planName} is built around your real life.`,
    milestones: planPhasesForPlan(preset.id).map((phase, index) => ({
      day: phase.endWeek * 7,
      title: phase.name,
      outcome: index === outcomes.length - 1
        ? `${outcomes[index]} You feel more ready to ${goal}.`
        : outcomes[index],
    })),
  };
}
