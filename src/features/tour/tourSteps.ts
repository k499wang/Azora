export type TourTargetId = 'dailies' | 'extraPractice';

export type TourTab = 'Home';

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
    body: "Start here. Finish today's three and your room gets its next piece.",
  },
  {
    target: 'extraPractice',
    tab: 'Home',
    body: 'Not sure what you need? Pick a reset that matches how you feel.',
  },
];
