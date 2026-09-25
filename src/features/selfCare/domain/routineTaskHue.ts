import type { IconName } from '../../../components/common/icons/Icon';

export type RoutineTaskHue = 'teal' | 'coral' | 'amber' | 'violet' | 'sky';

/**
 * A to-do stores only its icon, so the icon is what decides its colour. Grouped
 * by what the line is about rather than spread evenly, so a morning routine
 * reads warm and a wind-down reads violet instead of a list of random swatches.
 */
const HUE_GROUPS: Record<RoutineTaskHue, IconName[]> = {
  teal: [
    'lotus', 'yoga', 'meditation', 'lungs', 'breath-leaf', 'breath-wave',
    'breath-timer', 'waves', 'wind', 'weather-windy', 'snowflake', 'face-calm',
    'mood-anxious', 'mood-overwhelmed', 'todo-breath', 'todo-grounding',
    'todo-fresh-air', 'todo-surface', 'todo-storage', 'todo-broom', 'todo-shoes',
    'todo-tidy', 'todo-pack',
  ],
  coral: [
    'heart', 'walk', 'dumbbell', 'arrow-up', 'stethoscope', 'profile', 'camera',
    'message', 'todo-message', 'todo-meal', 'todo-dishes', 'todo-counter',
    'todo-stovetop', 'todo-cabinet', 'todo-fridge',
  ],
  amber: [
    'sun', 'sunrise', 'coffee-outline', 'sparkle', 'star', 'trophy',
    'celebration', 'laurel', 'streak', 'face-happy', 'mood-low-energy',
    'todo-curtains',
  ],
  violet: [
    'moon', 'bed-clock', 'book', 'journal', 'pencil', 'flask', 'mood-low-mood',
    'mood-focus', 'todo-plan', 'todo-priorities', 'todo-focus-timer',
    'todo-worry-note', 'todo-screen-free', 'todo-bed', 'todo-bedside',
    'todo-washer', 'todo-fold', 'todo-hamper',
  ],
  sky: [
    'home', 'bell', 'clock', 'timer', 'calendar', 'calendar-check-outline',
    'todo-mail', 'todo-water', 'todo-shower', 'todo-sink', 'todo-mirror',
    'todo-towel', 'todo-toilet', 'todo-toilet-paper',
  ],
};

export const ROUTINE_TASK_HUES = new Map<IconName, RoutineTaskHue>(
  (Object.entries(HUE_GROUPS) as Array<[RoutineTaskHue, IconName[]]>).flatMap(
    ([hue, icons]) => icons.map((icon) => [icon, hue] as const),
  ),
);

export function routineTaskHue(icon: IconName): RoutineTaskHue {
  return ROUTINE_TASK_HUES.get(icon) ?? 'sky';
}
