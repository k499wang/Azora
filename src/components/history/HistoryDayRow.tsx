import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../common/Text';
import Icon from '../common/icons/Icon';
import TaskIllustration from '../common/icons/TaskIllustration';
import TaskCardBody, { taskCard, TASK_TITLE_MAX_LINES } from '../home/journey/TaskCardBody';
import { card } from '../../theme/card';
import { colors } from '../../theme/colors';
import { triggerTapHaptic } from '../../native/tapHaptics';

const ILLUSTRATION_SIZE = 36;

interface Props {
  illustration: ComponentProps<typeof TaskIllustration>['name'];
  title: string;
  /** the line under the title: category, length, time of day */
  meta?: string;
  completed: boolean;
  /** dims the whole row for a day with nothing on it */
  muted?: boolean;
  /** At the end of the row, where a pressable row draws its chevron. */
  trailing?: ReactNode;
  onPress?: () => void;
}

export default function HistoryDayRow({
  illustration,
  title,
  meta,
  completed,
  muted = false,
  trailing,
  onPress,
}: Props) {
  const body = (
    <>
      <TaskCardBody
        icon={
          <View style={card.taskIcon}>
            <TaskIllustration name={illustration} size={ILLUSTRATION_SIZE} done={completed} />
          </View>
        }
        badge={trailing}
      >
        <Text
          style={[
            taskCard.title,
            completed && styles.titleCompleted,
            muted && styles.titleMuted,
          ]}
          numberOfLines={TASK_TITLE_MAX_LINES}
        >
          {title}
        </Text>
        {meta == null ? null : (
          <Text style={taskCard.detail} numberOfLines={1}>
            {meta}
          </Text>
        )}
      </TaskCardBody>

      {onPress == null ? null : (
        <Icon name="chevron-right" size={18} color={colors.text.tertiary} />
      )}
    </>
  );

  if (onPress == null) {
    return <View style={[taskCard.surface, taskCard.face]}>{body}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={meta == null ? title : `${title}, ${meta}`}
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        taskCard.surface,
        taskCard.face,
        pressed && styles.pressed,
      ]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.995 }],
  },
  titleCompleted: {
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  titleMuted: {
    color: colors.text.tertiary,
  },
});
