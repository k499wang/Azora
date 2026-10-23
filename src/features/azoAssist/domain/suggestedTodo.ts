import type { IconName } from '../../../components/common/icons/paths';
import type { SelfCareGoalDraft } from '../../../services/selfCare/selfCareService';
import { GOAL_ICON_CHOICES } from '../../selfCare/goalSuggestions';
import {
  DEFAULT_SELF_CARE_GOAL_ICON,
  MAX_SELF_CARE_GOAL_TITLE_LENGTH,
  SELF_CARE_GOAL_DAYPARTS,
  resolveSelfCareGoalDuration,
  selfCareGoalDaypartTime,
  type SelfCareGoalDaypart,
} from '../../selfCare/domain/selfCareGoal';

/** A to-do Azo proposed; nothing is saved until the person taps to keep it. */
export interface SuggestedTodo {
  title: string;
  icon: IconName;
  daypart: SelfCareGoalDaypart;
  minutes: number | null;
}

export function parseSuggestedTodos(value: unknown): SuggestedTodo[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): SuggestedTodo[] => {
    if (item == null || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    if (typeof record.title !== 'string') return [];
    const title = record.title.trim().slice(0, MAX_SELF_CARE_GOAL_TITLE_LENGTH);
    if (title.length === 0) return [];
    const icon = GOAL_ICON_CHOICES.includes(record.icon as IconName)
      ? record.icon as IconName
      : DEFAULT_SELF_CARE_GOAL_ICON;
    const daypart = SELF_CARE_GOAL_DAYPARTS.find((part) => part.id === record.daypart)?.id ?? 'afternoon';
    const minutes = resolveSelfCareGoalDuration(
      typeof record.minutes === 'number' ? record.minutes : null,
    );
    return [{ title, icon, daypart, minutes }];
  });
}

/** Azo's suggestions are for today, so they land as one-off to-dos. */
export function suggestedTodoDraft(todo: SuggestedTodo): SelfCareGoalDraft {
  return {
    title: todo.title,
    icon: todo.icon,
    recurrence: 'once',
    scheduledTime: selfCareGoalDaypartTime(todo.daypart),
    durationMinutes: todo.minutes,
  };
}

export function suggestedTodoMeta(todo: SuggestedTodo): string {
  const part = SELF_CARE_GOAL_DAYPARTS.find((entry) => entry.id === todo.daypart)?.label ?? '';
  return todo.minutes == null ? part : `${part} · ${todo.minutes} min`;
}
