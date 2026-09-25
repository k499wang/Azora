import { colors } from '../../../theme/colors';
import type { OnboardingOption } from '../OnboardingOptionList';

export type SleepDurationId = 'under5' | '5to6' | '6to7' | '7to8' | 'over8';
export type WakeEaseId = 'easy' | 'fewMinutes' | 'snooze' | 'struggle';
export type DayEnergyId = 'steady' | 'afternoonDip' | 'upAndDown' | 'drained';
export type SleepCauseId =
  | 'racingMind'
  | 'worry'
  | 'phone'
  | 'schedule'
  | 'body'
  | 'fine';
export type StressSignalId =
  | 'bodyAlarm'
  | 'worryLoop'
  | 'scatteredFocus'
  | 'frozen'
  | 'unsure';
export type StressAwarenessId = 'well' | 'some' | 'late' | 'never';
export type FamiliarityId = 'practiced' | 'some' | 'heard' | 'new';
export type SupportSystemId = 'strong' | 'some' | 'thin' | 'selfReliant';
export type DayActivityId =
  | 'sitting'
  | 'light'
  | 'onFeet'
  | 'training'
  | 'focus'
  | 'home'
  | 'admin'
  | 'rest';
export type RoutineHappinessId = 'love' | 'fine' | 'shaky' | 'none';
export type ChoresOverwhelmId =
  | 'never'
  | 'sometimes'
  | 'often'
  | 'almostDaily';
export type DistractionId = 'rarely' | 'sometimes' | 'often' | 'constant';
export type SocialMediaId =
  | 'under30'
  | '30to60'
  | '1to2'
  | '2to4'
  | 'over4';
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
  | 'other'
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

export const DAY_ENERGY_OPTIONS: OnboardingOption<DayEnergyId>[] = [
  { id: 'steady', title: 'Steady most of the day', echo: 'your energy stays steady through the day', icon: 'battery-90', accent: colors.playful.teal.base },
  { id: 'afternoonDip', title: 'I crash in the afternoon', echo: 'your energy crashes in the afternoon', icon: 'battery-50', accent: colors.playful.amber.base },
  { id: 'upAndDown', title: 'It goes up and down', echo: 'your energy goes up and down', icon: 'chart-line-variant', accent: colors.playful.sky.base },
  { id: 'drained', title: 'Drained most of the day', echo: 'you feel drained most of the day', icon: 'battery-10', accent: colors.playful.violet.base },
];

/**
 * The cause behind the three symptom questions. Single-select on purpose: the
 * plan acts on one cause, and one answer is what a later screen can quote.
 */
export const SLEEP_CAUSE_OPTIONS: OnboardingOption<SleepCauseId>[] = [
  { id: 'racingMind', title: 'My mind won’t switch off', icon: 'waves', accent: colors.playful.violet.base, echo: 'your mind won’t switch off at night' },
  { id: 'worry', title: 'Worry about tomorrow', icon: 'alert-circle-outline', accent: colors.playful.coral.base, echo: 'tomorrow is on your mind before you sleep' },
  { id: 'phone', title: 'My phone keeps me up', icon: 'laptop', accent: colors.playful.sky.base, echo: 'your phone keeps you up' },
  { id: 'schedule', title: 'Late nights and odd hours', icon: 'clock-fast', accent: colors.playful.amber.base, echo: 'your hours are all over the place' },
  { id: 'body', title: 'Discomfort or pain', icon: 'heart-pulse', accent: colors.playful.blush.base, echo: 'your body keeps you awake' },
  { id: 'fine', title: 'Nothing — I drop off fine', icon: 'emoticon-happy-outline', accent: colors.playful.teal.base, echo: 'you drop off without trouble' },
];

export const STRESS_SIGNAL_OPTIONS: OnboardingOption<StressSignalId>[] = [
  {
    id: 'bodyAlarm',
    title: 'My body feels tense or my breathing changes',
    icon: 'heart-pulse',
    accent: colors.playful.coral.base,
  },
  {
    id: 'worryLoop',
    title: 'I worry about everything I need to do',
    icon: 'waves',
    accent: colors.playful.violet.base,
  },
  {
    id: 'scatteredFocus',
    title: 'I jump between tasks and lose track',
    icon: 'blur',
    accent: colors.playful.sky.base,
  },
  {
    id: 'frozen',
    title: 'I feel stuck and can’t get started',
    icon: 'alert-circle-outline',
    accent: colors.playful.amber.base,
  },
  {
    id: 'unsure',
    title: 'It depends',
    icon: 'help-circle-outline',
    accent: colors.playful.teal.base,
  },
];

