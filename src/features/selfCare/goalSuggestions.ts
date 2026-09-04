import type { IconName } from '../../components/common/icons/Icon';

export interface GoalSuggestion {
  icon: IconName;
  title: string;
}

export interface GoalSuggestionCategory {
  id: string;
  label: string;
  suggestions: GoalSuggestion[];
}

/**
 * The icons a to-do can wear. Deliberately a shortlist rather than the app's
 * whole set: stat marks, brand logos and research glyphs mean nothing on a
 * personal to-do, and a picker you can read in one glance beats a complete one.
 */
export const GOAL_ICON_CHOICES: IconName[] = [
  'sparkle',
  'star',
  'heart',
  'sun',
  'moon',
  'waves',
  'wind',
  'snowflake',
  'lotus',
  'meditation',
  'lungs',
  'heart-pulse',
  'breath-leaf',
  'breath-wave',
  'book',
  'journal',
  'pencil',
  'message',
  'bell',
  'clock',
  'timer',
  'calendar',
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
    id: 'easy-wins',
    label: 'Easy wins',
    suggestions: [
      { icon: 'waves', title: 'Drink a glass of water' },
      { icon: 'sun', title: 'Step outside for five minutes' },
      { icon: 'home', title: 'Make the bed' },
      { icon: 'star', title: 'Do the one thing I keep putting off' },
      { icon: 'clock', title: 'Take a real break away from the desk' },
    ],
  },
  {
    id: 'calm',
    label: 'Calm',
    suggestions: [
      { icon: 'lotus', title: 'Sit still for two minutes' },
      { icon: 'moon', title: 'Put the phone down an hour before bed' },
      { icon: 'breath-leaf', title: 'Unclench my jaw and drop my shoulders' },
      { icon: 'wind', title: 'Slow my breathing down before the next meeting' },
      { icon: 'snowflake', title: 'Splash cold water on my face' },
    ],
  },
  {
    id: 'focus',
    label: 'Focus',
    suggestions: [
      { icon: 'timer', title: 'Work one stretch with the phone in another room' },
      { icon: 'pencil', title: 'Write down the one thing that matters today' },
      { icon: 'bell', title: 'Turn notifications off for an hour' },
      { icon: 'book', title: 'Read ten pages' },
      { icon: 'calendar', title: 'Plan tomorrow before closing the laptop' },
    ],
  },
  {
    id: 'body',
    label: 'Body',
    suggestions: [
      { icon: 'heart-pulse', title: 'Walk for fifteen minutes' },
      { icon: 'meditation', title: 'Stretch before bed' },
      { icon: 'lungs', title: 'Take the stairs' },
      { icon: 'sun', title: 'Get sunlight in the first hour awake' },
      { icon: 'clock', title: 'Stand up once every hour' },
    ],
  },
  {
    id: 'connect',
    label: 'Connect',
    suggestions: [
      { icon: 'message', title: 'Text someone I have been meaning to' },
      { icon: 'heart', title: 'Say thank you to one person' },
      { icon: 'profile', title: 'Ask someone how their day really went' },
      { icon: 'journal', title: 'Write down one thing I am grateful for' },
      { icon: 'face-happy', title: 'Eat one meal without a screen' },
    ],
  },
];
