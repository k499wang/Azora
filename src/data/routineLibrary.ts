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
  | 'get-ready'
  | 'midday-pause'
  | 'workday-shutdown'
  | 'kitchen-close'
  | 'clutter-hot-spots'
  | 'clutter-sweep'
  | 'laundry-day'
  | 'whole-home-hour'
  | 'slow-morning'
  | 'phone-free-morning'
  | 'morning-movement'
  | 'tidy-before-leaving'
  | 'deep-work-block'
  | 'inbox-clear'
  | 'study-session'
  | 'phone-down'
  | 'tomorrow-setup'
  | 'evening-shower'
  | 'read-before-bed'
  | 'fridge-clear-out'
  | 'bathroom-wipe-down'
  | 'low-energy-day'
  | 'overwhelmed-reset'
  | 'anxious-moment'
  | 'house-cleaning';

export type RoutineLibraryTone = 'sky' | 'teal' | 'amber' | 'violet' | 'coral';

export interface RoutineTemplateTask {
  id: string;
  title: string;
  icon: IconName;
  scheduledTime: string;
  recurrence: SelfCareGoalRecurrence;
  durationMinutes: number;
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
      { id: 'make-bed', title: 'Make the bed', icon: 'home', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 2 },
      { id: 'drink-water', title: 'Drink a glass of water', icon: 'waves', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 2 },
      { id: 'daylight', title: 'Get a little daylight', icon: 'sun', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 10 },
    ],
  },
  {
    id: 'focus-reset', kind: 'template', title: 'Focus reset',
    eyebrow: 'Make room to think',
    description: 'A short setup for one calmer, more intentional work block.',
    icon: 'timer', tone: 'sky',
    tasks: [
      { id: 'priority', title: 'Choose one priority', icon: 'pencil', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'phone-away', title: 'Put your phone away', icon: 'bell', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 2 },
      { id: 'reset-break', title: 'Take a short reset break', icon: 'wind', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 5 },
    ],
  },
  {
    id: 'evening-wind-down', kind: 'template', title: 'Evening wind-down',
    eyebrow: 'Close the day softly',
    description: 'A small landing ritual for a room and mind that can rest.',
    icon: 'moon', tone: 'violet',
    tasks: [
      { id: 'tidy-surface', title: 'Tidy one surface', icon: 'sparkle', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'tomorrow', title: 'Set out tomorrow’s essentials', icon: 'home', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'screen-free', title: 'Take a screen-free moment', icon: 'book', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 10 },
    ],
  },
  {
    id: 'bedtime-routine', kind: 'template', title: 'Bedtime routine',
    eyebrow: 'A softer landing',
    description: 'A gentle sequence for closing the day without overthinking it.',
    icon: 'moon', tone: 'violet',
    tasks: [
      { id: 'tidy-workspace', title: 'Clean up the workspace', icon: 'sparkle', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'brush-teeth', title: 'Brush teeth and wash face', icon: 'waves', scheduledTime: '21:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'skincare', title: 'Apply skincare routine', icon: 'sparkle', scheduledTime: '21:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'pajamas', title: 'Change into pajamas', icon: 'bed-clock', scheduledTime: '21:00', recurrence: 'daily', durationMinutes: 2 },
      { id: 'tomorrow-list', title: 'Write tomorrow’s to-do list', icon: 'pencil', scheduledTime: '21:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'journal', title: 'Journal for a moment', icon: 'book', scheduledTime: '21:00', recurrence: 'daily', durationMinutes: 10 },
    ],
  },
  {
    id: 'weekly-home-reset', kind: 'template', title: 'Weekly home reset',
    eyebrow: 'Make the week easier',
    description: 'A light reset that keeps the practical things from piling up.',
    icon: 'calendar', tone: 'teal',
    tasks: [
      { id: 'choose-room', title: 'Choose one room to reset', icon: 'home', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 15 },
      { id: 'laundry', title: 'Do one load of laundry', icon: 'bed-clock', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 15 },
      { id: 'plan-week', title: 'Plan the week ahead', icon: 'calendar', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 15 },
    ],
  },
  {
    id: 'small-clean', kind: 'template', title: 'Little clean',
    eyebrow: 'When you have ten minutes',
    description: 'Pick a few visible wins and leave the room easier than you found it.',
    icon: 'sparkle', tone: 'coral',
    tasks: [
      { id: 'dishes', title: 'Handle the dishes', icon: 'waves', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 10 },
      { id: 'clutter', title: 'Put away five things', icon: 'home', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'surfaces', title: 'Wipe one high-use surface', icon: 'sparkle', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 5 },
    ],
  },
  {
    id: 'get-ready', kind: 'template', title: 'Get ready',
    eyebrow: 'Out of pajamas and out the door',
    description: 'Dressed, fed, and ready before the day gets going.',
    icon: 'todo-shower', tone: 'sky',
    tasks: [
      { id: 'dressed', title: 'Get dressed, shoes and all', icon: 'todo-shoes', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'wash-face', title: 'Wash my face and brush my teeth', icon: 'todo-sink', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'breakfast', title: 'Eat something for breakfast', icon: 'todo-meal', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 10 },
      { id: 'bag', title: 'Pack what I need today', icon: 'todo-pack', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 3 },
    ],
  },
  {
    id: 'midday-pause', kind: 'template', title: 'Midday pause',
    eyebrow: 'A break in the middle',
    description: 'Stop for a moment so the afternoon does not run on empty.',
    icon: 'coffee-outline', tone: 'amber',
    tasks: [
      { id: 'lunch', title: 'Eat a real lunch', icon: 'todo-meal', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 20 },
      { id: 'water', title: 'Refill my water', icon: 'todo-water', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 1 },
      { id: 'outside', title: 'Step outside for some air', icon: 'todo-fresh-air', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'next-thing', title: 'Choose the next thing to do', icon: 'todo-priorities', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 2 },
    ],
  },
  {
    id: 'workday-shutdown', kind: 'template', title: 'Workday shutdown',
    eyebrow: 'Leave work at work',
    description: 'Close the day properly so it stays closed.',
    icon: 'todo-plan', tone: 'violet',
    tasks: [
      { id: 'tomorrow-top', title: 'Write tomorrow’s top three', icon: 'todo-priorities', scheduledTime: '18:00', recurrence: 'weekdays', durationMinutes: 5 },
      { id: 'clear-desk', title: 'Clear my desk', icon: 'todo-surface', scheduledTime: '18:00', recurrence: 'weekdays', durationMinutes: 5 },
      { id: 'messages', title: 'Answer what cannot wait', icon: 'todo-message', scheduledTime: '18:00', recurrence: 'weekdays', durationMinutes: 10 },
      { id: 'screens-off', title: 'Close my work apps', icon: 'todo-screen-free', scheduledTime: '18:00', recurrence: 'weekdays', durationMinutes: 1 },
    ],
  },
  {
    id: 'kitchen-close', kind: 'template', title: 'Kitchen close',
    eyebrow: 'Wake up to a clean kitchen',
    description: 'Shut the kitchen down at night so tomorrow starts easier.',
    icon: 'todo-sink', tone: 'teal',
    tasks: [
      { id: 'do-dishes', title: 'Wash or load the dishes', icon: 'todo-dishes', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 10 },
      { id: 'wipe-counters', title: 'Wipe the counters and stovetop', icon: 'todo-counter', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'shine-sink', title: 'Shine the sink', icon: 'todo-sink', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 2 },
      { id: 'trash', title: 'Take out the trash if it is full', icon: 'todo-tidy', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 2 },
    ],
  },
  {
    id: 'clutter-hot-spots', kind: 'template', title: 'Clutter hot spots',
    eyebrow: 'Two minutes each',
    description: 'Clear the spots where clutter lands first, before they spread.',
    icon: 'todo-surface', tone: 'coral',
    tasks: [
      { id: 'hot-table', title: 'Clear the table', icon: 'todo-surface', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 2 },
      { id: 'hot-counter', title: 'Clear the kitchen counter', icon: 'todo-counter', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 2 },
      { id: 'hot-couch', title: 'Clear the couch', icon: 'todo-storage', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 2 },
      { id: 'hot-entry', title: 'Clear the entryway', icon: 'todo-shoes', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 2 },
    ],
  },
  {
    id: 'clutter-sweep', kind: 'template', title: 'Clutter sweep',
    eyebrow: 'Fill a bag, fast',
    description: 'Walk through the home with a bag and let things go without overthinking.',
    icon: 'todo-storage', tone: 'coral',
    tasks: [
      { id: 'toss', title: 'Bag 15 things to throw out', icon: 'todo-tidy', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 10 },
      { id: 'donate', title: 'Bag 15 things to donate', icon: 'todo-fold', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 10 },
      { id: 'door', title: 'Put the donation bag by the door', icon: 'todo-shoes', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 1 },
    ],
  },
  {
    id: 'laundry-day', kind: 'template', title: 'Laundry day',
    eyebrow: 'Start to put away',
    description: 'Take one load all the way through, not just into the washer.',
    icon: 'todo-washer', tone: 'sky',
    tasks: [
      { id: 'sort', title: 'Sort one load', icon: 'todo-hamper', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 3 },
      { id: 'start', title: 'Start the washer', icon: 'todo-washer', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 2 },
      { id: 'dry', title: 'Move it to the dryer or rack', icon: 'todo-towel', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 3 },
      { id: 'fold', title: 'Fold it', icon: 'todo-fold', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 10 },
      { id: 'away', title: 'Put it away', icon: 'todo-cabinet', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 5 },
    ],
  },
  {
    id: 'whole-home-hour', kind: 'template', title: 'Whole-home hour',
    eyebrow: 'One hour, once a week',
    description: 'Seven quick jobs that keep the whole home looking cared for. Stop when the time is up.',
    icon: 'home', tone: 'violet',
    tasks: [
      { id: 'vacuum', title: 'Vacuum the main rooms', icon: 'todo-broom', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 10 },
      { id: 'dust', title: 'Dust the main surfaces', icon: 'todo-surface', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 10 },
      { id: 'mop', title: 'Mop the kitchen and bathroom', icon: 'todo-broom', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 10 },
      { id: 'mirrors', title: 'Wipe the mirrors and doors', icon: 'todo-mirror', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 10 },
      { id: 'magazines', title: 'Throw out old papers', icon: 'todo-mail', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 5 },
      { id: 'sheets', title: 'Change the sheets', icon: 'todo-bed', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 10 },
      { id: 'all-trash', title: 'Empty every trash can', icon: 'todo-tidy', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 5 },
    ],
  },
  {
    id: 'slow-morning', kind: 'template', title: 'Slow morning',
    eyebrow: 'Before the rush',
    description: 'Fifteen quiet minutes that belong to you.',
    icon: 'coffee-outline', tone: 'amber',
    tasks: [
      { id: 'slow-curtains', title: 'Open the curtains', icon: 'todo-curtains', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 1 },
      { id: 'slow-water', title: 'Drink a glass of water', icon: 'todo-water', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 2 },
      { id: 'slow-sit', title: 'Sit with something warm to drink', icon: 'todo-fresh-air', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 10 },
      { id: 'slow-plan', title: 'Look at today’s plan', icon: 'todo-plan', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 2 },
    ],
  },
  {
    id: 'phone-free-morning', kind: 'template', title: 'Phone-free morning',
    eyebrow: 'Your morning first',
    description: 'Give the first half hour to yourself before your phone gets it.',
    icon: 'todo-screen-free', tone: 'sky',
    tasks: [
      { id: 'pf-away', title: 'Leave my phone in another room', icon: 'todo-screen-free', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 1 },
      { id: 'pf-bed', title: 'Make my bed', icon: 'todo-bed', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 2 },
      { id: 'pf-shower', title: 'Take a shower', icon: 'todo-shower', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 10 },
      { id: 'pf-eat', title: 'Eat breakfast', icon: 'todo-meal', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 15 },
    ],
  },
  {
    id: 'morning-movement', kind: 'template', title: 'Morning movement',
    eyebrow: 'Wake your body up',
    description: 'A little movement before the day settles in.',
    icon: 'walk', tone: 'coral',
    tasks: [
      { id: 'mm-water', title: 'Drink some water', icon: 'todo-water', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 1 },
      { id: 'mm-stretch', title: 'Stretch for five minutes', icon: 'yoga', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'mm-walk', title: 'Take a short walk', icon: 'walk', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 15 },
      { id: 'mm-shower', title: 'Rinse off and get dressed', icon: 'todo-shower', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 10 },
    ],
  },
  {
    id: 'tidy-before-leaving', kind: 'template', title: 'Tidy before you go',
    eyebrow: 'Come home to calm',
    description: 'Ten small minutes now, and a nicer home to walk back into.',
    icon: 'todo-bedside', tone: 'teal',
    tasks: [
      { id: 'tbl-bed', title: 'Make the bed', icon: 'todo-bed', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 2 },
      { id: 'tbl-dishes', title: 'Put breakfast dishes away', icon: 'todo-dishes', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 3 },
      { id: 'tbl-counter', title: 'Wipe the counter', icon: 'todo-counter', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 2 },
      { id: 'tbl-bag', title: 'Check my keys and bag', icon: 'todo-pack', scheduledTime: '07:00', recurrence: 'daily', durationMinutes: 2 },
    ],
  },
  {
    id: 'deep-work-block', kind: 'template', title: 'Deep work block',
    eyebrow: 'One thing, done well',
    description: 'Clear the noise and give one job your full attention.',
    icon: 'todo-focus-timer', tone: 'violet',
    tasks: [
      { id: 'dw-one', title: 'Choose my one big task', icon: 'todo-priorities', scheduledTime: '07:00', recurrence: 'weekdays', durationMinutes: 3 },
      { id: 'dw-phone', title: 'Silence my phone', icon: 'todo-screen-free', scheduledTime: '07:00', recurrence: 'weekdays', durationMinutes: 1 },
      { id: 'dw-timer', title: 'Work for 45 minutes', icon: 'todo-focus-timer', scheduledTime: '07:00', recurrence: 'weekdays', durationMinutes: 45 },
      { id: 'dw-break', title: 'Take a real break', icon: 'todo-fresh-air', scheduledTime: '07:00', recurrence: 'weekdays', durationMinutes: 10 },
    ],
  },
  {
    id: 'inbox-clear', kind: 'template', title: 'Inbox clear',
    eyebrow: 'Get messages under control',
    description: 'Answer, sort, and stop thinking about them for today.',
    icon: 'todo-mail', tone: 'sky',
    tasks: [
      { id: 'ic-urgent', title: 'Answer anything urgent', icon: 'todo-message', scheduledTime: '13:00', recurrence: 'weekdays', durationMinutes: 10 },
      { id: 'ic-archive', title: 'Archive what I do not need', icon: 'todo-mail', scheduledTime: '13:00', recurrence: 'weekdays', durationMinutes: 5 },
      { id: 'ic-list', title: 'Add follow-ups to my list', icon: 'todo-plan', scheduledTime: '13:00', recurrence: 'weekdays', durationMinutes: 5 },
    ],
  },
  {
    id: 'study-session', kind: 'template', title: 'Study session',
    eyebrow: 'Make it stick',
    description: 'Short, focused study with the breaks built in.',
    icon: 'book', tone: 'amber',
    tasks: [
      { id: 'ss-goal', title: 'Choose what to study', icon: 'todo-priorities', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 2 },
      { id: 'ss-desk', title: 'Clear my desk', icon: 'todo-surface', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 3 },
      { id: 'ss-first', title: 'Study for 25 minutes', icon: 'todo-focus-timer', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 25 },
      { id: 'ss-break', title: 'Take a five-minute break', icon: 'todo-fresh-air', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'ss-second', title: 'Study for 25 more minutes', icon: 'todo-focus-timer', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 25 },
    ],
  },
  {
    id: 'phone-down', kind: 'template', title: 'Phone down',
    eyebrow: 'Give your brain a rest',
    description: 'Put the phone away early and let the night slow down.',
    icon: 'todo-screen-free', tone: 'violet',
    tasks: [
      { id: 'pd-charge', title: 'Plug my phone in across the room', icon: 'todo-screen-free', scheduledTime: '21:00', recurrence: 'daily', durationMinutes: 1 },
      { id: 'pd-alarm', title: 'Set my alarm for tomorrow', icon: 'clock', scheduledTime: '21:00', recurrence: 'daily', durationMinutes: 1 },
      { id: 'pd-book', title: 'Read a few pages', icon: 'book', scheduledTime: '21:00', recurrence: 'daily', durationMinutes: 15 },
    ],
  },
  {
    id: 'tomorrow-setup', kind: 'template', title: 'Tomorrow setup',
    eyebrow: 'Make tomorrow easier',
    description: 'Ten minutes tonight that your morning self will thank you for.',
    icon: 'todo-pack', tone: 'sky',
    tasks: [
      { id: 'ts-clothes', title: 'Lay out tomorrow’s clothes', icon: 'todo-fold', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 3 },
      { id: 'ts-bag', title: 'Pack my bag', icon: 'todo-pack', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 3 },
      { id: 'ts-top', title: 'Choose tomorrow’s top task', icon: 'todo-priorities', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 2 },
      { id: 'ts-lunch', title: 'Prepare my lunch', icon: 'todo-meal', scheduledTime: '18:00', recurrence: 'daily', durationMinutes: 10 },
    ],
  },
  {
    id: 'evening-shower', kind: 'template', title: 'Evening shower',
    eyebrow: 'Wash the day off',
    description: 'A warm shower and clean clothes to mark the end of the day.',
    icon: 'todo-shower', tone: 'teal',
    tasks: [
      { id: 'es-clothes', title: 'Put today’s clothes in the hamper', icon: 'todo-hamper', scheduledTime: '21:00', recurrence: 'daily', durationMinutes: 1 },
      { id: 'es-shower', title: 'Take a warm shower', icon: 'todo-shower', scheduledTime: '21:00', recurrence: 'daily', durationMinutes: 10 },
      { id: 'es-skin', title: 'Do my skincare', icon: 'todo-sink', scheduledTime: '21:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'es-pajamas', title: 'Put on clean pajamas', icon: 'todo-fold', scheduledTime: '21:00', recurrence: 'daily', durationMinutes: 2 },
    ],
  },
  {
    id: 'read-before-bed', kind: 'template', title: 'Read before bed',
    eyebrow: 'Off screens, into a story',
    description: 'A calmer way to finish the day than one more scroll.',
    icon: 'book', tone: 'amber',
    tasks: [
      { id: 'rb-dim', title: 'Dim the lights', icon: 'bed-clock', scheduledTime: '21:00', recurrence: 'daily', durationMinutes: 1 },
      { id: 'rb-tea', title: 'Make a warm drink', icon: 'coffee-outline', scheduledTime: '21:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'rb-read', title: 'Read for 20 minutes', icon: 'book', scheduledTime: '21:00', recurrence: 'daily', durationMinutes: 20 },
    ],
  },
  {
    id: 'fridge-clear-out', kind: 'template', title: 'Fridge clear-out',
    eyebrow: 'Know what you have',
    description: 'Clear out what has gone off and see what is left to eat.',
    icon: 'todo-fridge', tone: 'coral',
    tasks: [
      { id: 'fc-old', title: 'Throw out old food', icon: 'todo-fridge', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 5 },
      { id: 'fc-wipe', title: 'Wipe the shelves', icon: 'todo-counter', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 5 },
      { id: 'fc-sort', title: 'Put the rest back neatly', icon: 'todo-cabinet', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 5 },
      { id: 'fc-list', title: 'Write a shopping list', icon: 'todo-plan', scheduledTime: '13:00', recurrence: 'weekly', durationMinutes: 3 },
    ],
  },
  {
    id: 'bathroom-wipe-down', kind: 'template', title: 'Bathroom wipe-down',
    eyebrow: 'Ten-minute fresh start',
    description: 'A quick pass that keeps the bathroom from getting away from you.',
    icon: 'todo-toilet', tone: 'sky',
    tasks: [
      { id: 'bw-mirror', title: 'Wipe the mirror', icon: 'todo-mirror', scheduledTime: '18:00', recurrence: 'weekly', durationMinutes: 2 },
      { id: 'bw-sink', title: 'Wipe the bathroom sink', icon: 'todo-sink', scheduledTime: '18:00', recurrence: 'weekly', durationMinutes: 2 },
      { id: 'bw-toilet', title: 'Quickly clean the toilet', icon: 'todo-toilet', scheduledTime: '18:00', recurrence: 'weekly', durationMinutes: 3 },
      { id: 'bw-towel', title: 'Swap the hand towel', icon: 'todo-towel', scheduledTime: '18:00', recurrence: 'weekly', durationMinutes: 1 },
    ],
  },
  {
    id: 'low-energy-day', kind: 'template', title: 'Low-energy day',
    eyebrow: 'When today feels heavy',
    description: 'Only the basics today. That still counts.',
    icon: 'todo-water', tone: 'violet',
    tasks: [
      { id: 'le-water', title: 'Drink a glass of water', icon: 'todo-water', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 1 },
      { id: 'le-eat', title: 'Eat something easy', icon: 'todo-meal', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 10 },
      { id: 'le-wash', title: 'Wash my face', icon: 'todo-sink', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 2 },
      { id: 'le-one', title: 'Do one small thing', icon: 'todo-priorities', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 5 },
    ],
  },
  {
    id: 'overwhelmed-reset', kind: 'template', title: 'Overwhelmed reset',
    eyebrow: 'When it is all too much',
    description: 'Get it out of your head, then choose one thing.',
    icon: 'todo-worry-note', tone: 'sky',
    tasks: [
      { id: 'ov-dump', title: 'Write down everything on my mind', icon: 'todo-worry-note', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 5 },
      { id: 'ov-one', title: 'Circle one thing to do next', icon: 'todo-priorities', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 1 },
      { id: 'ov-timer', title: 'Work on it for 10 minutes', icon: 'todo-focus-timer', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 10 },
    ],
  },
  {
    id: 'anxious-moment', kind: 'template', title: 'Anxious moment',
    eyebrow: 'Come back to the room',
    description: 'A few small steps for when your thoughts are racing.',
    icon: 'todo-grounding', tone: 'teal',
    tasks: [
      { id: 'am-breaths', title: 'Take three slow breaths', icon: 'todo-breath', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 1 },
      { id: 'am-ground', title: 'Name five things I can see', icon: 'todo-grounding', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 2 },
      { id: 'am-air', title: 'Step outside for some air', icon: 'todo-fresh-air', scheduledTime: '13:00', recurrence: 'daily', durationMinutes: 5 },
    ],
  },
  {
    id: 'house-cleaning', kind: 'pdf', title: 'Cleaning checklist',
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
    durationMinutes: task.durationMinutes,
  }));
}
