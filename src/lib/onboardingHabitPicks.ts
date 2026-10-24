import { colors } from '../theme/colors';
import type { OnboardingIntent } from '../features/exercise/guidedBreathing/techniqueSelection';
import type { StarterPlanItem } from './onboardingStarterPlan';

/**
 * The habits onboarding lets someone add for the goal they chose, led by the
 * one their answers recommend.
 */
type HabitPick = Omit<StarterPlanItem, 'accent' | 'because'>;

const accents = [
  colors.playful.sky.base,
  colors.playful.teal.base,
  colors.playful.amber.base,
  colors.playful.violet.base,
  colors.playful.coral.base,
  colors.playful.blush.base,
];

const GENERAL: HabitPick[] = [
  { id: 'pickWaterFirst', title: 'Drink a glass of water first thing', icon: 'waves', daypart: 'start', minutes: 1 },
  { id: 'pickStepOutside', title: 'Step outside for five minutes', icon: 'weather-windy', daypart: 'afternoon', minutes: 5 },
  { id: 'pickTenMinuteWalk', title: 'Walk for ten minutes', icon: 'walk', daypart: 'afternoon', minutes: 10 },
  { id: 'pickStretch', title: 'Stretch for five minutes', icon: 'yoga', daypart: 'afternoon', minutes: 5 },
  { id: 'pickReadPages', title: 'Read ten pages', icon: 'book', daypart: 'evening', minutes: 15 },
  { id: 'pickOneLine', title: 'Write one line about my day', icon: 'pencil', daypart: 'evening', minutes: 2 },
  { id: 'pickPhoneDown', title: 'Put my phone down an hour before bed', icon: 'moon', daypart: 'bedtime' },
];

