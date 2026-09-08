import type { IconName } from '../components/common/icons/paths';
import type { OptionIconName } from '../components/common/icons/optionIconPaths';
import { colors } from '../theme/colors';
import type {
  DayActivityId,
  MentalHealthId,
  ProcrastinationAreaId,
  ProcrastinationReasonId,
  RoutineHappinessId,
  SleepDurationId,
  WakeEaseId,
} from '../components/onboarding/data/routineOptions';
import {
  selfCareGoalDaypartTime,
  type SelfCareGoalDaypart,
} from '../features/selfCare/domain/selfCareGoal';
import type { SelfCareGoalDraft } from '../services/selfCare/selfCareService';
import type { OnboardingIntent } from '../features/exercise/guidedBreathing/techniqueSelection';

/**
 * The to-do list onboarding hands the user, written from the answers they just
 * gave rather than from a fixed starter set.
 *
 * The assessment already asks what they put off, why, how they sleep and how
 * they move; a generic list would throw all of that away and ask them to say it
 * a second time. So each line is a claim about them — "you said mornings are
 * the hard part, so this one is about mornings" — and the screen lets them drop
 * any line that misses, because a plan they edited is theirs and a plan they
 * only received is Azora's.
 */
export interface StarterPlanAnswers {
  /** The goal they chose at the top of onboarding; null when they skipped it. */
  intent: OnboardingIntent | null;
  wakeEase: WakeEaseId | null;
  sleepDuration: SleepDurationId | null;
  dayActivity: DayActivityId | null;
  routineHappiness: RoutineHappinessId | null;
  mentalHealth: MentalHealthId[];
  procrastinationAreas: ProcrastinationAreaId[];
  procrastinationReasons: ProcrastinationReasonId[];
}

export interface StarterPlanItem {
  id: string;
  title: string;
  /**
   * A name both sets answer to: the notepad draws it from the onboarding icons,
   * and the to-do list stores it in its own vocabulary. The intersection is
   * checked here rather than discovered at runtime as a blank row.
   */
  icon: IconName & OptionIconName;
  /** the colour its icon is drawn in, so the page reads as a list of things */
  accent: string;
  daypart: SelfCareGoalDaypart;
}

interface StarterPlanCandidate extends StarterPlanItem {
  matches: (answers: StarterPlanAnswers) => boolean;
}

/**
 * Four lines keeps the starter plan approachable, and three is the fewest that
 * still reads as a plan.
 */
const MAX_ITEMS = 4;
const MIN_ITEMS = 3;

/** Declared in the order a day happens; `DAYPART_ORDER` is what shows them. */
const CANDIDATES: StarterPlanCandidate[] = [
  {
    id: 'outOfBed',
    title: 'Get out of bed when the alarm goes',
    icon: 'sunrise',
    accent: colors.playful.amber.base,
    daypart: 'start',
    matches: (answers) =>
      answers.wakeEase === 'snooze' || answers.wakeEase === 'struggle',
  },
  {
    id: 'makeBed',
    title: 'Make the bed',
    icon: 'home',
    accent: colors.playful.teal.base,
    daypart: 'start',
    matches: (answers) =>
      answers.routineHappiness === 'none' ||
      answers.procrastinationAreas.includes('chores'),
  },
  {
    id: 'water',
    title: 'Drink a glass of water',
    icon: 'waves',
    accent: colors.playful.sky.base,
    daypart: 'start',
    matches: (answers) => answers.procrastinationAreas.includes('health'),
  },
  {
    id: 'oneThing',
    title: 'Write down the one thing that matters today',
    icon: 'pencil',
    accent: colors.playful.violet.base,
    daypart: 'start',
    matches: (answers) =>
      answers.procrastinationAreas.includes('work') ||
      answers.procrastinationReasons.includes('start') ||
      answers.procrastinationReasons.includes('overwhelmed'),
  },
  {
    id: 'phoneAway',
    title: 'Work 25 minutes with my phone in another room',
    icon: 'timer',
    accent: colors.playful.night.base,
    daypart: 'afternoon',
    matches: (answers) => answers.procrastinationReasons.includes('focus'),
  },
  {
    id: 'walk',
    title: 'Walk for fifteen minutes',
    icon: 'walk',
    accent: colors.playful.coral.base,
    daypart: 'afternoon',
    matches: (answers) =>
      answers.dayActivity === 'sitting' ||
      answers.procrastinationAreas.includes('movement'),
  },
  {
    id: 'stretch',
    title: 'Stretch for five minutes',
    icon: 'meditation',
    accent: colors.playful.teal.base,
    daypart: 'afternoon',
    matches: (answers) =>
      answers.dayActivity === 'sitting' || answers.dayActivity === 'light',
  },
  {
    id: 'errand',
    title: 'Do one errand I keep putting off',
    icon: 'star',
    accent: colors.playful.amber.base,
    daypart: 'afternoon',
    matches: (answers) => answers.procrastinationAreas.includes('admin'),
  },
  {
    id: 'happyThing',
    title: 'Spend fifteen minutes on something I enjoy',
    icon: 'face-happy',
    accent: colors.playful.blush.base,
    daypart: 'evening',
    matches: (answers) => answers.mentalHealth.some((id) => id !== 'none'),
  },
  {
    id: 'windDown',
    title: 'Put my phone down thirty minutes before bed',
    icon: 'moon',
    accent: colors.playful.violet.base,
    daypart: 'bedtime',
    matches: (answers) =>
      answers.sleepDuration === 'under5' ||
      answers.sleepDuration === '5to6' ||
      answers.procrastinationAreas.includes('sleep'),
  },
];

