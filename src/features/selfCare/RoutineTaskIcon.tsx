import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import { card, TASK_ROW_GLYPH_SIZE, TASK_ROW_ICON_SIZE } from '../../theme/card';

interface RoutineTaskIconProps {
  name: ComponentProps<typeof TaskIllustration>['name'];
  done?: boolean;
}

/** The same little illustrated object follows a task from picker to routine. */
export default function RoutineTaskIcon({ name, done = false }: RoutineTaskIconProps) {
  return (
    <View style={styles.frame}>
      <View style={[card.taskIcon, card.taskIconRow, StyleSheet.absoluteFill]} />
      <TaskIllustration name={name} size={TASK_ROW_GLYPH_SIZE} done={done} />
    </View>
  );
}

// The tile tilts behind the illustration, so the illustration itself stays upright.
const styles = StyleSheet.create({
  frame: {
    width: TASK_ROW_ICON_SIZE,
    height: TASK_ROW_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