export const STRESS_AWARENESS_OPTIONS: OnboardingOption<StressAwarenessId>[] = [
  { id: 'well', title: 'I know my signs well', icon: 'check-circle-outline', accent: colors.playful.teal.base },
  { id: 'some', title: 'I notice some signs', icon: 'eye-outline', accent: colors.playful.sky.base },
  { id: 'late', title: 'I only notice when it’s too late', icon: 'alarm-light-outline', accent: colors.playful.amber.base },
  { id: 'never', title: 'I’ve never really thought about it', icon: 'help-circle-outline', accent: colors.playful.coral.base },
];

export const BREATHING_FAMILIARITY_OPTIONS: OnboardingOption<FamiliarityId>[] = [
  { id: 'practiced', title: 'I practice it regularly', icon: 'star', accent: colors.playful.teal.base },
  { id: 'some', title: 'I’ve tried it a few times', icon: 'book', accent: colors.playful.sky.base },
  { id: 'heard', title: 'I’ve heard of it', icon: 'help-circle-outline', accent: colors.playful.amber.base },
  { id: 'new', title: 'It’s new to me', icon: 'sparkle', accent: colors.playful.coral.base },
];

export const CBT_FAMILIARITY_OPTIONS: OnboardingOption<FamiliarityId>[] = [
  { id: 'practiced', title: 'I’ve used it before', icon: 'star', accent: colors.playful.teal.base },
  { id: 'some', title: 'I know a little about it', icon: 'book', accent: colors.playful.sky.base },
  { id: 'heard', title: 'I’ve heard the name', icon: 'help-circle-outline', accent: colors.playful.amber.base },
  { id: 'new', title: 'It’s new to me', icon: 'sparkle', accent: colors.playful.coral.base },
];

export const SUPPORT_SYSTEM_OPTIONS: OnboardingOption<SupportSystemId>[] = [
  { id: 'strong', title: 'I have people I can lean on', echo: 'you have people you can lean on', icon: 'account-group', accent: colors.playful.teal.base },
  { id: 'some', title: 'A few people, some of the time', echo: 'you have a few people to turn to', icon: 'account-multiple-outline', accent: colors.playful.sky.base },
  { id: 'thin', title: 'Not really anyone right now', echo: 'you are mostly carrying it on your own', icon: 'account-outline', accent: colors.playful.violet.base },
  { id: 'selfReliant', title: 'I prefer to handle things myself', echo: 'you like to handle things yourself', icon: 'shield-account-outline', accent: colors.playful.amber.base },
];

export const DAY_ACTIVITY_OPTIONS: OnboardingOption<DayActivityId>[] = [
  { id: 'sitting', title: 'I’m glued to my screen', icon: 'seat-outline', accent: colors.playful.teal.base, echo: 'you spend most of the day at a screen' },
  { id: 'light', title: 'Every day looks different', icon: 'walk', accent: colors.playful.teal.base, echo: 'every day looks a little different' },
  { id: 'onFeet', title: 'I’m always rushing', icon: 'run', accent: colors.playful.coral.base, echo: 'you’re always rushing from one thing to the next' },
  { id: 'training', title: 'I have a rhythm, but want it easier', icon: 'dumbbell', accent: colors.playful.violet.base, echo: 'you have a rhythm, but want it to feel easier' },
  { id: 'focus', title: 'My focus', icon: 'blur', accent: colors.playful.violet.base, echo: 'focus feels hard right now' },
  { id: 'home', title: 'Keeping my space together', icon: 'home', accent: colors.playful.teal.base, echo: 'keeping your space together feels hard right now' },
  { id: 'admin', title: 'Life-admin stuff', icon: 'file-document-outline', accent: colors.playful.amber.base, echo: 'life-admin stuff feels hard right now' },
  { id: 'rest', title: 'Getting enough rest', icon: 'bed-clock', accent: colors.playful.violet.base, echo: 'getting enough rest feels hard right now' },
];

