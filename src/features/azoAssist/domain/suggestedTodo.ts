import type { IconName } from '../../../components/common/icons/paths';
import type { SelfCareGoalDraft } from '../../../services/selfCare/selfCareService';
import { GOAL_ICON_CHOICES } from '../../selfCare/goalSuggestions';
import {
  DEFAULT_SELF_CARE_GOAL_ICON,
  MAX_SELF_CARE_GOAL_TITLE_LENGTH,
  SELF_CARE_GOAL_DAYPARTS,
  resolveSelfCareGoalDuration,
  selfCareGoalDaypartLabel,
  selfCareGoalDaypartTime,
} from '../../selfCare/domain/selfCareGoal';
import { selfCareGoalStartDayLabel, selfCareGoalStartDays } from '../../selfCare/domain/selfCareGoalStartDay';

/**
 * A to-do Azo proposed, already in the shape it is saved in, so the add sheet
 * can edit it; nothing is saved until the person taps to keep it.
 */
export type SuggestedTodo = SelfCareGoalDraft;

/**
 * Azo's suggestions land as one-off to-dos at their daypart's hour: on today,
 * or on a later day of the coming week when it was told one.
 */
export function parseSuggestedTodos(value: unknown, todayLocalDate?: string): SuggestedTodo[] {
  if (!Array.isArray(value)) return [];
  const planDays = todayLocalDate == null ? [] : selfCareGoalStartDays(todayLocalDate).slice(1);
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
    const durationMinutes = resolveSelfCareGoalDuration(
      typeof record.minutes === 'number' ? record.minutes : null,
    );
    const startsOn = planDays.find((day) => day === record.day);
    return [{
      title,
      icon,
      recurrence: 'once',
      scheduledTime: selfCareGoalDaypartTime(daypart),
      durationMinutes,
      ...(startsOn == null ? {} : { startsOn }),
    }];
  });
}

export function suggestedTodoMeta(todo: SuggestedTodo, todayLocalDate?: string): string {
  const part = selfCareGoalDaypartLabel(todo.scheduledTime);
  const when = todo.startsOn == null || todayLocalDate == null
    ? part
    : `${selfCareGoalStartDayLabel(todo.startsOn, todayLocalDate)} · ${part}`;
  return todo.durationMinutes == null ? when : `${when} · ${todo.durationMinutes} min`;
}
