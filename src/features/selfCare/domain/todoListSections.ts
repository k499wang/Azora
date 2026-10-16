import {
  groupOrderedSelfCareGoalsByDaypart,
  type SelfCareGoal,
  type SelfCareGoalDaypartGroup,
} from './selfCareGoal';

type SectionId = SelfCareGoalDaypartGroup['id'];

export type TodoListRow =
  | { kind: 'header'; id: string; section: SectionId; label: string; leaving: boolean }
  | { kind: 'goal'; id: string; section: SectionId; goal: SelfCareGoal };

export function todoListHeaderId(section: SectionId): string {
  return `daypart:${section}`;
}

/**
 * The list as drawn: each part of the day under its own header, in the order
 * the goals already stand in. A part whose every goal is on its way off the
 * list marks its header leaving, so it fades and closes up with them.
 */
export function todoListRows(
  ordered: SelfCareGoal[],
  leaving: ReadonlySet<string>,
): TodoListRow[] {
  return groupOrderedSelfCareGoalsByDaypart(ordered).flatMap((group) => {
    const goals: TodoListRow[] = group.goals.map((goal) => ({
      kind: 'goal',
      id: goal.id,
      section: group.id,
      goal,
    }));
    return [
      {
        kind: 'header',
        id: todoListHeaderId(group.id),
        section: group.id,
        label: group.label,
        leaving: group.goals.every((goal) => leaving.has(goal.id)),
      },
      ...goals,
    ];
  });
}

/**
 * The goal order a drop asks for, or null when it carried a goal under another
 * part of the day's header. A to-do's part of the day is its time, which a drag
 * does not change, so the list refuses the move rather than mislabel it.
 */
export function todoListGoalOrder(
  rows: TodoListRow[],
  orderedIds: readonly string[],
): string[] | null {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const headed = new Set(rows.filter((row) => row.kind === 'header').map((row) => row.section));
  let current: SectionId | null = null;
  const goalIds: string[] = [];
  for (const id of orderedIds) {
    const row = byId.get(id);
    if (row == null) return null;
    if (row.kind === 'header') {
      current = row.section;
      continue;
    }
    if (headed.has(row.section) && row.section !== current) return null;
    goalIds.push(id);
  }
  return goalIds;
}
