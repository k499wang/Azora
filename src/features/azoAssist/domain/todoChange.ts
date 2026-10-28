import type { SelfCareGoalDraft } from '../../../services/selfCare/selfCareService';
import {
  SELF_CARE_GOAL_DAYPARTS,
  normalizeSelfCareGoalTitle,
  resolveSelfCareGoalDuration,
  selfCareGoalDaypart,
  selfCareGoalDaypartLabel,
  selfCareGoalDaypartTime,
  selfCareGoalRecurrenceLabel,
  type SelfCareGoal,
} from '../../selfCare/domain/selfCareGoal';

/** One of today's to-dos as Azo sees it, under a short ref it points back at. */
export interface TodoRef {
  ref: string;
  title: string;
  daypart: string | null;
  minutes: number | null;
  repeats: boolean;
  done: boolean;
}

/**
 * A change Azo proposed to a to-do they already have. Nothing changes until
 * they tap to apply it; `draft` is the whole row as it would be saved.
 */
export type TodoChange =
  | { kind: 'remove'; goal: SelfCareGoal }
  | { kind: 'update'; goal: SelfCareGoal; draft: SelfCareGoalDraft };

/** Refs are numbered per request, so they always point at the list as it was sent. */
export function todoRefsFor(goals: readonly SelfCareGoal[]): { refs: TodoRef[]; goalsByRef: Map<string, SelfCareGoal> } {
  const goalsByRef = new Map<string, SelfCareGoal>();
  const refs = goals.slice(0, 30).map((goal, index) => {
    const ref = `t${index + 1}`;
    goalsByRef.set(ref, goal);
    return {
      ref,
      title: goal.title,
      daypart: selfCareGoalDaypart(goal.scheduledTime),
      minutes: goal.durationMinutes,
      repeats: goal.recurrence !== 'once',
      done: goal.completedToday,
    };
  });
  return { refs, goalsByRef };
}

/** The server already checked these; the app checks again against the list it sent. */
export function parseTodoChanges(value: unknown, goalsByRef: ReadonlyMap<string, SelfCareGoal>): TodoChange[] {
  if (!Array.isArray(value)) return [];
  const touched = new Set<string>();
  return value.flatMap((item): TodoChange[] => {
    if (item == null || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const goal = typeof record.ref === 'string' ? goalsByRef.get(record.ref) : undefined;
    if (goal == null || goal.completedToday || touched.has(goal.id)) return [];

    if (record.action === 'remove') {
      touched.add(goal.id);
      return [{ kind: 'remove', goal }];
    }
    if (record.action !== 'update') return [];

    const title = typeof record.title === 'string' ? normalizeSelfCareGoalTitle(record.title) : null;
    const daypart = SELF_CARE_GOAL_DAYPARTS.find((part) => part.id === record.daypart)?.id;
    const minutes = typeof record.minutes === 'number' ? resolveSelfCareGoalDuration(record.minutes) : null;
    const draft: SelfCareGoalDraft = {
      title: title ?? goal.title,
      icon: goal.icon,
      recurrence: goal.recurrence,
      scheduledTime: daypart == null || daypart === selfCareGoalDaypart(goal.scheduledTime)
        ? goal.scheduledTime
        : selfCareGoalDaypartTime(daypart),
      durationMinutes: minutes ?? goal.durationMinutes,
    };
    if (
      draft.title === goal.title &&
      draft.scheduledTime === goal.scheduledTime &&
      draft.durationMinutes === goal.durationMinutes
    ) {
      return [];
    }
    touched.add(goal.id);
    return [{ kind: 'update', goal, draft }];
  });
}

/** Removing a repeat takes it off every day, not just today. */
export function removesRepeat(change: TodoChange): boolean {
  return change.kind === 'remove' && change.goal.recurrence !== 'once';
}

export function todoChangeTitle(change: TodoChange): string {
  return change.kind === 'remove' ? change.goal.title : change.draft.title;
}

export function todoChangeDetail(change: TodoChange): string {
  if (change.kind === 'remove') {
    return removesRepeat(change)
      ? `Remove · ${selfCareGoalRecurrenceLabel(change.goal.recurrence)}, so it leaves every day`
      : 'Remove from today';
  }
  const { goal, draft } = change;
  const parts: string[] = [];
  if (draft.title !== goal.title) parts.push(`Was “${goal.title}”`);
  if (draft.scheduledTime !== goal.scheduledTime) {
    parts.push(`${selfCareGoalDaypartLabel(goal.scheduledTime)} to ${selfCareGoalDaypartLabel(draft.scheduledTime)}`);
  }
  if (draft.durationMinutes !== goal.durationMinutes) {
    parts.push(goal.durationMinutes == null
      ? `${draft.durationMinutes} min`
      : `${goal.durationMinutes} to ${draft.durationMinutes} min`);
  }
  return parts.join(' · ');
}

/** How a change reads back to Azo next turn, by title, since refs are renumbered every request. */
export function todoChangeNote(change: TodoChange): string {
  return change.kind === 'remove'
    ? `remove "${change.goal.title}"`
    : `change "${change.goal.title}" (${todoChangeDetail(change)})`;
}
