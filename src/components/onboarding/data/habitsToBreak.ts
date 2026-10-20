import { colors } from '../../../theme/colors';
import type { OnboardingOption } from '../OnboardingOptionList';
import type { OnboardingOptionIconName } from '../OnboardingOptionIcon';
import type { OnboardingIntent } from '../types';

/**
 * The habits each goal most wants to drop, authored per goal.
 *
 * Nothing here is shared between goals, because none of it transfers: "piling
 * up dishes" is only a habit for someone whose goal is their home, and a sleep
 * goal has nothing to say about laundry. The active goals a new user can pick
 * carry their own five; anything else — a retired goal on a saved profile, or
 * "something else" — gets the neutral set, which names no goal at all and so
 * cannot describe a habit the user never claimed.
 *
 * Every row is titled as the habit itself, in the plain "-ing" form the user
 * would say it in, so the list reads as a mirror rather than a diagnosis.
 */

/** The same six accents every question screen rotates through, in the same order. */
const ACCENTS = [
  colors.playful.sky.base,
  colors.playful.teal.base,
  colors.playful.amber.base,
  colors.playful.violet.base,
  colors.playful.coral.base,
  colors.playful.blush.base,
];

type HabitRow = readonly [id: string, title: string, icon: OnboardingOptionIconName];

function habits(rows: readonly HabitRow[]): OnboardingOption<string>[] {
  return rows.map(([id, title, icon], index) => ({
    id,
    title,
    icon,
    accent: ACCENTS[index % ACCENTS.length],
  }));
}

const CLEANING: readonly HabitRow[] = [
  ['dishes', 'Piling up dishes', 'todo-counter'],
  ['laundry', 'Leaving laundry around', 'todo-hamper'],
  ['clutter', 'Letting clutter grow', 'home'],
  ['skipping', 'Skipping cleaning', 'close-circle-outline'],
  ['allOrNothing', 'All-or-nothing cleaning', 'alert-circle-outline'],
];

const STRESS_RELIEF: readonly HabitRow[] = [
  ['snapping', 'Snapping at small things', 'alert-circle-outline'],
  ['bottling', 'Bottling it up all day', 'close-circle-outline'],
  ['yesToEverything', 'Saying yes to everything', 'shield-alert-outline'],
  ['scrolling', 'Scrolling to switch off', 'blur'],
  ['restGuilt', 'Feeling guilty when I rest', 'battery-low'],
];

const CALM_FAST: readonly HabitRow[] = [
  ['replaying', 'Replaying conversations', 'waves'],
  ['worstCase', 'Assuming the worst', 'shield-alert-outline'],
  ['lateNightSearch', 'Searching for answers at night', 'moon'],
  ['reassurance', 'Asking for reassurance', 'help-circle-outline'],
  ['losingSleep', 'Losing sleep to my thoughts', 'bed-outline'],
];

const SLEEP: readonly HabitRow[] = [
  ['scrollingInBed', 'Scrolling in bed', 'blur'],
  ['lateCaffeine', 'Caffeine too late', 'coffee-outline'],
  ['lateBedtime', 'Going to bed too late', 'clock-fast'],
  ['checkingClock', 'Checking the clock all night', 'timer'],
  ['catchingUp', 'Catching up with naps', 'bed-clock'],
];

const FOCUS: readonly HabitRow[] = [
  ['phoneMidTask', 'Opening my phone mid-task', 'blur'],
  ['tenThings', 'Starting ten things at once', 'dots-horizontal-circle-outline'],
  ['waitingMotivation', 'Waiting to feel motivated', 'timer'],
  ['messyDesk', 'Working in a mess', 'file-document-outline'],
  ['checkingMessages', 'Checking messages constantly', 'laptop'],
];

const EMOTIONAL_BALANCE: readonly HabitRow[] = [
  ['snappingTired', 'Snapping when I’m tired', 'alert-circle-outline'],
  ['goingQuiet', 'Going quiet instead of saying it', 'close-circle-outline'],
  ['bringingWorkHome', 'Bringing work home', 'laptop'],
  ['keepingScore', 'Keeping score', 'file-document-outline'],
  ['replayingArguments', 'Replaying arguments', 'waves'],
];

const ENERGY: readonly HabitRow[] = [
  ['snoozing', 'Snoozing every morning', 'alarm-snooze'],
  ['afternoonCaffeine', 'Afternoon caffeine', 'coffee-outline'],
  ['sitting', 'Sitting all day', 'seat-outline'],
  ['skippingMeals', 'Skipping meals', 'timer'],
  ['weekendLieIn', 'Weekend lie-ins', 'bed-outline'],
];

const DAILY_HABIT: readonly HabitRow[] = [
  ['freshStartMonday', 'Starting over every Monday', 'calendar-check-outline'],
  ['allIn', 'Going all in for three days', 'streak'],
  ['quitAfterMiss', 'Quitting after one missed day', 'close-circle-outline'],
  ['rightTime', 'Waiting for the right time', 'timer'],
  ['motivation', 'Relying on motivation', 'sparkle'],
];

const NEUTRAL: readonly HabitRow[] = [
  ['strongStart', 'Starting strong, then stopping', 'streak'],
  ['missedDay', 'Quitting after one missed day', 'close-circle-outline'],
  ['waiting', 'Waiting until I feel ready', 'timer'],
  ['allAtOnce', 'Trying to change everything at once', 'dots-horizontal-circle-outline'],
  ['losingTrack', 'Losing track of the plan', 'file-document-outline'],
];

/**
 * The active goals a new onboarding can pick. Partial on purpose: a goal with no
 * set falls through to the neutral one rather than being half-authored here.
 */
const BY_INTENT: Partial<Record<OnboardingIntent, readonly HabitRow[]>> = {
  scrolling: [
    ['unlock', 'Unlocking my phone without a reason', 'blur'],
    ['oneMore', 'Watching one more video', 'timer'],
    ['messages', 'Checking messages between every task', 'laptop'],
    ['phoneMeals', 'Scrolling through meals', 'coffee-outline'],
    ['phoneBed', 'Taking my phone to bed', 'bed-outline'],
  ],
  burnout: [
    ['skipBreaks', 'Skipping breaks', 'coffee-outline'],
    ['pushThrough', 'Pushing through when I am drained', 'battery-low'],
    ['overcommit', 'Taking on too much', 'calendar-check-outline'],
    ['restGuilt', 'Feeling guilty about resting', 'bed-outline'],
    ['ignoreNeeds', 'Putting my needs last', 'heart-outline'],
  ],
  procrastination: [
    ['delay', 'Saving tasks for later', 'alarm-snooze'],
    ['perfect', 'Waiting for the perfect moment', 'timer'],
    ['overplan', 'Planning instead of starting', 'file-document-outline'],
    ['avoid', 'Avoiding the hardest first step', 'close-circle-outline'],
    ['deadline', 'Waiting until the deadline', 'calendar-check-outline'],
  ],
  cleaning: CLEANING,
  stress_relief: STRESS_RELIEF,
  calm_fast: CALM_FAST,
  sleep: SLEEP,
  focus: FOCUS,
  emotional_balance: EMOTIONAL_BALANCE,
  energy: ENERGY,
  daily_habit: DAILY_HABIT,
};

export function habitsToBreakFor(intent: OnboardingIntent): OnboardingOption<string>[] {
  return habits(BY_INTENT[intent] ?? NEUTRAL);
}
