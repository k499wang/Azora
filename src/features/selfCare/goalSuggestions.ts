import type { IconName } from '../../components/common/icons/Icon';
import type { SelfCareGoalRecurrence } from './domain/selfCareGoal';

export interface GoalSuggestion {
  icon: IconName;
  title: string;
  recurrence: SelfCareGoalRecurrence;
  /** A representative daypart, stored as the normal goal time. */
  scheduledTime: string;
}

export interface GoalSuggestionCategory {
  id: string;
  label: string;
  description: string;
  icon: IconName;
  suggestions: GoalSuggestion[];
}

/**
 * The icons a to-do can wear. Deliberately a shortlist rather than the app's
 * whole set: stat marks, brand logos and research glyphs mean nothing on a
 * personal to-do, and a picker you can read in one glance beats a complete one.
 *
 * It has to cover every icon the starter plan writes, or a to-do onboarding
 * handed the user would wear a picture they cannot pick again after editing it.
 */
export const GOAL_ICON_CHOICES: IconName[] = [
  'sparkle', 'star', 'heart', 'sun', 'sunrise', 'moon', 'weather-windy',
  'waves', 'wind', 'snowflake', 'lotus', 'yoga', 'meditation', 'lungs',
  'walk', 'dumbbell', 'arrow-up', 'stethoscope', 'breath-leaf', 'breath-wave',
  'breath-timer', 'book', 'journal', 'pencil', 'message', 'bell', 'clock',
  'timer', 'calendar', 'calendar-check-outline', 'bed-clock', 'coffee-outline',
  'home', 'profile', 'camera', 'trophy', 'celebration', 'laurel', 'flask',
  'face-happy', 'face-calm', 'mood-anxious', 'mood-focus', 'mood-low-energy',
  'mood-low-mood', 'mood-overwhelmed', 'streak',
  'todo-plan', 'todo-priorities', 'todo-focus-timer', 'todo-tidy', 'todo-pack',
  'todo-dishes', 'todo-counter', 'todo-stovetop', 'todo-cabinet', 'todo-fridge',
  'todo-sink', 'todo-mirror', 'todo-towel', 'todo-toilet', 'todo-toilet-paper',
  'todo-bed', 'todo-bedside', 'todo-washer', 'todo-fold', 'todo-hamper',
  'todo-surface', 'todo-storage', 'todo-broom', 'todo-shoes', 'todo-mail',
  'todo-breath', 'todo-grounding', 'todo-fresh-air', 'todo-worry-note', 'todo-screen-free',
  'todo-curtains', 'todo-water', 'todo-shower', 'todo-meal', 'todo-message',
];

/**
 * The starting shelf for the routine browser. Every line is written the way a
 * user would write it for themselves — small, finishable today, and phrased as
 * the thing to do rather than the habit to become. The mental-health-focused
 * shelves offer supportive actions, not treatment or medical advice.
 */
