import type { OnboardingIntent } from '../components/onboarding/types';
import { planPhasesForPlan, type OnboardingPreset, type PresetId } from './onboardingPreset';
import { ARCHETYPE_FOR_PLAN } from './onboardingArchetype';

type MilestoneOutcomes = readonly [string, string, string];

const PLAN_MILESTONE_OUTCOMES: Record<PresetId, MilestoneOutcomes> = {
  night: [
    'Evenings start to feel less like another battle. You have room to leave the day behind.',
    'Bedtime feels more like time for you. A busy mind doesn’t have to run the whole evening.',
    'You feel more at home in your evenings, with a gentler rhythm to carry into tomorrow.',
  ],
  morning: [
    'The morning starts to feel like yours again. There’s room for you before everyone else’s demands.',
    'You can begin without having the whole day figured out. Small wins give you something to build on.',
    'You feel more ready to meet the day, with a morning that makes space for your own life.',
  ],
  pressure: [
    'The day feels less like one giant emergency. You can see the next small step.',
    'You can choose what matters and let the rest wait. There’s room to breathe again.',
    'Hard days don’t have to take everything from you. You feel steadier and more capable.',
  ],
  focus: [
    'The task in front of you feels less like a mountain. You can find a place to start.',
    'You feel the satisfaction of moving things forward, instead of carrying an unfinished list all day.',
    'Your attention has somewhere to land. You feel more confident starting and finishing what matters.',
  ],
  quiet: [
    'You start to feel like a person with needs of your own, not just someone everyone relies on.',
    'Time for yourself feels less like something you have to earn. You can make room without doing everything first.',
    'You feel more connected to yourself, with a little space that belongs to you even on busy days.',
  ],
  home: [
    'Your space starts to feel like something you can face. One small corner is enough to begin.',
    'Small tasks feel less tangled together. You can take on the dishes or the laundry without taking on everything.',
    'Home feels more like a place to land. You feel more confident keeping your space welcoming and manageable.',
  ],
  phone: [
    'You start to notice how much of your day belongs to the scroll. You get a say in what happens next.',
    'A quick check doesn’t have to decide your afternoon. Your attention has other places to go.',
    'You feel more present in your own life, with more room for the things your phone keeps pushing aside.',
  ],
  recovery: [
    'A low-energy day doesn’t have to feel like a lost day. Your gentle start can still count.',
    'You can make progress without running yourself into the ground. Rest belongs in your life, without guilt.',
    'You feel more confident finding your way back on tired days, without demanding your best every time.',
  ],
  selfTrust: [
    'You start seeing small wins instead of only what you haven’t done. You deserve credit for showing up.',
    'One difficult day doesn’t have to become a verdict on who you are. You can begin again with kindness.',
    'You feel more able to trust yourself, with proof that imperfect days can still move you forward.',
  ],
};

const GOAL_MILESTONE_OUTCOMES: Partial<Record<PresetId, Partial<Record<OnboardingIntent, MilestoneOutcomes>>>> = {
  pressure: {
    calm_fast: [
      'The same worry doesn’t have to own the whole day. You start to see a way out of the loop.',
      'You can notice a thought without treating it like a fact. There’s space for what is happening now.',
      'You feel less pulled around by every what-if, and more able to choose your next step.',
    ],
    emotional_balance: [
      'A difficult feeling doesn’t have to decide what you say next. You start to feel more in charge of your response.',
      'A tense moment can stay a moment, instead of becoming your whole day. You have room to choose.',
      'You feel more confident handling hard conversations and more able to return to yourself afterward.',
    ],
    heart_health: [
      'Looking after yourself starts to feel like a priority, instead of something you’ll get to later.',
      'You can make room for rest after a demanding day. Recovery doesn’t have to come last.',
      'You feel more confident protecting time for your wellbeing and making care part of everyday life.',
    ],
  },
  quiet: {
    spiritual: [
      'There’s a little more room for meaning in your day, beyond getting through the next thing.',
      'Quiet time feels more personal. You can return to what matters when the day pulls you elsewhere.',
      'You feel more connected to the values and moments that give your life meaning.',
    ],
    yoga: [
      'Your time on the mat starts to feel more like time for you, with less pressure to get it right.',
      'You feel more present on the mat and more connected to what your body needs that day.',
      'Your yoga time feels more intentional, with space to carry a little of that calm into your day.',
    ],
  },
  selfTrust: {
    daily_habit: [
      'Showing up starts to feel possible, even when motivation doesn’t. One small win is enough to begin.',
      'A missed day doesn’t have to erase your momentum. You can pick up where you left off.',
      'You feel proud of the days you keep showing up, and more confident that you can keep going.',
    ],
  },
  phone: {
    sleep: [
      'Bedtime doesn’t have to disappear into another scroll. You start making room for yourself at the end of the day.',
      'Putting the phone down feels more like choosing rest than missing out. Your evenings have other possibilities.',
      'You feel more in charge of your evenings, with more room to wind down instead of getting lost in your phone.',
    ],
    focus: [
      'The task you chose gets a chance before your phone takes over. You can see where your attention is going.',
      'Work or study feels less interrupted by the next quick check. You have more room to stay with one thing.',
      'You feel more in charge of your attention, and more confident moving work forward instead of scrolling it away.',
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
    firstDayLine: `${intro} your first step toward your goal to ${goal}. ${planName} is built around your real life. One small win today is enough to begin.`,
    milestones: planPhasesForPlan(preset.id).map((phase, index) => ({
      day: phase.endWeek * 7,
      title: phase.name,
      outcome: index === outcomes.length - 1
        ? `${outcomes[index]} You feel more ready to ${goal}.`
        : outcomes[index],
    })),
  };
}
