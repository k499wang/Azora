import { colors } from '../../../theme/colors';
import type { OnboardingOption } from '../OnboardingOptionList';
import type { OnboardingOptionIconName } from '../OnboardingOptionIcon';
import type { AzoExpression } from '../../../features/mascot/azoFace';
import type { OnboardingIntent } from '../types';

/**
 * The only place the flow asks about one problem more than once.
 *
 * Every goal gets the same three beats — when it hits, what has already been
 * tried, and what it costs — because those are the three things a plan has to
 * know and the three the assessment never asked. The first two are written per
 * goal, since "when does it hit" means something different for sleep than for
 * focus; the cost is the same question for everyone and so is authored once.
 *
 * Goals with no bespoke pair fall back to `DEFAULT_PAIR`, which is written to
 * be true of any of them. A new goal therefore needs no entry here to work.
 */

export interface IntentFollowUpQuestion {
  id: string;
  question: string;
  expression: AzoExpression;
  multiSelect?: boolean;
  options: OnboardingOption<string>[];
}

const accents = [
  colors.playful.sky.base,
  colors.playful.teal.base,
  colors.playful.amber.base,
  colors.playful.violet.base,
  colors.playful.coral.base,
  colors.playful.blush.base,
];

/**
 * Every row is a picture, a title and an `echo` — the same shape as the rest of
 * the question screens, so these read as part of the assessment rather than as
 * a form bolted onto it.
 */
function options(
  entries: readonly (readonly [
    string,
    string,
    string,
    OnboardingOptionIconName,
  ])[],
): OnboardingOption<string>[] {
  return entries.map(([id, title, echo, icon], index) => ({
    id,
    title,
    echo,
    icon,
    accent: accents[index % accents.length],
  }));
}

interface FollowUpPair {
  when: IntentFollowUpQuestion;
  tried: IntentFollowUpQuestion;
}

const DEFAULT_PAIR: FollowUpPair = {
  when: {
    id: 'when_default',
    question: 'When does it hit you hardest?',
    expression: 'listening',
    options: options([
      ['morning', 'First thing in the morning', 'mornings are the hard part', 'weather-sunset-up'],
      ['workday', 'In the middle of the workday', 'the middle of the day is the hard part', 'laptop'],
      ['evening', 'In the evening', 'evenings are the hard part', 'weather-night'],
      ['night', 'At night, in bed', 'nights are the hard part', 'bed-outline'],
      ['anytime', 'It can be any time', 'it can hit at any hour', 'clock-fast'],
    ]),
  },
  tried: {
    id: 'tried_default',
    question: 'What have you already tried?',
    expression: 'thinking',
    multiSelect: true,
    options: options([
      ['apps', 'Other apps', 'other apps', 'dots-horizontal-circle-outline'],
      ['meditation', 'Meditation', 'meditation', 'meditation'],
      ['exercise_habit', 'Moving more', 'moving more', 'run'],
      ['therapy', 'Therapy or coaching', 'therapy', 'book'],
      ['supplements', 'Supplements', 'supplements', 'sparkle'],
      ['nothing', 'Nothing yet', 'nothing yet', 'close-circle-outline'],
    ]),
  },
};