export const GOAL_SUGGESTION_CATEGORIES: GoalSuggestionCategory[] = [
  {
    id: 'adhd',
    label: 'ADHD',
    description: 'Small cues and clear next steps to make starting easier.',
    icon: 'mood-focus',
    suggestions: [
      { icon: 'todo-plan', title: 'Check today’s plan', recurrence: 'daily', scheduledTime: '07:00' },
      { icon: 'todo-priorities', title: 'Choose my top three tasks', recurrence: 'daily', scheduledTime: '07:00' },
      { icon: 'todo-focus-timer', title: 'Start a 10-minute focus timer', recurrence: 'daily', scheduledTime: '13:00' },
      { icon: 'todo-tidy', title: 'Put one thing back in its place', recurrence: 'daily', scheduledTime: '18:00' },
      { icon: 'todo-pack', title: 'Set out what I need tomorrow', recurrence: 'daily', scheduledTime: '21:00' },
    ],
  },
  {
    id: 'kitchen',
    label: 'Kitchen reset',
    description: 'Small after-meal resets that make the next meal easier.',
    icon: 'coffee-outline',
    suggestions: [
      { icon: 'todo-dishes', title: 'Do the dishes', recurrence: 'daily', scheduledTime: '18:00' },
      { icon: 'todo-counter', title: 'Wipe down the kitchen counter', recurrence: 'daily', scheduledTime: '18:00' },
      { icon: 'todo-stovetop', title: 'Wipe down the stovetop', recurrence: 'daily', scheduledTime: '18:00' },
      { icon: 'todo-cabinet', title: 'Put away clean dishes', recurrence: 'daily', scheduledTime: '13:00' },
      { icon: 'todo-fridge', title: 'Check the fridge for leftovers', recurrence: 'daily', scheduledTime: '18:00' },
    ],
  },
  {
    id: 'bathroom',
    label: 'Bathroom reset',
    description: 'Quick essentials to keep the room comfortable and ready.',
    icon: 'waves',
    suggestions: [
      { icon: 'todo-sink', title: 'Wipe down the bathroom sink', recurrence: 'daily', scheduledTime: '07:00' },
      { icon: 'todo-mirror', title: 'Wipe the mirror', recurrence: 'daily', scheduledTime: '07:00' },
      { icon: 'todo-towel', title: 'Hang up the hand towel', recurrence: 'daily', scheduledTime: '18:00' },
      { icon: 'todo-toilet', title: 'Quickly clean the toilet', recurrence: 'daily', scheduledTime: '18:00' },
      { icon: 'todo-toilet-paper', title: 'Check the toilet paper', recurrence: 'daily', scheduledTime: '18:00' },
    ],
  },
  {
    id: 'bedroom-laundry',
    label: 'Bedroom & laundry',
    description: 'A calmer start and a softer landing at the end of the day.',
    icon: 'bed-clock',
    suggestions: [
      { icon: 'todo-bed', title: 'Make the bed', recurrence: 'daily', scheduledTime: '07:00' },
      { icon: 'todo-bedside', title: 'Clear the bedside table', recurrence: 'daily', scheduledTime: '07:00' },
      { icon: 'todo-washer', title: 'Put in one load of laundry', recurrence: 'daily', scheduledTime: '13:00' },
      { icon: 'todo-fold', title: 'Put away clean laundry', recurrence: 'daily', scheduledTime: '15:00' },
      { icon: 'todo-hamper', title: 'Put clothes in the hamper', recurrence: 'daily', scheduledTime: '21:00' },
    ],
  },
  {
    id: 'living-entry',
    label: 'Living space & entry',
    description: 'Five-minute resets for the rooms you see and use most.',
    icon: 'home',
    suggestions: [
      { icon: 'todo-surface', title: 'Reset one surface for five minutes', recurrence: 'daily', scheduledTime: '18:00' },
      { icon: 'todo-storage', title: 'Put away five things', recurrence: 'daily', scheduledTime: '18:00' },
      { icon: 'todo-broom', title: 'Sweep one high-traffic area', recurrence: 'daily', scheduledTime: '18:00' },
      { icon: 'todo-shoes', title: 'Put shoes away', recurrence: 'daily', scheduledTime: '18:00' },
      { icon: 'todo-mail', title: 'Sort the mail', recurrence: 'daily', scheduledTime: '18:00' },
    ],
  },
  {
    id: 'anxiety',
    label: 'Anxiety',
    description: 'Gentle pauses to help you feel more grounded.',
    icon: 'mood-anxious',
    suggestions: [
      { icon: 'todo-breath', title: 'Take three slow breaths', recurrence: 'daily', scheduledTime: '07:00' },
      { icon: 'todo-grounding', title: 'Try a five-minute breathing exercise check-in', recurrence: 'daily', scheduledTime: '13:00' },
      { icon: 'todo-fresh-air', title: 'Step outside for fresh air', recurrence: 'daily', scheduledTime: '15:00' },
      { icon: 'todo-worry-note', title: 'Write down one worry', recurrence: 'daily', scheduledTime: '18:00' },
      { icon: 'todo-screen-free', title: 'Take a screen-free wind-down break', recurrence: 'daily', scheduledTime: '21:00' },
    ],
  },
  {
    id: 'depression',
    label: 'Depression',
    description: 'Tiny, caring steps for low-energy days.',
    icon: 'mood-low-mood',
    suggestions: [
      { icon: 'todo-curtains', title: 'Open the curtains', recurrence: 'daily', scheduledTime: '07:00' },
      { icon: 'todo-water', title: 'Drink a glass of water', recurrence: 'daily', scheduledTime: '07:00' },
      { icon: 'todo-shower', title: 'Wash my face or shower', recurrence: 'daily', scheduledTime: '13:00' },
      { icon: 'todo-meal', title: 'Eat one simple meal', recurrence: 'daily', scheduledTime: '13:00' },
      { icon: 'todo-message', title: 'Text someone I trust', recurrence: 'daily', scheduledTime: '18:00' },
    ],
  },
];
