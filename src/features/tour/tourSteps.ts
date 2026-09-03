export type TourTargetId =
  | 'dailies'
  | 'measureHeart';

export type TourTab = 'Home' | 'Heart';

export interface TourStep {
  /** the element Mochi points at; registered with `useTourTarget` */
  target: TourTargetId;
  /** the tab that has to be showing before this step can be measured */
  tab: TourTab;
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
    tab: 'Home',
    body: 'Start here! Finish your three daily resets to earn a new piece for your room.',
  },
  {
    target: 'measureHeart',
    tab: 'Heart',
    body: 'This is where you can track your heart rate. Tap + to take a measurement and see how your body responds over time.',
  },
];
