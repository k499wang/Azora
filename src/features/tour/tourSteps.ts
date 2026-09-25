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
    body: 'This is your plan! Tap anything to start it, or tick off a to-do once it’s done.',
  },
  // Straight after the list it is about: the card is what the list is *for*,
  // and it stands directly above it, so this stop barely moves the page.
  {
    target: 'roomProgress',
    destination: { route: 'MainTabs', screen: 'Home' },
    body: 'Finish today’s plan and you’ll unlock a new decoration for your room!',
  },
  {
    target: 'routineAddHabit',
    destination: { route: 'MainTabs', screen: 'Plan' },
    body: 'Want a new habit? Add it to your routine with this plus button.',
  },
  {
    target: 'azoraScore',
    destination: { route: 'MainTabs', screen: 'Insights' },
    body: 'Your Azora Score shows how well you’re keeping up with your plan.',
  },
  {
    target: 'azoToolkit',
    destination: { route: 'MainTabs', screen: 'Explore' },
    body: 'My toolkit breaks big cleanups into small, doable steps.',
  },
  {
    target: 'measureHeart',
    destination: { route: 'MainTabs', screen: 'Home' },
    body: 'Your heart readings live right here.',
  },
  // Named, not instructed. The overlay swallows every tap to advance itself, so
  // a stop that says "tap this" is asking for the one press that cannot work.
  {
    target: 'startHeartMeasurement',
    destination: { route: 'Heart' },
    body: 'Every heart reading starts with this plus button.',
  },
  // The tour ends by starting the plan rather than describing it. The row's
  // own action runs, so the lesson opens exactly as it would from Home.
  {
    target: 'firstLesson',
    destination: { route: 'MainTabs', screen: 'Home' },
    body: 'Let’s start here! Tap play and I’ll show you how your plan works.',
    finishOn: 'press',
  },
];