const BY_INTENT: Partial<Record<OnboardingIntent, HabitPick[]>> = {
  scrolling: [
    { id: 'pickNoPhoneWalk', title: 'Take a short walk without my phone', icon: 'walk', daypart: 'afternoon', minutes: 10 },
    { id: 'pickCloseApp', title: 'Close one app when my timer ends', icon: 'timer', daypart: 'afternoon' },
    { id: 'pickChooseOffline', title: 'Choose an offline activity for tonight', icon: 'book', daypart: 'evening', minutes: 2 },
    { id: 'pickPhoneAway', title: 'Put my phone out of reach for one task', icon: 'timer', daypart: 'start', minutes: 25 },
    { id: 'pickPauseUnlock', title: 'Pause before I unlock my phone', icon: 'timer', daypart: 'afternoon' },
    { id: 'pickPhoneFreeMeal', title: 'Eat one meal without my phone', icon: 'coffee-outline', daypart: 'evening', minutes: 20 },
  ],
  burnout: [
    { id: 'pickLunchPause', title: 'Take lunch away from my tasks', icon: 'coffee-outline', daypart: 'afternoon', minutes: 30 },
    { id: 'pickOneLimit', title: 'Set one small limit on my commitments', icon: 'calendar-check-outline', daypart: 'start', minutes: 5 },
    { id: 'pickRestWindow', title: 'Leave ten minutes free to rest', icon: 'moon', daypart: 'evening', minutes: 10 },
    { id: 'pickOneBreak', title: 'Take a short break before I feel empty', icon: 'coffee-outline', daypart: 'afternoon', minutes: 5 },
    { id: 'pickEnoughToday', title: 'Choose one thing that is enough for today', icon: 'star', daypart: 'start', minutes: 2 },
    { id: 'pickAskHelp', title: 'Ask for help with one small thing', icon: 'heart', daypart: 'evening', minutes: 5 },
  ],
  procrastination: [
    { id: 'pickOpenTask', title: 'Open what I need for one task', icon: 'journal', daypart: 'start', minutes: 2 },
    { id: 'pickTinyFinish', title: 'Finish one small part of a task', icon: 'star', daypart: 'afternoon', minutes: 15 },
    { id: 'pickNameBarrier', title: 'Write down what is making one task hard', icon: 'pencil', daypart: 'evening', minutes: 5 },
    { id: 'pickFirstAction', title: 'Write down the first action for one task', icon: 'pencil', daypart: 'start', minutes: 2 },
    { id: 'pickTwoMinuteStart', title: 'Start one task for just two minutes', icon: 'timer', daypart: 'afternoon', minutes: 2 },
    { id: 'pickReadyTomorrow', title: 'Leave one task ready to start tomorrow', icon: 'journal', daypart: 'evening', minutes: 5 },
  ],
  stress_relief: [
    { id: 'pickBreathsBeforeMessages', title: 'Take three slow breaths before I open messages', icon: 'waves', daypart: 'start', minutes: 1 },
    { id: 'pickLunchAway', title: 'Eat lunch away from my desk', icon: 'coffee-outline', daypart: 'afternoon', minutes: 30 },
    { id: 'pickShoulders', title: 'Stretch my neck and shoulders', icon: 'yoga', daypart: 'afternoon', minutes: 5 },
    { id: 'pickTenMinuteWalk', title: 'Walk for ten minutes', icon: 'walk', daypart: 'afternoon', minutes: 10 },
    { id: 'pickBrainDump', title: 'Write down everything on my mind', icon: 'pencil', daypart: 'evening', minutes: 10 },
    { id: 'pickTomorrowThree', title: 'Pick tomorrow’s top three tonight', icon: 'calendar-check-outline', daypart: 'evening', minutes: 5 },
    { id: 'pickGoodThing', title: 'Write down one good thing from today', icon: 'star', daypart: 'evening', minutes: 2 },
    { id: 'pickNoEmailLate', title: 'No email or news after 9pm', icon: 'moon', daypart: 'bedtime' },
  ],
  calm_fast: [
    { id: 'pickMorningBreaths', title: 'Breathe slowly for two minutes after waking', icon: 'waves', daypart: 'start', minutes: 2 },
    { id: 'pickFiveThings', title: 'Name five things I can see', icon: 'sparkle', daypart: 'afternoon', minutes: 1 },
    { id: 'pickWalkNoPhone', title: 'Walk for ten minutes without my phone', icon: 'walk', daypart: 'afternoon', minutes: 10 },
    { id: 'pickSmallChoice', title: 'Make one small choice and stick with it', icon: 'star', daypart: 'afternoon' },
    { id: 'pickWorrySlot', title: 'Give my worries a ten minute slot', icon: 'timer', daypart: 'evening', minutes: 10 },
    { id: 'pickWorryDown', title: 'Write a worry down, then close the notebook', icon: 'pencil', daypart: 'evening', minutes: 5 },
    { id: 'pickWentFine', title: 'Write down one thing that went fine', icon: 'face-happy', daypart: 'evening', minutes: 2 },
    { id: 'pickPhoneDown', title: 'Put my phone down an hour before bed', icon: 'moon', daypart: 'bedtime' },
  ],
  focus: [
    { id: 'pickTopTaskFirst', title: 'Write my top task before I open my phone', icon: 'pencil', daypart: 'start', minutes: 2 },
    { id: 'pickOneThingBlock', title: 'Work 25 minutes on one thing', icon: 'timer', daypart: 'start', minutes: 25 },
    { id: 'pickCloseTabs', title: 'Close every tab I am not using', icon: 'book', daypart: 'start', minutes: 2 },
    { id: 'pickWaterDesk', title: 'Keep water on my desk', icon: 'waves', daypart: 'start' },
    { id: 'pickHourlyBreak', title: 'Take a five minute break every hour', icon: 'coffee-outline', daypart: 'afternoon' },
    { id: 'pickLunchWalk', title: 'Walk outside at lunch', icon: 'walk', daypart: 'afternoon', minutes: 15 },
    { id: 'pickWhereStopped', title: 'Write where I stopped before I finish work', icon: 'journal', daypart: 'evening', minutes: 2 },
    { id: 'pickTomorrowThree', title: 'Pick tomorrow’s top three tonight', icon: 'calendar-check-outline', daypart: 'evening', minutes: 5 },
  ],
  sleep: [
    { id: 'pickSameWake', title: 'Wake up at the same time every day', icon: 'sunrise', daypart: 'start' },
    { id: 'pickMorningLight', title: 'Get daylight within an hour of waking', icon: 'sun', daypart: 'start', minutes: 10 },
    { id: 'pickNoLateCaffeine', title: 'No caffeine after 2pm', icon: 'coffee-outline', daypart: 'afternoon' },
    { id: 'pickShortNap', title: 'Keep naps under twenty minutes', icon: 'bed-clock', daypart: 'afternoon' },
    { id: 'pickTodoBeforeBed', title: 'Write tomorrow’s to-do before bed', icon: 'pencil', daypart: 'evening', minutes: 5 },
    { id: 'pickDimLights', title: 'Dim the lights an hour before bed', icon: 'lotus', daypart: 'bedtime' },
    { id: 'pickPhoneOutside', title: 'Charge my phone outside the bedroom', icon: 'moon', daypart: 'bedtime' },
    { id: 'pickReadInBed', title: 'Read a few pages in bed', icon: 'book', daypart: 'bedtime', minutes: 15 },
  ],
  energy: [
    { id: 'pickWaterFirst', title: 'Drink a glass of water first thing', icon: 'waves', daypart: 'start', minutes: 1 },
    { id: 'pickProteinBreakfast', title: 'Eat a breakfast with protein', icon: 'sunrise', daypart: 'start', minutes: 15 },
    { id: 'pickAfterLunchWalk', title: 'Take a ten minute walk after lunch', icon: 'walk', daypart: 'afternoon', minutes: 10 },
    { id: 'pickStandHourly', title: 'Stand up and move every hour', icon: 'arrow-up', daypart: 'afternoon' },
    { id: 'pickNoLateCaffeine', title: 'No caffeine after 2pm', icon: 'coffee-outline', daypart: 'afternoon' },
    { id: 'pickStretch', title: 'Stretch for five minutes', icon: 'yoga', daypart: 'afternoon', minutes: 5 },
    { id: 'pickSameBedtime', title: 'Go to bed at the same time each night', icon: 'bed-clock', daypart: 'bedtime' },
    { id: 'pickPhoneDown', title: 'Put my phone down an hour before bed', icon: 'moon', daypart: 'bedtime' },
  ],
  daily_habit: [
    { id: 'pickTwoMinutes', title: 'Start with just two minutes', icon: 'timer', daypart: 'start', minutes: 2 },
    { id: 'pickWithCoffee', title: 'Pair a habit with my morning coffee', icon: 'coffee-outline', daypart: 'start' },
    { id: 'pickWaterFirst', title: 'Drink a glass of water first thing', icon: 'waves', daypart: 'start', minutes: 1 },
    { id: 'pickTenMinuteWalk', title: 'Walk for ten minutes', icon: 'walk', daypart: 'afternoon', minutes: 10 },
    { id: 'pickReadPages', title: 'Read ten pages', icon: 'book', daypart: 'evening', minutes: 15 },
    { id: 'pickOneLine', title: 'Write one line about my day', icon: 'pencil', daypart: 'evening', minutes: 2 },
    { id: 'pickLayOut', title: 'Lay out what I need the night before', icon: 'home', daypart: 'evening', minutes: 5 },
    { id: 'pickTickToday', title: 'Tick off today before bed', icon: 'calendar-check-outline', daypart: 'bedtime', minutes: 2 },
  ],
  cleaning: [
    { id: 'pickMakeMyBed', title: 'Make my bed', icon: 'home', daypart: 'start', minutes: 2 },
    { id: 'pickBathroomSink', title: 'Wipe the bathroom sink', icon: 'sparkle', daypart: 'start', minutes: 2 },
    { id: 'pickLaundryLoad', title: 'Start one load of laundry', icon: 'todo-hamper', daypart: 'afternoon', minutes: 5 },
    { id: 'pickOneDrawer', title: 'Clear out one drawer', icon: 'star', daypart: 'afternoon', minutes: 15 },
    { id: 'pickTenMinuteTidy', title: 'Do a ten minute tidy', icon: 'timer', daypart: 'evening', minutes: 10 },
    { id: 'pickByTheDoor', title: 'Put away what is by the door', icon: 'bell', daypart: 'evening', minutes: 5 },
    { id: 'pickEmptySink', title: 'Leave the kitchen sink empty at night', icon: 'todo-counter', daypart: 'bedtime', minutes: 10 },
  ],
};

const normalized = (title: string) => title.trim().toLowerCase();

/** Their goal's habits, the recommended one first and never repeated below it. */
export function habitPicksFor(
  intent: OnboardingIntent | null,
  recommended: StarterPlanItem | null,
): StarterPlanItem[] {
  const picks = (intent == null ? undefined : BY_INTENT[intent]) ?? GENERAL;
  const rest = picks
    .filter(
      (pick) =>
        recommended == null ||
        (pick.id !== recommended.id && normalized(pick.title) !== normalized(recommended.title)),
    )
    .map((pick, index) => ({
      ...pick,
      accent: accents[index % accents.length],
      because: null,
    }));
  return recommended == null ? rest : [recommended, ...rest];
}
