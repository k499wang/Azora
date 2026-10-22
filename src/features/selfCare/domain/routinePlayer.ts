import { selfCareGoalCoins, type SelfCareGoal } from './selfCareGoal';

export type RoutineStepOutcome = 'done' | 'skipped';

export interface RoutinePlayerState {
  steps: SelfCareGoal[];
  index: number;
  outcomes: (RoutineStepOutcome | null)[];
  extraMinutes: number[];
}

export type RoutinePlayerAction =
  | { type: 'complete' }
  | { type: 'skip' }
  | { type: 'addMinute' }
  | { type: 'removeMinute' }
  /** reorders the steps not yet finished, the one playing included; finished ones stay put */
  | { type: 'moveUpcoming'; from: number; to: number };

export interface RoutinePlayerSummary {
  done: number;
  skipped: number;
  total: number;
  /** what the finished steps earned, as the completion trigger credits them */
  coins: number;
  /** the finished steps' lengths added up; null when one of them had none */
  minutes: number | null;
}

/** The goals to play, in the order given, leaving out any that are gone or already done today. */
export function buildRoutinePlayerSteps(
  goals: readonly SelfCareGoal[],
  goalIds: readonly string[],
): SelfCareGoal[] {
  const byId = new Map(goals.map((goal) => [goal.id, goal]));
  const steps: SelfCareGoal[] = [];
  for (const id of new Set(goalIds)) {
    const goal = byId.get(id);
    if (goal != null && !goal.completedToday) steps.push(goal);
  }
  return steps;
}

export function createRoutinePlayerState(
  steps: SelfCareGoal[],
): RoutinePlayerState {
  return {
    steps,
    index: 0,
    outcomes: steps.map(() => null),
    extraMinutes: steps.map(() => 0),
  };
}

/** Minutes the step at `index` runs for, or null when it has no set length. */
export function routineStepMinutes(
  state: RoutinePlayerState,
  index: number,
): number | null {
  const base = state.steps[index]?.durationMinutes ?? null;
  if (base == null) return null;
  return base + state.extraMinutes[index];
}

export function routinePlayerReducer(
  state: RoutinePlayerState,
  action: RoutinePlayerAction,
): RoutinePlayerState {
  if (isRoutinePlayerFinished(state)) return state;
  const { index } = state;

  switch (action.type) {
    case 'complete':
    case 'skip': {
      const outcomes = [...state.outcomes];
      outcomes[index] = action.type === 'complete' ? 'done' : 'skipped';
      return { ...state, outcomes, index: index + 1 };
    }
    case 'addMinute':
    case 'removeMinute': {
      const minutes = routineStepMinutes(state, index);
      if (minutes == null) return state;
      const delta = action.type === 'addMinute' ? 1 : -1;
      if (minutes + delta < 1) return state;
      const extraMinutes = [...state.extraMinutes];
      extraMinutes[index] += delta;
      return { ...state, extraMinutes };
    }
    case 'moveUpcoming': {
      const { from, to } = action;
      const last = state.steps.length - 1;
      if (from === to || from < index || to < index || from > last || to > last) {
        return state;
      }
      const move = <T,>(list: readonly T[]): T[] => {
        const next = [...list];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        return next;
      };
      return {
        ...state,
        steps: move(state.steps),
        outcomes: move(state.outcomes),
        extraMinutes: move(state.extraMinutes),
      };
    }
  }
}

export function isRoutinePlayerFinished(state: RoutinePlayerState): boolean {
  return state.index >= state.steps.length;
}

export function currentRoutineStep(state: RoutinePlayerState): SelfCareGoal | null {
  return state.steps[state.index] ?? null;
}

export function nextRoutineStep(state: RoutinePlayerState): SelfCareGoal | null {
  return state.steps[state.index + 1] ?? null;
}

export function routinePlayerSummary(
  state: RoutinePlayerState,
): RoutinePlayerSummary {
  const doneIndexes = state.outcomes.flatMap((outcome, index) =>
    outcome === 'done' ? [index] : [],
  );
  const lengths = doneIndexes.map((index) => routineStepMinutes(state, index));
  return {
    done: doneIndexes.length,
    skipped: state.outcomes.filter((outcome) => outcome === 'skipped').length,
    total: state.steps.length,
    coins: doneIndexes.reduce(
      (sum, index) => sum + selfCareGoalCoins(state.steps[index].recurrence),
      0,
    ),
    minutes: lengths.some((length) => length == null)
      ? null
      : lengths.reduce<number>((sum, length) => sum + (length ?? 0), 0),
  };
}

/** "mm:ss" for a count of whole seconds. */
export function routineStepClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(whole / 60))}:${pad(whole % 60)}`;
}

/**
 * When the routine will end if every step left runs its full length, or null
 * when any of them is open-ended and there is no honest answer.
 */
export function routineAllEndsAt(
  state: RoutinePlayerState,
  nowMs: number,
  currentRemainingMs: number,
): number | null {
  if (isRoutinePlayerFinished(state)) return null;
  if (routineStepMinutes(state, state.index) == null) return null;
  let endMs = nowMs + Math.max(0, currentRemainingMs);
  for (let index = state.index + 1; index < state.steps.length; index += 1) {
    const minutes = routineStepMinutes(state, index);
    if (minutes == null) return null;
    endMs += minutes * 60_000;
  }
  return endMs;
}

/** "4:30am" for a moment, in local time. */
export function routineTimeOfDay(ms: number): string {
  const date = new Date(ms);
  const hour24 = date.getHours();
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour12}:${minute}${hour24 < 12 ? 'am' : 'pm'}`;
}

export const ROUTINE_TIME_UP_LINE = "Time's up.";
export const ROUTINE_FINISHED_LINE = 'Routine done.';

/** What the voice guide says as a step comes up, e.g. "Last one. Make bed. 2 minutes." */
export function routineStepAnnouncement(
  step: Pick<SelfCareGoal, 'title'>,
  minutes: number | null,
  isLast: boolean,
): string {
  const title = step.title.trim().replace(/[.!?]+$/, '');
  const length =
    minutes == null ? '' : ` ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`;
  return `${isLast ? 'Last one. ' : ''}${title}.${length}`;
}
