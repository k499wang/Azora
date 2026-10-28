import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import TaskCardBody, { TASK_TITLE_MAX_LINES, taskCard } from '../../components/home/journey/TaskCardBody';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import RoutineTaskIcon from '../selfCare/RoutineTaskIcon';
import { removesRepeat, todoChangeDetail, todoChangeTitle, type TodoChange } from './domain/todoChange';

const CHECK_SIZE = 24;
const CHECK_MARK_SIZE = 15;

interface Props {
  change: TodoChange;
  selected: boolean;
  disabled?: boolean;
  /** already applied or turned down */
  settled?: boolean;
  onToggle: () => void;
}

/** A to-do they already have, drawn as its Routine card with what Azo would change about it. */
export default function TodoChangeRow({ change, selected, disabled = false, settled = false, onToggle }: Props) {
  const removing = change.kind === 'remove';
  const warn = removesRepeat(change);
  const title = todoChangeTitle(change);
  const detail = todoChangeDetail(change);
  const inactive = disabled || settled;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled: inactive }}
      accessibilityLabel={`${title}, ${detail}`}
      disabled={inactive}
      onPress={() => {
        triggerTapHaptic();
        onToggle();
      }}
      style={({ pressed }) => [taskCard.surface, styles.card, settled && styles.settled, pressed && pressable.subtle]}
    >
      <View style={[taskCard.face, styles.face]}>
        <TaskCardBody icon={<RoutineTaskIcon name={change.goal.icon} />}>
          <Text numberOfLines={TASK_TITLE_MAX_LINES} style={[taskCard.title, removing && styles.struck]}>{title}</Text>
          <Text style={[taskCard.detail, warn && styles.warning]}>{detail}</Text>
        </TaskCardBody>
      </View>
      <View style={[styles.check, selected && (removing ? styles.checkRemove : styles.checkSelected)]}>
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
  settled: { opacity: 0.65 },
  struck: { textDecorationLine: 'line-through', color: colors.text.secondary },
  warning: { color: colors.error[700] },
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
  checkRemove: {
    borderColor: colors.error[500],
    backgroundColor: colors.error[500],
  },
});
