export type TourTargetId =
  | 'dailies'
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
    body: 'Tap a daily to start it, or tick off a to-do when it’s done.',
  },
  {
    target: 'measureHeart',
    destination: { route: 'MainTabs', screen: 'Home' },
    body: 'Tap the heart to open your Heart page and see your readings.',
  },
  {
    target: 'startHeartMeasurement',
    destination: { route: 'Heart' },
    body: 'Tap the plus button to start a heart-rate reading.',
  },
];
