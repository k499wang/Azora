import type { OnboardingIntent, OnboardingStep } from './types';
import type {
  SleepDurationId,
  WakeEaseId,
  DayEnergyId,
  DayActivityId,
  RoutineHappinessId,
  ChoresOverwhelmId,
  DistractionId,
  SleepCauseId,
  StressSignalId,
  ProcrastinationAreaId,
  ProcrastinationReasonId,
} from './data/routineOptions';

export const INTENT_DEPTH_STEPS = [
  'intentDepth1',
  'intentDepth2',
  'intentDepth3',
  'intentDepth4',
  'intentDepth5',
  'intentDepth6',
] as const;

const DAILY_LIFE_AND_HABIT_STEPS: readonly OnboardingStep[] = [
  'dayActivity',
  'routineHappiness',
  'fallingBehind',
  'beforeAfter',
  'choresOverwhelm',
  'distraction',
  'scrollInstead',
  'socialMedia',
  'procrastinationArea',
  'procrastinationReason',
  'habitsFocusInsight',
  'putOffGuilt',
  'habitsFocusScience1',
  'habitsFocusScience2',
  'habitsFocusScience3',
  'routineBrain',
  'halfway',
];

const CLEANING_REPLACED_STEPS = new Set<OnboardingStep>([
  'choresOverwhelm',
  'procrastinationArea',
  'procrastinationReason',
  'putOffGuilt',
]);

/**
 * The health assessment every goal runs after the habits section: sleep, then
 * who they are, then the load they carry, closing on the screen that names the
 * whole picture. Universal rather than goal-specific — the plan reads the same
 * answers for every goal.
 */
const ASSESSMENT_STEPS: readonly OnboardingStep[] = [
  'sleep',
  'sleepDuration',
  'wakeEase',
  'dayEnergy',
  'sleepCause',
  'sleepInsight',
  'age',
  'gender',
  'stress',
  'stressSignal',
  'stressAwareness',
  'piecesTogether',
];

/**
 * Asked of every goal once the assessment is in: what they are carrying and the
 * life they picture, before the plan's own settings.
 */
const PERSONAL_CONTEXT_STEPS: readonly OnboardingStep[] = [
  'supportSystem',
  'mentalHealth',
  'homeFeeling',
];

/** One sequence owns navigation, analytics indices, and progress for the chosen goal. */
export function onboardingStepOrder(
  primaryIntent: OnboardingIntent | null,
  selectedIntentCount: number,
  followUpCount: number,
): OnboardingStep[] {
  return [
    'azoChatInvite',
    'azoChat',
    'name',
    'greeting',
    'intent',
    ...(selectedIntentCount >= 2 ? ['intentPriority' as const] : []),
    'personalizeIntro',
    'communityProof',
    ...INTENT_DEPTH_STEPS.slice(0, followUpCount),
    'goalProof',
    ...DAILY_LIFE_AND_HABIT_STEPS.filter(
      (step) => primaryIntent !== 'cleaning' || !CLEANING_REPLACED_STEPS.has(step),
    ),
    ...ASSESSMENT_STEPS,
    ...PERSONAL_CONTEXT_STEPS,
    'dailyTime',
    'wakeTime',
    'sleepTime',
    'planBoost',
    'diagnosis',
    'planOutcome',
    'planPersonalization',
    'recommendedExercise',
    'planDays',
    'recommendedHabits',
    'acquisitionSource',
    // Both are "how you got here" facts, grouped once the plan is visible.
    'doctorReferral',
    'attPriming',
    'notifications',
    'pact',
    'paywall',
  ];
}

/** Continue, Skip, and Back all use the same visible sequence. */
export function adjacentOnboardingStep(
  steps: readonly OnboardingStep[],
  current: OnboardingStep,
  direction: 'forward' | 'back',
): OnboardingStep | null {
  const index = steps.indexOf(current);
  if (index === -1) return null;
  const nextIndex = index + (direction === 'forward' ? 1 : -1);
  return steps[nextIndex] ?? null;
}

/** Only the questions the sequence actually asks are read by the plan. */
export function activeOnboardingContext(
  steps: readonly OnboardingStep[],
  answers: OnboardingContextAnswers,
): OnboardingContextAnswers {
  return {
    stressLevel: steps.includes('stress') ? answers.stressLevel : null,
    sleepQuality: steps.includes('sleep') ? answers.sleepQuality : null,
    sleepDuration: steps.includes('sleepDuration') ? answers.sleepDuration : null,
    wakeEase: steps.includes('wakeEase') ? answers.wakeEase : null,
    dayEnergy: steps.includes('dayEnergy') ? answers.dayEnergy : null,
    dayActivity: steps.includes('dayActivity') ? answers.dayActivity : null,
    choresOverwhelm: steps.includes('choresOverwhelm') ? answers.choresOverwhelm : null,
    routineHappiness: steps.includes('routineHappiness') ? answers.routineHappiness : null,
    distraction: steps.includes('distraction') ? answers.distraction : null,
    sleepCause: steps.includes('sleepCause') ? answers.sleepCause : null,
    stressSignal: steps.includes('stressSignal') ? answers.stressSignal : null,
    procrastinationAreas: steps.includes('procrastinationArea') ? answers.procrastinationAreas : [],
    procrastinationReasons: steps.includes('procrastinationReason') ? answers.procrastinationReasons : [],
  };
}

interface OnboardingContextAnswers {
  stressLevel: number | null;
  sleepQuality: number | null;
  sleepDuration: SleepDurationId | null;
  wakeEase: WakeEaseId | null;
  dayEnergy: DayEnergyId | null;
  dayActivity: DayActivityId | null;
  routineHappiness: RoutineHappinessId | null;
  choresOverwhelm: ChoresOverwhelmId | null;
  distraction: DistractionId | null;
  sleepCause: SleepCauseId | null;
  stressSignal: StressSignalId | null;
  procrastinationAreas: ProcrastinationAreaId[];
  procrastinationReasons: ProcrastinationReasonId[];
}
