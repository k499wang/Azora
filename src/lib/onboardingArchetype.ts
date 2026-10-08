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
    planName: 'Sweet Dreams',
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
    planName: 'Rise & Shine',
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
    planName: 'Cool Head',
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
    planName: 'Deep Focus',
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
    planName: 'Quiet Mind',
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
    planName: 'Cleanup Frenzy',
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
    planName: 'Phone Detox',
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
    planName: 'Gentle Comeback',
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
    planName: 'Self-Trust Builder',
    planPromise: 'Small promises kept, adding up to trust.',
    changes: [
      'Promises small enough to keep every day.',
      'Each one kept becomes proof.',
      'Trusting yourself starts to feel normal.',
    ],
  },
};
