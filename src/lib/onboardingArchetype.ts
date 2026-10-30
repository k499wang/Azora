import type { PresetId } from './onboardingPreset';

/**
 * Who the onboarding answers say you are, and the plan named for it. The two
 * are authored side by side so the profile and the plan it prescribes never
 * drift apart.
 */
export interface OnboardingArchetype {
  name: string;
  tagline: string;
  /** What the answers point to, said back as patterns the user will recognise. */
  noticed: readonly string[];
  /**
   * Who the plan turns them into, for the report that shows where they land. A
   * nickname rather than the plan's own name, and positive without exception:
   * `name` names what they recognise in themselves today, this names the person
   * the same answers are building.
   */
  futureName: string;
  planName: string;
  planPromise: string;
  /** What the plan does about each of those patterns, in the same order. */
  changes: readonly string[];
}

export const ARCHETYPE_FOR_PLAN: Record<PresetId, OnboardingArchetype> = {
  night: {
    name: 'The Night Spinner',
    tagline: 'Your mind gets loudest right when you want to sleep.',
    noticed: [
      'Your body is tired before your mind is.',
      'Bedtime is when the day’s worries catch up.',
      'A rough night makes the next day harder to face.',
    ],
    futureName: 'The Sound Sleeper',
    planName: 'Sleep Restoration',
    planPromise: 'Quieter nights, and sleep that comes sooner.',
    changes: [
      'A short wind-down tells your mind the day is done.',
      'Worries get parked before bed, not in it.',
      'Better nights make the days feel lighter.',
    ],
  },
  morning: {
    name: 'The Slow Starter',
    tagline: 'Your days take a long while to switch on.',
    noticed: [
      'The first hour sets the tone for your whole day.',
      'You run on snooze and catch-up.',
      'Energy shows up late, once the day is already busy.',
    ],
    futureName: 'The Early Riser',
    planName: 'Morning Momentum',
    planPromise: 'Mornings that start without a fight.',
    changes: [
      'A two-minute start that wakes you up gently.',
      'Mornings get a routine you don’t have to think about.',
      'Energy arrives earlier, so the day feels like yours.',
    ],
  },
  pressure: {
    name: 'The Pressure Cooker',
    tagline: 'You hold it all together, until the lid rattles.',
    noticed: [
      'Small things land harder when you’re already full.',
      'You carry stress quietly until it spills over.',
      'Calming down takes longer than getting wound up.',
    ],
    futureName: 'The Steady One',
    planName: 'Stress Regulation',
    planPromise: 'A longer fuse, and a faster bounce back.',
    changes: [
      'A pause you can reach for before you react.',
      'Stress gets let out in small doses, not all at once.',
      'Bad moments pass quicker.',
    ],
  },
  focus: {
    name: 'The Tab Juggler',
    tagline: 'Ten things open, none of them finished.',
    noticed: [
      'Starting is harder than doing.',
      'Your attention jumps when a task feels big.',
      'You work best once you’re already in it.',
    ],
    futureName: 'The Finisher',
    planName: 'Focus Training',
    planPromise: 'Start the thing, and stay with it.',
    changes: [
      'Tasks get cut small enough to start.',
      'A short pause before deep work clears the noise.',
      'Momentum builds a little more each day.',
    ],
  },
  quiet: {
    name: 'The Overthinker',
    tagline: 'One thought turns into twenty.',
    noticed: [
      'Your mind replays things long after they’re over.',
      'Quiet moments are when thoughts get loudest.',
      'You plan for problems that may never come.',
    ],
    futureName: 'The Calm Thinker',
    planName: 'Mental Clarity',
    planPromise: 'A calm spot you can reach any time.',
    changes: [
      'A way to step out of a thought loop.',
      'Daily quiet that doesn’t feel empty.',
      'Worries get smaller and easier to set down.',
    ],
  },
  home: {
    name: 'The Clutter Dodger',
    tagline: 'The mess grows faster than the energy to face it.',
    noticed: [
      'The mess grows when the rest of life gets busy.',
      'Not knowing where to start is the hardest part.',
      'A tidy corner lifts your whole mood.',
    ],
    futureName: 'The Home Keeper',
    planName: 'Home Order Plan',
    planPromise: 'A home that feels lighter, one small step a day.',
    changes: [
      'One small spot a day, never the whole house.',
      'Starting gets easy because every step is tiny.',
      'Home starts to feel like a place to rest.',
    ],
  },
  phone: {
    name: 'The Doomscroller',
    tagline: 'One quick check turns into an hour.',
    noticed: [
      'You reach for your phone without deciding to.',
      'Scrolling fills the gaps where rest should be.',
      'You finish scrolling more tired than you started.',
    ],
    futureName: 'The Present One',
    planName: 'Digital Discipline',
    planPromise: 'Less scrolling, and more of your day back.',
    changes: [
      'A pause between the urge and the unlock.',
      'Better things to do with the in-between minutes.',
      'Hours back, without a strict ban.',
    ],
  },
  recovery: {
    name: 'The Empty Tank',
    tagline: 'You give out more than you get back.',
    noticed: [
      'You keep going long after you’re empty.',
      'Rest feels like something you have to earn.',
      'Low days knock you further back than they should.',
    ],
    futureName: 'The Recharged One',
    planName: 'Burnout Recovery',
    planPromise: 'Easy days that slowly fill the tank.',
    changes: [
      'Small steps that count, even on low days.',
      'Rest becomes part of the plan, not a reward.',
      'You bounce back faster after hard weeks.',
    ],
  },
  selfTrust: {
    name: 'The Second-Guesser',
    tagline: 'You keep promises to everyone but yourself.',
    noticed: [
      'You’re kind to others and hard on yourself.',
      'One broken plan makes you doubt the next one.',
      'You wait to feel ready before you start.',
    ],
    futureName: 'The Promise Keeper',
    planName: 'Self-Trust Training',
    planPromise: 'Small promises kept, adding up to trust.',
    changes: [
      'Promises small enough to keep every day.',
      'Each one kept becomes proof.',
      'Trusting yourself starts to feel normal.',
    ],
  },
};

