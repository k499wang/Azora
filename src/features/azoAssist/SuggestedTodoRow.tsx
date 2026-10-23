import { Pressable, StyleSheet, View } from 'react-native';
import AnimatedSelectionToggle from '../../components/common/AnimatedSelectionToggle';
import { Text } from '../../components/common/Text';
import TaskCardBody, { TASK_TITLE_MAX_LINES, taskCard } from '../../components/home/journey/TaskCardBody';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { selfCareGoalRecurrenceLabel } from '../selfCare/domain/selfCareGoal';
import RoutineTaskIcon from '../selfCare/RoutineTaskIcon';
import { suggestedTodoDraft, suggestedTodoMeta, type SuggestedTodo } from './domain/suggestedTodo';

interface Props {
  todo: SuggestedTodo;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

/** Drawn like the Routine page's to-do card it becomes, with a keep toggle where the check sits. */
export default function SuggestedTodoRow({ todo, selected, disabled = false, onToggle }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={`${todo.title}, ${suggestedTodoMeta(todo)}`}
      disabled={disabled}
      onPress={() => {
        triggerTapHaptic();
        onToggle();
      }}
      style={({ pressed }) => [taskCard.surface, styles.card, pressed && pressable.subtle]}
    >
      <View style={[taskCard.face, styles.face]}>
        <TaskCardBody icon={<RoutineTaskIcon name={todo.icon} />}>
          <Text numberOfLines={TASK_TITLE_MAX_LINES} style={taskCard.title}>{todo.title}</Text>
          <Text style={taskCard.detail}>
            {selfCareGoalRecurrenceLabel(suggestedTodoDraft(todo).recurrence)}
          </Text>
        </TaskCardBody>
      </View>
      <AnimatedSelectionToggle selected={selected} />
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
});