const PAIRS: Partial<Record<OnboardingIntent, FollowUpPair>> = {
  stress_relief: {
    when: {
      id: 'when_stress',
      question: 'When is the stress at its worst?',
      expression: 'listening',
      options: options([
        ['morning', 'Before the day has started', 'it starts before the day does', 'weather-sunset-up'],
        ['work', 'While you are working', 'work is when it peaks', 'laptop'],
        ['evening', 'Once things go quiet', 'it arrives once things go quiet', 'weather-night'],
        ['night', 'When you are trying to sleep', 'it peaks when you are trying to sleep', 'bed-outline'],
        ['constant', 'It never really lifts', 'it never really lifts', 'waves'],
      ]),
    },
    tried: {
      id: 'tried_stress',
      question: 'What have you tried to bring it down?',
      expression: 'thinking',
      multiSelect: true,
      options: options([
        ['apps', 'Other apps', 'other apps', 'dots-horizontal-circle-outline'],
        ['meditation', 'Meditation', 'meditation', 'meditation'],
        ['exercise_habit', 'Moving more', 'moving more', 'run'],
        ['therapy', 'Therapy or coaching', 'therapy', 'book'],
        ['drinking', 'A drink to take the edge off', 'a drink to take the edge off', 'coffee-outline'],
        ['nothing', 'Nothing yet', 'nothing yet', 'close-circle-outline'],
      ]),
    },
  },
  calm_fast: {
    when: {
      id: 'when_spike',
      question: 'What sets off the spikes?',
      expression: 'listening',
      multiSelect: true,
      options: options([
        ['people', 'Being around people', 'being around people', 'emoticon-confused-outline'],
        ['performance', 'Speaking or performing', 'having to perform', 'star'],
        ['conflict', 'Conflict or confrontation', 'conflict', 'alert-circle-outline'],
        ['deadlines', 'Deadlines and pressure', 'deadlines', 'timer'],
        ['nowhere', 'They come out of nowhere', 'spikes that come from nowhere', 'weather-windy'],
      ]),
    },
    tried: {
      id: 'tried_spike',
      question: 'What do you do when one hits?',
      expression: 'thinking',
      options: options([
        ['wait', 'Wait it out', 'waiting it out', 'clock-fast'],
        ['leave', 'Leave the room', 'leaving the room', 'home'],
        ['breathe', 'Try to breathe through it', 'breathing through it', 'breath-leaf'],
        ['distract', 'Distract yourself', 'distracting yourself', 'blur'],
        ['nothing', 'Nothing that works', 'nothing that has worked', 'close-circle-outline'],
      ]),
    },
  },
  sleep: {
    when: {
      id: 'when_sleep',
      question: 'Where do your nights go wrong?',
      expression: 'listening',
      options: options([
        ['falling', 'Falling asleep takes forever', 'falling asleep takes forever', 'moon-waning-crescent'],
        ['waking', 'You wake in the night', 'you wake in the night', 'alarm-snooze'],
        ['early', 'You wake too early', 'you wake too early', 'weather-sunset-up'],
        ['unrested', 'You sleep, but wake unrested', 'you wake unrested', 'battery-low'],
        ['all', 'All of it', 'the whole night is a fight', 'weather-pouring'],
      ]),
    },
    tried: {
      id: 'tried_sleep',
      question: 'What have you already tried for it?',
      expression: 'thinking',
      multiSelect: true,
      options: options([
        ['melatonin', 'Melatonin or sleep aids', 'sleep aids', 'sparkle'],
        ['screens', 'Cutting screens at night', 'cutting screens at night', 'laptop'],
        ['caffeine', 'Cutting caffeine', 'cutting caffeine', 'coffee-outline'],
        ['schedule', 'A stricter bedtime', 'a stricter bedtime', 'bed-clock'],
        ['apps', 'Other apps', 'other apps', 'dots-horizontal-circle-outline'],
        ['nothing', 'Nothing yet', 'nothing yet', 'close-circle-outline'],
      ]),
    },
  },
  focus: {
    when: {
      id: 'when_focus',
      question: 'Where does your focus go?',
      expression: 'listening',
      options: options([
        ['starting', 'You cannot get started', 'starting is the hard part', 'help-circle-outline'],
        ['minutes', 'It lasts a few minutes', 'focus lasts a few minutes', 'timer'],
        ['afternoon', 'It dies in the afternoon', 'the afternoon is where it dies', 'battery-low'],
        ['phone', 'Your phone takes it', 'your phone takes it', 'blur'],
        ['racing', 'Your head is too busy', 'your head is too busy', 'waves'],
      ]),
    },
    tried: {
      id: 'tried_focus',
      question: 'What have you leaned on so far?',
      expression: 'thinking',
      multiSelect: true,
      options: options([
        ['caffeine', 'Caffeine', 'caffeine', 'coffee-outline'],
        ['blockers', 'App blockers', 'app blockers', 'shield-alert-outline'],
        ['timers', 'Timers and pomodoros', 'timers', 'breath-timer'],
        ['lists', 'Lists and planners', 'lists', 'file-document-outline'],
        ['medication', 'Medication', 'medication', 'stethoscope'],
        ['nothing', 'Nothing yet', 'nothing yet', 'close-circle-outline'],
      ]),
    },
  },
  energy: {
    when: {
      id: 'when_energy',
      question: 'When does the energy run out?',
      expression: 'listening',
      options: options([
        ['morning', 'You wake up already flat', 'you wake up already flat', 'weather-sunset-up'],
        ['midday', 'Around the middle of the day', 'the middle of the day empties you', 'white-balance-sunny'],
        ['afternoon', 'The afternoon crash', 'the afternoon crash', 'battery-low'],
        ['evening', 'By the evening there is nothing left', 'evenings have nothing left', 'weather-night'],
        ['constant', 'It is low all day', 'it stays low all day', 'blur'],
      ]),
    },
    tried: {
      id: 'tried_energy',
      question: 'What have you leaned on so far?',
      expression: 'thinking',
      multiSelect: true,
      options: options([
        ['caffeine', 'Caffeine', 'caffeine', 'coffee-outline'],
        ['sugar', 'Sugar or energy drinks', 'energy drinks', 'sparkle'],
        ['napping', 'Naps', 'naps', 'sleep'],
        ['exercise_habit', 'Moving more', 'moving more', 'run'],
        ['supplements', 'Supplements', 'supplements', 'lotus'],
        ['nothing', 'Nothing yet', 'nothing yet', 'close-circle-outline'],
      ]),
    },
  },
};

/**
 * The same for every goal: the question the assessment never asks, and the one
 * the plan quotes back.
 */
const COST_QUESTION: IntentFollowUpQuestion = {
  id: 'cost',
  question: 'What has it cost you most?',
  expression: 'thinking',
  options: options([
    ['focus', 'My focus at work', 'your focus at work', 'laptop'],
    ['patience', 'My patience with people I love', 'your patience with the people you love', 'heart-outline'],
    ['sleep', 'My sleep', 'your sleep', 'moon'],
    ['health', 'My health', 'your health', 'heart-pulse'],
    ['enjoyment', 'Enjoying things I used to', 'the things you used to enjoy', 'emoticon-sad-outline'],
    ['time', 'Time I will not get back', 'time you will not get back', 'clock-fast'],
  ]),
};

/** When it hits, what has been tried, what it costs — always three. */
export function intentFollowUpsFor(
  intent: OnboardingIntent | null,
): IntentFollowUpQuestion[] {
  const pair = (intent == null ? null : PAIRS[intent]) ?? DEFAULT_PAIR;
  return [pair.when, pair.tried, COST_QUESTION];
}
