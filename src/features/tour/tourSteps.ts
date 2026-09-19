export type TourTargetId =
  | 'dailies'
  | 'firstDailyPlay'
  | 'firstSessionStart'
  | 'resultDone'
  | 'roomProgress'
  | 'measureHeart'
  | 'startHeartMeasurement';

export type TourDestination =
  | { route: 'MainTabs'; screen: 'Home' }
  | { route: 'Heart' };

export interface TourStep {
  /** the element Mochi points at; registered with `useTourTarget` */
  target: TourTargetId;
  /** the registered screen that has to be showing before this step can be measured */
  destination: TourDestination;
  /** Mochi's single line — he says one thing per stop */
  body: string;
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
    target: 'measureHeart',
    destination: { route: 'MainTabs', screen: 'Home' },
    body: 'Tap the heart to open your Heart page and see your readings.',
  },
  // Named, not instructed. The overlay swallows every tap to advance itself, so
  // a stop that says "tap this" is asking for the one press that cannot work.
  {
    target: 'startHeartMeasurement',
    destination: { route: 'Heart' },
    body: 'The plus button is where a heart-rate reading starts.',
  },
];
