import type { IconName } from '../../components/common/icons/Icon';

export interface GoalSuggestion {
  icon: IconName;
  title: string;
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
  'sparkle',
  'star',
  'heart',
  'sun',
  'sunrise',
  'moon',
  'weather-windy',
  'waves',
  'wind',
  'snowflake',
  'lotus',
  'yoga',
  'meditation',
  'lungs',
  'walk',
  'dumbbell',
  'arrow-up',
  'stethoscope',
  'breath-leaf',
  'breath-wave',
  'breath-timer',
  'book',
  'journal',
  'pencil',
  'message',
  'bell',
  'clock',
  'timer',
  'calendar',
  'calendar-check-outline',
  'bed-clock',
  'coffee-outline',
  'home',
  'profile',
  'camera',
  'trophy',
  'celebration',
  'laurel',
  'flask',
  'face-happy',
  'face-calm',
  'streak',
];

/**
 * The starting shelf for the add-goal sheet. Every line is written the way a
 * user would write it for themselves — small, finishable today, and phrased as
 * the thing to do rather than the habit to become.
 */
export const GOAL_SUGGESTION_CATEGORIES: GoalSuggestionCategory[] = [
  {
    id: 'daily-chores',
    label: 'Daily chores',
    description: 'Stay in control daily and prevent mess from piling up.',
    icon: 'calendar',
    suggestions: [
      { icon: 'home', title: 'Make the bed' },
      { icon: 'sparkle', title: 'Empty the trash' },
      { icon: 'waves', title: 'Do the dishes' },
      { icon: 'timer', title: 'Clean and sweep the kitchen' },
      { icon: 'bed-clock', title: 'Put in one load of laundry' },
    ],
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    description: 'Keep the heart of your home ready for the next meal.',
    icon: 'coffee-outline',
    suggestions: [
      { icon: 'waves', title: 'Wash the dishes in the sink' },
      { icon: 'coffee-outline', title: 'Wipe down the kitchen counter' },
      { icon: 'home', title: 'Put away clean dishes' },
      { icon: 'sparkle', title: 'Take out the kitchen bin' },
      { icon: 'calendar', title: 'Plan one simple meal' },
    ],
  },
  {
    id: 'living-room',
    label: 'Living room',
    description: 'Make the space you relax in feel calm again.',
    icon: 'home',
    suggestions: [
      { icon: 'timer', title: 'Tidy one surface for five minutes' },
      { icon: 'home', title: 'Put away anything left on the floor' },
      { icon: 'sparkle', title: 'Reset the coffee table' },
      { icon: 'waves', title: 'Water the plants' },
      { icon: 'sun', title: 'Open a window for fresh air' },
    ],
  },
  {
    id: 'bedrooms',
    label: 'Bedrooms',
    description: 'A few small resets make tomorrow easier.',
    icon: 'bed-clock',
    suggestions: [
      { icon: 'bed-clock', title: 'Put clothes in the hamper' },
      { icon: 'home', title: 'Clear the bedside table' },
      { icon: 'timer', title: 'Fold one small load of laundry' },
      { icon: 'moon', title: 'Lay out clothes for tomorrow' },
      { icon: 'sparkle', title: 'Change the bed sheets' },
    ],
  },
  {
    id: 'bathrooms',
    label: 'Bathrooms',
    description: 'Keep the essentials clean and easy to use.',
    icon: 'waves',
    suggestions: [
      { icon: 'waves', title: 'Wipe down the sink' },
      { icon: 'sparkle', title: 'Clean the mirror' },
      { icon: 'home', title: 'Replace the hand towel' },
      { icon: 'timer', title: 'Quickly clean the toilet' },
      { icon: 'calendar', title: 'Restock toilet paper' },
    ],
  },
  {
    id: 'entrance',
    label: 'Entrance',
    description: 'Create an easy welcome home and an easy way out.',
    icon: 'home',
    suggestions: [
      { icon: 'home', title: 'Put shoes away' },
      { icon: 'calendar', title: 'Sort the mail' },
      { icon: 'sparkle', title: 'Clear the entryway floor' },
      { icon: 'bed-clock', title: 'Set out what I need tomorrow' },
      { icon: 'sun', title: 'Check the weather for tomorrow' },
    ],
  },
];
