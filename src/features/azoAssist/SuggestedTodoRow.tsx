import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import TaskCardBody, { TASK_TITLE_MAX_LINES, taskCard } from '../../components/home/journey/TaskCardBody';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import {
  selfCareGoalCoins,
  selfCareGoalDaypartLabel,
  selfCareGoalRecurrenceLabel,
} from '../selfCare/domain/selfCareGoal';
import RoutineTaskIcon from '../selfCare/RoutineTaskIcon';
import { suggestedTodoMeta, type SuggestedTodo } from './domain/suggestedTodo';

/** The Routine page's check circle, so a suggestion reads as the to-do it becomes. */
const CHECK_SIZE = 24;
const CHECK_MARK_SIZE = 15;
const EDIT_ICON_SIZE = 18;

interface Props {
  todo: SuggestedTodo;
  selected: boolean;
  disabled?: boolean;
  /** already added or turned down: greyed out, with nothing left to edit */
  settled?: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

/** Drawn as the Routine page's to-do card, with a pencil to change it and its check circle marking whether to keep it. */
export default function SuggestedTodoRow({ todo, selected, disabled = false, settled = false, onToggle, onEdit }: Props) {
  const { recurrence } = todo;
  const inactive = disabled || settled;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled: inactive }}
      accessibilityLabel={`${todo.title}, ${suggestedTodoMeta(todo)}`}
      disabled={inactive}
      onPress={() => {
        triggerTapHaptic();
        onToggle();
      }}
      style={({ pressed }) => [taskCard.surface, styles.card, settled && pressable.disabled, pressed && pressable.subtle]}
    >
      <View style={[taskCard.face, styles.face]}>
        <TaskCardBody icon={<RoutineTaskIcon name={todo.icon} />} coins={selfCareGoalCoins(recurrence)}>
          <Text numberOfLines={TASK_TITLE_MAX_LINES} style={taskCard.title}>{todo.title}</Text>
          <Text style={taskCard.detail}>
            {`${selfCareGoalRecurrenceLabel(recurrence)} · ${selfCareGoalDaypartLabel(todo.scheduledTime)}`}
          </Text>
        </TaskCardBody>
      </View>
      {settled ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${todo.title}`}
          disabled={disabled}
          hitSlop={spacing.sm}
          onPress={() => {
            triggerTapHaptic();
            onEdit();
          }}
          style={({ pressed }) => [styles.edit, pressed && pressable.subtle]}
        >
          <Icon bold name="pencil" size={EDIT_ICON_SIZE} color={colors.text.tertiary} />
        </Pressable>
      )}
      <View style={[styles.check, selected && styles.checkSelected]}>
        {selected ? <Icon bold name="check" size={CHECK_MARK_SIZE} color={colors.neutral[0]} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  face: { flex: 1 },
  edit: { padding: spacing.xs, marginRight: spacing.sm },
  check: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: CHECK_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    borderColor: colors.primary.blue500,
    backgroundColor: colors.primary.blue500,
  },
});
