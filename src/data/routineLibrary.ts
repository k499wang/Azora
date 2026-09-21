import type { IconName } from '../components/common/icons/Icon';
import type { SelfCareGoalRecurrence } from '../features/selfCare/domain/selfCareGoal';
import type { SelfCareGoalDraft } from '../services/selfCare/selfCareService';

export type RoutineLibraryId =
  | 'morning-reset'
  | 'focus-reset'
  | 'evening-wind-down'
  | 'bedtime-routine'
  | 'weekly-home-reset'
  | 'small-clean'
  | 'house-cleaning';

export type RoutineLibraryTone = 'sky' | 'teal' | 'amber' | 'violet' | 'coral';

export interface RoutineTemplateTask {
  id: string;
  title: string;
  icon: IconName;
  scheduledTime: string;
  recurrence: SelfCareGoalRecurrence;
}

interface RoutineLibraryBase {
  id: RoutineLibraryId;
  title: string;
  eyebrow: string;
  description: string;
  icon: IconName;
  tone: RoutineLibraryTone;
}

export interface RoutineTemplate extends RoutineLibraryBase {
  kind: 'template';
  tasks: readonly RoutineTemplateTask[];
}

export interface RoutinePdfResource extends RoutineLibraryBase {
  kind: 'pdf';
  sourceNote: string;
}

export type RoutineLibraryEntry = RoutineTemplate | RoutinePdfResource;

/** Curated Explore content. A PDF guide remains a resource, never a to-do. */
export const ROUTINE_LIBRARY: readonly RoutineLibraryEntry[] = [
  {
    id: 'morning-reset', kind: 'template', title: 'Morning reset',
    eyebrow: 'A gentle start',
    description: 'Three small anchors before the day starts asking things of you.',
    icon: 'sunrise', tone: 'amber',
    tasks: [
      { id: 'make-bed', title: 'Make the bed', icon: 'home', scheduledTime: '07:00', recurrence: 'daily' },
      { id: 'drink-water', title: 'Drink a glass of water', icon: 'waves', scheduledTime: '07:00', recurrence: 'daily' },
      { id: 'daylight', title: 'Get a little daylight', icon: 'sun', scheduledTime: '07:00', recurrence: 'daily' },
    ],
  },
  {
    id: 'focus-reset', kind: 'template', title: 'Focus reset',
    eyebrow: 'Make room to think',
    description: 'A short setup for one calmer, more intentional work block.',
    icon: 'timer', tone: 'sky',
    tasks: [
      { id: 'priority', title: 'Choose one priority', icon: 'pencil', scheduledTime: '07:00', recurrence: 'daily' },
      { id: 'phone-away', title: 'Put your phone away', icon: 'bell', scheduledTime: '07:00', recurrence: 'daily' },
      { id: 'reset-break', title: 'Take a short reset break', icon: 'wind', scheduledTime: '13:00', recurrence: 'daily' },
    ],
  },
  {
    id: 'evening-wind-down', kind: 'template', title: 'Evening wind-down',
    eyebrow: 'Close the day softly',
    description: 'A small landing ritual for a room and mind that can rest.',
    icon: 'moon', tone: 'violet',
    tasks: [
      { id: 'tidy-surface', title: 'Tidy one surface', icon: 'sparkle', scheduledTime: '18:00', recurrence: 'daily' },
      { id: 'tomorrow', title: 'Set out tomorrow’s essentials', icon: 'home', scheduledTime: '18:00', recurrence: 'daily' },
      { id: 'screen-free', title: 'Take a screen-free moment', icon: 'book', scheduledTime: '18:00', recurrence: 'daily' },
    ],
  },
  {
    id: 'bedtime-routine', kind: 'template', title: 'Bedtime routine',
    eyebrow: 'A softer landing',
    description: 'A gentle sequence for closing the day without overthinking it.',
    icon: 'moon', tone: 'violet',
    tasks: [
      { id: 'tidy-workspace', title: 'Clean up the workspace', icon: 'sparkle', scheduledTime: '18:00', recurrence: 'daily' },
      { id: 'brush-teeth', title: 'Brush teeth and wash face', icon: 'waves', scheduledTime: '21:00', recurrence: 'daily' },
      { id: 'skincare', title: 'Apply skincare routine', icon: 'sparkle', scheduledTime: '21:00', recurrence: 'daily' },
      { id: 'pajamas', title: 'Change into pajamas', icon: 'bed-clock', scheduledTime: '21:00', recurrence: 'daily' },
      { id: 'tomorrow-list', title: 'Write tomorrow’s to-do list', icon: 'pencil', scheduledTime: '21:00', recurrence: 'daily' },
      { id: 'journal', title: 'Journal for a moment', icon: 'book', scheduledTime: '21:00', recurrence: 'daily' },
    ],
  },
  {
    id: 'weekly-home-reset', kind: 'template', title: 'Weekly home reset',
    eyebrow: 'Make the week easier',
    description: 'A light reset that keeps the practical things from piling up.',
    icon: 'calendar', tone: 'teal',
    tasks: [
      { id: 'choose-room', title: 'Choose one room to reset', icon: 'home', scheduledTime: '13:00', recurrence: 'weekly' },
      { id: 'laundry', title: 'Do one load of laundry', icon: 'bed-clock', scheduledTime: '13:00', recurrence: 'weekly' },
      { id: 'plan-week', title: 'Plan the week ahead', icon: 'calendar', scheduledTime: '13:00', recurrence: 'weekly' },
    ],
  },
  {
    id: 'small-clean', kind: 'template', title: 'Little clean',
    eyebrow: 'When you have ten minutes',
    description: 'Pick a few visible wins and leave the room easier than you found it.',
    icon: 'sparkle', tone: 'coral',
    tasks: [
      { id: 'dishes', title: 'Handle the dishes', icon: 'waves', scheduledTime: '18:00', recurrence: 'daily' },
      { id: 'clutter', title: 'Put away five things', icon: 'home', scheduledTime: '18:00', recurrence: 'daily' },
      { id: 'surfaces', title: 'Wipe one high-use surface', icon: 'sparkle', scheduledTime: '18:00', recurrence: 'daily' },
    ],
  },
  {
    id: 'house-cleaning', kind: 'pdf', title: 'House cleaning checklist',
    eyebrow: 'Home-care guide',
    description: 'A printable schedule for daily, weekly, monthly, and seasonal home care.',
    sourceNote: 'Your House Cleaning Checklist PDF, available to preview or save.',
    icon: 'home', tone: 'teal',
  },
];

export const ROUTINE_TEMPLATES = ROUTINE_LIBRARY.filter(
  (entry): entry is RoutineTemplate => entry.kind === 'template',
);

export const HOME_CARE_GUIDES = ROUTINE_LIBRARY.filter(
  (entry): entry is RoutinePdfResource => entry.kind === 'pdf',
);

export function getRoutineLibraryEntry(id: RoutineLibraryId) {
  return ROUTINE_LIBRARY.find((entry) => entry.id === id) ?? null;
}

export function routineTemplateDrafts(
  tasks: readonly RoutineTemplateTask[],
): SelfCareGoalDraft[] {
  return tasks.map((task) => ({
    title: task.title,
    icon: task.icon,
    recurrence: task.recurrence,
    scheduledTime: task.scheduledTime,
  }));
}
