import { useTodayLocalDate } from './useTodayLocalDate';
import { useDailiesForcedComplete } from './devDailiesOverride';
import {
  countCompletedDayUnits,
  mergeDayUnitSources,
  type DayUnit,
} from './dayUnits/dayUnit';
import { useExerciseDayUnits } from './dayUnits/useExerciseDayUnits';
import { useMoodDayUnit } from './dayUnits/useMoodDayUnit';
import type { BreathingTechnique } from '../features/exercise/guidedBreathing/techniques';

export type { DayUnit } from './dayUnits/dayUnit';
export { MOOD_CHECK_IN_UNIT_ID } from './dayUnits/useMoodDayUnit';

export interface DailiesCompletion {
  todayLocalDate: string;
  /** Everything today asks for, in the order the day runs. */
  units: readonly DayUnit[];
  dailiesDone: number;
  dailiesTotal: number;
  guidedTechnique: BreathingTechnique | null;
  guidedTechniqueLoading: boolean;
  handPickedTechnique: BreathingTechnique | null;
  handPickedTechniqueLoading: boolean;
  guidedCompleted: boolean;
  handPickedCompleted: boolean;
  allCompleted: boolean;
  isLoading: boolean;
  /**
   * True while completion data is being refetched over data we already have.
   * `isLoading` cannot answer this — it only covers a first load — so a screen
   * opened right after finishing a session sees the *previous* counts and
   * reports itself ready. Anything that snapshots completion waits for this.
   */
  isSettling: boolean;
}

/**
 * Whether today's dailies are done, and what they are.
 *
 * Home renders these; the room's earn rule turns on `allCompleted`; the
 * post-session screens ask whether the session they just finished was the last
 * one. Resolving it in one place keeps those answers from drifting.
 *
 * This hook composes; it does not fetch. Each kind of row owns its own loading
 * in `dayUnits/`, and the day is their rows end to end. It used to hold every
 * query itself, which meant a new kind of row was an edit here — another query,
 * another term in `isLoading`, another term in `isSettling`, another guard —
 * and the file that everything counting a day depends on grew a little more
 * frightening each time. Adding a row is now a file in `dayUnits/` and one line
 * below.
 */
export function useDailiesCompletion(userId: string | null): DailiesCompletion {
  const todayLocalDate = useTodayLocalDate();
  // Dev lab only, and `useDailiesForcedComplete` returns false in release
  // builds. Applied to the units rather than to `allCompleted`, so every
  // surface that counts them agrees with the one that gates the reward.
  const forced = useDailiesForcedComplete();

  const exercises = useExerciseDayUnits(userId, todayLocalDate, forced);
  const mood = useMoodDayUnit(userId, todayLocalDate, forced);

  const day = mergeDayUnitSources([exercises, mood]);
  const dailiesDone = countCompletedDayUnits(day.units);

  return {
    todayLocalDate,
    units: day.units,
    dailiesDone,
    dailiesTotal: day.units.length,
    guidedTechnique: exercises.guidedTechnique,
    guidedTechniqueLoading: exercises.guidedTechniqueLoading,
    handPickedTechnique: exercises.handPickedTechnique,
    handPickedTechniqueLoading: exercises.handPickedTechniqueLoading,
    guidedCompleted: exercises.guidedCompleted,
    handPickedCompleted: exercises.handPickedCompleted,
    isSettling: day.isSettling,
    allCompleted:
      !day.isLoading &&
      userId != null &&
      day.units.length > 0 &&
      dailiesDone === day.units.length,
    isLoading: day.isLoading,
  };
}