/**
 * The lines the chosen goal earns, on top of whatever the routine answers ask
 * for. Without these the plan reads back the assessment but never the goal —
 * someone who picked heart health and someone who picked sleep would get the
 * same list, and the one thing they told us first would be the one thing the
 * plan never mentions.
 *
 * Every line here carries a picture no other line in the file uses — goal or
 * routine — so no plan can ever show the same icon twice, whichever goal built
 * it. `buildStarterPlan`'s icon test is what keeps that true.
 */
const GOAL_ITEMS: Record<OnboardingIntent, StarterPlanItem[]> = {
  stress_relief: [
    {
      id: 'goalOutside',
      title: 'Step outside for five minutes',
      icon: 'weather-windy',
      accent: colors.playful.amber.base,
      daypart: 'afternoon',
    },
  ],
  calm_fast: [
    {
      id: 'goalNoticeCalm',
      title: 'Write down one moment that felt calm today',
      icon: 'sparkle',
      accent: colors.playful.sky.base,
      daypart: 'evening',
    },
  ],
  sleep: [
    {
      id: 'goalSameBedtime',
      title: 'Be in bed by the same time as last night',
      icon: 'bed-clock',
      accent: colors.playful.violet.base,
      daypart: 'bedtime',
    },
  ],
  focus: [
    {
      id: 'goalOneTask',
      title: 'Clear my desk before I start work',
      icon: 'book',
      accent: colors.playful.sky.base,
      daypart: 'start',
    },
  ],
  energy: [
    {
      id: 'goalDaylight',
      title: 'Get outside within an hour of waking',
      icon: 'sun',
      accent: colors.playful.amber.base,
      daypart: 'start',
    },
  ],
  self_acceptance: [
    {
      id: 'goalDidWell',
      title: 'Write down one thing I did well',
      icon: 'calendar-check-outline',
      accent: colors.playful.blush.base,
      daypart: 'evening',
    },
  ],
  emotional_balance: [
    {
      id: 'goalNameFeeling',
      title: 'Write down what I felt today, in one line',
      icon: 'breath-timer',
      accent: colors.playful.violet.base,
      daypart: 'evening',
    },
  ],
  self_care: [
    {
      id: 'goalFifteenMinutes',
      title: 'Take a thirty minute break with my phone off',
      icon: 'coffee-outline',
      accent: colors.playful.teal.base,
      daypart: 'evening',
    },
  ],
  spiritual: [
    {
      id: 'goalQuiet',
      title: 'Sit in silence for five minutes',
      icon: 'lotus',
      accent: colors.playful.violet.base,
      daypart: 'evening',
    },
  ],
  yoga: [
    {
      id: 'goalMat',
      title: 'Do ten minutes on the mat',
      icon: 'yoga',
      accent: colors.playful.teal.base,
      daypart: 'afternoon',
    },
  ],
  heart_health: [
    {
      id: 'goalRestingRate',
      title: 'Check my resting heart rate',
      icon: 'stethoscope',
      accent: colors.playful.coral.base,
      daypart: 'start',
    },
    {
      id: 'goalStairs',
      title: 'Take the stairs today',
      icon: 'arrow-up',
      accent: colors.playful.amber.base,
      daypart: 'afternoon',
    },
    {
      id: 'goalWalkAfterDinner',
      title: 'Walk after dinner',
      icon: 'dumbbell',
      accent: colors.playful.blush.base,
      daypart: 'evening',
    },
  ],
  // Both are empty on purpose: these intents do not imply a specific action.
  // Routine answers and the neutral filler list provide their plan instead.
  daily_habit: [],
  other: [],
};

