import type { PaywallFeature } from '../../components/paywall/PaywallFeatureList';
import type { OnboardingIntent } from '../../components/onboarding/types';
import type { OnboardingPreset } from '../onboardingPreset';

/**
 * What the long-form paywall knows about the plan it is selling.
 *
 * Pure on purpose: the sell page is the highest-stakes copy in the app, and the
 * only way to keep it honest is to be able to read every sentence it can
 * produce for every goal in one test rather than in twelve screenshots.
 */
export interface PaywallPlanFacts {
  /** The plan the goal resolves to. */
  planName: string;
  /** Finished days the plan runs. */
  planDays: number;
  /** Minutes of the first daily reset. */
  sessionMinutes: number;
}

export function paywallPlanFacts(
  preset: OnboardingPreset,
  sessionMinutes: number,
): PaywallPlanFacts {
  return {
    planName: preset.name,
    planDays: preset.weeks * 7,
    sessionMinutes,
  };
}

/**
 * The two lines that name what the plan does for their goal.
 *
 * Outcome first, then the part of the plan that delivers it. No pain: the problem
 * is the headline's job; a bullet only says what they get.
 */
const GOAL_HIGHLIGHTS: Record<OnboardingIntent, readonly [PaywallFeature, PaywallFeature]> = {
  sleep: [
    { icon: 'moon', text: 'Fall asleep without the 2am scroll, with nightly wind-downs' },
    { icon: 'bed-clock', text: 'Wake up rested instead of already behind on everything' },
  ],
  energy: [
    { icon: 'sunrise', text: 'Get out of bed with energy, not an hour of scrolling' },
    { icon: 'sun', text: 'Skip the afternoon crash with a quick pick-me-up' },
  ],
  stress_relief: [
    { icon: 'waves', text: 'Calm your anxiety in minutes with short guided steps' },
    { icon: 'lotus', text: 'Quiet a loud head on the hard days' },
  ],
  calm_fast: [
    { icon: 'breath-lightning', text: 'Calm down fast, anywhere, in just a few minutes' },
    { icon: 'timer', text: 'Small enough to do from bed, the car, or anywhere' },
  ],
  emotional_balance: [
    { icon: 'face-calm', text: 'Feel like yourself again with a quick daily check-in' },
    { icon: 'breath-wave', text: 'Get through rough days without spiraling for the whole week' },
  ],
  self_acceptance: [
    { icon: 'lotus', text: 'Build real self-trust through small daily wins' },
    { icon: 'sparkle', text: 'Go easier on yourself with lessons that stick without guilt' },
  ],
  heart_health: [
    { icon: 'waves', text: 'Bring your daily stress down with short guided steps' },
    { icon: 'lotus', text: 'Feel calmer in your body, a little more each week' },
  ],
  cleaning: [
    { icon: 'home', text: 'Get on top of basic tasks with tiny home to-dos' },
    { icon: 'timer', text: 'One surface, one load at a time, never the whole house' },
  ],
  focus: [
    { icon: 'breath-box', text: 'Start tasks without waiting for motivation to show up' },
    { icon: 'timer', text: 'Finish what you start, with focus that actually lasts' },
  ],
  daily_habit: [
    { icon: 'streak', text: 'Build habits that actually stick, one tiny step a day' },
    { icon: 'sparkle', text: 'Keep your momentum going, even on the hard days' },
  ],
  spiritual: [
    { icon: 'lotus', text: 'Find a few quiet minutes a day that are yours' },
    { icon: 'moon', text: 'Go deeper with longer sits when you have time' },
  ],
  self_care: [
    { icon: 'sparkle', text: 'Get your life together gently, without a total overhaul' },
    { icon: 'lotus', text: 'Put yourself back on your own to-do list' },
  ],
  yoga: [
    { icon: 'yoga', text: 'Pair a short guided practice with your mat' },
    { icon: 'breath-leaf', text: 'Stretch into longer sessions on the days you have time' },
  ],
  other: [
    { icon: 'sparkle', text: 'Start feeling like yourself again, one day at a time' },
    { icon: 'streak', text: 'Build momentum one tiny step at a time, no motivation needed' },
  ],
};

/**
 * Benefit-led bullets, as many as the long page has room for: their
 * plan, what it does for their goal, what it asks of them, what else is in it,
 * and who built it. In-app names like the score or the room mean nothing to
 * someone who has not used the app yet, so the lines say what those things do.
 */
export function paywallHighlights(
  intent: OnboardingIntent,
  facts: PaywallPlanFacts,
): PaywallFeature[] {
  return [
    { icon: 'calendar-check-outline', text: `All ${facts.planDays} days of your personalized plan, built around your answers` },
    { icon: 'stethoscope', text: 'Built by mental health and wellness professionals' },
    ...GOAL_HIGHLIGHTS[intent],
    { icon: 'breath-timer', text: 'Small steps every day, already planned for you' },
    { icon: 'book', text: 'Short daily lessons on why you get stuck, and what helps' },
    { icon: 'stat-health-spark', text: 'Watch yourself improve week by week with a clear score' },
  ];
}

/**
 * How long the page holds the plan open for, and how that is said.
 *
 * Fifteen minutes is the whole claim: the countdown is drawn from a start time
 * rather than decremented, so a backgrounded app that misses a hundred ticks
 * comes back showing the truth instead of the time it had left when it went
 * away.
 */
export const PLAN_RESERVATION_MS = 15 * 60 * 1000;

export function planReservationRemaining(
  startedAt: number,
  now: number,
): number {
  return Math.max(0, PLAN_RESERVATION_MS - (now - startedAt));
}

/** `14:59`, and `0:00` once it has run out. */
export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
