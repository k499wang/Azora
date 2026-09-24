export type TourTargetId =
  | 'dailies'
  | 'firstLesson'
  | 'roomProgress'
  | 'measureHeart'
  | 'startHeartMeasurement'
  | 'routineAddHabit'
  | 'azoraScore'
  | 'azoToolkit';

export type TourDestination =
  | {
      route: 'MainTabs';
      screen: 'Home' | 'Plan' | 'Insights' | 'Explore' | 'Profile';
    }
  | { route: 'Heart' };

export interface TourStep {
  /** the element Mochi points at; registered with `useTourTarget` */
  target: TourTargetId;
  /** the registered screen that has to be showing before this step can be measured */
  destination: TourDestination;
  /** Mochi's single line — he says one thing per stop */
  body: string;
  /**
   * `press` — the stop is finished on the highlighted control, which does what
   * it always does, and the rest of the screen stays inert. It ends the tour,
   * so only the last stop can be one. A press stop that cannot be placed is
   * passed over rather than aborting the tour: every stop before it was seen.
   *
   * Left out, a tap anywhere moves the tour on.
   */
  finishOn?: 'press';
}

/**
 * The whole tour. Adding a stop is one entry here plus a `useTourTarget` call
 * on the element it points at; nothing else needs to change.
 */
export const tourSteps: readonly TourStep[] = [
  {
    target: 'dailies',
    destination: { route: 'MainTabs', screen: 'Home' },
    body: 'This is your plan. Tap anything to start it, or tick off a to-do when it’s done.',
  },
  // Straight after the list it is about: the card is what the list is *for*,
  // and it stands directly above it, so this stop barely moves the page.
  {
    target: 'roomProgress',
    destination: { route: 'MainTabs', screen: 'Home' },
    body: 'Finish your plan for the day to unlock a new decoration for your room.',
  },
  {
    target: 'routineAddHabit',
    destination: { route: 'MainTabs', screen: 'Plan' },
    body: 'Use this plus button to add a habit to your routine.',
  },
  {
    target: 'azoraScore',
    destination: { route: 'MainTabs', screen: 'Insights' },
    body: 'Your Azora Score shows how consistently you are keeping your plan.',
  },
  {
    target: 'azoToolkit',
    destination: { route: 'MainTabs', screen: 'Explore' },
    body: 'Azo’s toolkit helps you clean rooms by breaking the work into small steps.',
  },
  {
    target: 'measureHeart',
    destination: { route: 'MainTabs', screen: 'Home' },
    body: 'Your heart readings live here.',
  },
  // Named, not instructed. The overlay swallows every tap to advance itself, so
  // a stop that says "tap this" is asking for the one press that cannot work.
  {
    target: 'startHeartMeasurement',
    destination: { route: 'Heart' },
    body: 'The plus button is where a heart-rate reading starts.',
  },
  // The tour ends by starting the plan rather than describing it. The row's
  // own action runs, so the lesson opens exactly as it would from Home.
  {
    target: 'firstLesson',
    destination: { route: 'MainTabs', screen: 'Home' },
    body: 'Start here! Tap play to learn how your plan works.',
    finishOn: 'press',
  },
];
