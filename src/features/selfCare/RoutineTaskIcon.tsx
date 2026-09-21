import { StyleSheet, View } from 'react-native';
import Icon from '../../components/common/icons/Icon';
import type { IconName } from '../../components/common/icons/Icon';
import { colors } from '../../theme/colors';

export const ROUTINE_TASK_ICON_SIZE = 38;

interface RoutineTaskIconProps {
  name: IconName;
  color?: string;
}

/** The consistent task mark used in routine pickers and My Routine cards. */
export default function RoutineTaskIcon({
  name,
  color = colors.primary.blue500,
}: RoutineTaskIconProps) {
  return (
    <View style={styles.container}>
      <Icon name={name} size={ROUTINE_TASK_ICON_SIZE} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ROUTINE_TASK_ICON_SIZE,
    height: ROUTINE_TASK_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
