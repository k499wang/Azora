import type { OnboardingIntent, OnboardingStep } from './types';
import type {
  AdhdStatus,
  SleepDurationId,
  WakeEaseId,
  DayEnergyId,
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
  'intentDepth7',
] as const;

const DAILY_LIFE_AND_HABIT_STEPS: readonly OnboardingStep[] = [
  'routineHappiness',
  'fallingBehind',
  'skipSelfCare',
  'drainedFrequency',
  'homeFeeling',
  'beforeAfter',
  'lifestyleHappiness',
  'habitMotivation',
  'untappedPotential',
  'loseMotivation',
  'habitAttempts',
  'selfDiscipline',
  'greatDaysChart',
  'choresOverwhelm',
  'scrollInstead',
  'socialMedia',
  'procrastinationArea',
  'procrastinationReason',
  'putOffGuilt',
  'distraction',
  // Opens the brain-science block instead of splitting the two procrastination questions.
  'habitsFocusInsight',
  'habitsFocusScience1',
  'habitsFocusScience2',
  'habitsFocusScience3',
  'halfway',
];

const CLEANING_REPLACED_STEPS = new Set<OnboardingStep>([
  'choresOverwhelm',
  'procrastinationArea',
  'procrastinationReason',
  'putOffGuilt',
]);

/** Sleep goals collect symptoms, routine, causes, attempts, and impact together. */
const SLEEP_INTENT_STEPS: readonly OnboardingStep[] = [
  'intentDepth1',
  'sleepDuration',
  'sleepTime',
  'wakeTime',
  'sleep',
  'wakeEase',
  'sleepCause',
  'intentDepth2',
  'intentDepth3',
  'sleepInsight',
];

/** Other goals assess sleep after their daily-life and habits questions. */
const SLEEP_ASSESSMENT_STEPS: readonly OnboardingStep[] = [
  'sleep',
  'sleepDuration',
  'wakeEase',
  'sleepCause',
  'sleepInsight',
];

/** Every goal closes the assessment with demographics and the load they carry. */
const ASSESSMENT_STEPS: readonly OnboardingStep[] = [
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
  'putOthersFirst',
  'wishUnderstood',
  'doingItFor',
  'sacrificeForOthers',
  'expertReview',
  'adhdStatus',
  'mentalHealth',
  'struggles',
  'homeAtmosphere',
];

/**
 * Steps the flow runs through on its own — a wait, not a question. Back steps
 * over them, so Back from the screen they hand off to returns to the last real
 * question instead of replaying the wait.
 */
const TRANSIENT_STEPS = new Set<OnboardingStep>(['planLoading']);

export type OnboardingSection =
  | 'aboutYou'
  | 'goal'
  | 'days'
  | 'sleep'
  | 'carry'
  | 'method'
  | 'plan';

/** The goal as one short word, so a section label can name it and stay short. */
const SECTION_GOAL_NOUNS: Partial<Record<OnboardingIntent, string>> = {
  scrolling: 'phone habits',
  burnout: 'energy',
  procrastination: 'starting point',
  stress_relief: 'stress',
  calm_fast: 'stress',
  sleep: 'sleep',
  focus: 'focus',
  energy: 'energy',
  cleaning: 'clutter',
  daily_habit: 'routine',
};

/** The line under the progress bar, so a long flow reads as a few short parts. */
export function onboardingSectionLabel(
  section: OnboardingSection,
  primaryIntent: OnboardingIntent | null,
  name: string,
): string {
  const goal = primaryIntent ? SECTION_GOAL_NOUNS[primaryIntent] : undefined;
  const owner = name.trim() ? `${name.trim()}'s` : 'Your';
  switch (section) {
    case 'aboutYou':
      return 'About you';
    case 'goal':
      return goal ? `Your ${goal}` : 'Your goal';
    case 'days':
      return goal ? `Your ${goal} triggers` : 'Your days';
    case 'sleep':
      return 'Your sleep';
    case 'carry':
      return 'What you carry';
    case 'method':
      return goal ? `Fixing your ${goal}` : 'How it works';
    case 'plan':
      return goal ? `${owner} ${goal} plan` : `${owner} plan`;
  }
}

export interface OnboardingSectionSteps {
  section: OnboardingSection;
  steps: OnboardingStep[];
}