export const ROUTINE_HAPPINESS_OPTIONS: OnboardingOption<RoutineHappinessId>[] = [
  { id: 'love', title: 'It feels manageable', icon: 'emoticon-happy-outline', accent: colors.playful.teal.base, echo: 'life feels manageable right now' },
  { id: 'fine', title: 'Most days, mostly', icon: 'emoticon-neutral-outline', accent: colors.playful.sky.base, echo: 'most days feel manageable' },
  { id: 'shaky', title: 'I’m always catching up', icon: 'emoticon-confused-outline', accent: colors.playful.amber.base, echo: 'you’re always catching up' },
  { id: 'none', title: 'Everything is piling up', icon: 'emoticon-sad-outline', accent: colors.playful.coral.base, echo: 'everything feels like it is piling up' },
];

export const CHORES_OVERWHELM_OPTIONS: OnboardingOption<ChoresOverwhelmId>[] = [
  { id: 'never', title: 'Never', icon: 'broom', accent: colors.playful.teal.base, echo: 'chores rarely feel overwhelming' },
  { id: 'sometimes', title: 'Sometimes', icon: 'broom', accent: colors.playful.sky.base, echo: 'chores sometimes feel overwhelming' },
  { id: 'often', title: 'Often', icon: 'broom', accent: colors.playful.amber.base, echo: 'chores often feel overwhelming' },
  { id: 'almostDaily', title: 'Almost every day', icon: 'broom', accent: colors.playful.coral.base, echo: 'chores feel overwhelming almost every day' },
];

export const DISTRACTION_OPTIONS: OnboardingOption<DistractionId>[] = [
  { id: 'rarely', title: 'Rarely', icon: 'emoticon-happy-outline', accent: colors.playful.teal.base, echo: 'distractions rarely get in your way' },
  { id: 'sometimes', title: 'Sometimes', icon: 'emoticon-neutral-outline', accent: colors.playful.sky.base, echo: 'you get distracted sometimes' },
  { id: 'often', title: 'Often', icon: 'blur', accent: colors.playful.amber.base, echo: 'you get distracted often' },
  { id: 'constant', title: 'Almost constantly', icon: 'blur', accent: colors.playful.coral.base, echo: 'distractions are almost constant' },
];

export const SOCIAL_MEDIA_OPTIONS: OnboardingOption<SocialMediaId>[] = [
  { id: 'under30', title: 'Less than 30 minutes', icon: 'cellphone', accent: colors.playful.teal.base, echo: 'you spend less than 30 minutes on social media a day' },
  { id: '30to60', title: '30–60 minutes', icon: 'cellphone', accent: colors.playful.sky.base, echo: 'you spend 30 to 60 minutes on social media a day' },
  { id: '1to2', title: '1–2 hours', icon: 'cellphone', accent: colors.playful.amber.base, echo: 'you spend 1 to 2 hours on social media a day' },
  { id: '2to4', title: '2–4 hours', icon: 'cellphone', accent: colors.playful.violet.base, echo: 'you spend 2 to 4 hours on social media a day' },
  { id: 'over4', title: 'More than 4 hours', icon: 'cellphone', accent: colors.playful.coral.base, echo: 'you spend more than 4 hours on social media a day' },
];

/** Deliberately picture-less: these are not things to illustrate. */
export const MENTAL_HEALTH_OPTIONS: OnboardingOption<MentalHealthId>[] = [
  { id: 'anxiety', title: 'Anxiety', accent: colors.playful.sky.base, echo: 'anxiety is part of it' },
  { id: 'lowMood', title: 'Low mood', accent: colors.playful.sky.base, echo: 'low mood is part of it' },
  { id: 'burnout', title: 'Burnout', accent: colors.playful.sky.base, echo: 'burnout is part of it' },
  { id: 'panic', title: 'Panic attacks', accent: colors.playful.sky.base, echo: 'panic attacks are part of it' },
  { id: 'insomnia', title: 'Insomnia', accent: colors.playful.sky.base, echo: 'insomnia is part of it' },
  { id: 'ptsd', title: 'PTSD or trauma', accent: colors.playful.sky.base, echo: 'trauma is part of it' },
  { id: 'adhd', title: 'ADHD', accent: colors.playful.sky.base, echo: 'ADHD is part of it' },
  { id: 'autism', title: 'Autism', accent: colors.playful.sky.base, echo: 'autism is part of it' },
  { id: 'ocd', title: 'OCD', accent: colors.playful.sky.base, echo: 'OCD is part of it' },
  { id: 'other', title: 'Something else', accent: colors.playful.sky.base, echo: 'something else is part of it' },
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
    { id: 'work', title: 'Texts, emails and calls', icon: 'laptop', accent: colors.playful.sky.base, echo: 'texts, emails and calls keep sliding' },
    { id: 'chores', title: 'My space, laundry and dishes', icon: 'broom', accent: colors.playful.teal.base, echo: 'your space, laundry and dishes keep sliding' },
    { id: 'movement', title: 'Taking care of myself', icon: 'run', accent: colors.playful.coral.base, echo: 'taking care of yourself keeps sliding' },
    { id: 'sleep', title: 'Getting out the door or winding down', icon: 'bed-clock', accent: colors.playful.violet.base, echo: 'getting out the door or winding down keeps sliding' },
    { id: 'admin', title: 'Life-admin stuff', icon: 'file-document-outline', accent: colors.playful.amber.base, echo: 'life-admin stuff keeps sliding' },
    { id: 'health', title: 'Appointments and health stuff', icon: 'heart-outline', accent: colors.playful.blush.base, echo: 'appointments and health stuff keep sliding' },
  ];