type CleaningArchetypeVoice = Pick<OnboardingArchetype, 'name' | 'tagline' | 'futureName' | 'planPromise'>;

/** Cleaning mode names the profile after what goes through their head at the mess. */
const CLEANING_ARCHETYPE_FOR_THOUGHT: Record<string, CleaningArchetypeVoice> = {
  where_start: {
    name: 'The Deer in Headlights',
    tagline: 'You walk in, see all of it, and freeze.',
    futureName: 'The Clear Thinker',
    planPromise: 'You see one next step, not the whole mess.',
  },
  tomorrow: {
    name: 'The Last-Minute Scrambler',
    tagline: 'It waits until guests or panic force your hand.',
    futureName: 'The Ahead-of-It Keeper',
    planPromise: 'Small steps now, so there’s never a scramble.',
  },
  too_tired: {
    name: 'The Low-Battery Tidier',
    tagline: 'By the time you’re free, the energy is gone.',
    futureName: 'The Recharged Keeper',
    planPromise: 'Tidying that fits the energy you actually have.',
  },
  why_bother: {
    name: 'The Uphill Pusher',
    tagline: 'Every clean-up feels undone by the next day.',
    futureName: 'The Easy Maintainer',
    planPromise: 'A few minutes a day keeps it from coming back.',
  },
  someone_sees: {
    name: 'The Last-Minute Stuffer',
    tagline: 'When someone’s coming, the mess goes in a closet.',
    futureName: 'The Anytime Host',
    planPromise: 'Ready for people to drop by, any day.',
  },
  not_bad: {
    name: 'The Laid-Back Keeper',
    tagline: 'It’s mostly fine, just never quite done.',
    futureName: 'The Effortless Keeper',
    planPromise: 'Staying on top of it without thinking about it.',
  },
};

export function cleaningArchetype(messThought: readonly string[] | undefined): OnboardingArchetype {
  const voice = messThought?.length === 1 ? CLEANING_ARCHETYPE_FOR_THOUGHT[messThought[0]] : undefined;
  return voice == null ? ARCHETYPE_FOR_PLAN.home : { ...ARCHETYPE_FOR_PLAN.home, ...voice };
}
