import { selfCareGoalCoins, selfCareGoalRecurrenceLabel, type SelfCareGoal } from '../features/selfCare/domain/selfCareGoal';
import { ROUTINE_TEMPLATES, type RoutineLibraryId, type RoutineTemplate } from './routineLibrary';

export type RoutineShelfId = 'home' | 'morning' | 'work' | 'evening' | 'support';

export interface RoutineShelf {
  id: RoutineShelfId;
  label: string;
  shortLabel: string;
  routineIds: readonly RoutineLibraryId[];
  categoryIds: readonly string[];
  /** Heading over the category rows on the shelf's own screen, when it also has routines. */
  categoriesTitle: string | null;
}

export const ROUTINE_SHELVES: readonly RoutineShelf[] = [
  {
    id: 'home', label: 'Keep your home tidy', shortLabel: 'Home',
    routineIds: [
      'kitchen-close', 'small-clean', 'clutter-hot-spots', 'clutter-sweep',
      'laundry-day', 'whole-home-hour', 'weekly-home-reset',
      'fridge-clear-out', 'bathroom-wipe-down',
    ],
    categoryIds: ['kitchen', 'bathroom', 'bedroom-laundry', 'living-entry'],
    categoriesTitle: 'Daily habits by room',
  },
  {
    id: 'morning', label: 'Start your morning well', shortLabel: 'Morning',
    routineIds: ['morning-reset', 'get-ready', 'slow-morning', 'phone-free-morning', 'morning-movement', 'tidy-before-leaving'],
    categoryIds: [],
    categoriesTitle: null,
  },
  {
    id: 'work', label: 'Focus and finish your work', shortLabel: 'Work',
    routineIds: ['focus-reset', 'midday-pause', 'workday-shutdown', 'deep-work-block', 'inbox-clear', 'study-session'],
    categoryIds: [],
    categoriesTitle: null,
  },
  {
    id: 'evening', label: 'Wind down and sleep better', shortLabel: 'Evening',
    routineIds: ['evening-wind-down', 'bedtime-routine', 'phone-down', 'tomorrow-setup', 'evening-shower', 'read-before-bed'],
    categoryIds: [],
    categoriesTitle: null,
  },
  {
    id: 'support', label: 'Support for how you feel', shortLabel: 'Support',
    routineIds: ['low-energy-day', 'overwhelmed-reset', 'anxious-moment'],
    categoryIds: ['adhd', 'anxiety', 'depression'],
    categoriesTitle: 'Daily habits',
  },
];

export function routineShelfTemplates(shelf: RoutineShelf): RoutineTemplate[] {
  return shelf.routineIds.flatMap((id) => ROUTINE_TEMPLATES.filter((entry) => entry.id === id));
}

export function routineFacts(routine: Pick<RoutineTemplate, 'tasks'>) {
  const count = routine.tasks.length;
  const total = routine.tasks.reduce((sum, task) => sum + task.durationMinutes, 0);
  return {
    steps: `${count} ${count === 1 ? 'step' : 'steps'}`,
    minutes: `${total} min`,
    repeat: selfCareGoalRecurrenceLabel(routine.tasks[0].recurrence),
    coins: routine.tasks.reduce((sum, task) => sum + selfCareGoalCoins(task.recurrence), 0),
  };
}

/** A routine counts as added once every one of its tasks is on the person's list. */
export function isRoutineAdded(
  routine: Pick<RoutineTemplate, 'tasks'>,
  goals: readonly Pick<SelfCareGoal, 'title' | 'recurrence'>[],
): boolean {
  const identity = (item: { title: string; recurrence: string }) =>
    `${item.title.trim().toLowerCase()}|${item.recurrence}`;
  const onList = new Set(goals.map(identity));
  return routine.tasks.every((task) => onList.has(identity(task)));
}