/**
 * `echo` is the answer said inside one of the app's sentences, for the plan
 * screen that quotes it back. Written here rather than derived from `title`,
 * which is first person and has no safe general transform.
 */
export const PROCRASTINATION_REASON_OPTIONS: OnboardingOption<ProcrastinationReasonId>[] =
  [
    { id: 'overwhelmed', title: 'It feels too big', icon: 'alert-circle-outline', accent: colors.playful.coral.base, echo: 'it feels too big' },
    { id: 'start', title: 'I don’t know the first step', icon: 'help-circle-outline', accent: colors.playful.teal.base, echo: 'the first step is unclear' },
    { id: 'tired', title: 'I don’t have the energy', icon: 'battery-low', accent: colors.playful.amber.base, echo: 'you don’t have the energy' },
    { id: 'failing', title: 'I’m worried I’ll do it wrong', icon: 'shield-alert-outline', accent: colors.playful.blush.base, echo: 'you’re worried you’ll do it wrong' },
    { id: 'focus', title: 'I get distracted', icon: 'blur', accent: colors.playful.violet.base, echo: 'you get distracted' },
    { id: 'boring', title: 'I dread it', icon: 'emoticon-neutral-outline', accent: colors.playful.sky.base, echo: 'you dread it' },
  ];

export type HomeFeelingId = 'calm' | 'inControl' | 'proud' | 'rested' | 'lessGuilty';

export const HOME_FEELING_OPTIONS: OnboardingOption<HomeFeelingId>[] = [
  { id: 'calm', title: 'Calm', icon: 'lotus', accent: colors.playful.sky.base, echo: 'you want to feel calm at home' },
  { id: 'inControl', title: 'In control', icon: 'target', accent: colors.playful.teal.base, echo: 'you want to feel in control at home' },
  { id: 'proud', title: 'Proud to have guests over', icon: 'home', accent: colors.playful.coral.base, echo: 'you want to feel proud to have guests over' },
  { id: 'rested', title: 'Rested', icon: 'seat-outline', accent: colors.playful.violet.base, echo: 'you want to feel rested at home' },
  { id: 'lessGuilty', title: 'Less guilty', icon: 'emoticon-happy-outline', accent: colors.playful.amber.base, echo: 'you want to feel less guilty at home' },
];

export type PlanBoostId = 'quickWins' | 'streaks' | 'decorating' | 'reminders' | 'progress';

export const PLAN_BOOST_OPTIONS: OnboardingOption<PlanBoostId>[] = [
  { id: 'quickWins', title: 'Quick wins', icon: 'clock-fast', accent: colors.playful.amber.base, echo: 'quick wins' },
  { id: 'streaks', title: 'Keeping a streak', icon: 'streak', accent: colors.playful.coral.base, echo: 'keeping a streak' },
  { id: 'decorating', title: 'Decorating Azo’s room', icon: 'sparkle', accent: colors.playful.teal.base, echo: 'decorating Azo’s room' },
  { id: 'reminders', title: 'Gentle reminders', icon: 'alarm-snooze', accent: colors.playful.sky.base, echo: 'gentle reminders' },
  { id: 'progress', title: 'Seeing my progress', icon: 'arrow-up', accent: colors.playful.violet.base, echo: 'seeing your progress' },
];
