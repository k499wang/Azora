import { View } from 'react-native';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import type { IconName } from '../../components/common/icons/Icon';
import { card } from '../../theme/card';

interface RoutineTaskIconProps {
  name: IconName;
  done?: boolean;
}

/** The same little illustrated object follows a task from picker to routine. */
export default function RoutineTaskIcon({ name, done = false }: RoutineTaskIconProps) {
  return (
    <View style={card.taskIcon}>
      <TaskIllustration name={name} size={36} done={done} />
    </View>
  );
}
