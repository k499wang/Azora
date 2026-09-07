export type TourTargetId =
  | 'dailies'
  | 'todos'
  | 'extraPractice'
  | 'seeAll'
  | 'measureHeart';

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
    body: 'Start here! Finish your daily exercises to earn a new piece for your room.',
  },
  {
    target: 'todos',
    tab: 'Home',
    body: 'And here are your to-dos! Tick one off whenever you get to it. Little ones count too.',
  },
  {
    target: 'extraPractice',
    tab: 'Home',
    body: 'Want something different? Pick an exercise that matches how you feel.',
  },
  {
    target: 'seeAll',
    tab: 'Home',
    body: 'Looking for more? Tap See all to explore every exercise.',
  },
  {
    target: 'measureHeart',
    tab: 'Home',
    body: 'Measure your heart rate here. We will show you how before the reading starts.',
  },
];