/** Support applies to both diagnosed and suspected ADHD without recording a diagnosis. */
export function shouldShowAdhdSupport(status: AdhdStatus | null): boolean {
  return status === 'diagnosed' || status === 'suspected';
}

/** The step order grouped into the sections the progress bar names. */
export function onboardingSections(
  primaryIntent: OnboardingIntent | null,
  selectedIntentCount: number,
  followUpCount: number,
  adhdStatus: AdhdStatus | null = null,
): OnboardingSectionSteps[] {
  const sections: OnboardingSectionSteps[] = [
    {
      section: 'aboutYou',
      steps: [
        'azoChatInvite',
        'azoChat',
        'name',
        'greeting',
        'intent',
        ...(selectedIntentCount >= 2 ? ['intentPriority' as const] : []),
        'usageStyle',
        'personalizeIntro',
        'communityProof',
      ],
    },
    {
      section: 'goal',
      steps: [
        ...(primaryIntent === 'sleep'
          ? SLEEP_INTENT_STEPS
          : INTENT_DEPTH_STEPS.slice(0, followUpCount)),
        'goalProof',
      ],
    },
    {
      section: 'days',
      steps: DAILY_LIFE_AND_HABIT_STEPS.filter(
        (step) => primaryIntent !== 'cleaning' || !CLEANING_REPLACED_STEPS.has(step),
      ),
    },
    {
      section: 'sleep',
      steps: primaryIntent !== 'sleep' ? [...SLEEP_ASSESSMENT_STEPS] : [],
    },
    {
      section: 'carry',
      steps: [
        ...ASSESSMENT_STEPS,
        ...PERSONAL_CONTEXT_STEPS.flatMap((step) =>
          step === 'adhdStatus' && shouldShowAdhdSupport(adhdStatus)
            ? [step, 'adhdSupport' as const]
            : [step],
        ),
      ],
    },
    {
      section: 'method',
      steps: [
        // The goal, named one last time in habit form once every personal answer is
        // in, opening the last run before the plan's own settings.
        'habitsToBreak',
        // The method behind the plan, taught as one run of three: what they know
        // about CBT, the CBT chalkboard, then the GST one.
        'cbtFamiliarity',
        'cbtIntro',
        'routineBrain',
        'dailyTime',
        ...(primaryIntent === 'sleep' ? [] : ['wakeTime' as const, 'sleepTime' as const]),
        'planBoost',
      ],
    },
    {
      section: 'plan',
      steps: [
        // Everything is in: say so, wait while it is put together, then show it.
        'planIntro',
        'planLoading',
        'diagnosis',
        'planOutcome',
        'planPersonalization',
        'recommendedExercise',
        'planDays',
        'habitPicks',
        'habitCurve',
        'acquisitionSource',
        // Both are "how you got here" facts, grouped once the plan is visible.
        'doctorReferral',
        'attPriming',
        'notifications',
        'pact',
        'paywall',
      ],
    },
  ];
  return sections.filter(({ steps }) => steps.length > 0);
}

/** One sequence owns navigation, analytics indices, and progress for the chosen goal. */
export function onboardingStepOrder(
  primaryIntent: OnboardingIntent | null,
  selectedIntentCount: number,
  followUpCount: number,
  adhdStatus: AdhdStatus | null = null,
): OnboardingStep[] {
  return onboardingSections(
    primaryIntent,
    selectedIntentCount,
    followUpCount,
    adhdStatus,
  ).flatMap(({ steps }) => steps);
}

/** Continue, Skip, and Back all use the same visible sequence. */
export function adjacentOnboardingStep(
  steps: readonly OnboardingStep[],
  current: OnboardingStep,
  direction: 'forward' | 'back',
): OnboardingStep | null {
  const index = steps.indexOf(current);
  if (index === -1) return null;
  let nextIndex = index + (direction === 'forward' ? 1 : -1);
  if (direction === 'back') {
    while (nextIndex >= 0 && TRANSIENT_STEPS.has(steps[nextIndex])) {
      nextIndex -= 1;
    }
  }
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
  routineHappiness: RoutineHappinessId | null;
  choresOverwhelm: ChoresOverwhelmId | null;
  distraction: DistractionId | null;
  sleepCause: SleepCauseId | null;
  stressSignal: StressSignalId | null;
  procrastinationAreas: ProcrastinationAreaId[];
  procrastinationReasons: ProcrastinationReasonId[];
}
