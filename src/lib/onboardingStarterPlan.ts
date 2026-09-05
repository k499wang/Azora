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
 * Seven lines is what fits on the page before it stops looking like a start and
 * begins looking like a workload, and four is the fewest that reads as a plan.
 */
const MAX_ITEMS = 7;
const MIN_ITEMS = 4;

/**
 * Declared in the order a day happens, which is the order they are shown: the
 * filter preserves it, so the page reads morning to bedtime without sorting.
 */
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
    title: 'Work one stretch with the phone in another room',
    icon: 'timer',
    accent: colors.playful.night.base,
    daypart: 'afternoon',
    matches: (answers) => answers.procrastinationReasons.includes('focus'),
  },
  {
    id: 'walk',
    title: 'Walk for fifteen minutes',
    icon: 'heart-pulse',
    accent: colors.playful.coral.base,
    daypart: 'afternoon',
    matches: (answers) =>
      answers.dayActivity === 'sitting' ||
      answers.procrastinationAreas.includes('movement'),
  },
  {
    id: 'stretch',
    title: 'Take a stretch break',
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
    title: 'Do one thing that makes me happy',
    icon: 'face-happy',
    accent: colors.playful.blush.base,
    daypart: 'evening',
    matches: (answers) => answers.mentalHealth.some((id) => id !== 'none'),
  },
  {
    id: 'windDown',
    title: 'Start winding down thirty minutes before bed',
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
 * The one line every plan ends on. It is the app's own promise in to-do form,
 * so it is not conditional and it is not subject to the cap — a starter plan
 * that could come back without a reset on it would be someone else's list.
 *
 * Placed at the end of the day as well as the end of the page: the list is
 * ordered by the hour each line carries, so an earlier daypart here would show
 * the plan in one order on paper and another on the to-do list.
 */
const RESET_ITEM: StarterPlanItem = {
  id: 'reset',
  title: 'Take 3 deep breaths',
  icon: 'breath-leaf',
  accent: colors.playful.teal.base,
  daypart: 'bedtime',
};

/**
 * Topped up in this order when the answers matched too little to fill a page —
 * someone who reports a steady routine still leaves with a plan, and these are
 * the lines that cost the least to be wrong about.
 */
const FILLER_IDS = ['water', 'makeBed', 'oneThing', 'walk'];

export function buildStarterPlan(answers: StarterPlanAnswers): StarterPlanItem[] {
  const picked = new Set(
    CANDIDATES.filter((candidate) => candidate.matches(answers)).map(
      (candidate) => candidate.id,
    ),
  );

  for (const id of FILLER_IDS) {
    if (picked.size >= MIN_ITEMS - 1) break;
    picked.add(id);
  }

  const items = CANDIDATES.filter((candidate) => picked.has(candidate.id))
    .slice(0, MAX_ITEMS - 1)
    .map(({ matches, ...item }) => item);

  return [...items, RESET_ITEM];
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
