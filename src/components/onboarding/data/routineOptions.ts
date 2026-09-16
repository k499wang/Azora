import { colors } from '../../../theme/colors';
import type { OnboardingOption } from '../OnboardingOptionList';

export type SleepDurationId = 'under5' | '5to6' | '6to7' | '7to8' | 'over8';
export type WakeEaseId = 'easy' | 'fewMinutes' | 'snooze' | 'struggle';
export type DayActivityId = 'sitting' | 'light' | 'onFeet' | 'training';
export type RoutineHappinessId = 'love' | 'fine' | 'shaky' | 'none';
export type MentalHealthId =
  | 'anxiety'
  | 'lowMood'
  | 'burnout'
  | 'panic'
  | 'insomnia'
  | 'ptsd'
  | 'adhd'
  | 'autism'
  | 'ocd'
  | 'none';

export const SLEEP_DURATION_OPTIONS: OnboardingOption<SleepDurationId>[] = [
  { id: 'under5', title: 'Less than 5 hours', echo: 'less than 5 hours', icon: 'moon-waning-crescent', accent: colors.playful.violet.base },
  { id: '5to6', title: '5 to 6 hours', echo: '5 to 6 hours', icon: 'weather-night', accent: colors.playful.violet.base },
  { id: '6to7', title: '6 to 7 hours', echo: '6 to 7 hours', icon: 'bed-outline', accent: colors.playful.sky.base },
  { id: '7to8', title: '7 to 8 hours', echo: '7 to 8 hours', icon: 'bed-king-outline', accent: colors.playful.sky.base },
  { id: 'over8', title: 'More than 8 hours', echo: 'more than 8 hours', icon: 'sleep', accent: colors.playful.teal.base },
];

export const WAKE_EASE_OPTIONS: OnboardingOption<WakeEaseId>[] = [
  { id: 'easy', title: 'I’m up as soon as it goes off', echo: 'get up as soon as your alarm goes off', icon: 'weather-sunset-up', accent: colors.playful.amber.base },
  { id: 'fewMinutes', title: 'It takes me a few minutes', echo: 'need a few minutes to get up', icon: 'coffee-outline', accent: colors.playful.amber.base },
  { id: 'snooze', title: 'I hit snooze more than once', echo: 'hit snooze more than once', icon: 'alarm-snooze', accent: colors.playful.violet.base },
  { id: 'struggle', title: 'Getting up is a real fight', echo: 'find getting up a real fight', icon: 'weather-pouring', accent: colors.playful.sky.base },
];

export const DAY_ACTIVITY_OPTIONS: OnboardingOption<DayActivityId>[] = [
  { id: 'sitting', title: 'Mostly sitting', icon: 'seat-outline', accent: colors.playful.teal.base },
  { id: 'light', title: 'A bit of walking here and there', icon: 'walk', accent: colors.playful.teal.base },
  { id: 'onFeet', title: 'On my feet most of the day', icon: 'run', accent: colors.playful.coral.base },
  { id: 'training', title: 'I train hard most days', icon: 'dumbbell', accent: colors.playful.violet.base },
];

export const ROUTINE_HAPPINESS_OPTIONS: OnboardingOption<RoutineHappinessId>[] = [
  { id: 'love', title: 'I’m happy with it', icon: 'emoticon-happy-outline', accent: colors.playful.teal.base },
  { id: 'fine', title: 'It works, mostly', icon: 'emoticon-neutral-outline', accent: colors.playful.sky.base },
  { id: 'shaky', title: 'It falls apart often', icon: 'emoticon-confused-outline', accent: colors.playful.amber.base },
  { id: 'none', title: 'I don’t really have one', icon: 'emoticon-sad-outline', accent: colors.playful.coral.base },
];

/** Deliberately picture-less: these are not things to illustrate. */
export const MENTAL_HEALTH_OPTIONS: OnboardingOption<MentalHealthId>[] = [
  { id: 'anxiety', title: 'Anxiety', accent: colors.playful.sky.base },
  { id: 'lowMood', title: 'Low mood', accent: colors.playful.sky.base },
  { id: 'burnout', title: 'Burnout', accent: colors.playful.sky.base },
  { id: 'panic', title: 'Panic attacks', accent: colors.playful.sky.base },
  { id: 'insomnia', title: 'Insomnia', accent: colors.playful.sky.base },
  { id: 'ptsd', title: 'PTSD or trauma', accent: colors.playful.sky.base },
  { id: 'adhd', title: 'ADHD', accent: colors.playful.sky.base },
  { id: 'autism', title: 'Autism', accent: colors.playful.sky.base },
  { id: 'ocd', title: 'OCD', accent: colors.playful.sky.base },
  { id: 'none', title: 'None of these', accent: colors.playful.sky.base },
];

export type ProcrastinationAreaId =
  | 'work'
  | 'chores'
  | 'movement'
  | 'sleep'
  | 'admin'
  | 'health';

export type ProcrastinationReasonId =
  | 'overwhelmed'
  | 'focus'
  | 'tired'
  | 'boring'
  | 'failing'
  | 'start';

export const PROCRASTINATION_AREA_OPTIONS: OnboardingOption<ProcrastinationAreaId>[] =
  [
    { id: 'work', title: 'Work or study', icon: 'laptop', accent: colors.playful.sky.base },
    { id: 'chores', title: 'Chores at home', icon: 'broom', accent: colors.playful.teal.base },
    { id: 'movement', title: 'Moving my body', icon: 'run', accent: colors.playful.coral.base },
    { id: 'sleep', title: 'Going to bed on time', icon: 'bed-clock', accent: colors.playful.violet.base },
    { id: 'admin', title: 'Admin and errands', icon: 'file-document-outline', accent: colors.playful.amber.base },
    { id: 'health', title: 'Taking care of my health', icon: 'heart-outline', accent: colors.playful.blush.base },
  ];

/**
 * `echo` is the answer said inside one of the app's sentences, for the plan
 * screen that quotes it back. Written here rather than derived from `title`,
 * which is first person and has no safe general transform.
 */
export const PROCRASTINATION_REASON_OPTIONS: OnboardingOption<ProcrastinationReasonId>[] =
  [
    { id: 'overwhelmed', title: 'It all feels like too much', icon: 'alert-circle-outline', accent: colors.playful.coral.base, echo: 'it all feels like too much' },
    { id: 'focus', title: 'I can’t hold my focus', icon: 'blur', accent: colors.playful.violet.base, echo: 'your focus won’t hold' },
    { id: 'tired', title: 'I’m too tired', icon: 'battery-low', accent: colors.playful.amber.base, echo: 'you’re too tired' },
    { id: 'boring', title: 'It just feels boring', icon: 'emoticon-neutral-outline', accent: colors.playful.sky.base, echo: 'it feels boring' },
    { id: 'failing', title: 'I’m afraid of doing it badly', icon: 'shield-alert-outline', accent: colors.playful.blush.base, echo: 'you’re afraid of doing it badly' },
    { id: 'start', title: 'I don’t know where to start', icon: 'help-circle-outline', accent: colors.playful.teal.base, echo: 'you don’t know where to start' },
  ];
