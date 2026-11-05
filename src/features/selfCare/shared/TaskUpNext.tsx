import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../../components/common/Text';
import TaskCardBody, { taskCard } from '../../../components/home/journey/TaskCardBody';
import { spacing } from '../../../theme/spacing';
import RoutineTaskIcon from '../RoutineTaskIcon';
import { RearrangePill } from './RearrangeSheet';

interface TaskUpNextProps {
  next: { title: string; icon: ComponentProps<typeof RoutineTaskIcon>['name'] } | null;
  detail: string | null;
  onRearrange?: () => void;
}

/** Sits at the bottom of a task timer page and previews what follows the current step. */
export default function TaskUpNext({ next, detail, onRearrange }: TaskUpNextProps) {
  return (
    <View style={styles.block}>
      {onRearrange == null ? null : <RearrangePill onPress={onRearrange} />}
      <View style={[taskCard.surface, taskCard.face]}>
        <TaskCardBody icon={<RoutineTaskIcon name={next == null ? 'celebration' : next.icon} />}>
          <Text style={taskCard.overline}>{next == null ? 'LAST ONE' : 'UP NEXT'}</Text>
          <Text numberOfLines={1} style={taskCard.title}>
            {next == null ? 'Then you’re done' : next.title}
          </Text>
          {detail == null ? null : <Text style={taskCard.detail}>{detail}</Text>}
        </TaskCardBody>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignSelf: 'stretch',
    marginTop: 'auto',
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
});