/** The order the page reads in, so goal and routine lines interleave by hour. */
const DAYPART_ORDER: SelfCareGoalDaypart[] = [
  'start',
  'afternoon',
  'evening',
  'bedtime',
];

/**
 * Topped up in this order when the answers matched too little to fill a page —
 * someone who reports a steady routine still leaves with a plan, and these are
 * the lines that cost the least to be wrong about.
 */
const FILLER_IDS = ['water', 'makeBed', 'oneThing', 'walk'];

/**
 * Which routine line survives when more of them match than the page can hold,
 * strongest answer first. Ranked by what it costs the user to lose the line,
 * not by the hour it happens: `CANDIDATES` is declared in day order, so cutting
 * from its end would drop the bedtime line first and hand someone sleeping
 * under five hours a plan with no wind-down on it.
 */
const PRIORITY_IDS = [
  'windDown',
  'outOfBed',
  'happyThing',
  'oneThing',
  'phoneAway',
  'walk',
  'errand',
  'stretch',
  'makeBed',
  'water',
];

function priorityOf(id: string): number {
  const rank = PRIORITY_IDS.indexOf(id);
  return rank === -1 ? PRIORITY_IDS.length : rank;
}

/**
 * Goal lines are taken first and the routine lines fill what is left, strongest
 * answer first. So the cap can only ever cost someone a line they implied
 * faintly — never the goal they asked for outright, and never the wind-down of
 * someone who told us they barely sleep.
 */
export function buildStarterPlan(answers: StarterPlanAnswers): StarterPlanItem[] {
  const goalItems = (
    answers.intent == null ? [] : GOAL_ITEMS[answers.intent]
  ).map((item) => ({ ...item }));
  const routineSlots = MAX_ITEMS - goalItems.length;

  const picked = new Set(
    CANDIDATES.filter((candidate) => candidate.matches(answers)).map(
      (candidate) => candidate.id,
    ),
  );

  for (const id of FILLER_IDS) {
    if (picked.size + goalItems.length >= MIN_ITEMS) break;
    picked.add(id);
  }

  const routineItems = CANDIDATES.filter((candidate) => picked.has(candidate.id))
    .sort((a, b) => priorityOf(a.id) - priorityOf(b.id))
    .slice(0, Math.max(0, routineSlots))
    .map(({ matches, ...item }) => item);

  const items = [...goalItems, ...routineItems].sort(
    (a, b) => DAYPART_ORDER.indexOf(a.daypart) - DAYPART_ORDER.indexOf(b.daypart),
  );

  return items;
}

/**
 * The plan as the to-do list stores it. Everything repeats daily — a starter
 * plan is a routine, and a one-off would leave the list empty tomorrow — and
 * each line carries the hour its part of the day stands for, so the list opens
 * already ordered like a day.
 */
export function starterPlanDrafts(
  items: StarterPlanItem[],
  excludedIds: string[],
): SelfCareGoalDraft[] {
  return items
    .filter((item) => !excludedIds.includes(item.id))
    .map((item) => ({
      title: item.title,
      icon: item.icon,
      recurrence: 'daily' as const,
      scheduledTime: selfCareGoalDaypartTime(item.daypart),
    }));
}
