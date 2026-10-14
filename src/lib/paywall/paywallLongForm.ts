import type { PaywallFeature } from '../../components/paywall/PaywallFeatureList';
import type { OnboardingIntent } from '../../components/onboarding/types';
import { planPhasesForPlan, type OnboardingPreset, type PresetId } from '../onboardingPreset';
import { onboardingPlanBenefits } from '../onboardingPlanBenefits';
import { ARCHETYPE_FOR_PLAN } from '../onboardingArchetype';

const PLAN_PRACTICE_MILESTONES: Record<PresetId, readonly [string, string, string]> = {
  night: [
    'Make room for a short wind-down before bed.',
    'Practise letting the day go with a familiar evening reset.',
    'Have an evening routine you can return to after a difficult day.',
  ],
  morning: [
    'Find a small place to begin each morning.',
    'Practise a morning reset before the day gets busy.',
    'Have a familiar morning routine that makes space for your own day.',
  ],
  pressure: [
    'Learn a short pause for overwhelming moments.',
    'Practise returning to that pause when stress shows up.',
    'Have a familiar reset to reach for on hard days.',
  ],
  focus: [
    'Find a small reset before your next task.',
    'Practise bringing your attention back when it wanders.',
    'Have a repeatable way to begin a work or study session.',
  ],
  quiet: [
    'Make a little room for quiet in your day.',
    'Practise noticing one thing at a time.',
    'Have a familiar quiet practice you can return to.',
  ],
  home: [
    'Try a short reset before an everyday household task.',
    'Practise taking a calmer pause when your space feels overwhelming.',
    'Have a familiar reset before taking the next small step at home.',
  ],
  phone: [
    'Practise noticing the pull to check your phone.',
    'Build a small pause between the urge and the unlock.',
    'Have a familiar practice for choosing where your attention goes.',
  ],
  recovery: [
    'Find a gentle place to begin on a low-energy day.',
    'Practise small resets that leave room for rest.',
    'Have a lighter routine you can return to when your energy is low.',
  ],
  selfTrust: [
    'Start with one small promise you can practise keeping.',
    'Practise picking up where you left off after a missed day.',
    'Have a repeatable routine for showing up for yourself.',
  ],
};

/** A target calendar date, with today counted as the first plan day. */
function planDayDate(today: Date, day: number): string {
  const date = new Date(today);
  date.setDate(date.getDate() + day - 1);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Copy and practice targets for the exact plan the user was shown. */
export function personalizedPaywallPlan(
  preset: OnboardingPreset,
  intent: OnboardingIntent,
  name: string | null | undefined,
  goalPhrase: string | null | undefined,
  today: Date,
) {
  const benefits = onboardingPlanBenefits(preset, intent, goalPhrase ?? '');
  const personalName = name?.trim();
  const intro = personalName ? `${personalName}, we’ll` : 'We’ll';
  const milestones = planPhasesForPlan(preset.id).map((phase, index) => {
    const day = phase.endWeek * 7;
    return {
      day,
      date: planDayDate(today, day),
      title: phase.name,
      outcome: PLAN_PRACTICE_MILESTONES[preset.id][index],
    };
  });

  return {
    headline: `${intro} help you feel ${benefits.outcome} in ${benefits.days} days.`,
    days: benefits.days,
    planName: ARCHETYPE_FOR_PLAN[preset.id].planName,
    goal: benefits.goal,
    finishDate: planDayDate(today, benefits.days),
    milestones,
  };
}

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
