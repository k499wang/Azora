/**
 * What a day asks for, and how the things that ask contribute to it.
 *
 * A day used to be a fixed pair of exercises, so the count was a constant. It
 * is now a list assembled from several unrelated sources — the plan's exercises,
 * the check-in, a lesson on the days that have one — and the only thing they
 * have in common is this shape.
 *
 * The contract is deliberately narrow. A source knows how to load its own rows
 * and nothing about the day it joins; the day knows how to count rows and
 * nothing about where they came from. That is what lets a new kind of row be a
 * new file rather than an edit to everything that counts one.
 */

export type DayUnitKind = 'exercise' | 'mood' | 'lesson';

export interface DayUnit {
  /** Which kind of thing this is, for a screen that draws them differently. */
  kind: DayUnitKind;
  /** Unique within the day: the plan's activity id, or the row's own id. */
  id: string;
  /** What the row is called, in the words Home uses. */
  title: string;
  /** Null for anything a breathing session cannot prove, like the check-in. */
  techniqueId: string | null;
  completed: boolean;
}

/**
 * One source's contribution to today.
 *
 * `isLoading` and `isSettling` are separate because they gate different things.
 * `isLoading` is a first load: the day's *size* is not known yet, so nothing may
 * be counted. `isSettling` is a refetch over data already held: the size is
 * known but a value may be about to change, so nothing may be *snapshotted* —
 * a reward that appears and then retracts is worse than one that arrives late.
 */
export interface DayUnitSource {
  units: readonly DayUnit[];
  isLoading: boolean;
  isSettling: boolean;
}

export const EMPTY_DAY_UNIT_SOURCE: DayUnitSource = {
  units: [],
  isLoading: false,
  isSettling: false,
};

/**
 * Every source's rows, in the order the sources were given.
 *
 * Order here is the order the day runs, not an opinion about importance — the
 * arrangement the user drags into is a separate preference, reconciled against
 * this in `todayJourneyOrder`.
 *
 * Loading is the union: a day with one source still loading has an unknown
 * length, and counting it would report a fraction of a day as the whole of it.
 */
export function mergeDayUnitSources(
  sources: readonly DayUnitSource[],
): DayUnitSource {
  return {
    units: sources.flatMap((source) => source.units),
    isLoading: sources.some((source) => source.isLoading),
    isSettling: sources.some((source) => source.isSettling),
  };
}

export function countCompletedDayUnits(units: readonly DayUnit[]): number {
  return units.filter((unit) => unit.completed).length;
}

export function dayUnitsOfKind(
  units: readonly DayUnit[],
  kind: DayUnitKind,
): readonly DayUnit[] {
  return units.filter((unit) => unit.kind === kind);
}

/** Whether finishing this unit is what completes the day. */
export function isLastUnfinishedDayUnit(
  units: readonly DayUnit[],
  id: string,
): boolean {
  const unit = units.find((candidate) => candidate.id === id);
  return (
    unit != null &&
    !unit.completed &&
    units.every((candidate) => candidate.completed || candidate.id === id)
  );
}
