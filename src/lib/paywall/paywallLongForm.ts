import type { PaywallFeature } from '../../components/paywall/PaywallFeatureList';
import type { OnboardingIntent } from '../../components/onboarding/types';
import { planGoalDays, planNameFor } from '../onboardingPreset';

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
  intent: OnboardingIntent,
  sessionMinutes: number,
): PaywallPlanFacts {
  return {
    planName: planNameFor(intent),
    planDays: planGoalDays(intent),
    sessionMinutes,
  };
}

/**
 * What the plan unlocks, after the plan itself has been named.
 *
 * These two lines are authored per goal and they are the reason the list is not
 * a generic feature list — but they are not the list's opening: a page that
 * starts with "fall asleep 40% faster" sells a benefit before it says who built
 * the thing offering it. The authority line in `paywallHighlights` leads every
 * goal for that reason.
 */
const GOAL_HIGHLIGHTS: Record<OnboardingIntent, PaywallFeature[]> = {
  sleep: [
    { icon: 'moon', text: 'Fall asleep 40% faster with guided wind-downs' },
    { icon: 'bed-clock', text: 'Wake up feeling rested instead of groggy' },
  ],
  energy: [
    { icon: 'sun', text: 'Reclaim your afternoon with a 2-minute reset' },
    { icon: 'sunrise', text: 'Start mornings sharp even after a bad night' },
  ],
  stress_relief: [
    { icon: 'waves', text: 'Lower resting heart rate in just 2 weeks' },
    { icon: 'heart', text: 'Watch your stress score drop in real time' },
  ],
  calm_fast: [
    { icon: 'breath-lightning', text: 'Reset anxiety in 90 seconds, anywhere' },
    { icon: 'timer', text: 'Finished before anyone notices you stepped away' },
  ],
  emotional_balance: [
    { icon: 'breath-wave', text: 'Steady rough days with a 2-minute check-in' },
    { icon: 'face-calm', text: 'Turn a bad week into something you can track' },
  ],
  self_acceptance: [
    { icon: 'lotus', text: 'Build self-kindness in just 5 minutes a day' },
    { icon: 'book', text: 'Daily lessons that stick without guilt' },
  ],
  heart_health: [
    { icon: 'heart-bpm', text: 'Track resting heart rate and HRV daily' },
    { icon: 'stat-hrv-curve', text: 'See what each reset does to your numbers' },
  ],
  cleaning: [
    { icon: 'home', text: 'A reset for the moment the mess feels too big to start' },
    { icon: 'timer', text: 'A small way back before one surface, one load, or one room' },
  ],
  focus: [
    { icon: 'breath-box', text: 'Sharpen focus before the first meeting' },
    { icon: 'timer', text: 'Short enough to run between two calls' },
  ],
  daily_habit: [
    { icon: 'streak', text: 'Build a streak that survives missed days' },
    { icon: 'calendar-check-outline', text: 'One small win, already scheduled for you' },
  ],
  spiritual: [
    { icon: 'lotus', text: '5 quiet minutes that belong to nobody else' },
    { icon: 'moon', text: 'Longer sits for the evenings you have them' },
  ],
  self_care: [
    { icon: 'sparkle', text: 'A plan that fits the day you already have' },
    { icon: 'calendar-check-outline', text: 'Your list, carried over when life gets in the way' },
  ],
  yoga: [
    { icon: 'yoga', text: 'A short practice to pair with your mat' },
    { icon: 'breath-leaf', text: 'Longer sessions for the days you have time' },
  ],
  other: [
    { icon: 'sparkle', text: 'A plan built from what you actually answered' },
    { icon: 'waves', text: 'A reset for whichever kind of day you are having' },
  ],
};

export function paywallHighlights(
  intent: OnboardingIntent,
  facts: PaywallPlanFacts,
): PaywallFeature[] {
  return [
    // Always first, for every goal: the whole plan, personal to them, and
    // authored by professionals. The benefit lines below are the argument; this
    // is the thing being argued for. Named "your personalized plan" rather than
    // the protocol's own name — the page sells the thing they were handed, not
    // the programme it belongs to.
    {
      icon: 'stethoscope',
      text: `All ${facts.planDays} days of your personalized plan, built around your goals by mental health and wellness professionals`,
    },
    ...GOAL_HIGHLIGHTS[intent],
    {
      icon: 'breath-timer',
      text: `Your ${facts.sessionMinutes}-minute reset, plus every other length you need`,
    },
    {
      icon: 'heart-glow',
      text: 'Track HRV gains that last beyond the session',
    },
    {
      icon: 'stat-health-spark',
      text: 'See your Azora Score improve week by week',
    },
    {
      icon: 'room-hex',
      text: 'Your room: finish the day, unlock the object',
    },
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
