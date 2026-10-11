export type TourTargetId =
  | 'dailies'
  | 'firstLesson'
  | 'roomProgress'
  | 'roomPiece'
  | 'measureHeart'
  | 'startHeartMeasurement'
  | 'routineOverview'
  | 'routineAddHabit'
  | 'azoraScore'
  | 'planWeeks'
  | 'azoToolkit';

export type TourDestination =
  | {
      route: 'MainTabs';
      screen: 'Home' | 'Plan' | 'Insights' | 'Explore' | 'Profile';
    }
  | { route: 'Heart' };

export interface TourStep {
  /** the element Azo points at; registered with `useTourTarget` */
  target: TourTargetId;
  /** the registered screen that has to be showing before this step can be measured */
  destination: TourDestination;
  /** Azo's single line — he says one thing per stop */
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
  // Stay on Home: show progress, its room reward, then start the lesson.
  {
    target: 'roomProgress',
    destination: { route: 'MainTabs', screen: 'Home' },
    body: 'This shows how many steps you’ve finished today.',
  },
  // The reward stop covers the whole path — the list of today's steps — rather
  // than the room the piece lands in: those steps are what earns the piece, and
  // the room above them is scenery the user cannot act on.
  {
    target: 'dailies',
    destination: { route: 'MainTabs', screen: 'Home' },
    body: 'Finish the whole path to unlock a new piece for your room!',
  },
  // The tour ends by starting the plan rather than describing it. The row's
  // own action runs, so the lesson opens exactly as it would from Home.
  {
    target: 'firstLesson',
    destination: { route: 'MainTabs', screen: 'Home' },
    body: 'Let’s take your first small step. Tap play to begin.',
    finishOn: 'press',
  },
];
