import { colors } from '../theme/colors';
import type { OnboardingIntent } from '../features/exercise/guidedBreathing/techniqueSelection';
import type { StarterPlanItem } from './onboardingStarterPlan';

/**
 * The open menu after the swipe deck: habits for the goal they chose that the
 * deck did not already offer, any of which they can add to their routine.
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
  { id: 'pickWaterFirst', title: 'Drink a glass of water first thing', icon: 'waves', daypart: 'start' },
  { id: 'pickStepOutside', title: 'Step outside for five minutes', icon: 'weather-windy', daypart: 'afternoon' },
  { id: 'pickTenMinuteWalk', title: 'Walk for ten minutes', icon: 'walk', daypart: 'afternoon' },
  { id: 'pickStretch', title: 'Stretch for five minutes', icon: 'yoga', daypart: 'afternoon' },
  { id: 'pickReadPages', title: 'Read ten pages', icon: 'book', daypart: 'evening' },
  { id: 'pickOneLine', title: 'Write one line about my day', icon: 'pencil', daypart: 'evening' },
  { id: 'pickPhoneDown', title: 'Put my phone down an hour before bed', icon: 'moon', daypart: 'bedtime' },
];

const BY_INTENT: Partial<Record<OnboardingIntent, HabitPick[]>> = {
  stress_relief: [
    { id: 'pickBreathsBeforeMessages', title: 'Take three slow breaths before I open messages', icon: 'waves', daypart: 'start' },
    { id: 'pickLunchAway', title: 'Eat lunch away from my desk', icon: 'coffee-outline', daypart: 'afternoon' },
    { id: 'pickShoulders', title: 'Stretch my neck and shoulders', icon: 'yoga', daypart: 'afternoon' },
    { id: 'pickTenMinuteWalk', title: 'Walk for ten minutes', icon: 'walk', daypart: 'afternoon' },
    { id: 'pickBrainDump', title: 'Write down everything on my mind', icon: 'pencil', daypart: 'evening' },
    { id: 'pickTomorrowThree', title: 'Pick tomorrow’s top three tonight', icon: 'calendar-check-outline', daypart: 'evening' },
    { id: 'pickGoodThing', title: 'Write down one good thing from today', icon: 'star', daypart: 'evening' },
    { id: 'pickNoEmailLate', title: 'No email or news after 9pm', icon: 'moon', daypart: 'bedtime' },
  ],
  calm_fast: [
    { id: 'pickMorningBreaths', title: 'Breathe slowly for two minutes after waking', icon: 'waves', daypart: 'start' },
    { id: 'pickFiveThings', title: 'Name five things I can see', icon: 'sparkle', daypart: 'afternoon' },
    { id: 'pickWalkNoPhone', title: 'Walk for ten minutes without my phone', icon: 'walk', daypart: 'afternoon' },
    { id: 'pickSmallChoice', title: 'Make one small choice and stick with it', icon: 'star', daypart: 'afternoon' },
    { id: 'pickWorrySlot', title: 'Give my worries a ten minute slot', icon: 'timer', daypart: 'evening' },
    { id: 'pickWorryDown', title: 'Write a worry down, then close the notebook', icon: 'pencil', daypart: 'evening' },
    { id: 'pickWentFine', title: 'Write down one thing that went fine', icon: 'face-happy', daypart: 'evening' },
    { id: 'pickPhoneDown', title: 'Put my phone down an hour before bed', icon: 'moon', daypart: 'bedtime' },
  ],
  focus: [
    { id: 'pickTopTaskFirst', title: 'Write my top task before I open my phone', icon: 'pencil', daypart: 'start' },
    { id: 'pickOneThingBlock', title: 'Work 25 minutes on one thing', icon: 'timer', daypart: 'start' },
    { id: 'pickCloseTabs', title: 'Close every tab I am not using', icon: 'book', daypart: 'start' },
    { id: 'pickWaterDesk', title: 'Keep water on my desk', icon: 'waves', daypart: 'start' },
    { id: 'pickHourlyBreak', title: 'Take a five minute break every hour', icon: 'coffee-outline', daypart: 'afternoon' },
    { id: 'pickLunchWalk', title: 'Walk outside at lunch', icon: 'walk', daypart: 'afternoon' },
    { id: 'pickWhereStopped', title: 'Write where I stopped before I finish work', icon: 'pencil', daypart: 'evening' },
    { id: 'pickTomorrowThree', title: 'Pick tomorrow’s top three tonight', icon: 'calendar-check-outline', daypart: 'evening' },
  ],
  sleep: [
    { id: 'pickSameWake', title: 'Wake up at the same time every day', icon: 'sunrise', daypart: 'start' },
    { id: 'pickMorningLight', title: 'Get daylight within an hour of waking', icon: 'sun', daypart: 'start' },
    { id: 'pickNoLateCaffeine', title: 'No caffeine after 2pm', icon: 'coffee-outline', daypart: 'afternoon' },
    { id: 'pickShortNap', title: 'Keep naps under twenty minutes', icon: 'bed-clock', daypart: 'afternoon' },
    { id: 'pickTodoBeforeBed', title: 'Write tomorrow’s to-do before bed', icon: 'pencil', daypart: 'evening' },
    { id: 'pickDimLights', title: 'Dim the lights an hour before bed', icon: 'lotus', daypart: 'bedtime' },
    { id: 'pickPhoneOutside', title: 'Charge my phone outside the bedroom', icon: 'moon', daypart: 'bedtime' },
    { id: 'pickReadInBed', title: 'Read a few pages in bed', icon: 'book', daypart: 'bedtime' },
  ],
  energy: [
    { id: 'pickWaterFirst', title: 'Drink a glass of water first thing', icon: 'waves', daypart: 'start' },
    { id: 'pickProteinBreakfast', title: 'Eat a breakfast with protein', icon: 'coffee-outline', daypart: 'start' },
    { id: 'pickAfterLunchWalk', title: 'Take a ten minute walk after lunch', icon: 'walk', daypart: 'afternoon' },
    { id: 'pickStandHourly', title: 'Stand up and move every hour', icon: 'arrow-up', daypart: 'afternoon' },
    { id: 'pickNoLateCaffeine', title: 'No caffeine after 2pm', icon: 'coffee-outline', daypart: 'afternoon' },
    { id: 'pickStretch', title: 'Stretch for five minutes', icon: 'yoga', daypart: 'afternoon' },
    { id: 'pickSameBedtime', title: 'Go to bed at the same time each night', icon: 'bed-clock', daypart: 'bedtime' },
    { id: 'pickPhoneDown', title: 'Put my phone down an hour before bed', icon: 'moon', daypart: 'bedtime' },
  ],
  daily_habit: [
    { id: 'pickTwoMinutes', title: 'Start with just two minutes', icon: 'timer', daypart: 'start' },
    { id: 'pickWithCoffee', title: 'Pair a habit with my morning coffee', icon: 'coffee-outline', daypart: 'start' },
    { id: 'pickWaterFirst', title: 'Drink a glass of water first thing', icon: 'waves', daypart: 'start' },
    { id: 'pickTenMinuteWalk', title: 'Walk for ten minutes', icon: 'walk', daypart: 'afternoon' },
    { id: 'pickReadPages', title: 'Read ten pages', icon: 'book', daypart: 'evening' },
    { id: 'pickOneLine', title: 'Write one line about my day', icon: 'pencil', daypart: 'evening' },
    { id: 'pickLayOut', title: 'Lay out what I need the night before', icon: 'home', daypart: 'evening' },
    { id: 'pickTickToday', title: 'Tick off today before bed', icon: 'calendar-check-outline', daypart: 'bedtime' },
  ],
  cleaning: [
    { id: 'pickMakeMyBed', title: 'Make my bed', icon: 'home', daypart: 'start' },
    { id: 'pickBathroomSink', title: 'Wipe the bathroom sink', icon: 'sparkle', daypart: 'start' },
    { id: 'pickLaundryLoad', title: 'Start one load of laundry', icon: 'todo-hamper', daypart: 'afternoon' },
    { id: 'pickOneDrawer', title: 'Clear out one drawer', icon: 'home', daypart: 'afternoon' },
    { id: 'pickTenMinuteTidy', title: 'Do a ten minute tidy', icon: 'timer', daypart: 'evening' },
    { id: 'pickByTheDoor', title: 'Put away what is by the door', icon: 'home', daypart: 'evening' },
    { id: 'pickEmptySink', title: 'Leave the kitchen sink empty at night', icon: 'todo-counter', daypart: 'bedtime' },
  ],
};

const normalized = (title: string) => title.trim().toLowerCase();

/** Their goal's habits, minus anything the deck already put in front of them. */
export function habitPicksFor(
  intent: OnboardingIntent | null,
  deck: readonly StarterPlanItem[],
): StarterPlanItem[] {
  const shownIds = new Set(deck.map((item) => item.id));
  const shownTitles = new Set(deck.map((item) => normalized(item.title)));
  const picks = (intent == null ? undefined : BY_INTENT[intent]) ?? GENERAL;
  return picks
    .filter((pick) => !shownIds.has(pick.id) && !shownTitles.has(normalized(pick.title)))
    .map((pick, index) => ({
      ...pick,
      accent: accents[index % accents.length],
      because: null,
    }));
}
